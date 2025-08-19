import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatHistoryAPI } from '../services/api';
import { 
  LogOut, 
  Plus, 
  Edit3, 
  Trash2, 
  User, 
  MessageSquare,
  Search,
  Download,
  Clock,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import ChatHistorySearch from './ChatHistorySearch';
import LogoutModal from './LogoutModal';

const SidebarContainer = styled.div`
  width: 320px;
  background: #202123;
  color: white;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #4a4a4a;
  
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    position: relative;
  }
`;

const Header = styled.div`
  padding: 20px 20px 16px;
  border-bottom: 1px solid #4a4a4a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #2a2b2d;
`;

const NewChatButton = styled.button`
  width: calc(100% - 40px);
  margin: 16px 20px;
  padding: 12px 16px;
  background: #404040;
  border: 1px solid #5a5a5a;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  font-size: 14px;
  
  &:hover {
    background: #505050;
    border-color: #6a6a6a;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const SearchContainer = styled.div`
  padding: 0 20px 16px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 12px 12px 44px;
  background: #404040;
  border: 1px solid #5a5a5a;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &::placeholder {
    color: #a0a0a0;
  }
  
  &:focus {
    outline: none;
    border-color: #FF6B35;
    background: #454545;
    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 36px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0a0a0;
  size: 16px;
`;

const SessionsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #202123;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #4a4a4a;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #5a5a5a;
  }
`;

const SessionItem = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  border: 1px solid transparent;
  
  ${props => props.active && `
    background: #404040;
    border-color: #FF6B35;
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);
  `}
  
  ${props => !props.active && `
    &:hover {
      background: #353535;
      border-color: #5a5a5a;
    }
  `}
`;

const SessionInfo = styled.div`
  flex: 1;
  min-width: 0;
  margin-right: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SessionName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: white;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  max-width: 200px;
`;

const SessionMeta = styled.div`
  font-size: 12px;
  color: #a0a0a0;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.2;
`;

const SessionActions = styled.div`
  display: flex;
  gap: 2px;
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
  padding: 4px;
  border-radius: 4px;
  color: #a0a0a0;
  transition: all 0.2s ease;
  
  &:hover {
    background: #4a4a4a;
    color: white;
    transform: scale(1.05);
  }
`;

const UserSection = styled.div`
  padding: 20px;
  border-top: 1px solid #4a4a4a;
  background: #2a2b2d;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #404040;
  border-radius: 10px;
  border: 1px solid #5a5a5a;
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin-bottom: 2px;
`;

const UserStatus = styled.div`
  font-size: 12px;
  color: #a0a0a0;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: #4ade80;
    border-radius: 50%;
    display: inline-block;
  }
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: #404040;
  border: 1px solid #5a5a5a;
  border-radius: 10px;
  color: #a0a0a0;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  
  &:hover {
    background: #505050;
    border-color: #6a6a6a;
    color: white;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #a0a0a0;
  
  svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  div {
    font-size: 14px;
    line-height: 1.4;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid #4a4a4a;
  border-radius: 50%;
  border-top-color: #FF6B35;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const CreateSessionModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: #2a2b2d;
  padding: 28px;
  border-radius: 16px;
  width: 420px;
  max-width: 90vw;
  border: 1px solid #4a4a4a;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h3`
  color: white;
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.5px;
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  background: #404040;
  border: 1px solid #5a5a5a;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  margin-bottom: 20px;
  transition: all 0.2s ease;
  
  &::placeholder {
    color: #a0a0a0;
  }
  
  &:focus {
    outline: none;
    border-color: #FF6B35;
    background: #454545;
    box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.primary {
    background: #FF6B35;
    color: white;
    border: none;
    
    &:hover {
      background: #e53e3e;
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  &.secondary {
    background: #404040;
    color: #a0a0a0;
    border: 1px solid #5a5a5a;
    
    &:hover {
      background: #505050;
      color: white;
      border-color: #6a6a6a;
    }
  }
`;

const ChatHistorySidebar = React.forwardRef(({ currentSessionId, setCurrentSessionId, onSessionSelect, onSessionRenamed, currentSessionData }, ref) => {
  const { user, logout } = useAuth();
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [editingSession, setEditingSession] = useState(null);
  const [editName, setEditName] = useState('');

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
  }, []);



  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const response = await chatHistoryAPI.getAllChatHistory();
      if (response.success) {
        setChatHistory(response.chat_history || []);
        
        // Set first session as current if none selected
        if (!currentSessionId && response.chat_history.length > 0) {
          setCurrentSessionId(response.chat_history[0].session_id);
        }
      } else {
        toast.error('Failed to load chat history');
      }
    } catch (error) {
      console.error('Load chat history error:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  // Expose loadChatHistory function to parent component
  React.useImperativeHandle(ref, () => ({
    loadChatHistory
  }));

  const handleNewChat = async () => {
    try {
      console.log('Starting new chat...');
      
      // Check if current session has messages
      const currentSessionHasMessages = currentSessionData?.message_count > 0;
      console.log('Current session message count:', currentSessionData?.message_count);
      
      // If no existing chats, just clear the current session and let user start typing
      if (chatHistory.length === 0) {
        console.log('No existing chats, clearing current session');
        setCurrentSessionId(null);
        
        // Notify parent component to clear the session with a special flag
        if (onSessionSelect) {
          onSessionSelect({ 
            isNewChatMode: true, 
            shouldCreateSessionOnFirstMessage: true 
          });
        }
        
        toast.success('New chat ready');
        return;
      }
      
      // If current session has no messages, just clear it instead of creating a new one
      if (currentSessionId && !currentSessionHasMessages) {
        console.log('Current session has no messages, clearing instead of creating new');
        setCurrentSessionId(null);
        
        // Notify parent component to clear the session
        if (onSessionSelect) {
          onSessionSelect(null);
        }
        
        toast.success('New chat ready');
        return;
      }
      
      // If there are existing chats and current session has messages, clear current session
      // The ChatInterface will create a new session with unique name when user types
      console.log('Clearing current session for new chat...');
      setCurrentSessionId(null);
      
      // Notify parent component to clear the session
      if (onSessionSelect) {
        onSessionSelect(null);
      }
      
      toast.success('New chat ready');
    } catch (error) {
      console.error('New chat error:', error);
      toast.error('Failed to create new chat');
    }
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    
    try {
      const response = await chatHistoryAPI.createChatSession(newSessionName.trim());
      if (response.success) {
        await loadChatHistory(); // Reload to get the new session
        setCurrentSessionId(response.session.id);
        setShowCreateModal(false);
        setNewSessionName('');
        toast.success('New chat session created');
      } else {
        toast.error(response.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('Create session error:', error);
      toast.error('Failed to create session');
    }
  };

  const handleUpdateSession = async () => {
    if (!editName.trim() || !editingSession) return;
    
    try {
      const response = await chatHistoryAPI.updateChatSession(editingSession, editName.trim());
      if (response.success) {
        await loadChatHistory(); // Reload to get updated data
        setEditingSession(null);
        setEditName('');
        toast.success('Session renamed successfully');
      } else {
        toast.error(response.message || 'Failed to rename session');
      }
    } catch (error) {
      console.error('Update session error:', error);
      toast.error('Failed to rename session');
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      try {
        const response = await chatHistoryAPI.deleteChatSession(sessionId);
        if (response.success) {
          await loadChatHistory(); // Reload to get updated data
          
          // If deleted session was current, select first available
          if (currentSessionId === sessionId) {
            const remainingSessions = chatHistory.filter(s => s.session_id !== sessionId);
            if (remainingSessions.length > 0) {
              setCurrentSessionId(remainingSessions[0].session_id);
            } else {
              setCurrentSessionId(null);
            }
          }
          
          toast.success('Session deleted successfully');
        } else {
          toast.error(response.message || 'Failed to delete session');
        }
      } catch (error) {
        console.error('Delete session error:', error);
        toast.error('Failed to delete session');
      }
    }
  };

  const handleExportSession = async (sessionId) => {
    try {
      const response = await chatHistoryAPI.exportSession(sessionId);
      if (response.success) {
        // Create and download JSON file
        const dataStr = JSON.stringify(response.export_data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-session-${sessionId}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Session exported successfully');
      } else {
        toast.error(response.message || 'Failed to export session');
      }
    } catch (error) {
      console.error('Export session error:', error);
      toast.error('Failed to export session');
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    logout();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const filteredSessions = chatHistory.filter(session =>
    session.session_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SidebarContainer>
      <Header>
        <h2 style={{ 
          margin: 0, 
          fontSize: '20px', 
          fontWeight: '700',
          color: 'white',
          letterSpacing: '-0.5px'
        }}>
          Chat History
        </h2>
        <ActionButton
          onClick={() => setShowSearchModal(true)}
          title="Search conversations"
          style={{
            background: '#404040',
            border: '1px solid #5a5a5a',
            borderRadius: '8px',
            padding: '8px'
          }}
        >
          <Search size={18} />
        </ActionButton>
      </Header>

      <NewChatButton onClick={handleNewChat}>
        <Plus size={16} />
        New Chat
      </NewChatButton>

      <SearchContainer>
        <SearchIcon size={16} />
        <SearchInput
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchContainer>

      <SessionsContainer>
        {loading ? (
          <EmptyState>
            <LoadingSpinner />
            <div style={{ marginTop: '12px' }}>Loading conversations...</div>
          </EmptyState>
        ) : filteredSessions.length === 0 ? (
          <EmptyState>
            <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div>No conversations found</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              {searchQuery ? 'Try adjusting your search' : 'Start a new conversation'}
            </div>
          </EmptyState>
        ) : (
          filteredSessions.map((session) => (
            <SessionItem
              key={session.session_id}
              active={currentSessionId === session.session_id}
              onClick={() => {
                setCurrentSessionId(session.session_id);
                if (onSessionSelect) {
                  onSessionSelect(session);
                }
              }}
            >
              <SessionInfo>
                <SessionName>
                  {editingSession === session.session_id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleUpdateSession()}
                      onBlur={handleUpdateSession}
                      autoFocus
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontSize: '14px',
                        width: '100%'
                      }}
                    />
                  ) : (
                    session.session_name
                  )}
                </SessionName>
                <SessionMeta>
                  <Clock size={12} />
                  <span>{formatDate(session.created_at)}</span>
                  <span style={{ color: '#666', fontSize: '10px' }}>•</span>
                  <span>{session.message_count} message{session.message_count !== 1 ? 's' : ''}</span>
                </SessionMeta>
              </SessionInfo>
              
              <SessionActions>
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportSession(session.session_id);
                  }}
                  title="Export session"
                >
                  <Download size={14} />
                </ActionButton>
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingSession(session.session_id);
                    setEditName(session.session_name);
                  }}
                  title="Rename session"
                >
                  <Edit3 size={14} />
                </ActionButton>
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.session_id);
                  }}
                  title="Delete session"
                >
                  <Trash2 size={14} />
                </ActionButton>
              </SessionActions>
            </SessionItem>
          ))
        )}
      </SessionsContainer>

      <UserSection>
        <UserInfo>
          <UserAvatar>
            {user ? user.charAt(0).toUpperCase() : 'U'}
          </UserAvatar>
          <UserDetails>
            <UserName>{user || 'User'}</UserName>
            <UserStatus>Active</UserStatus>
          </UserDetails>
        </UserInfo>
        
        <LogoutButton onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </LogoutButton>
      </UserSection>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        user={user}
        currentSessionData={chatHistory.find(s => s.session_id === currentSessionId)}
      />

      {showCreateModal && (
        <CreateSessionModal onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Create New Chat</ModalTitle>
            <ModalInput
              placeholder="Enter session name..."
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
              autoFocus
            />
            <ModalButtons>
              <ModalButton 
                className="secondary" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </ModalButton>
              <ModalButton 
                className="primary" 
                onClick={handleCreateSession}
                disabled={!newSessionName.trim()}
              >
                Create
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </CreateSessionModal>
      )}

      <ChatHistorySearch
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onResultClick={(result) => {
          // Navigate to the session when a search result is clicked
          const session = chatHistory.find(s => s.session_id === result.session_id);
          if (session) {
            setCurrentSessionId(result.session_id);
            if (onSessionSelect) {
              onSessionSelect(session);
            }
          }
        }}
      />
    </SidebarContainer>
  );
});

export default ChatHistorySidebar;
