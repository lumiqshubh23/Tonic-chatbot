import React, { useState } from 'react';
import LogoutModal from './LogoutModal';
import styled from 'styled-components';

const DemoContainer = styled.div`
  padding: 40px;
  text-align: center;
  background: #f7fafc;
  min-height: 100vh;
`;

const DemoButton = styled.button`
  padding: 16px 32px;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(255, 107, 53, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const DemoTitle = styled.h1`
  color: #2d3748;
  margin-bottom: 20px;
  font-size: 2.5rem;
  font-weight: 700;
`;

const DemoSubtitle = styled.p`
  color: #718096;
  margin-bottom: 40px;
  font-size: 1.1rem;
`;

function LogoutModalDemo() {
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    console.log('Logout confirmed!');
    alert('Logout functionality would be triggered here.');
  };

  return (
    <DemoContainer>
      <DemoTitle>TONIC AI Logout Modal</DemoTitle>
      <DemoSubtitle>
        A beautifully styled logout confirmation modal with the TONIC AI theme
      </DemoSubtitle>
      
      <DemoButton onClick={() => setShowModal(true)}>
        🚪 Show Logout Modal
      </DemoButton>
      
      <LogoutModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleLogout}
        user="admin@123"
        currentSessionData={{
          session_name: "Demo Session",
          message_count: 15
        }}
      />
    </DemoContainer>
  );
}

export default LogoutModalDemo;
