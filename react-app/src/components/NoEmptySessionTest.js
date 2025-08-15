import React, { useState } from 'react';
import ChatHistorySidebar from './ChatHistorySidebar';
import ChatInterface from './ChatInterface';
import styled from 'styled-components';

const TestContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const SidebarContainer = styled.div`
  width: 300px;
  background: #202123;
  height: 100vh;
  position: relative;
`;

const ContentArea = styled.div`
  flex: 1;
  background: #f7fafc;
  display: flex;
  flex-direction: column;
`;

const TestHeader = styled.div`
  background: white;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TestTitle = styled.h1`
  color: #2d3748;
  margin: 0 0 10px 0;
  font-size: 1.5rem;
`;

const TestInfo = styled.div`
  background: #f0fff4;
  border: 1px solid #9ae6b4;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
`;

const TestInfoTitle = styled.h3`
  color: #38a169;
  margin-bottom: 10px;
  font-size: 1rem;
`;

const TestInfoText = styled.p`
  color: #2f855a;
  line-height: 1.6;
  font-size: 14px;
  margin: 0;
`;

const TestSteps = styled.div`
  background: #fef5e7;
  border: 1px solid #f6ad55;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
`;

const StepItem = styled.div`
  margin: 8px 0;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #f6ad55;
  font-size: 14px;
  
  &:before {
    content: "✓ ";
    color: #f6ad55;
    font-weight: bold;
  }
`;

const StatusInfo = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
  font-family: monospace;
  font-size: 12px;
`;

const WarningBox = styled.div`
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
`;

const WarningTitle = styled.h4`
  color: #c53030;
  margin: 0 0 8px 0;
  font-size: 14px;
`;

const WarningText = styled.p`
  color: #c53030;
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
`;

const SuccessBox = styled.div`
  background: #f0fff4;
  border: 1px solid #9ae6b4;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
`;

const SuccessTitle = styled.h4`
  color: #38a169;
  margin: 0 0 8px 0;
  font-size: 14px;
`;

const SuccessText = styled.p`
  color: #2f855a;
  font-size: 12px;
  margin: 0;
  line-height: 1.4;
`;

