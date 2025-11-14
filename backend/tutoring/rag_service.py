"""
LangChain-based RAG Service.

Uses LangChain's vector store with conversation memory support.
"""

from typing import List, Dict, Any, Optional

from backend.ingestion.langchain_vector_store import LangChainVectorStore
from backend.tutoring.langchain_tutor import LangChainTutor


class LangChainRAGService:
    """LangChain-based Retrieval-Augmented Generation service with conversation memory."""
    
    def __init__(self, vector_store: LangChainVectorStore, llm_tutor: LangChainTutor):
        """
        Initialize the LangChain RAG service.
        
        Args:
            vector_store: LangChainVectorStore instance
            llm_tutor: LangChainTutor instance with memory support
        """
        self.vector_store = vector_store
        self.llm_tutor = llm_tutor
    
    def answer_question(self, query: str, top_k: int = 3, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Answer a question using RAG approach with LangChain.
        
        Args:
            query: User's question
            top_k: Number of chunks to retrieve (default 3, as per current implementation)
            user_id: Firebase user ID for conversation memory (optional)
            
        Returns:
            Dictionary with answer, sources, and metadata
        """
        # Retrieve relevant chunks
        retrieved_chunks = self.vector_store.search(query, top_k)
        
        if not retrieved_chunks:
            return {
                'answer': "I don't have enough information to answer that question. Please upload some study materials first.",
                'sources': [],
                'total_sources': 0,
                'query': query
            }
        
        # Generate answer using LangChain tutor with memory
        llm_answer = self.llm_tutor.generate_answer(query, retrieved_chunks, user_id=user_id)
        
        # Prepare response with sources
        sources = []
        for chunk in retrieved_chunks:
            text = chunk.get('text', '')
            sources.append({
                'file': chunk.get('source_file', 'Unknown'),
                'section': chunk.get('section', 'Unknown'),
                'text': text[:200] + '...' if len(text) > 200 else text,
                'relevance_score': chunk.get('relevance_score', 0.0)
            })
        
        return {
            'answer': llm_answer,
            'sources': sources,
            'total_sources': len(sources),
            'query': query
        }
    
    def get_context_for_query(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Get context chunks for a query without generating an answer."""
        return self.vector_store.search(query, top_k)


# Alias for backward compatibility
RAGService = LangChainRAGService 