from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import google.generativeai as genai

genai.configure(api_key=settings.GEMINI_API_KEY)

@api_view(['POST'])
def generate_content(request):
    try:
        data = request.data
        content_type = request.data.get('type', 'email')
        
        if not isinstance(data.get('businesses'), list):
            return Response(
                {'error': 'Invalid data format. Expected an array of businesses.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        businesses = data.get('businesses', [])
        results = []
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        for business in businesses:
            business_name = business.get('Business_Name', '')
            business_description = business.get('Business_Description', '')
            address_region = business.get('Address/Region', '')
            
            if content_type == 'email':
                prompt = f"""You are an expert in writing cold outreach emails for businesses.
Write a personalized cold email encouraging the recipient to build or redesign their website, highlighting how it will benefit their business.
Make it human, engaging, and persuasive.
Tone: professional but conversational.

Business Name: {business_name}
Business Description: {business_description}
Address/Region: {address_region}

Write only the email content, no subject line."""
            else:
                prompt = f"""You are an expert in writing cold outreach messages for businesses.
Write a short personalized message (for LinkedIn/WhatsApp) encouraging the recipient to build or redesign their website, highlighting how it will benefit their business.
Make it human, engaging, and persuasive. Keep it brief (2-3 sentences).
Tone: professional but conversational.

Business Name: {business_name}
Business Description: {business_description}
Address/Region: {address_region}

Write only the message content."""
            
            try:
                response = model.generate_content(prompt)
                generated_text = response.text
                
                if content_type == 'email':
                    business['Generated_Cold_Email'] = generated_text
                else:
                    business['Generated_Cold_Message'] = generated_text
                    
                results.append(business)
            except Exception as e:
                business['error'] = str(e)
                results.append(business)
        
        return Response({'results': results}, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': f'An error occurred: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
