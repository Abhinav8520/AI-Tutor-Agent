import { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';

const AuthContainer = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {isLogin ? (
        <Login onSwitchToSignup={() => setIsLogin(false)} />
      ) : (
        <SignUp onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
};

export default AuthContainer;

