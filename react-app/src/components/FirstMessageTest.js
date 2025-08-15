import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import styled from 'styled-components';

const TestContainer = styled.div`
  padding: 20px;
  background: #f7fafc;
  min-height: 100vh;
`;

const TestTitle = styled.h1`
  color: #2d3748;
  margin-bottom: 20px;
  text-align: center;
`;

const TestInfo = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TestInfoTitle = styled.h3`
  color: #FF6B35;
  margin-bottom: 10px;
`;

const TestInfoText = styled.p`
  color: #4a5568;
  line-height: 1.6;
`;

const TestSteps = styled.div`
  background: #f0fff4;
  border: 1px solid #9ae6b4;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
`;

const StepItem = styled.div`
  margin: 8px 0;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #38a169;
  
  &:before {
    content: "✓ ";
    color: #38a169;
    font-weight: bold;
  }
`;

const ResetButton = styled.button`
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
`;

function FirstMessageTest() {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSessionData, setCurrentSessionData] = useState(null);
  const [testResults, setTestResults] = useState([]);

  const handleSessionChange = (sessionData) => {
    console.log('Session changed in test:', sessionData);
    setCurrentSessionData(sessionData);
    setCurrentSessionId(sessionData?.session_id || null);
    
    // Add to test results
    setTestResults(prev => [...prev, {
      type: 'session_change',
      timestamp: new Date().toISOString(),
      data: sessionData
    }]);
  };

  const resetTest = () => {
    setCurrentSessionId(null);
    setCurrentSessionData(null);
    setTestResults([]);
  };

  return (
    <TestContainer>
      <TestTitle>First Message Test - New User Experience</TestTitle>
      
      <TestInfo>
        <TestInfoTitle>Test Scenario: New User's First Message</TestInfoTitle>
        <TestInfoText>
          This test simulates a new user who has just logged in for the first time.
          The goal is to verify that both the user's prompt and the AI response are visible.
        </TestInfoText>
        
        <TestSteps>
          <h4>Expected Behavior:</h4>
          <StepItem>User can type a message immediately (no session required)</StepItem>
          <StepItem>When user sends first message, a "Default" session is created automatically</StepItem>
          <StepItem>User's prompt/question should be visible in the chat</StepItem>
          <StepItem>AI response should be visible in the chat</StepItem>
          <StepItem>Both messages should persist when session is reloaded</StepItem>
        </TestSteps>
      </TestInfo>

      <TestInfo>
        <TestInfoTitle>Current State</TestInfoTitle>
        <TestInfoText>
          <strong>Session ID:</strong> {currentSessionId || 'None (will be created automatically)'}<br/>
          <strong>Session Name:</strong> {currentSessionData?.session_name || 'None'}<br/>
          <strong>Message Count:</strong> {currentSessionData?.message_count || 0}<br/>
          <strong>Test Events:</strong> {testResults.length}
        </TestInfoText>
        
        <ResetButton onClick={resetTest}>
          🔄 Reset Test
        </ResetButton>
      </TestInfo>

      {testResults.length > 0 && (
        <TestInfo>
          <TestInfoTitle>Test Events Log</TestInfoTitle>
          <div style={{ maxHeight: '200px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
            {testResults.map((result, index) => (
              <div key={index} style={{ margin: '5px 0', padding: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                <strong>{result.timestamp}:</strong> {result.type} - {JSON.stringify(result.data)}
              </div>
            ))}
          </div>
        </TestInfo>
      )}

      <ChatInterface 
        currentSessionId={currentSessionId}
        currentSessionData={currentSessionData}
        onSessionChange={handleSessionChange}
      />
    </TestContainer>
  );
}

export default FirstMessageTest;
