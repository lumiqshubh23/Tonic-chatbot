import React from 'react';
import { LogOut, X, AlertTriangle, User } from 'lucide-react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  width: 400px;
  max-width: 90vw;
  overflow: hidden;
  animation: ${slideIn} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  color: white;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderIcon = styled.div`
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const HeaderSubtitle = styled.p`
  margin: 4px 0 0 0;
  font-size: 14px;
  opacity: 0.9;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
`;

const UserAvatar = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 18px;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #2d3748;
  font-size: 16px;
  margin-bottom: 4px;
`;

const UserStatus = styled.div`
  font-size: 14px;
  color: #718096;
`;

const WarningMessage = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 12px;
  margin-bottom: 24px;
`;

const WarningIcon = styled.div`
  color: #e53e3e;
  flex-shrink: 0;
  margin-top: 2px;
`;

const WarningText = styled.div`
  color: #c53030;
  font-size: 14px;
  line-height: 1.5;
`;

const KeyboardHint = styled.div`
  font-size: 12px;
  color: #718096;
  text-align: center;
  margin-top: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 0 24px 24px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &.primary {
    background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  &.secondary {
    background: #f8f9fa;
    color: #4a5568;
    border: 1px solid #e2e8f0;
    
    &:hover {
      background: #e9ecef;
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SessionInfo = styled.div`
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
`;

const SessionTitle = styled.div`
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
  margin-bottom: 4px;
`;

const SessionDetails = styled.div`
  font-size: 12px;
  color: #718096;
`;

function LogoutModal({ isOpen, onClose, onConfirm, user, currentSessionData }) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleConfirm();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer>
        <ModalHeader>
          <HeaderIcon>
            <LogOut size={20} />
          </HeaderIcon>
          <HeaderContent>
            <HeaderTitle>Confirm Logout</HeaderTitle>
            <HeaderSubtitle>Are you sure you want to logout?</HeaderSubtitle>
          </HeaderContent>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <UserInfo>
            <UserAvatar>
              {user ? user.charAt(0).toUpperCase() : 'U'}
            </UserAvatar>
            <UserDetails>
              <UserName>{user || 'User'}</UserName>
              <UserStatus>Active Session</UserStatus>
            </UserDetails>
          </UserInfo>
          
          {currentSessionData && (
            <SessionInfo>
              <SessionTitle>Current Session</SessionTitle>
              <SessionDetails>
                {currentSessionData.session_name} • {currentSessionData.message_count} messages
              </SessionDetails>
            </SessionInfo>
          )}
          
          <WarningMessage>
            <WarningIcon>
              <AlertTriangle size={16} />
            </WarningIcon>
            <WarningText>
              You will be logged out of your current session. Any unsaved changes will be lost.
            </WarningText>
          </WarningMessage>
          
          <KeyboardHint>
            💡 Tip: Press Ctrl+Enter to quickly confirm logout
          </KeyboardHint>
        </ModalBody>
        
        <ModalFooter>
          <Button className="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button className="primary" onClick={handleConfirm}>
            <LogOut size={16} />
            Logout
          </Button>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
}

export default LogoutModal;