function NoEmptySessionTest() {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSessionData, setCurrentSessionData] = useState(null);
  const [testEvents, setTestEvents] = useState([]);
  const [databaseCheck, setDatabaseCheck] = useState(null);

  const handleSessionSelect = (sessionData) => {
    console.log('Session selected:', sessionData);
    setCurrentSessionData(sessionData);
    setCurrentSessionId(sessionData?.session_id || null);
    
    // Add to test events
    setTestEvents(prev => [...prev, {
      type: 'session_selected',
      timestamp: new Date().toISOString(),
      sessionId: sessionData?.session_id,
      sessionName: sessionData?.session_name,
      isNewChatMode: sessionData?.isNewChatMode,
      action: sessionData ? (sessionData.isNewChatMode ? 'new_chat_mode' : 'session_created') : 'session_cleared'
    }]);
  };

  const handleSessionRenamed = (sessionId, newName) => {
    console.log('Session renamed:', sessionId, 'to', newName);
    
    // Add to test events
    setTestEvents(prev => [...prev, {
      type: 'session_renamed',
      timestamp: new Date().toISOString(),
      sessionId,
      newName
    }]);
  };

  const clearTestEvents = () => {
    setTestEvents([]);
  };

  const resetTest = () => {
    setCurrentSessionId(null);
    setCurrentSessionData(null);
    setTestEvents([]);
    setDatabaseCheck(null);
  };

  const checkDatabase = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chat-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const emptySessions = data.chat_history.filter(s => s.message_count === 0);
        setDatabaseCheck({
          totalSessions: data.chat_history.length,
          emptySessions: emptySessions.length,
          sessions: data.chat_history
        });
      }
    } catch (error) {
      console.error('Error checking database:', error);
    }
  };

  return (
    <TestContainer>
      <SidebarContainer>
        <ChatHistorySidebar 
          currentSessionId={currentSessionId}
          setCurrentSessionId={setCurrentSessionId}
          onSessionSelect={handleSessionSelect}
          onSessionRenamed={handleSessionRenamed}
          currentSessionData={currentSessionData}
        />
      </SidebarContainer>
      
      <ContentArea>
        <TestHeader>
          <TestTitle>No Empty Session Test - ChatGPT-like Behavior</TestTitle>
          
          <TestInfo>
            <TestInfoTitle>Test Scenario: Prevent Empty Sessions</TestInfoTitle>
            <TestInfoText>
              This test verifies that clicking "New Chat" with no existing conversations 
              does NOT create empty sessions in the database until the user sends their first message.
            </TestInfoText>
          </TestInfo>
          
          <WarningBox>
            <WarningTitle>⚠️ Critical Test Condition</WarningTitle>
            <WarningText>
              This test should be run when there are NO existing chat sessions in the database.
              The "New Chat" button should NOT create any database entries until the user sends their first message.
            </WarningText>
          </WarningBox>
          
          <SuccessBox>
            <SuccessTitle>✅ Expected Behavior</SuccessTitle>
            <SuccessText>
              Click "New Chat" → No database entry created → User types message → Database entry created → Session auto-renamed
            </SuccessText>
          </SuccessBox>
          
          <TestSteps>
            <h4>Test Steps:</h4>
            <StepItem>Click "New Chat" button (no existing chats)</StepItem>
            <StepItem>Check database - should have NO empty sessions</StepItem>
            <StepItem>Type a message and send it</StepItem>
            <StepItem>Check database - should have ONE session with 2 messages</StepItem>
            <StepItem>Session should be auto-renamed based on content</StepItem>
          </TestSteps>
          
          <StatusInfo>
            <strong>Current Session:</strong> {currentSessionId || 'None'}<br/>
            <strong>Session Name:</strong> {currentSessionData?.session_name || 'None'}<br/>
            <strong>New Chat Mode:</strong> {currentSessionData?.isNewChatMode ? 'Yes' : 'No'}<br/>
            <strong>Message Count:</strong> {currentSessionData?.message_count || 0}<br/>
            <strong>Test Events:</strong> {testEvents.length}
            <div style={{ marginTop: '10px' }}>
              <button 
                onClick={checkDatabase}
                style={{
                  marginRight: '10px',
                  padding: '4px 8px',
                  background: '#3182ce',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Check DB
              </button>
              <button 
                onClick={clearTestEvents}
                style={{
                  marginRight: '10px',
                  padding: '4px 8px',
                  background: '#FF6B35',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Clear Events
              </button>
              <button 
                onClick={resetTest}
                style={{
                  padding: '4px 8px',
                  background: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Reset Test
              </button>
            </div>
          </StatusInfo>
          
          {databaseCheck && (
            <StatusInfo>
              <strong>Database Check Results:</strong><br/>
              <strong>Total Sessions:</strong> {databaseCheck.totalSessions}<br/>
              <strong>Empty Sessions:</strong> {databaseCheck.emptySessions}<br/>
              <strong>Status:</strong> {databaseCheck.emptySessions === 0 ? '✅ PASS' : '❌ FAIL'}<br/>
              {databaseCheck.sessions.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Sessions:</strong>
                  {databaseCheck.sessions.map((session, index) => (
                    <div key={index} style={{ marginLeft: '10px', fontSize: '11px' }}>
                      • {session.session_name} ({session.message_count} messages)
                    </div>
                  ))}
                </div>
              )}
            </StatusInfo>
          )}
        </TestHeader>
        
        <ChatInterface 
          currentSessionId={currentSessionId}
          currentSessionData={currentSessionData}
          onSessionChange={handleSessionSelect}
          onSessionRenamed={handleSessionRenamed}
        />
      </ContentArea>
      
      {testEvents.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '400px',
          maxHeight: '400px',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '15px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Test Events</h4>
          <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
            {testEvents.map((event, index) => (
              <div key={index} style={{ 
                margin: '5px 0', 
                padding: '5px', 
                background: '#f8f9fa', 
                borderRadius: '4px',
                borderLeft: '3px solid #FF6B35'
              }}>
                <strong>{event.timestamp.split('T')[1].split('.')[0]}:</strong> {event.type}
                {event.type === 'session_renamed' && (
                  <span style={{ color: '#38a169' }}>
                    {' '}→ "{event.newName}"
                  </span>
                )}
                {event.type === 'session_selected' && (
                  <span style={{ color: '#3182ce' }}>
                    {' '}→ {event.action === 'new_chat_mode' ? 'NEW_CHAT_MODE' : 
                           event.action === 'session_cleared' ? 'CLEARED' : 
                           event.sessionName}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </TestContainer>
  );
}

export default NoEmptySessionTest;
