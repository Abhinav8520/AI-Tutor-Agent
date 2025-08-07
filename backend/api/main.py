from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Body
import os
import shutil
from typing import List, Dict, Any
import uvicorn

from backend.config import settings
from backend.ingestion.document_parser import DocumentParser
from backend.ingestion.embedding_manager import EmbeddingManager
from backend.tutoring.openai_tutor import OpenAITutor
from backend.tutoring.rag_service import RAGService
from backend.quizzes.quiz_generator import QuizGenerator

# Initialize FastAPI app
app = FastAPI(
    title="AI Study Tutor API",
    description="API for AI-powered study tutoring with document processing and knowledge retrieval",
    version="1.0.0"
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
document_parser = DocumentParser()
embedding_manager = EmbeddingManager()

# Initialize OpenAI tutor (will require API key)
try:
    llm_tutor = OpenAITutor()
    rag_service = RAGService(embedding_manager, llm_tutor)
    quiz_generator = QuizGenerator()
    print("✅ OpenAI tutor and quiz generator initialized successfully")
except Exception as e:
    print(f"⚠️  OpenAI tutor initialization failed: {e}")
    print("   Please set OPENAI_API_KEY environment variable")
    llm_tutor = None
    rag_service = None
    quiz_generator = None

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "AI Study Tutor API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "upload": "/upload",
            "search": "/search",
            "documents": "/documents"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "documents_loaded": embedding_manager.count()
    }

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document (PDF or PowerPoint)."""
    try:
        # Validate file type
        allowed_extensions = ['.pdf', '.pptx', '.ppt']
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Save file to upload directory
        file_path = os.path.join(settings.upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse document
        print(f"Parsing document: {file.filename}")
        chunks = document_parser.parse_document(file_path)
        
        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="No content could be extracted from the document"
            )
        
        # Add to embedding manager
        print(f"Adding {len(chunks)} chunks to embedding manager")
        embedding_manager.add_chunks(chunks)
        
        return {
            "message": "Document uploaded and processed successfully",
            "filename": file.filename,
            "chunks_processed": len(chunks),
            "total_documents": embedding_manager.count()
        }
        
    except Exception as e:
        # Clean up uploaded file on error
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(query: str = Form(...), top_k: int = Form(5)):
    """Ask a question and get an intelligent answer using RAG."""
    try:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        if top_k < 1 or top_k > 20:
            raise HTTPException(status_code=400, detail="top_k must be between 1 and 20")
        
        # Check if RAG service is available
        if rag_service is None:
            raise HTTPException(
                status_code=503, 
                detail="AI service is not available. Please set OPENAI_API_KEY environment variable."
            )
        
        # Use RAG service to generate intelligent answer
        response = rag_service.answer_question(query, top_k)
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-quiz")
async def generate_quiz():
    """Generate a simple 5-question quiz from uploaded documents."""
    try:
        # Check if quiz generator is available
        if quiz_generator is None:
            raise HTTPException(
                status_code=503, 
                detail="Quiz service is not available. Please set OPENAI_API_KEY environment variable."
            )
        
        # Get all available chunks for quiz generation
        total_chunks = embedding_manager.count()
        if total_chunks == 0:
            raise HTTPException(
                status_code=400,
                detail="No documents uploaded. Please upload documents first."
            )
        
        # Get chunks for quiz generation
        chunks = embedding_manager.search("", top_k=20)
        
        # Generate quiz
        quiz_data = quiz_generator.generate_quiz(context_chunks=chunks)
        
        if "error" in quiz_data:
            raise HTTPException(status_code=500, detail=quiz_data["error"])
        
        return quiz_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check-answer")
async def check_answer(question_index: int = Form(...), user_answer: str = Form(...), quiz_data: str = Form(...)):
    """Check if a single answer is correct."""
    try:
        import json
        
        # Parse quiz_data from string
        try:
            quiz_data_parsed = json.loads(quiz_data)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid quiz_data format")
        
        # Check if quiz generator is available
        if quiz_generator is None:
            raise HTTPException(
                status_code=503, 
                detail="Quiz service is not available. Please set OPENAI_API_KEY environment variable."
            )
        
        # Check the answer
        result = quiz_generator.check_answer(question_index, user_answer, quiz_data_parsed)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
async def get_document_info():
    """Get information about loaded documents."""
    try:
        return {
            "total_documents": embedding_manager.count(),
            "message": "Document count retrieved successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "backend.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    ) 