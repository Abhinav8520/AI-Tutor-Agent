import { useAuth } from '../contexts/AuthContext';

const Header = ({ documentCount = 0 }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      // Logout successful, user will be redirected by App.jsx
      console.log('Logged out successfully');
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <h1>AI Study Tutor</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="document-count">
              {documentCount} documents loaded
            </div>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#fff', fontSize: '14px' }}>
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 