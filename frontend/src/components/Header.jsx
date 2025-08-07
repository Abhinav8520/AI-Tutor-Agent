const Header = ({ documentCount = 0 }) => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <h1>🧠 AI Study Tutor</h1>
          <div className="document-count">
            📚 {documentCount} documents loaded
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 