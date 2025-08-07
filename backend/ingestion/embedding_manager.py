import os
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any

class EmbeddingManager:
    """Manages text embeddings and FAISS vector search."""
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.chunks = []  # Store chunk metadata
        self.dimension = self.model.get_sentence_embedding_dimension()

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        """Embed and add text chunks to the FAISS index."""
        texts = [chunk['text'] for chunk in chunks]
        embeddings = self.model.encode(texts, show_progress_bar=True)
        embeddings = np.array(embeddings).astype('float32')

        if self.index is None:
            self.index = faiss.IndexFlatL2(self.dimension)
        self.index.add(embeddings)
        self.chunks.extend(chunks)

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar chunks given a query string."""
        if self.index is None or len(self.chunks) == 0:
            return []
        query_emb = self.model.encode([query]).astype('float32')
        D, I = self.index.search(query_emb, top_k)
        results = []
        for idx, dist in zip(I[0], D[0]):
            if idx < len(self.chunks):
                result = self.chunks[idx].copy()
                result['distance'] = float(dist)
                results.append(result)
        return results

    def count(self) -> int:
        return len(self.chunks)