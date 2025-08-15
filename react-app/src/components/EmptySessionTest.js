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

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  margin: 15px 0;
`;

const ActionButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &.primary {
    background: #3182ce;
    color: white;
    
    &:hover {
      background: #2c5aa0;
    }
  }
  
  &.secondary {
    background: #FF6B35;
    color: white;
    
    &:hover {
      background: #e55a2b;
    }
  }
  
  &.danger {
    background: #e53e3e;
    color: white;
    
    &:hover {
      background: #c53030;
    }
  }
`;

function EmptySessionTest() {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSessionData, setCurrentSessionData] = useState(null);
  const [testEvents, setTestEvents] = useState([]);
  const [databaseCheck, setDatabaseCheck] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);

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
      messageCount: sessionData?.message_count,
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
    setSessionCount(0);
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
        setSessionCount(data.chat_history.length);
      }
    } catch (error) {
      console.error('Error checking database:', error);
    }
  };

  const createEmptySession = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ session_name: 'Empty Test Session' })
      });
      const data = await response.json();
      
      if (data.success) {
        setTestEvents(prev => [...prev, {
          type: 'empty_session_created',
          timestamp: new Date().toISOString(),
          sessionId: data.session.id,
          sessionName: data.session.session_name
        }]);
        await checkDatabase();
      }
    } catch (error) {
      console.error('Error creating empty session:', error);
    }
  };

  const deleteAllSessions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chat-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        for (const session of data.chat_history) {
          await fetch(`http://localhost:5000/api/chat-history/${session.session_id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          });
        }
        
        setTestEvents(prev => [...prev, {
          type: 'all_sessions_deleted',
          timestamp: new Date().toISOString()
        }]);
        await checkDatabase();
      }
    } catch (error) {
      console.error('Error deleting sessions:', error);
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
          <TestTitle>Empty Session Test - Prevent Unnecessary Sessions</TestTitle>
          
          <TestInfo>
            <TestInfoTitle>Test Scenario: Empty Session Handling</TestInfoTitle>
            <TestInfoText>
              This test verifies that clicking "New Chat" on an empty session (0 messages) 
              does NOT create a new database entry, but instead clears the current session.
            </TestInfoText>
          </TestInfo>
          
          <WarningBox>
            <WarningTitle>⚠️ Test Prerequisites</WarningTitle>
            <WarningText>
              This test requires at least one empty session in the database. 
              Use the "Create Empty Session" button to set up the test scenario.
            </WarningText>
          </WarningBox>
          
          <SuccessBox>
            <SuccessTitle>✅ Expected Behavior</SuccessTitle>
            <SuccessText>
              Empty Session → Click "New Chat" → Session Cleared (No New DB Entry) → User Types → New Session Created
            </SuccessText>
          </SuccessBox>
          
          <TestSteps>
            <h4>Test Steps:</h4>
            <StepItem>Create an empty session using the button below</StepItem>
            <StepItem>Select the empty session (should show 0 messages)</StepItem>
            <StepItem>Click "New Chat" button</StepItem>
            <StepItem>Check database - session count should NOT increase</StepItem>
            <StepItem>Type a message and send it</StepItem>
            <StepItem>Check database - should have new session with 2 messages</StepItem>
          </TestSteps>
          
          <ActionButtons>
            <ActionButton className="primary" onClick={checkDatabase}>
              Check Database
            </ActionButton>
            <ActionButton className="secondary" onClick={createEmptySession}>
              Create Empty Session
            </ActionButton>
            <ActionButton className="danger" onClick={deleteAllSessions}>
              Delete All Sessions
            </ActionButton>
            <ActionButton className="secondary" onClick={clearTestEvents}>
              Clear Events
            </ActionButton>
            <ActionButton className="danger" onClick={resetTest}>
              Reset Test
            </ActionButton>
          </ActionButtons>
          
          <StatusInfo>
            <strong>Current Session:</strong> {currentSessionId || 'None'}<br/>
            <strong>Session Name:</strong> {currentSessionData?.session_name || 'None'}<br/>
            <strong>Message Count:</strong> {currentSessionData?.message_count || 0}<br/>
            <strong>New Chat Mode:</strong> {currentSessionData?.isNewChatMode ? 'Yes' : 'No'}<br/>
            <strong>Total Sessions:</strong> {sessionCount}<br/>
            <strong>Test Events:</strong> {testEvents.length}
          </StatusInfo>
          
          {databaseCheck && (
            <StatusInfo>
              <strong>Database Check Results:</strong><br/>
              <strong>Total Sessions:</strong> {databaseCheck.totalSessions}<br/>
              <strong>Empty Sessions:</strong> {databaseCheck.emptySessions}<br/>
              <strong>Status:</strong> {databaseCheck.emptySessions === 0 ? '✅ PASS' : '⚠️ HAS_EMPTY'}<br/>
              {databaseCheck.sessions.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Sessions:</strong>
                  {databaseCheck.sessions.map((session, index) => (
                    <div key={index} style={{ 
                      marginLeft: '10px', 
                      fontSize: '11px',
                      color: session.message_count === 0 ? '#e53e3e' : '#38a169'
                    }}>
                      • {session.session_name} ({session.message_count} messages)
                      {session.message_count === 0 && ' - EMPTY'}
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
                           event.sessionName} ({event.messageCount} msgs)
                  </span>
                )}
                {event.type === 'empty_session_created' && (
                  <span style={{ color: '#e53e3e' }}>
                    {' '}→ "{event.sessionName}" (EMPTY)
                  </span>
                )}
                {event.type === 'all_sessions_deleted' && (
                  <span style={{ color: '#e53e3e' }}>
                    {' '}→ ALL DELETED
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

export default EmptySessionTest;
