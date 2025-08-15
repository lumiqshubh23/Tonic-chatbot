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

const ExamplePrompts = styled.div`
  background: #fef5e7;
  border: 1px solid #f6ad55;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
`;

const PromptExample = styled.div`
  background: white;
  padding: 10px;
  margin: 5px 0;
  border-radius: 6px;
  border-left: 4px solid #f6ad55;
  font-family: monospace;
  font-size: 14px;
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

function AutoRenameTest() {
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

  const handleSessionRenamed = (sessionId, newName) => {
    console.log('Session renamed:', sessionId, 'to', newName);
    
    // Add to test results
    setTestResults(prev => [...prev, {
      type: 'session_renamed',
      timestamp: new Date().toISOString(),
      sessionId,
      newName
    }]);
  };

  const resetTest = () => {
    setCurrentSessionId(null);
    setCurrentSessionData(null);
    setTestResults([]);
  };

  return (
    <TestContainer>
      <TestTitle>Auto-Rename Test - ChatGPT-like Session Naming</TestTitle>
      
      <TestInfo>
        <TestInfoTitle>Test Scenario: Auto-Rename Sessions</TestInfoTitle>
        <TestInfoText>
          This test verifies that sessions are automatically renamed based on the first message content,
          just like ChatGPT does. The session should change from "Default" to a meaningful name.
        </TestInfoText>
        
        <TestSteps>
          <h4>Expected Behavior:</h4>
          <StepItem>User sends first message in a new session</StepItem>
          <StepItem>Session starts as "Default"</StepItem>
          <StepItem>After AI responds, session is automatically renamed</StepItem>
          <StepItem>New name is based on the first message content</StepItem>
          <StepItem>Sidebar updates to show the new name</StepItem>
        </TestSteps>
      </TestInfo>

      <TestInfo>
        <TestInfoTitle>Example Prompts to Test</TestInfoTitle>
        <ExamplePrompts>
          <PromptExample>"How do I create a React component?"</PromptExample>
          <PromptExample>"Explain quantum computing in simple terms"</PromptExample>
          <PromptExample>"Write a Python function to sort a list"</PromptExample>
          <PromptExample>"What are the benefits of meditation?"</PromptExample>
          <PromptExample>"Help me plan a marketing strategy"</PromptExample>
        </ExamplePrompts>
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
          <div style={{ maxHeight: '300px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
            {testResults.map((result, index) => (
              <div key={index} style={{ margin: '5px 0', padding: '5px', background: '#f8f9fa', borderRadius: '4px' }}>
                <strong>{result.timestamp}:</strong> {result.type}
                {result.type === 'session_renamed' && (
                  <span style={{ color: '#38a169' }}>
                    {' '}→ "{result.newName}"
                  </span>
                )}
                {result.type === 'session_change' && (
                  <span style={{ color: '#3182ce' }}>
                    {' '}→ {result.data?.session_name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </TestInfo>
      )}

      <ChatInterface 
        currentSessionId={currentSessionId}
        currentSessionData={currentSessionData}
        onSessionChange={handleSessionChange}
        onSessionRenamed={handleSessionRenamed}
      />
    </TestContainer>
  );
}

export default AutoRenameTest;
