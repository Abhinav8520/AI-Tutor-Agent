from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import uvicorn

from backend.config import settings
from backend.ingestion.document_parser import DocumentParser
from backend.ingestion.langchain_vector_store import LangChainVectorStore
from backend.tutoring.langchain_tutor import LangChainTutor
from backend.tutoring.memory_manager import ConversationMemoryManager
from backend.tutoring.rag_service import LangChainRAGService
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

# Initialize LangChain vector store with error handling
vector_store = None
try:
    print("Initializing LangChain vector store...")
    vector_store = LangChainVectorStore()
    print("LangChain vector store initialized successfully")
except Exception as e:
    print(f"Warning: Vector store initialization failed: {e}")
    print("   Backend will start but document upload/search features will be limited")
    print("   This may be due to torch/sentence-transformers compatibility issues")

# Initialize LangChain tutor and memory manager (will require API key)
llm_tutor = None
memory_manager = None
rag_service = None
quiz_generator = None

try:
    # Initialize memory manager
    memory_manager = ConversationMemoryManager()
    
    # Initialize LangChain tutor with memory manager
    llm_tutor = LangChainTutor(memory_manager=memory_manager)
    
    # Initialize RAG service if vector store is available
    if vector_store is not None:
        rag_service = LangChainRAGService(vector_store, llm_tutor)
    
    # Initialize quiz generator
    quiz_generator = QuizGenerator()
    print("LangChain tutor, memory manager, and quiz generator initialized successfully")
except Exception as e:
    print(f"Warning: LangChain services initialization failed: {e}")
    print("   Please set OPENAI_API_KEY environment variable")
    llm_tutor = None
    memory_manager = None
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
        "documents_loaded": vector_store.count() if vector_store else 0,
        "embedding_service_available": vector_store is not None,
        "langchain_enabled": True
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
        
        # Add to vector store
        if vector_store is None:
            raise HTTPException(
                status_code=503,
                detail="Vector store service is not available. Please check backend logs for initialization errors."
            )
        print(f"Adding {len(chunks)} chunks to LangChain vector store")
        vector_store.add_chunks(chunks)
        
        return {
            "message": "Document uploaded and processed successfully",
            "filename": file.filename,
            "chunks_processed": len(chunks),
            "total_documents": vector_store.count()
        }
        
    except Exception as e:
        # Clean up uploaded file on error
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(query: str = Form(...), top_k: int = Form(5), user_id: str = Form(None)):
    """
    Ask a question and get an intelligent answer using RAG with conversation memory.
    
    Args:
        query: User's question
        top_k: Number of chunks to retrieve (default 5, but only top 3 are used)
        user_id: Firebase user ID for conversation memory (optional)
    """
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
        
        # Use RAG service to generate intelligent answer with conversation memory
        response = rag_service.answer_question(query, top_k=top_k, user_id=user_id)
        
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
        
        # Check if vector store is available
        if vector_store is None:
            raise HTTPException(
                status_code=503,
                detail="Vector store service is not available. Please check backend logs for initialization errors."
            )
        
        # Get all available chunks for quiz generation
        total_chunks = vector_store.count()
        if total_chunks == 0:
            raise HTTPException(
                status_code=400,
                detail="No documents uploaded. Please upload documents first."
            )
        
        # Get chunks for quiz generation (search with empty query to get random chunks)
        chunks = vector_store.search("", top_k=20)
        
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
            "total_documents": vector_store.count() if vector_store else 0,
            "message": "Document count retrieved successfully",
            "embedding_service_available": vector_store is not None,
            "langchain_enabled": True
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