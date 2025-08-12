import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, User, Lock } from 'lucide-react';
import styled from 'styled-components';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-width: 1000px;
  width: 100%;
  border: 1px solid #e2e8f0;
  display: flex;
`;

const LeftSection = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #f8f9fa;
`;

const RightSection = styled.div`
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const WelcomeText = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h2 {
    color: #4a5568;
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  
  h1 {
    color: #FF6B35;
    font-size: 4.8rem;
    font-weight: 700;
    margin: 0;
    text-shadow: 0 2px 4px rgba(255, 107, 53, 0.2);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 5px;
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  background: #f8f9fa;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #FF6B35;
    background: white;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0 25px 0;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4a5568;
  font-size: 0.9rem;
  cursor: pointer;
`;

const ForgotLink = styled.a`
  color: #FF6B35;
  text-decoration: none;
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
    color: #e53e3e;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 15px 20px;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 25px rgba(255, 107, 53, 0.3);
    background: linear-gradient(135deg, #e53e3e 0%, #FF6B35 100%);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const RegisterText = styled.div`
  text-align: center;
  margin-top: 20px;
  color: #718096;
  
  a {
    color: #FF6B35;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      color: #e53e3e;
      text-decoration: underline;
    }
  }
`;

const Illustration = styled.div`
  width: 100%;
  max-width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 4rem;
  font-weight: bold;
`;

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await login(username, password, rememberMe);
    if (success) {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LeftSection>
          <Illustration>
            TONIC
          </Illustration>
        </LeftSection>
        
        <RightSection>
          <WelcomeText>
            <h2>Welcome to</h2>
            <h1>TONIC AI</h1>
          </WelcomeText>
          
          <form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="example@gmail.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </FormGroup>
            
            <CheckboxContainer>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </CheckboxLabel>
              <ForgotLink href="#">Forgot Password?</ForgotLink>
            </CheckboxContainer>
            
            <LoginButton type="submit" disabled={loading}>
              {loading ? (
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
              ) : (
                <LogIn size={20} />
              )}
              Login
            </LoginButton>
          </form>
          
          <RegisterText>
            Don't have an account? <a href="#">Register</a>
          </RegisterText>
        </RightSection>
      </LoginCard>
    </LoginContainer>
  );
}

export default Login;
