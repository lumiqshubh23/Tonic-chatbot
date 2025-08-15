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
`;

const TestInfoTitle = styled.h3`
  color: #FF6B35;
  margin-bottom: 10px;
`;

const TestInfoText = styled.p`
  color: #4a5568;
  line-height: 1.6;
`;

function ChatInterfaceTest() {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSessionData, setCurrentSessionData] = useState(null);

  const handleSessionChange = (sessionData) => {
    console.log('Session changed:', sessionData);
    setCurrentSessionData(sessionData);
    setCurrentSessionId(sessionData?.session_id || null);
  };

  return (
    <TestContainer>
      <TestTitle>Chat Interface Test - New User Experience</TestTitle>
      
      <TestInfo>
        <TestInfoTitle>Test Scenario: New User Login</TestInfoTitle>
        <TestInfoText>
          This test simulates a new user who has just logged in for the first time.
          The user should be able to:
        </TestInfoText>
        <ul>
          <li>Type a message in the input box</li>
          <li>Press Enter or click Send button</li>
          <li>Have a default session automatically created</li>
          <li>Receive an AI response</li>
        </ul>
      </TestInfo>

      <TestInfo>
        <TestInfoTitle>Current State</TestInfoTitle>
        <TestInfoText>
          <strong>Session ID:</strong> {currentSessionId || 'None (will be created automatically)'}<br/>
          <strong>Session Name:</strong> {currentSessionData?.session_name || 'None'}<br/>
          <strong>Message Count:</strong> {currentSessionData?.message_count || 0}
        </TestInfoText>
      </TestInfo>

      <ChatInterface 
        currentSessionId={currentSessionId}
        currentSessionData={currentSessionData}
        onSessionChange={handleSessionChange}
      />
    </TestContainer>
  );
}

export default ChatInterfaceTest;
