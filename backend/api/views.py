import csv
from django.http import HttpResponse
from datetime import datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings
import google.generativeai as genai
import logging
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .models import UsageTrack

logger = logging.getLogger(__name__)
GOOGLE_CLIENT_ID = '703335616589-p16fkbldg9jpq04gs71cq2iqfh2la16b.apps.googleusercontent.com'

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class GoogleLogin(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('access_token') # This is actually the id_token from frontend
        if not token:
            return Response({'error': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Verify the id_token with Google
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            if not email:
                return Response({'error': 'Google account has no email.'}, status=status.HTTP_400_BAD_REQUEST)

            # Get or create the user
            user, created = User.objects.get_or_create(
                username=email,
                defaults={'email': email, 'first_name': first_name, 'last_name': last_name}
            )

            # Merge guest IP usage into user account
            ip = get_client_ip(request)
            try:
                guest_usage = UsageTrack.objects.get(ip_address=ip, user=None)
                user_usage, _ = UsageTrack.objects.get_or_create(user=user)
                user_usage.email_count += guest_usage.email_count
                user_usage.message_count += guest_usage.message_count
                user_usage.save()
                guest_usage.delete()
            except UsageTrack.DoesNotExist:
                UsageTrack.objects.get_or_create(user=user)

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': {'email': user.email, 'first_name': user.first_name}
            })
        except ValueError as e:
            logger.error(f"Google token verification failed: {e}")
            return Response({'error': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)


def _generate_tokens_for_user(user):
    """Helper: issue JWT access + refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access_token': str(refresh.access_token),
        'refresh_token': str(refresh),
        'user': {'email': user.email, 'first_name': user.first_name}
    }


class EmailRegister(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        first_name = request.data.get('first_name', '').strip()

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=email).exists():
            return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=email, email=email, password=password, first_name=first_name)

        # Merge any guest usage for this IP
        ip = get_client_ip(request)
        try:
            guest_usage = UsageTrack.objects.get(ip_address=ip, user=None)
            user_usage, _ = UsageTrack.objects.get_or_create(user=user)
            user_usage.email_count += guest_usage.email_count
            user_usage.message_count += guest_usage.message_count
            user_usage.save()
            guest_usage.delete()
        except UsageTrack.DoesNotExist:
            UsageTrack.objects.get_or_create(user=user)

        return Response(_generate_tokens_for_user(user), status=status.HTTP_201_CREATED)


class EmailLogin(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth import authenticate
        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(_generate_tokens_for_user(user))


# NOTE: Using the recommended 'gemini-2.0-flash' model
MODEL_NAME = 'gemini-2.0-flash'

# Configure the API key once
genai.configure(api_key=settings.GEMINI_API_KEY)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def generate_content(request):
    try:
        data = request.data
        content_type = data.get('type', 'email')
        sender_role = data.get('sender_role', 'Web Developer')
        demo_site = data.get('demo_site', 'No')
        outreach_tone = data.get('outreach_tone', 'Friendly')
        
        if not isinstance(data.get('businesses'), list):
            return Response(
                {'error': 'Invalid data format. Expected an array of businesses.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        businesses = data.get('businesses', [])
        business_count = len(businesses)

        # Hard cap: max 100 rows per request
        if business_count > 100:
            return Response(
                {'error': 'Maximum 100 businesses per request.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- USAGE LIMIT CHECK (separate buckets) ---
        user = request.user if request.user.is_authenticated else None
        ip_address = get_client_ip(request)

        if user:
            usage, _ = UsageTrack.objects.get_or_create(user=user)
            limit = 25
        else:
            usage, _ = UsageTrack.objects.get_or_create(ip_address=ip_address)
            limit = 10

        current_count = usage.email_count if content_type == 'email' else usage.message_count
        remaining = limit - current_count

        if remaining <= 0:
            return Response(
                {
                    'error': f'{content_type.capitalize()} limit reached ({limit} max).',
                    'limit_reached': True,
                    'is_authenticated': user is not None
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Partial processing: only process as many as credits allow
        processed_count = min(business_count, remaining)
        businesses = businesses[:processed_count]
        # -----------------------------------------------
        results = []
        
        model = genai.GenerativeModel(MODEL_NAME)
        
        for business in businesses:
            # Create a mutable dictionary for the result, copying original data
            result_item = business.copy() 
            
            business_name = business.get('Business_Name', 'A great local business')
            business_description = business.get('Business_Description', 'They offer high quality services.')
            address_region = business.get('Address/Region', 'our local area')
            
            try:
                # --- 1. EMAIL CONTENT AND SUBJECT GENERATION ---
                if content_type == 'email':
                    # Prompt for the main email body
                    email_body_prompt = f"""
You are great at writing short, friendly cold outreach emails to small business owners.

Goal:
Start a genuine conversation where the sender offers their professional service in a helpful, non-salesy way.

Tone: {outreach_tone}
If Tone is "Friendly", keep the tone Warm, conversational, and human — like a helpful builder or creator reaching out personally.
If tone is "Short & Direct", keep sentences concise and minimal.
If tone is "Professional", use slightly more formal language.
If tone is "Casual", make it relaxed and conversational.

Length:
Maximum 90 words.

Business Details:
- Business Name: {business_name}
- Business Description: {business_description}
- Region: {address_region}

Sender Details:
- Role: {sender_role}
- Has Example/Demo Ready: {demo_site}

Instructions:
Write a personalized email where the sender briefly introduces themselves and suggests a way their service could help the business.

The offer should naturally match the sender’s role.

Examples:
- Web Developer → improving or building their website
- SEO Specialist → helping them rank better on Google
- Social Media Manager → improving social media presence
- Graphic Designer → improving branding or visual design
- Video Editor → helping create engaging video content

If "Has Example/Demo Ready" is Yes, mention it casually in one short sentence (example: “I even put together a quick example you can check out if you're curious.”)

Format:
1. Subject line (short and natural)
2. Email body (1–2 short paragraphs)
3. Signature line (“Cheers,” or “Best,” followed by [Your Name])

Guidelines:
- Avoid corporate buzzwords.
- Avoid sounding like a marketing agency.
- Make it feel like a real human wrote it.
- Keep sentences simple and easy to read.
"""

                
                    # Generate Email Body
                    body_response = model.generate_content(email_body_prompt)
                    result_item['Generated_Cold_Email'] = body_response.text.strip()
                
                # --- 2. SHORT MESSAGE GENERATION ---
                else: # content_type == 'message'
                    prompt = f"""
You are great at writing short, friendly outreach messages to small business owners and founders.

Goal:
Start a casual conversation where the sender offers their professional service in a helpful way without sounding salesy.


Tone: {outreach_tone}
If Tone is "Friendly", keep the tone Friendly, genuine, and conversational — like a builder or creator reaching out personally.
If Tone is "Short & Direct", keep sentences concise and minimal.
If Tone is "Professional", use slightly more formal language.
If Tone is "Casual", make it relaxed and conversational.


Length:
Maximum 70 words.

Business Details:
- Name: {business_name}
- Description: {business_description}
- Region: {address_region}

Sender Details:
- Role: {sender_role}
- Has Example/Demo Ready: {demo_site}

Instructions:
Write a short message where the sender briefly introduces themselves and suggests a way their service might help the business.

The offer should naturally match the sender’s role.

Examples:
- Web Developer → improving or building their website
- SEO Specialist → helping them rank better on Google
- Social Media Manager → improving social media presence
- Graphic Designer → improving branding or visuals
- Video Editor → creating engaging video content

If "Has Example/Demo Ready" is Yes, mention it casually in one short sentence (example: “I actually made a quick example you can check out if you're curious.”)

Format:
Write only the message text.
Do NOT include subject lines or signatures.

Guidelines:
- Avoid corporate buzzwords.
- Avoid sounding like a marketing agency.
- Make it sound like a real human conversation starter.
- Use the business description to make the message feel slightly personalized.
- Optionally include a casual CTA like “want to take a quick look?” or “happy to share if you're curious.”
"""
                    
                    response = model.generate_content(prompt)
                    result_item['Generated_Cold_Message'] = response.text.strip()
                    
            except Exception as e:
                # Log the specific error for this item
                error_message = f"Gemini generation failed for business '{business_name}': {str(e)}"
                logger.error(error_message, exc_info=True)
                
                result_item['generation_error'] = error_message
            
            results.append(result_item)
            
        # --- UPDATE USAGE (correct bucket) ---
        if content_type == 'email':
            usage.email_count += processed_count
        else:
            usage.message_count += processed_count
        usage.save()
        # ----------------------------------------

        resp = {
            'results': results,
            'email_count': usage.email_count,
            'message_count': usage.message_count,
            'processed': processed_count,
            'total_requested': business_count if business_count != processed_count else processed_count,
        }
        return Response(resp, status=status.HTTP_200_OK)
    
    except Exception as e:
        # Catch critical errors outside the loop (like invalid API key, model loading failure, etc.)
        logger.exception("Critical error in generate_content view.")
        
        return Response(
            {'error': f'A critical server error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_usage(request):
    user = request.user if request.user.is_authenticated else None
    if user:
        usage, _ = UsageTrack.objects.get_or_create(user=user)
        limit = 25
    else:
        ip = get_client_ip(request)
        usage, _ = UsageTrack.objects.get_or_create(ip_address=ip)
        limit = 10

    return Response({
        'email_count': usage.email_count,
        'message_count': usage.message_count,
        'email_limit': limit,
        'message_limit': limit,
        'is_authenticated': user is not None
    })
    
@api_view(["POST"])
def export_csv(request):
    try:
        data = request.data.get("rows", [])
        if not isinstance(data, list) or not data:
            return HttpResponse("No data provided or invalid format.", status=400)

        # Create filename
        filename = f"cold_outreach_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

        # Create response
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)

        # Write headers
        headers = list(data[0].keys())
        writer.writerow(headers)

        # Write rows (clean newlines and commas)
        for row in data:
            clean_row = [str(row.get(col, "")).replace("\n", " ").replace("\r", " ") for col in headers]
            writer.writerow(clean_row)

        logger.info(f"CSV generated successfully: {filename}")
        return response

    except Exception as e:
        logger.exception("CSV export failed.")
        return HttpResponse(f"Error generating CSV: {str(e)}", status=500)