import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ChatInterface from './ChatInterface';
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
  background: white;
  z-index: 1000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
`;

function Dashboard() {
  const [currentSession, setCurrentSession] = useState('Default');
  const [sessions, setSessions] = useState({
    'Default': []
  });

  return (
    <DashboardContainer>
      <SidebarContainer>
        <Sidebar 
          currentSession={currentSession}
          setCurrentSession={setCurrentSession}
          sessions={sessions}
          setSessions={setSessions}
        />
      </SidebarContainer>
      
      <ContentArea>
        <Header>
          {/* <Logo>TONIC</Logo> */}
          <Title>TONIC AI Chatbot</Title>
        </Header>
        <ChatInterface 
          currentSession={currentSession}
          sessions={sessions}
          setSessions={setSessions}
        />
      </ContentArea>
    </DashboardContainer>
  );
}

export default Dashboard;