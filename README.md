# AI Study Tutor - Setup Guide

AI Study Tutor is a lightweight study assistant that lets you upload PDFs and slide decks, builds a searchable knowledge base with embeddings, and helps you learn using RAG-powered Q&A and auto-generated quizzes. It includes a FastAPI backend, a React/Vite frontend, and optional Firebase-based progress tracking.

##  Quick Setup

### 1. Backend Setup
Create a `.env` file in the project root:

```env
# OpenAI API Configuration (REQUIRED)
OPENAI_API_KEY=sk-your-actual-api-key-here

# API Configuration (Optional)
API_HOST=127.0.0.1
API_PORT=8000
DEBUG=true

# Data Directories (Optional)
DATA_DIR=./data
UPLOAD_DIR=./uploads
```

### 2. Frontend Setup
Create a `.env` file in the `frontend` directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 3. Get API Keys
1. **OpenAI API Key**: Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Firebase Config**: Follow the [Firebase Setup Guide](FIREBASE_SETUP.md)

### 4. Install & Start

#### Option 1: Simple Script (Recommended)
```bash
# Install Python dependencies first
pip install -r requirements.txt

# Run everything with one command
python run.py
```

#### Option 2: Manual (Separate Terminals)
```bash
# Backend
pip install -r requirements.txt
uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

#### Option 3: Windows Double-Click
Simply double-click `run.bat` to start the project.

##  Project Structure
```
AI Tutor agent/
├── .env                    # Backend environment variables
├── frontend/.env          # Frontend environment variables
├── requirements.txt       # Python dependencies
├── run.py                 # Simple project runner
├── run.bat               # Windows batch file
├── backend/              # FastAPI backend
├── frontend/            # React frontend
├── test_documents/      # Your test files
├── data/               # Vector database
└── uploads/            # File uploads
```

##  Features
-  Document Upload (PDF, PPT, PPTX)
-  OpenAI-powered RAG
-  Quiz Generation
-  Progress Tracking (Firebase)
-  FastAPI Backend + React Frontend

##  Security
- `.env` files are excluded from Git
- Use `.env.example` files for reference
- Never commit actual API keys

##  Tips
- Keep your `.env` files secure
- Monitor API usage to avoid charges
- Check Firebase Console for data 