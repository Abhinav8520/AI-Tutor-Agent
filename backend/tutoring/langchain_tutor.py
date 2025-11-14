"""
LangChain-based tutor with conversation summary memory.

Replaces OpenAITutor with LangChain's ChatOpenAI and conversation memory.
"""

from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI

from backend.tutoring.memory_manager import ConversationMemoryManager
import os
from backend.config import settings


class LangChainTutor:
    """LangChain-based tutor for generating intelligent answers with conversation memory."""
    
    def __init__(self, memory_manager: Optional[ConversationMemoryManager] = None, 
                 api_key: Optional[str] = None):
        """
        Initialize the LangChain tutor.
        
        Args:
            memory_manager: ConversationMemoryManager instance. If None, creates a new one.
            api_key: OpenAI API key. If None, uses settings or environment variable.
        """
        # Get API key
        self.api_key = api_key or settings.openai_api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY in .env file or environment variable.")
        
        # Initialize LLM
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.7,
            max_tokens=500,
            openai_api_key=self.api_key
        )
        
        # Initialize memory manager if not provided
        if memory_manager is None:
            self.memory_manager = ConversationMemoryManager()
        else:
            self.memory_manager = memory_manager
    
    def generate_answer(self, query: str, context_chunks: List[Dict[str, Any]], 
                       user_id: Optional[str] = None) -> str:
        """
        Generate an answer using RAG approach with conversation memory.
        
        Args:
            query: User's question
            context_chunks: Retrieved context chunks from vector store
            user_id: Firebase user ID for conversation memory (optional)
            
        Returns:
            Generated answer string
        """
        if not context_chunks:
            return "I don't have enough information to answer that question. Please upload some study materials first."
        
        try:
            # Prepare context from retrieved chunks
            context_text = self._prepare_context(context_chunks)
            
            # Create prompt
            prompt = self._create_prompt(query, context_text)
            
            # Get conversation memory if user_id provided
            memory = None
            if user_id:
                memory = self.memory_manager.get_memory(user_id)
            
            # Build messages for LLM
            messages = []
            
            # Add system message
            messages.append({"role": "system", "content": "You are a helpful AI tutor that provides clear, comprehensive answers based on provided study materials."})
            
            # Add conversation history from memory if available
            if memory:
                chat_history = memory.get_messages()
                # Add last 4 messages (2 exchanges) to context
                for role, content in chat_history[-4:]:
                    messages.append({"role": role, "content": content})
            
            # Add current query
            messages.append({"role": "user", "content": prompt})
            
            # Generate answer using LLM
            response = self.llm.invoke(messages)
            answer = response.content.strip()
            
            # Save to memory if user_id provided
            if user_id and memory:
                memory.add_message("user", query)
                memory.add_message("assistant", answer)
            
            if answer and len(answer.strip()) > 20:
                return answer
            else:
                print(f"Generated answer too short: '{answer}'")
                return "I apologize, but I couldn't generate a proper answer. Please try rephrasing your question."
                
        except Exception as e:
            print(f"Error generating LangChain answer: {e}")
            return self._simple_answer(query, context_chunks)
    
    def _prepare_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Prepare context text from retrieved chunks."""
        context_parts = []
        # Use top 3 chunks (as per current implementation)
        for i, chunk in enumerate(chunks[:3], 1):
            source = chunk.get('source_file', 'Unknown')
            section = chunk.get('section', 'Unknown')
            text = chunk.get('text', '')
            context_parts.append(f"Source {i} ({source}, {section}): {text}")
        
        return "\n\n".join(context_parts)
    
    def _create_prompt(self, query: str, context: str) -> str:
        """Create a prompt for the LLM."""
        prompt = f"""You are a helpful AI tutor. Based on the following information from study materials, provide a clear and comprehensive answer to the student's question.

Information from study materials:
{context}

Student Question: {query}

Please provide a concise answer that:
1. Synthesizes the information from the provided sources
2. Addresses the question directly and comprehensively
3. Organizes the response in a logical, easy-to-understand format
4. Focuses on the information available without asking for additional details

Answer:"""
        return prompt
    
    def _simple_answer(self, query: str, context_chunks: List[Dict[str, Any]]) -> str:
        """Fallback answer when LLM generation fails."""
        if not context_chunks:
            return "I don't have enough information to answer that question. Please upload some study materials first."
        
        answer_parts = []
        answer_parts.append(f"Based on the information from your documents, here's what I found:\n")
        
        for i, chunk in enumerate(context_chunks[:3], 1):
            source = chunk.get('source_file', 'Unknown')
            section = chunk.get('section', 'Unknown')
            text = chunk.get('text', '')
            
            answer_parts.append(f"{i}. From {source} ({section}):")
            answer_parts.append(f"   {text}")
            answer_parts.append("")
        
        answer_parts.append("This is a basic answer based on the retrieved content.")
        
        return "\n".join(answer_parts)

