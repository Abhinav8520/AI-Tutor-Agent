"""
Conversation Memory Manager for LangChain.

Manages per-user conversation memories for context-aware responses.
"""

from typing import Dict, List, Tuple


class ConversationMemory:
    """Simple conversation memory for a user."""
    
    def __init__(self, user_id: str, max_messages: int = 10):
        """
        Initialize conversation memory.
        
        Args:
            user_id: Firebase user ID
            max_messages: Maximum number of messages to keep in memory
        """
        self.user_id = user_id
        self.max_messages = max_messages
        self.messages: List[Tuple[str, str]] = []  # List of (role, content) tuples
    
    def add_message(self, role: str, content: str) -> None:
        """
        Add a message to memory.
        
        Args:
            role: 'user' or 'assistant'
            content: Message content
        """
        self.messages.append((role, content))
        # Keep only last max_messages
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]
    
    def get_messages(self) -> List[Tuple[str, str]]:
        """Get all messages in memory."""
        return self.messages.copy()
    
    def clear(self) -> None:
        """Clear all messages."""
        self.messages = []
    


class ConversationMemoryManager:
    """Manages conversation memories for multiple users."""
    
    def __init__(self):
        """Initialize the memory manager."""
        # Store memories per user
        self.memories: Dict[str, ConversationMemory] = {}
    
    def get_memory(self, user_id: str) -> ConversationMemory:
        """
        Get or create conversation memory for a user.
        
        Args:
            user_id: Firebase user ID
            
        Returns:
            ConversationMemory instance for the user
        """
        if user_id not in self.memories:
            # Create new memory for this user
            self.memories[user_id] = ConversationMemory(user_id)
        
        return self.memories[user_id]
    
    def clear_memory(self, user_id: str) -> None:
        """
        Clear conversation memory for a user.
        
        Args:
            user_id: Firebase user ID
        """
        if user_id in self.memories:
            self.memories[user_id].clear()
            del self.memories[user_id]

