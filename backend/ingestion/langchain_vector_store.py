"""
LangChain Vector Store wrapper for FAISS with RecursiveCharacterTextSplitter.

Replaces the custom EmbeddingManager with LangChain's FAISS implementation.
"""

import os
from typing import List, Dict, Any, Optional

from langchain_community.vectorstores import FAISS
try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
except ImportError:
    # Fallback for newer LangChain versions
    from langchain_huggingface import HuggingFaceEmbeddings
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
try:
    from langchain_core.documents import Document
except ImportError:
    from langchain.schema import Document

from backend.config import settings


class LangChainVectorStore:
    """LangChain-based vector store using FAISS with character-based text splitting."""
    
    def __init__(self, model_name: str = 'sentence-transformers/all-MiniLM-L6-v2', 
                 persist_directory: Optional[str] = None):
        """
        Initialize the LangChain vector store.
        
        Args:
            model_name: HuggingFace embedding model name
            persist_directory: Directory to persist the vector store. 
                              If None, uses settings.data_dir
        """
        self.model_name = model_name
        self.persist_directory = persist_directory or os.path.join(settings.data_dir, "faiss_index")
        
        # Initialize embeddings
        # Try langchain-huggingface first (recommended), fallback to langchain_community
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
            self.embeddings = HuggingFaceEmbeddings(
                model_name=model_name,
                model_kwargs={'device': 'cpu'}
            )
        except ImportError:
            # Fallback to deprecated langchain_community version
            self.embeddings = HuggingFaceEmbeddings(
                model_name=model_name,
                model_kwargs={'device': 'cpu'}
            )
        
        # Initialize text splitter with character-based splitting
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,  # characters
            chunk_overlap=200,  # characters
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
        # Initialize vector store (will be created on first add)
        self.vectorstore: Optional[FAISS] = None
        
        # Try to load existing vector store
        self._load_vectorstore()
    
    def _load_vectorstore(self) -> None:
        """Load existing vector store from disk if it exists."""
        try:
            if os.path.exists(self.persist_directory) and os.path.isdir(self.persist_directory):
                self.vectorstore = FAISS.load_local(
                    self.persist_directory,
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                print(f"Loaded existing vector store from {self.persist_directory}")
        except Exception as e:
            print(f"Warning: Could not load existing vector store: {e}")
            print("   Will create a new one on first document upload")
            self.vectorstore = None
    
    def add_chunks(self, chunks: List[Dict[str, Any]]) -> None:
        """
        Add text chunks to the vector store.
        
        Args:
            chunks: List of chunk dictionaries with 'text', 'source_file', 'section', etc.
        """
        if not chunks:
            return
        
        # Convert chunks to LangChain Documents
        documents = []
        for chunk in chunks:
            # Split chunk text using RecursiveCharacterTextSplitter
            chunk_text = chunk.get('text', '')
            if not chunk_text:
                continue
            
            # Split the text into smaller chunks if needed
            split_texts = self.text_splitter.split_text(chunk_text)
            
            # Create Document objects for each split
            for i, text in enumerate(split_texts):
                metadata = {
                    'source_file': chunk.get('source_file', 'Unknown'),
                    'section': chunk.get('section', 'Unknown'),
                    'chunk_id': f"{chunk.get('chunk_id', 'unknown')}_{i}",
                    'original_chunk_id': chunk.get('chunk_id', 'unknown')
                }
                documents.append(Document(page_content=text, metadata=metadata))
        
        if not documents:
            return
        
        # Add to vector store
        if self.vectorstore is None:
            # Create new vector store
            self.vectorstore = FAISS.from_documents(documents, self.embeddings)
        else:
            # Add to existing vector store
            self.vectorstore.add_documents(documents)
        
        # Save to disk
        self._save_vectorstore()
    
    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar chunks given a query string.
        
        Args:
            query: Search query string
            top_k: Number of results to return
            
        Returns:
            List of chunk dictionaries with similarity scores
        """
        if self.vectorstore is None:
            return []
        
        try:
            # Search using similarity search
            results = self.vectorstore.similarity_search_with_score(query, k=top_k)
            
            # Convert to expected format
            chunks = []
            for doc, score in results:
                chunks.append({
                    'text': doc.page_content,
                    'source_file': doc.metadata.get('source_file', 'Unknown'),
                    'section': doc.metadata.get('section', 'Unknown'),
                    'chunk_id': doc.metadata.get('chunk_id', 'unknown'),
                    'distance': float(score),  # FAISS returns distance (lower = more similar)
                    'relevance_score': 1.0 / (1.0 + float(score))  # Convert distance to similarity
                })
            
            return chunks
        except Exception as e:
            print(f"Error searching vector store: {e}")
            return []
    
    def count(self) -> int:
        """Get the total number of documents in the vector store."""
        if self.vectorstore is None:
            return 0
        return self.vectorstore.index.ntotal if hasattr(self.vectorstore.index, 'ntotal') else 0
    
    def _save_vectorstore(self) -> None:
        """Save vector store to disk."""
        if self.vectorstore is None:
            return
        
        try:
            os.makedirs(self.persist_directory, exist_ok=True)
            self.vectorstore.save_local(self.persist_directory)
        except Exception as e:
            print(f"Warning: Could not save vector store: {e}")

