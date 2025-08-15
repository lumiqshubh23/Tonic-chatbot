import React, { useState } from 'react';
import { chatHistoryAPI } from '../services/api';
import styled from 'styled-components';
import toast from 'react-hot-toast';

const TestContainer = styled.div`
  padding: 40px;
  max-width: 600px;
  margin: 0 auto;
`;

const TestTitle = styled.h1`
  color: #2d3748;
  text-align: center;
  margin-bottom: 30px;
`;

const TestSection = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TestButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin: 10px 5px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResultBox = styled.div`
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  font-family: monospace;
  font-size: 14px;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
`;

const InputField = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 10px;
  
  &:focus {
    outline: none;
    border-color: #FF6B35;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }
`;

function SessionTest() {
  const [sessionName, setSessionName] = useState('Test Session');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testCreateSession = async () => {
    setIsLoading(true);
    setResult('Testing session creation...\n');
    
    try {
      console.log('Testing with session name:', sessionName);
      
      const response = await chatHistoryAPI.createChatSession(sessionName);
      
      setResult(prev => prev + `✅ Success!\nResponse: ${JSON.stringify(response, null, 2)}\n`);
      toast.success('Session created successfully!');
      
    } catch (error) {
      console.error('Session creation error:', error);
      setResult(prev => prev + `❌ Error: ${error.message}\nResponse: ${JSON.stringify(error.response?.data, null, 2)}\n`);
      toast.error('Failed to create session');
    } finally {
      setIsLoading(false);
    }
  };

  const testGetHistory = async () => {
    setIsLoading(true);
    setResult('Testing get chat history...\n');
    
    try {
      const response = await chatHistoryAPI.getAllChatHistory();
      
      setResult(prev => prev + `✅ Success!\nResponse: ${JSON.stringify(response, null, 2)}\n`);
      toast.success('Chat history retrieved successfully!');
      
    } catch (error) {
      console.error('Get history error:', error);
      setResult(prev => prev + `❌ Error: ${error.message}\nResponse: ${JSON.stringify(error.response?.data, null, 2)}\n`);
      toast.error('Failed to get chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResult = () => {
    setResult('');
  };

  return (
    <TestContainer>
      <TestTitle>Session API Test</TestTitle>
      
      <TestSection>
        <h3>Test Session Creation</h3>
        <p>This test verifies that the session creation API works with the correct payload format.</p>
        
        <InputField
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Enter session name"
        />
        
        <TestButton onClick={testCreateSession} disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Session'}
        </TestButton>
        
        <TestButton onClick={testGetHistory} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Get Chat History'}
        </TestButton>
        
        <TestButton onClick={clearResult} disabled={isLoading}>
          Clear Results
        </TestButton>
      </TestSection>
      
      {result && (
        <TestSection>
          <h3>Test Results</h3>
          <ResultBox>{result}</ResultBox>
        </TestSection>
      )}
    </TestContainer>
  );
}

export default SessionTest;
