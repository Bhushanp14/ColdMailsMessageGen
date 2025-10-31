import csv
from django.http import HttpResponse
from datetime import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import google.generativeai as genai
import logging

# Configure logging to output errors to the console/log file
logger = logging.getLogger(__name__)

# NOTE: Using the recommended 'gemini-2.5-flash' model
MODEL_NAME = 'gemini-2.5-flash'

# Configure the API key once
genai.configure(api_key=settings.GEMINI_API_KEY)

@api_view(['POST'])
def generate_content(request):
    try:
        data = request.data
        content_type = request.data.get('type', 'email')
         # 🆕 New dropdown fields
        sender_role = data.get('sender_role', 'Web Developer')
        demo_site = data.get('demo_site', 'No')

        if not isinstance(data.get('businesses'), list):
            return Response(
                {'error': 'Invalid data format. Expected an array of businesses.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        businesses = data.get('businesses', [])
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
You are an expert at writing short, friendly cold outreach emails for small businesses and startups.

Goal:
Encourage the business owner to build or redesign their website in a casual, genuine way.

Tone:
Warm, conversational, and human — like a helpful friend, not a marketer.

Length:
Keep it under 90 words total.

Details:
- Business Name: {business_name}
- Business Description: {business_description}
- Address/Region: {address_region}
- Your Role: {sender_role}
- Have a demo side: {demo_site}
If a demo site is available, mention it naturally in one simple line (e.g., “I put together a small demo for you to preview.”)

Format:
1. Subject line (short, natural)
2. Email body (1–2 short paragraphs)
3. Signature (“Cheers, [Your Name]” or “Best, [Your Name]”)

Avoid buzzwords and corporate phrases. Keep it real, friendly, and easy to read.
"""

                
                    # Generate Email Body
                    body_response = model.generate_content(email_body_prompt)
                    result_item['Generated_Cold_Email'] = body_response.text.strip()
                
                # --- 2. SHORT MESSAGE GENERATION ---
                else: # content_type == 'message'
                    prompt = f"""You are an expert at writing short, friendly outreach messages for small business owners and founders.

Goal:
Start a casual conversation that makes the business owner curious about getting a website made (or redesigned), without sounding salesy or robotic.

Tone:
Friendly, genuine, and startup-style — like someone who enjoys building cool projects, not a marketing agency.

Length:
Keep it under 70 words total.

Business Details:
- Name: {business_name}
- Description: {business_description}
- Region: {address_region}
- Sender Role: {sender_role}
- Demo Site Ready: {demo_site}

If demo_site = "Yes", mention it naturally (e.g., “I actually made a small demo so you can get a quick feel for it.”)

Format:
Write only the message text (no subject, no signature).

Guidelines:
- Avoid buzzwords and formal phrases.
- Make it sound like a human conversation opener.
- Optionally, include a casual call-to-action like “want to take a quick look?” or “happy to share it if you’re curious.”
"""
                    
                    response = model.generate_content(prompt)
                    result_item['Generated_Cold_Message'] = response.text.strip()
                    
            except Exception as e:
                # Log the specific error for this item
                error_message = f"Gemini generation failed for business '{business_name}': {str(e)}"
                logger.error(error_message, exc_info=True)
                
                result_item['generation_error'] = error_message
            
            results.append(result_item)
            
        # Optional: Print all final results to the console for debugging
        # for item in results:
        #     print(item)
            
        return Response({'results': results}, status=status.HTTP_200_OK)
    
    except Exception as e:
        # Catch critical errors outside the loop (like invalid API key, model loading failure, etc.)
        logger.exception("Critical error in generate_content view.")
        
        return Response(
            {'error': f'A critical server error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
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