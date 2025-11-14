"""
LangChain-based Quiz Generator.

Uses LangChain's ChatOpenAI for structured quiz generation.
"""

import os
import json
import re
from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from backend.config import settings


class QuizGenerator:
    """LangChain-based quiz generator that creates 5 questions from document content."""
    
    def __init__(self, api_key: str = None):
        """
        Initialize the quiz generator.
        
        Args:
            api_key: OpenAI API key. If None, uses settings or environment variable.
        """
        self.api_key = api_key or settings.openai_api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required for quiz generation.")
        
        # Initialize LangChain ChatOpenAI
        self.llm = ChatOpenAI(
            model="gpt-3.5-turbo",
            temperature=0.7,
            max_tokens=1500,
            openai_api_key=self.api_key
        )
    
    def generate_quiz(self, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a simple 5-question quiz from document chunks."""
        if not context_chunks:
            return {
                "error": "No content available for quiz generation. Please upload documents first."
            }
        
        try:
            # Prepare context from chunks
            context_text = self._prepare_context(context_chunks)
            
            # Generate quiz using OpenAI
            quiz_data = self._generate_quiz_with_openai(context_text)
            
            return quiz_data
            
        except Exception as e:
            print(f"Error generating quiz: {e}")
            return {
                "error": f"Failed to generate quiz: {str(e)}"
            }
    
    def _prepare_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Prepare context text from document chunks."""
        context_parts = []
        for i, chunk in enumerate(chunks[:10], 1):  # Use top 10 chunks
            source = chunk.get('source_file', 'Unknown')
            section = chunk.get('section', 'Unknown')
            text = chunk.get('text', '')
            context_parts.append(f"Source {i} ({source}, {section}): {text}")
        
        return "\n\n".join(context_parts)
    
    def _generate_quiz_with_openai(self, context: str) -> Dict[str, Any]:
        """Generate quiz using LangChain ChatOpenAI."""
        
        # Create prompt for quiz generation
        prompt = self._create_quiz_prompt(context)
        
        try:
            # Use LangChain's invoke method with proper message format
            try:
                from langchain_core.messages import HumanMessage, SystemMessage
            except ImportError:
                from langchain.schema import HumanMessage, SystemMessage
            
            messages = [
                SystemMessage(content="You are a simple quiz generator that creates 5 basic multiple choice questions."),
                HumanMessage(content=prompt)
            ]
            
            response = self.llm.invoke(messages)
            quiz_text = response.content.strip()
            
            # Parse the quiz response
            quiz_data = self._parse_quiz_response(quiz_text)
            
            return quiz_data
            
        except Exception as e:
            print(f"Error in LangChain quiz generation: {e}")
            raise
    
    def _create_quiz_prompt(self, context: str) -> str:
        """Create a simple prompt for quiz generation."""
        
        prompt = f"""Based on the following study material, generate exactly 5 simple multiple choice questions.

Study Material:
{context}

Requirements:
- Generate exactly 5 questions
- Each question should have 4 options (A, B, C, D)
- Questions should be clear and test basic understanding
- Provide correct answer for each question
- Keep questions simple and straightforward

Format your response as JSON:
{{
  "questions": [
    {{
      "question": "Question text here?",
      "options": {{
        "A": "Option A",
        "B": "Option B", 
        "C": "Option C",
        "D": "Option D"
      }},
      "correct_answer": "A"
    }}
  ]
}}

Generate exactly 5 questions:"""
        
        return prompt
    
    def _parse_quiz_response(self, quiz_text: str) -> Dict[str, Any]:
        """Parse the quiz response from OpenAI."""
        try:
            import json
            import re
            
            # Find JSON in the response
            json_match = re.search(r'\{.*\}', quiz_text, re.DOTALL)
            if json_match:
                quiz_json = json.loads(json_match.group())
                
                # Validate the structure
                if "questions" in quiz_json and isinstance(quiz_json["questions"], list):
                    return {
                        "questions": quiz_json["questions"],
                        "total_questions": len(quiz_json["questions"])
                    }
            
            # Fallback: create a simple quiz structure
            return {
                "questions": [
                    {
                        "question": "Unable to generate quiz. Please try again.",
                        "options": {"A": "Error", "B": "Error", "C": "Error", "D": "Error"},
                        "correct_answer": "A"
                    }
                ],
                "total_questions": 1
            }
            
        except Exception as e:
            print(f"Error parsing quiz response: {e}")
            return {
                "questions": [
                    {
                        "question": "Quiz generation failed. Please try again.",
                        "options": {"A": "Error", "B": "Error", "C": "Error", "D": "Error"},
                        "correct_answer": "A"
                    }
                ],
                "total_questions": 1
            }
    
    def check_answer(self, question_index: int, user_answer: str, quiz_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check if a single answer is correct."""
        if "questions" not in quiz_data:
            return {"error": "Invalid quiz data"}
        
        questions = quiz_data["questions"]
        if question_index < 0 or question_index >= len(questions):
            return {"error": "Invalid question index"}
        
        question = questions[question_index]
        correct_answer = question.get("correct_answer", "")
        
        is_correct = user_answer.upper() == correct_answer.upper()
        
        return {
            "is_correct": is_correct,
            "correct_answer": correct_answer,
            "user_answer": user_answer
        } 