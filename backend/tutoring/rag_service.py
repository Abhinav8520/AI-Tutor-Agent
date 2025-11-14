"""
LangChain-based RAG Service.

Uses LangChain's LCEL (Runnable) approach with custom Firebase memory support.
"""

from typing import List, Dict, Any, Optional

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from backend.ingestion.langchain_vector_store import LangChainVectorStore
from backend.tutoring.langchain_tutor import LangChainTutor
from backend.tutoring.memory_manager import ConversationMemoryManager


class LangChainRAGService:
    """LangChain-based Retrieval-Augmented Generation service with conversation memory."""
    
    def __init__(self, vector_store: LangChainVectorStore, llm_tutor: LangChainTutor, 
                 memory_manager: ConversationMemoryManager):
        """
        Initialize the LangChain RAG service.
        
        Args:
            vector_store: LangChainVectorStore instance
            llm_tutor: LangChainTutor instance with memory support
            memory_manager: ConversationMemoryManager instance for Firebase integration
        """
        self.vector_store = vector_store
        self.llm_tutor = llm_tutor
        self.memory_manager = memory_manager
        self.llm = llm_tutor.llm
    
    def _format_docs(self, docs):
        """Format retrieved documents for the prompt."""
        return "\n\n".join([
            f"Source: {doc.metadata.get('source_file', 'Unknown')} ({doc.metadata.get('section', 'Unknown')})\n{doc.page_content}"
            for doc in docs
        ])
    
    def answer_question(self, query: str, top_k: int = 3, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Answer a question using LCEL-based retrieval chain with custom Firebase memory.
        
        Args:
            query: User's question
            top_k: Number of chunks to retrieve (default 3)
            user_id: Firebase user ID for conversation memory (optional)
            
        Returns:
            Dictionary with answer, sources, and metadata
        """
        # Check if vector store is initialized
        if self.vector_store.vectorstore is None:
            return {
                'answer': "I don't have enough information to answer that question. Please upload some study materials first.",
                'sources': [],
                'total_sources': 0,
                'query': query
            }
        
        try:
            # Get retriever from vector store
            retriever = self.vector_store.get_retriever(top_k=top_k)
            
            # Get conversation history if user_id provided
            chat_history = []
            if user_id:
                memory = self.memory_manager.get_memory(user_id)
                history_messages = memory.get_messages()
                # Convert to LangChain message format (last 4 messages = 2 exchanges)
                for role, content in history_messages[-4:]:
                    if role == "user":
                        chat_history.append(HumanMessage(content=content))
                    elif role == "assistant":
                        chat_history.append(AIMessage(content=content))
            
            # Create contextualize question prompt (for history-aware retrieval)
            contextualize_q_prompt = ChatPromptTemplate.from_messages([
                ("system", "Given a chat history and the latest user question "
                 "which might reference context in the chat history, formulate a standalone question "
                 "which can be understood without the chat history. Do NOT answer the question, "
                 "just reformulate it if needed and otherwise return it as is."),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}")
            ])
            
            # Create QA prompt
            qa_prompt = ChatPromptTemplate.from_messages([
                ("system", """You are a helpful AI tutor. Based on the following information from study materials, provide a clear and comprehensive answer to the student's question.

Use the following pieces of context from study materials to answer the question. If you don't know the answer, just say that you don't have enough information, don't try to make up an answer.

{context}"""),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}")
            ])
            
            # Build the RAG chain
            def get_standalone_question(input_dict):
                """Get standalone question from context."""
                if chat_history:
                    result = contextualize_q_prompt.invoke({
                        "input": input_dict["input"],
                        "chat_history": chat_history
                    })
                    standalone_question = (self.llm | StrOutputParser()).invoke(result)
                    return standalone_question
                return input_dict["input"]
            
            def retrieve_docs(input_dict):
                """Retrieve documents based on standalone question."""
                question = get_standalone_question(input_dict)
                docs = retriever.invoke(question)
                return {"docs": docs, "input": input_dict["input"]}
            
            def format_context(input_dict):
                """Format documents for the prompt."""
                context = self._format_docs(input_dict["docs"])
                return {
                    "context": context,
                    "input": input_dict["input"],
                    "chat_history": chat_history
                }
            
            # Create the full RAG chain
            rag_chain = (
                RunnablePassthrough()
                | retrieve_docs
                | format_context
                | qa_prompt
                | self.llm
                | StrOutputParser()
            )
            
            # Prepare input
            chain_input = {"input": query}
            
            # Invoke the chain
            answer = rag_chain.invoke(chain_input)
            
            # Get source documents for response
            docs_result = retrieve_docs(chain_input)
            
            source_documents = docs_result.get("docs", [])
            sources = []
            for doc in source_documents:
                text = doc.page_content if hasattr(doc, 'page_content') else str(doc)
                metadata = doc.metadata if hasattr(doc, 'metadata') else {}
                sources.append({
                    'file': metadata.get('source_file', 'Unknown'),
                    'section': metadata.get('section', 'Unknown'),
                    'text': text[:200] + '...' if len(text) > 200 else text,
                    'relevance_score': 1.0
                })
            
            # Save to memory if user_id provided
            if user_id:
                memory_obj = self.memory_manager.get_memory(user_id)
                memory_obj.add_message("user", query)
                memory_obj.add_message("assistant", answer)
            
            return {
                'answer': answer,
                'sources': sources,
                'total_sources': len(sources),
                'query': query
            }
            
        except Exception as e:
            print(f"Error in retrieval chain: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to manual retrieval
            retrieved_chunks = self.vector_store.search(query, top_k)
            
            if not retrieved_chunks:
                return {
                    'answer': "I don't have enough information to answer that question. Please upload some study materials first.",
                    'sources': [],
                    'total_sources': 0,
                    'query': query
                }
            
            # Use old method as fallback
            llm_answer = self.llm_tutor.generate_answer(query, retrieved_chunks, user_id=user_id)
            
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
