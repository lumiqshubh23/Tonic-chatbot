import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sessionAPI } from '../services/api';
import { 
  LogOut, 
  Plus, 
  Edit3, 
  Trash2, 
  User, 
  MessageSquare,
  Settings,
  Lock,
  Unlock
} from 'lucide-react';
import styled from 'styled-components';
import toast from 'react-hot-toast';

const SidebarContainer = styled.div`
  width: 300px;
  background: white;
  border-right: 1px solid #e2e8f0;
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    position: relative;
  }
`;

const UserSection = styled.div`
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 20px;
  text-align: center;
`;

const UserAvatar = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
  margin: 0 auto 10px;
`;

const UserName = styled.h3`
  color: #4a5568;
  margin: 0 0 5px 0;
  font-size: 1.1rem;
`;

const UserStatus = styled.p`
  color: #718096;
  font-size: 0.9rem;
  margin: 0;
`;

const Section = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h4`
  color: #4a5568;
  margin-bottom: 15px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SessionItem = styled.div`
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 5px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  ${props => props.active && `
    background: #FF6B35;
    color: white;
  `}
  
  ${props => !props.active && `
    background: #f8f9fa;
    color: #4a5568;
    
    &:hover {
      background: #e9ecef;
    }
  `}
`;

const SessionName = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
`;

const SessionActions = styled.div`
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  ${SessionItem}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  color: inherit;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const NewSessionForm = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const Input = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #FF6B35;
  }
`;

const Button = styled.button`
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &.primary {
    background: #FF6B35;
    color: white;
    
    &:hover {
      background: #e53e3e;
    }
  }
  
  &.secondary {
    background: #f8f9fa;
    color: #4a5568;
    border: 1px solid #e2e8f0;
    
    &:hover {
      background: #e9ecef;
    }
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 20px 0;
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: #e9ecef;
    color: #e53e3e;
  }
`;

function Sidebar({ currentSession, setCurrentSession, sessions, setSessions }) {
  const { user, logout } = useAuth();
  const [newSessionName, setNewSessionName] = useState('');
  const [editingSession, setEditingSession] = useState(null);
  const [editName, setEditName] = useState('');

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout? This will clear your current session.')) {
      logout();
    }
  };

  const handleCreateSession = async () => {
    if (newSessionName.trim() && !sessions[newSessionName.trim()]) {
      try {
        const response = await sessionAPI.createSession(newSessionName.trim());
        if (response.success) {
          setSessions(response.sessions);
          setCurrentSession(newSessionName.trim());
          setNewSessionName('');
          toast.success(`Session "${newSessionName.trim()}" created successfully`);
        } else {
          toast.error(response.message || 'Failed to create session');
        }
      } catch (error) {
        console.error('Create session error:', error);
        toast.error('Failed to create session');
      }
    }
  };

  const handleRenameSession = () => {
    if (editName.trim() && !sessions[editName.trim()] && editingSession) {
      const newSessions = { ...sessions };
      newSessions[editName.trim()] = newSessions[editingSession];
      delete newSessions[editingSession];
      setSessions(newSessions);
      
      if (currentSession === editingSession) {
        setCurrentSession(editName.trim());
      }
      setEditingSession(null);
      setEditName('');
      toast.success(`Session renamed to "${editName.trim()}"`);
    }
  };

  const handleDeleteSession = async (sessionName) => {
    if (Object.keys(sessions).length > 1) {
      try {
        const response = await sessionAPI.deleteSession(sessionName);
        if (response.success) {
          const newSessions = { ...sessions };
          delete newSessions[sessionName];
          setSessions(newSessions);
          
          if (currentSession === sessionName) {
            const remainingSessions = Object.keys(newSessions);
            setCurrentSession(remainingSessions[0]);
          }
          toast.success(`Session "${sessionName}" deleted successfully`);
        } else {
          toast.error(response.message || 'Failed to delete session');
        }
      } catch (error) {
        console.error('Delete session error:', error);
        toast.error('Failed to delete session');
      }
    }
  };

  const handleClearSession = async (sessionName) => {
    try {
      const response = await sessionAPI.clearSession(sessionName);
      if (response.success) {
        setSessions(prev => ({
          ...prev,
          [sessionName]: []
        }));
        toast.success(`Session "${sessionName}" cleared successfully`);
      } else {
        toast.error(response.message || 'Failed to clear session');
      }
    } catch (error) {
      console.error('Clear session error:', error);
      toast.error('Failed to clear session');
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'l') {
        event.preventDefault(); // Prevent default browser behavior (like new tab)
        handleLogout();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SidebarContainer>
      <UserSection>
        <UserAvatar>
          {user ? user.charAt(0).toUpperCase() : 'U'}
        </UserAvatar>
        <UserName>Welcome {user || 'User'}!</UserName>
        <UserStatus>Session Active</UserStatus>
      </UserSection>

      <Section>
        <SectionTitle>
          <MessageSquare size={16} />
          Chat Sessions
        </SectionTitle>
        
        {Object.keys(sessions).map(sessionName => (
          <SessionItem
            key={sessionName}
            active={currentSession === sessionName}
            onClick={() => setCurrentSession(sessionName)}
          >
            <SessionName>
              {editingSession === sessionName ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRenameSession()}
                  autoFocus
                />
              ) : (
                sessionName
              )}
            </SessionName>
            <SessionActions>
              {editingSession !== sessionName && (
                <>
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSession(sessionName);
                      setEditName(sessionName);
                    }}
                  >
                    <Edit3 size={14} />
                  </ActionButton>
                  <ActionButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSession(sessionName);
                    }}
                  >
                    <Trash2 size={14} />
                  </ActionButton>
                </>
              )}
            </SessionActions>
          </SessionItem>
        ))}
        
        <NewSessionForm>
          <Input
            placeholder="New session name"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
          />
          <Button className="primary" onClick={handleCreateSession}>
            <Plus size={14} />
          </Button>
        </NewSessionForm>
      </Section>

      <Divider />

      <LogoutButton onClick={handleLogout}>
        <LogOut size={16} />
        Logout
      </LogoutButton>
    </SidebarContainer>
  );
}

export default Sidebar;
