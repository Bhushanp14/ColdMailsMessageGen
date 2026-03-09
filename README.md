# AI Cold Email & Message Generator

A powerful, AI-driven tool designed to help freelancers, developers, marketers, and agencies generate personalized cold outreach emails and messages at scale. Built with **Django**, **React**, and powered by **Google Gemini 2.5 Flash**.

## 🚀 Key Features

- **Bulk Generation**: Paste business details directly from Excel/CSV and generate dozens of personalized emails or messages in seconds.
- **AI-Powered Personalization**: Uses Google Gemini 2.5 Flash to craft human-like, conversational outreach based on business descriptions.
- **Flexible Content Types**: Choose between professional **Cold Emails** (with subject lines) or short, casual **Cold Messages** (for LinkedIn/DMs).
- **Role-Based Personalization**: Choose your service role (Web Developer, Designer, SEO Specialist, Marketer, etc.) so the AI tailors the outreach to your profession.
- **Tone Selection**: Control the style of outreach with tone options like Friendly, Professional, Casual, or Short & Direct.
- **Example/Demo Mention**: Optionally indicate if you have a sample/demo ready so the AI can naturally reference it in the outreach.
- **Excel Integration**: Easy "Bulk Paste" feature that parses 3 columns (Name, Description, Location) automatically.
- **CSV Export**: Download your results in a clean CSV format for your CRM or mailing tools.
- **Modern UI**: Clean, responsive interface with real-time status updates and modal views for generated content.

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Axios, React-Toastify
- **Backend**: Django, Django REST Framework (DRF)
- **AI Engine**: Google Gemini 2.5 Flash
- **Database**: SQLite (Development)

## 📂 Project Structure

```text
GeminiEmailGen/
├── backend/            # Django Backend
│   ├── api/            # Outreach generation & CSV export logic (views.py)
│   ├── backend/        # Core settings & configurations
│   └── manage.py       # Django management script
├── frontend/           # React Frontend
│   ├── src/            # UI Components (App.jsx)
│   └── vite.config.js  # Build configuration
└── main.py             # Entry script
```

## ⚙️ Setup & Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in `backend/` and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
5. Run migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📋 Usage Guide

1. **Paste Data**: Copy 3 columns from an Excel sheet (Business Name, Business Description, Address/Region) and paste them into the "Bulk Paste" textarea.
2. 2. **Configure Pitch**:
   - Select your **Sender Role** (e.g., Web Developer, Designer, Marketer).
   - Choose the **Tone** of the outreach (Friendly, Professional, Casual, Short & Direct).
   - Indicate if you have an **Example/Demo ready** that the AI can reference.
3. **Generate**: Click **Generate Cold Emails** or **Generate Cold Messages**.
4. **Review**: Click "View Email/Message" in the table to see the AI-generated content in a modal.
5. **Export**: Once satisfied, click **Export to CSV** to download all results.


## 🎯 Supported Outreach Roles

The generator can adapt outreach messages based on different service roles, including:

- Web Developer
- Web Designer
- SEO Specialist
- Digital Marketer
- Social Media Manager
- Graphic Designer
- Video Editor
- AI / Automation Consultant
---
*Built with ❤️ for Outreach Efficiency.*
