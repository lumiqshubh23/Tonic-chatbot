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

const SessionList = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
  max-height: 200px;
  overflow-y: auto;
`;

const SessionItem = styled.div`
  padding: 8px;
  margin: 4px 0;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #3182ce;
  font-size: 12px;
  
  &.unique {
    border-left-color: #38a169;
  }
  
  &.default {
    border-left-color: #e53e3e;
  }
`;

function UniqueSessionTest() {
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
        const uniqueSessions = data.chat_history.filter(s => 
          s.session_name !== 'Default' && 
          s.session_name !== 'New Chat' &&
          !s.session_name.includes('Empty Test')
        );
        const defaultSessions = data.chat_history.filter(s => 
          s.session_name === 'Default' || 
          s.session_name === 'New Chat'
        );
        
        setDatabaseCheck({
          totalSessions: data.chat_history.length,
          uniqueSessions: uniqueSessions.length,
          defaultSessions: defaultSessions.length,
          sessions: data.chat_history
        });
        setSessionCount(data.chat_history.length);
      }
    } catch (error) {
      console.error('Error checking database:', error);
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

  const testSessionNameGeneration = () => {
    const testQuestions = [
      "How to create a React component?",
      "What is the difference between useState and useEffect?",
      "Explain async/await in JavaScript",
      "How to deploy a Node.js application?",
      "What are the best practices for API design?",
      "How to implement authentication in a web app?",
      "Explain the concept of closures in JavaScript",
      "What is the virtual DOM in React?",
      "How to optimize database queries?",
      "What are microservices and when to use them?"
    ];
    
    setTestEvents(prev => [...prev, {
      type: 'name_generation_test',
      timestamp: new Date().toISOString(),
      testQuestions: testQuestions
    }]);
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
          <TestTitle>Unique Session Names Test - ChatGPT-like Naming</TestTitle>
          
          <TestInfo>
            <TestInfoTitle>Test Scenario: Unique Session Naming</TestInfoTitle>
            <TestInfoText>
              This test verifies that sessions are created with unique, meaningful names 
              based on the chat content, just like ChatGPT does.
            </TestInfoText>
          </TestInfo>
          
          <WarningBox>
            <WarningTitle>⚠️ Test Requirements</WarningTitle>
            <WarningText>
              This test requires creating multiple sessions with different questions to verify 
              that each session gets a unique, meaningful name based on the content.
            </WarningText>
          </WarningBox>
          
          <SuccessBox>
            <SuccessTitle>✅ Expected Behavior</SuccessTitle>
            <SuccessText>
              Type Question → Session Created with Unique Name → No "Default" Names → Meaningful Titles
            </SuccessText>
          </SuccessBox>
          
          <TestSteps>
            <h4>Test Steps:</h4>
            <StepItem>Click "New Chat" to start a fresh session</StepItem>
            <StepItem>Type a meaningful question (e.g., "How to create React components?")</StepItem>
            <StepItem>Send the message and check the sidebar</StepItem>
            <StepItem>Verify the session has a unique name (not "Default")</StepItem>
            <StepItem>Repeat with different questions to test uniqueness</StepItem>
            <StepItem>Check database to see all unique session names</StepItem>
          </TestSteps>
          
          <ActionButtons>
            <ActionButton className="primary" onClick={checkDatabase}>
              Check Database
            </ActionButton>
            <ActionButton className="secondary" onClick={testSessionNameGeneration}>
              Test Name Generation
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
              <strong>Unique Sessions:</strong> {databaseCheck.uniqueSessions}<br/>
              <strong>Default Sessions:</strong> {databaseCheck.defaultSessions}<br/>
              <strong>Status:</strong> {databaseCheck.defaultSessions === 0 ? '✅ PASS' : '❌ FAIL'}<br/>
              {databaseCheck.sessions.length > 0 && (
                <SessionList>
                  <strong>Sessions:</strong>
                  {databaseCheck.sessions.map((session, index) => (
                    <SessionItem 
                      key={index} 
                      className={session.session_name === 'Default' || session.session_name === 'New Chat' ? 'default' : 'unique'}
                    >
                      • {session.session_name} ({session.message_count} messages)
                      {session.session_name === 'Default' && ' - DEFAULT NAME'}
                      {session.session_name === 'New Chat' && ' - GENERIC NAME'}
                    </SessionItem>
                  ))}
                </SessionList>
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
                {event.type === 'all_sessions_deleted' && (
                  <span style={{ color: '#e53e3e' }}>
                    {' '}→ ALL DELETED
                  </span>
                )}
                {event.type === 'name_generation_test' && (
                  <span style={{ color: '#3182ce' }}>
                    {' '}→ {event.testQuestions.length} test questions ready
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

export default UniqueSessionTest;
