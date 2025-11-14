import { useState } from 'react';

const SearchInterface = ({ onSearch, isSearching = false, aiAnswer = null, sources = [] }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="card">
      <h2>Ask Your AI Tutor</h2>
      
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question about your study materials..."
          className="search-input"
          disabled={isSearching}
        />
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="search-btn"
        >
          {isSearching ? (
            <>
              <span className="loading"></span>
              Thinking...
            </>
          ) : (
            'Ask AI'
          )}
        </button>
      </form>

      {/* AI Answer Section */}
      {aiAnswer && (
        <div className="ai-answer">
          <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#2c3e50' }}>
            AI Answer:
          </h3>
          <div className="answer-content" style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap'
          }}>
            {aiAnswer}
          </div>
          
          {/* Sources Section */}
          {sources.length > 0 && (
            <div className="sources">
              <h4 style={{ marginBottom: '12px', fontSize: '16px', color: '#6c757d' }}>
                Sources ({sources.length}):
              </h4>
              {sources.map((source, index) => (
                <div key={index} className="source-item" style={{
                  background: '#ffffff',
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {source.file} - {source.section}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '13px' }}>
                    {source.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No Answer State */}
      {!aiAnswer && query && !isSearching && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>?</div>
          <p>No answer generated for your question.</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            Try rephrasing your question or upload more documents.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!aiAnswer && !query && (
        <div style={{ 
          background: '#f0f8ff', 
          border: '1px solid #b3d9ff', 
          borderRadius: '6px', 
          padding: '16px' 
        }}>
          <h4 style={{ marginBottom: '12px', color: '#0066cc' }}>AI Tutor Tips:</h4>
          <ul style={{ fontSize: '14px', color: '#0066cc', lineHeight: '1.6' }}>
            <li>Ask specific questions about concepts in your documents</li>
            <li>Use natural language - the AI understands context</li>
            <li>Try different phrasings if you don't get a good answer</li>
            <li>Upload more documents to expand your knowledge base</li>
            <li>The AI will synthesize information from multiple sources</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchInterface; 