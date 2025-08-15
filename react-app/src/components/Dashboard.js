import React, { useState, useRef } from 'react';
import ChatHistorySidebar from './ChatHistorySidebar';
import ChatInterface from './ChatInterface';
import LogoutModal from './LogoutModal';
import styled from 'styled-components';

const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const ContentArea = styled.div`
  flex: 1;
  margin-left: 300px;
  background: #f7fafc;
  width: calc(100vw - 300px);
  
  @media (max-width: 768px) {
    margin-left: 0;
    width: 100vw;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 0;
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
`;

const Title = styled.h1`
  color: #FF6B35;
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 2px 4px rgba(255, 107, 53, 0.2);
`;

const SidebarContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;
  height: 100vh;
  z-index: 1000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
`;

function Dashboard() {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSessionData, setCurrentSessionData] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const sidebarRef = useRef(null);

  const handleSessionSelect = (sessionData) => {
    console.log('Session selected in Dashboard:', sessionData);
    
    // Handle special new chat mode flag
    if (sessionData && sessionData.isNewChatMode) {
      setCurrentSessionData({ 
        isNewChatMode: true, 
        shouldCreateSessionOnFirstMessage: true 
      });
      setCurrentSessionId(null);
      return;
    }
    
    setCurrentSessionData(sessionData);
    setCurrentSessionId(sessionData?.session_id || null);
  };

  const handleSessionRenamed = (sessionId, newName) => {
    // Update the current session data if it's the active session
    if (currentSessionId === sessionId) {
      setCurrentSessionData(prev => ({
        ...prev,
        session_name: newName
      }));
    }
    
    // Refresh the sidebar to show the updated session name
    if (sidebarRef.current && sidebarRef.current.loadChatHistory) {
      sidebarRef.current.loadChatHistory();
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    // This will be handled by the AuthContext
    window.location.href = '/login';
  };

  return (
    <DashboardContainer>
      <SidebarContainer>
        <ChatHistorySidebar 
          ref={sidebarRef}
          currentSessionId={currentSessionId}
          setCurrentSessionId={setCurrentSessionId}
          onSessionSelect={handleSessionSelect}
          onSessionRenamed={handleSessionRenamed}
          currentSessionData={currentSessionData}
        />
      </SidebarContainer>
      
      <ContentArea>
        <Header>
          <Title>TONIC AI Chatbot</Title>
        </Header>
        <ChatInterface 
          currentSessionId={currentSessionId}
          currentSessionData={currentSessionData}
          onSessionChange={handleSessionSelect}
          onSessionRenamed={handleSessionRenamed}
        />
      </ContentArea>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        user="User"
        currentSessionData={currentSessionData}
      />
    </DashboardContainer>
  );
}

export default Dashboard;