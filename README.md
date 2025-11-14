# AI Study Tutor

An AI-powered study assistant that helps you learn from your documents using intelligent Q&A and quiz generation.

## What It Does

- Upload PDF and PowerPoint documents
- Ask questions about your study materials
- Generate quizzes automatically
- Save your quiz results and track progress

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   cd frontend && npm install
   ```

2. **Set up environment variables:**
   - Create `.env` in project root with `OPENAI_API_KEY=your-key`
   - Create `frontend/.env` with your Firebase configuration

3. **Run the application:**
   ```bash
   python run.py
   ```

4. **Access the app:**
   - Frontend: http://localhost:5173
   - Backend API: http://127.0.0.1:8000

## Requirements

- Python 3.8+
- Node.js 16+
- OpenAI API key
- Firebase project (for authentication and quiz results)

## Project Structure

```
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── data/            # Vector database storage
└── uploads/         # Uploaded documents
```
