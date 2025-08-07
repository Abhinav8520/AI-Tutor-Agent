import os
from typing import List, Dict, Any, Optional
import openai
from backend.config import settings

class OpenAITutor:
    """OpenAI-based tutor for generating intelligent answers using RAG."""
    
    def __init__(self, api_key: str = None):
        """Initialize the OpenAI tutor."""
        self.api_key = api_key or settings.openai_api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY in .env file or environment variable.")
        
        self.client = openai.OpenAI(api_key=self.api_key)
        self.model = "gpt-3.5-turbo"  
    
    def generate_answer(self, query: str, context_chunks: List[Dict[str, Any]]) -> str:
        """Generate an answer using RAG approach with OpenAI."""
        if not context_chunks:
            return "I don't have enough information to answer that question. Please upload some study materials first."
        
        try:
            # Prepare context from retrieved chunks
            context_text = self._prepare_context(context_chunks)
            
            # Create prompt for OpenAI
            prompt = self._create_prompt(query, context_text)
            
            # Generate answer using OpenAI
            answer = self._generate_with_openai(prompt)
            
            return answer
            
        except Exception as e:
            print(f"Error generating OpenAI answer: {e}")
            return self._simple_answer(query, context_chunks)
    
    def _prepare_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Prepare context text from retrieved chunks."""
        context_parts = []
        for i, chunk in enumerate(chunks[:3], 1):  # Use top 3 chunks only
            source = chunk.get('source_file', 'Unknown')
            section = chunk.get('section', 'Unknown')
            text = chunk.get('text', '')
            context_parts.append(f"Source {i} ({source}, {section}): {text}")
        
        return "\n\n".join(context_parts)
    
    def _create_prompt(self, query: str, context: str) -> str:
        """Create a prompt for OpenAI."""
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
    
    def _generate_with_openai(self, prompt: str) -> str:
        """Generate answer using OpenAI API."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI tutor that provides clear, comprehensive answers based on provided study materials."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,  # Reasonable length for answers
                temperature=0.7,  # Balanced creativity and accuracy
                top_p=0.9
            )
            
            answer = response.choices[0].message.content.strip()
            
            if answer and len(answer.strip()) > 20:
                return answer
            else:
                print(f"Generated answer too short: '{answer}'")
                return "I apologize, but I couldn't generate a proper answer. Please try rephrasing your question."
                
        except Exception as e:
            print(f"Error in OpenAI generation: {e}")
            raise
    
    def _simple_answer(self, query: str, context_chunks: List[Dict[str, Any]]) -> str:
        """Fallback answer when OpenAI generation fails."""
        if not context_chunks:
            return "I don't have enough information to answer that question. Please upload some study materials first."
        
        # Create a comprehensive answer based on all relevant chunks
        answer_parts = []
        answer_parts.append(f"Based on the information from your documents, here's what I found:\n")
        
        for i, chunk in enumerate(context_chunks[:3], 1):
            source = chunk.get('source_file', 'Unknown')
            section = chunk.get('section', 'Unknown')
            text = chunk.get('text', '')
            
            answer_parts.append(f"{i}. From {source} ({section}):")
            answer_parts.append(f"   {text}")
            answer_parts.append("")
        
        answer_parts.append("This is a basic answer based on the retrieved content. OpenAI should provide much better AI-generated responses.")
        
        return "\n".join(answer_parts) 