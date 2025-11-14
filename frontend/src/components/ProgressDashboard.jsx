import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { progressService } from '../services/progressService';

const ProgressDashboard = ({ onClose }) => {
  const { user } = useAuth();
  const [quizHistory, setQuizHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      loadProgressData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProgressData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [history, stats] = await Promise.all([
        progressService.getQuizHistory(user.uid),
        progressService.getQuizStatistics(user.uid)
      ]);
      setQuizHistory(history);
      setStatistics(stats);
    } catch (err) {
      console.error('Error loading progress data:', err);
      setError('Failed to load progress data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (percentage) => {
    const isPass = percentage >= 60;
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          background: isPass ? '#d4edda' : '#f8d7da',
          color: isPass ? '#155724' : '#721c24'
        }}
      >
        {isPass ? 'Pass' : 'Fail'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div
            style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}
          ></div>
          <p>Loading your progress...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '40px', color: '#721c24' }}>
          <p>{error}</p>
          <button
            onClick={loadProgressData}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Your Progress Dashboard</h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Close
          </button>
        )}
      </div>

      {/* Statistics Section */}
      {statistics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff', marginBottom: '8px' }}>
              {statistics.totalQuizzes}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>Total Quizzes</div>
          </div>
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745', marginBottom: '8px' }}>
              {statistics.averageScore}%
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>Average Score</div>
          </div>
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107', marginBottom: '8px' }}>
              {statistics.bestScore}%
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>Best Score</div>
          </div>
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#6c757d', marginBottom: '8px' }}>
              {formatDate(statistics.lastQuizDate)}
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d' }}>Last Quiz</div>
          </div>
        </div>
      )}

      {/* Quiz History Section */}
      <div>
        <h3 style={{ marginBottom: '16px', color: '#2c3e50' }}>Quiz History</h3>
        
        {quizHistory.length === 0 ? (
          <div style={{
            background: '#f0f8ff',
            border: '1px solid #b3d9ff',
            borderRadius: '6px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#0066cc', fontSize: '16px', marginBottom: '8px' }}>
              No quiz history yet
            </p>
            <p style={{ color: '#0066cc', fontSize: '14px' }}>
              Complete some quizzes to see your progress here!
            </p>
          </div>
        ) : (
          <div style={{
            overflowX: 'auto',
            background: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '8px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#495057' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#495057' }}>Score</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#495057' }}>Percentage</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#495057' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {quizHistory.map((quiz, index) => (
                  <tr
                    key={quiz.id}
                    style={{
                      borderBottom: index < quizHistory.length - 1 ? '1px solid #e9ecef' : 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.parentElement.style.background = '#f8f9fa'}
                    onMouseLeave={(e) => e.target.parentElement.style.background = 'white'}
                  >
                    <td style={{ padding: '12px', color: '#495057' }}>{formatDate(quiz.date)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#495057' }}>
                      {quiz.score} / {quiz.total}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#495057', fontWeight: 'bold' }}>
                      {quiz.percentage}%
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {getStatusBadge(quiz.percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressDashboard;

