from typing import List, Dict, Any
from backend.ingestion.embedding_manager import EmbeddingManager
from backend.tutoring.openai_tutor import OpenAITutor

class RAGService:
    """Retrieval-Augmented Generation service."""
    
    def __init__(self, embedding_manager: EmbeddingManager, llm_tutor: OpenAITutor):
        self.embedding_manager = embedding_manager
        self.llm_tutor = llm_tutor
    
    def answer_question(self, query: str, top_k: int = 3) -> Dict[str, Any]:
        """Answer a question using RAG approach."""
        # Retrieve relevant chunks
        retrieved_chunks = self.embedding_manager.search(query, top_k)
        
        # Generate answer using LLM
        llm_answer = self.llm_tutor.generate_answer(query, retrieved_chunks)
        
        # Prepare response
        sources = []
        for chunk in retrieved_chunks:
            sources.append({
                'file': chunk.get('source_file', 'Unknown'),
                'section': chunk.get('section', 'Unknown'),
                'text': chunk.get('text', '')[:200] + '...' if len(chunk.get('text', '')) > 200 else chunk.get('text', ''),
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
        return self.embedding_manager.search(query, top_k) 