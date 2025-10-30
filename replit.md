# AI Cold Mail & Message Generator

## Project Overview
A single-page AI web application that generates personalized cold emails and messages for potential clients using React, Django, and Google's Gemini AI.

## Tech Stack
- **Frontend**: React with Vite
- **Backend**: Django with Django REST Framework
- **AI Model**: Google Gemini (gemini-1.5-flash)
- **Additional Libraries**: 
  - axios (API calls)
  - react-csv (CSV export)
  - react-toastify (notifications)
  - django-cors-headers (CORS handling)

## Features
1. **Editable Data Table**: Enter business details directly in the table
   - Business Name
   - Business Description
   - Address/Region
   - Generated Cold Email (AI-generated)
   - Generated Cold Message (AI-generated)

2. **Table Management**:
   - Add Row: Add new business entries
   - Delete Row: Remove individual rows
   - Clear Table: Reset all data

3. **AI Generation**:
   - Generate Cold Emails: Create full personalized cold emails
   - Generate Cold Messages: Create short messages for LinkedIn/WhatsApp
   - Uses Gemini AI with custom prompts for professional, conversational tone

4. **Export**: Download results as CSV file

5. **User Experience**:
   - Loading indicators during AI generation
   - Toast notifications for success/error messages
   - Responsive design with clean UI

## Project Structure
```
/
├── backend/              # Django backend
│   ├── api/             # API app
│   │   ├── views.py     # API endpoint for AI generation
│   │   └── urls.py      # API routing
│   ├── backend/         # Project settings
│   │   ├── settings.py  # Django configuration
│   │   └── urls.py      # Main URL routing
│   └── manage.py        # Django management script
├── frontend/            # React frontend
│   ├── src/
│   │   ├── App.jsx      # Main component with table and logic
│   │   └── App.css      # Styling
│   ├── vite.config.js   # Vite configuration
│   └── package.json     # Frontend dependencies
└── .gitignore           # Git ignore file

```

## API Endpoints
- `POST /api/generate/` - Generate cold emails or messages
  - Request body: `{ type: 'email' | 'message', businesses: [...] }`
  - Response: `{ results: [...] }` with generated content

## Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key (stored in Replit Secrets)

## How to Use
1. Enter business details in the table (or use the pre-loaded sample data)
2. Click "Generate Cold Emails" to create personalized emails
3. Click "Generate Cold Messages" to create short messages
4. Edit generated content if needed
5. Export results using "Export to CSV" button

## Development Notes
- Frontend runs on port 5000 (configured in vite.config.js)
- Backend runs on port 8000
- CORS is enabled for all origins in development
- Gemini API uses gemini-1.5-flash model for fast generation

## Recent Changes
- Initial project setup with Django and React
- Integrated Google Gemini AI for content generation
- Created editable table with full CRUD operations
- Added CSV export functionality
- Implemented loading states and error handling

## User Preferences
- Professional, conversational tone for generated content
- Clean, modern UI design
- Real-time results display in the same table
