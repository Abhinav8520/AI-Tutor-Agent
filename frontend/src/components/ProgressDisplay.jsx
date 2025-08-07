import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { progressService } from '../services/progressService';

const ProgressDisplay = forwardRef((props, ref) => {
  const [history, setHistory] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const [quizHistory, weakTopicsList] = await Promise.all([
        progressService.getQuizHistory(),
        progressService.getWeakTopics()
      ]);
      setHistory(quizHistory);
      setWeakTopics(weakTopicsList);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refresh: loadProgress
  }));

  useEffect(() => {
    loadProgress();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="card">
        <h2>📊 Your Progress</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📊 Your Progress</h2>
        <button
          onClick={loadProgress}
          disabled={loading}
          style={{
            padding: '8px 16px',
            border: '1px solid #007bff',
            borderRadius: '6px',
            background: 'white',
            color: '#007bff',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>
      
      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '16px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '16px', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
            {history.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Total Quizzes</div>
        </div>
        
        <div style={{ 
          background: '#f8f9fa', 
          padding: '16px', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            {history.length > 0 ? Math.round(history.reduce((sum, quiz) => sum + quiz.percentage, 0) / history.length) : 0}%
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Average Score</div>
        </div>
        
        <div style={{ 
          background: '#f8f9fa', 
          padding: '16px', 
          borderRadius: '8px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
            {weakTopics.length}
          </div>
          <div style={{ fontSize: '14px', color: '#6c757d' }}>Weak Topics</div>
        </div>
      </div>

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '12px', color: '#dc3545' }}>🎯 Focus Areas</h3>
          <div style={{ 
            background: '#f8d7da', 
            border: '1px solid #f5c6cb', 
            borderRadius: '6px', 
            padding: '12px' 
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#721c24', fontWeight: 'bold' }}>
              Topics to review:
            </p>
            <ul style={{ margin: '0', paddingLeft: '20px', color: '#721c24' }}>
              {weakTopics.map((topic, index) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recent Quiz History */}
      {history.length > 0 ? (
        <div>
          <h3 style={{ marginBottom: '12px' }}>📝 Recent Quizzes</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {history.slice(0, 5).map((quiz, index) => (
              <div key={quiz.id} style={{ 
                border: '1px solid #e9ecef', 
                borderRadius: '6px', 
                padding: '12px', 
                marginBottom: '8px',
                background: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      Quiz #{history.length - index}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                      {formatDate(quiz.date)}
                    </div>
                  </div>
                  <div style={{ 
                    background: quiz.percentage >= 80 ? '#d4edda' : quiz.percentage >= 60 ? '#fff3cd' : '#f8d7da',
                    color: quiz.percentage >= 80 ? '#155724' : quiz.percentage >= 60 ? '#856404' : '#721c24',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    {quiz.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ 
          background: '#f0f8ff', 
          border: '1px solid #b3d9ff', 
          borderRadius: '6px', 
          padding: '16px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0', color: '#0066cc' }}>
            No quizzes taken yet. Take your first quiz to see your progress!
          </p>
        </div>
      )}
    </div>
  );
});

export default ProgressDisplay; 