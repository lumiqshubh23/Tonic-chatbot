import React, { useState, useRef, useEffect } from 'react';
import FileUpload from './FileUpload';
import ChatMessage from './ChatMessage';
import { Send, Paperclip, X } from 'lucide-react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { fileAPI, chatAPI, chatHistoryAPI } from '../services/api';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 105px);
  background: #f7fafc;
`;

// FileUploadSection component removed as it's no longer used

const ChatSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #f7fafc;
  min-height: 0;
  max-height: calc(100vh - 200px);
`;

const InputSection = styled.div`
  padding: 24px;
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  bottom: 0;
  z-index: 10;
  flex-shrink: 0;
  transition: all 0.2s ease;
  min-height: 80px;
  display: flex;
  align-items: center;
`;

const InputForm = styled.form`
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  flex: 1;
`;

const TextArea = styled.textarea`
  flex: 1;
  padding: 16px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  font-family: inherit;
  resize: none;
  min-height: 60px;
  max-height: 200px;
  background: white;
  transition: all 0.2s ease;
  overflow-y: auto;
  line-height: 1.5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:focus {
    outline: none;
    border-color: #FF6B35;
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
  }
  
  &::placeholder {
    color: #a0aec0;
  }
`;

const SendButton = styled.button`
  padding: 16px 24px;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  min-height: 48px;
  white-space: nowrap;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 25px rgba(255, 107, 53, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const UploadButton = styled.button`
  padding: 16px;
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  min-width: 48px;
  height: 48px;
  
  &:hover {
    background: #f7fafc;
    color: #FF6B35;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const UploadInterface = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
  z-index: 20;
  animation: slideUp 0.2s ease;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const UploadHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
`;

const UploadTitle = styled.h4`
  color: #2d3748;
  margin: 0;
  font-weight: 600;
  font-size: 16px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #f7fafc;
    color: #e53e3e;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #718096;
  
  h3 {
    margin-bottom: 12px;
    color: #4a5568;
    font-weight: 600;
  }
  
  p {
    margin-bottom: 20px;
    font-size: 16px;
  }
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #718096;
  
  .spinner {
    margin: 0 auto 16px auto;
  }
  
  p {
    font-size: 16px;
    margin: 0;
  }
`;

const KnowledgeBaseStatus = styled.div`
  margin: 20px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const StatusHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const StatusTitle = styled.h4`
  color: #2d3748;
  margin: 0;
  font-weight: 600;
  font-size: 16px;
`;

const ClearButton = styled.button`
  padding: 6px 12px;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #c53030;
  }
`;

const StatusText = styled.p`
  color: #718096;
  margin: 0;
  font-size: 14px;
`;

function ChatInterface({ currentSessionId, currentSessionData, onSessionChange, onSessionRenamed }) {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showUploadInterface, setShowUploadInterface] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isCreatingNewSession, setIsCreatingNewSession] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Function to generate unique session name based on conversation content (like ChatGPT)
  const generateSessionName = (question, answer) => {
    // Clean and process the question
    const cleanQuestion = question.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .trim();
    
    if (!cleanQuestion) {
      return 'New Chat';
    }
    
    // Split into words and filter meaningful ones
    const words = cleanQuestion.split(/\s+/)
      .filter(word => word.length > 2) // Filter out very short words
      .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall'].includes(word)); // Filter common words
    
    if (words.length === 0) {
      return 'New Chat';
    }
    
    // Take first 4 meaningful words for better uniqueness
    const meaningfulWords = words.slice(0, 4);
    
    // Create a title with proper capitalization
    const title = meaningfulWords
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    // Add timestamp for uniqueness if title is too short
    if (title.length < 10) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      return `${title} (${timeStr})`;
    }
    
    // Limit to reasonable length
    return title.length > 35 ? title.substring(0, 35) + '...' : title;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadSessionMessages = async () => {
    if (!currentSessionId) return;
    
    try {
      console.log('Loading messages for session:', currentSessionId);
      setLoadingMessages(true);
      const response = await chatHistoryAPI.getSessionHistory(currentSessionId);
      console.log('Session history response:', response);
      
      if (response.success) {
        // Convert database messages to the format expected by ChatMessage component
        // We need to create separate messages for user questions and AI answers
        const formattedMessages = [];
        
        response.session.messages.forEach(msg => {
          // Format timestamp for display
          const timestamp = new Date(msg.timestamp).toLocaleString();
          
          // Add user question message
          formattedMessages.push({
            q: msg.question,
            a: '',
            timestamp: timestamp,
            type: 'user'
          });
          
          // Add AI answer message
          formattedMessages.push({
            q: '',
            a: msg.answer,
            timestamp: timestamp,
            type: 'ai'
          });
        });
        
        setMessages(formattedMessages);
      } else {
        toast.error('Failed to load session messages');
      }
    } catch (error) {
      console.error('Load session messages error:', error);
      toast.error('Failed to load session messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Auto-resize textarea function
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Load messages when session changes
  useEffect(() => {
    console.log('Session change detected:', {
      currentSessionId,
      isCreatingNewSession,
      messagesLength: messages.length
    });
    
    if (currentSessionId && !isCreatingNewSession) {
      console.log('Loading messages for session:', currentSessionId);
      loadSessionMessages();
    } else if (!currentSessionId) {
      console.log('Clearing messages - no session');
      setMessages([]);
    } else if (isCreatingNewSession) {
      console.log('Skipping message load - creating new session');
    }
  }, [currentSessionId, isCreatingNewSession]);

  // Clear messages when starting a new chat (session changes from existing to new)
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      // Check if this is a new session (message count is 0)
      if (currentSessionData?.message_count === 0) {
        console.log('New session detected, clearing messages');
        setMessages([]);
      }
    } else if (!currentSessionId && messages.length > 0) {
      // Clear messages when no session is selected (new chat without existing sessions)
      console.log('No session selected, clearing messages for new chat');
      setMessages([]);
    }
    
    // Clear messages when entering new chat mode
    if (currentSessionData?.isNewChatMode && messages.length > 0) {
      console.log('New chat mode detected, clearing messages');
      setMessages([]);
    }
  }, [currentSessionId, currentSessionData?.message_count, currentSessionData?.isNewChatMode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Adjust textarea height when userInput changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [userInput]);

  // Monitor for Chrome extension interference
  useEffect(() => {
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    
    // Monitor fetch requests
    window.fetch = function(...args) {
      const url = args[0];
      if (typeof url === 'string' && url.includes('chrome-extension://')) {
        console.warn('Chrome extension request detected:', {
          url,
          method: args[1]?.method || 'GET',
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }
      return originalFetch.apply(this, args);
    };
    
    // Monitor XMLHttpRequest
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (typeof url === 'string' && url.includes('chrome-extension://')) {
        console.warn('Chrome extension XMLHttpRequest detected:', {
          url,
          method,
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        });
      }
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    // Cleanup function
    return () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Add handlers to detect and potentially mitigate Chrome extension interference
  const handleFocus = (e) => {
    // Log focus events to help debug extension issues
    console.log('TextArea focused', {
      target: e.target,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  };

  const handleBlur = (e) => {
    // Log blur events to help debug extension issues
    console.log('TextArea blurred', {
      target: e.target,
      timestamp: new Date().toISOString()
    });
  };

  const handleInput = (e) => {
    // Prevent potential extension interference by ensuring proper event handling
    setUserInput(e.target.value);
    adjustTextareaHeight();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    // If no current session, create a default one
    let sessionId = currentSessionId;
    let sessionName = currentSessionData?.session_name || 'Default';
    
    // Check if we're in new chat mode (no existing chats)
    const isNewChatMode = currentSessionData?.isNewChatMode && currentSessionData?.shouldCreateSessionOnFirstMessage;
    
    if (!sessionId && !isNewChatMode) {
      try {
        console.log('No active session, creating unique session...');
        setIsCreatingNewSession(true);
        
        // Generate unique session name based on the first message
        const question = userInput.trim();
        const uniqueSessionName = generateSessionName(question, '');
        console.log('Generated unique session name:', uniqueSessionName);
        
        const createResponse = await chatHistoryAPI.createChatSession(uniqueSessionName);
        if (createResponse.success) {
          sessionId = createResponse.session.id;
          sessionName = createResponse.session.session_name;
          console.log('Unique session created:', sessionId, 'with name:', sessionName);
          
          // Update the parent component with the new session
          if (onSessionChange) {
            onSessionChange({
              session_id: sessionId,
              session_name: sessionName,
              created_at: createResponse.session.created_at,
              message_count: 0
            });
          }
        } else {
          console.error('Failed to create unique session:', createResponse.message);
          toast.error(`Failed to create chat session: ${createResponse.message}`);
          setIsCreatingNewSession(false);
          return;
        }
      } catch (error) {
        console.error('Error creating unique session:', error);
        toast.error(`Failed to create chat session: ${error.message || 'Unknown error'}`);
        setIsCreatingNewSession(false);
        return;
      }
    }
    
    // If in new chat mode, create session now (first message)
    if (isNewChatMode) {
      try {
        console.log('New chat mode: creating session on first message...');
        setIsCreatingNewSession(true);
        
        // Generate unique session name based on the first message
        const question = userInput.trim();
        const uniqueSessionName = generateSessionName(question, '');
        console.log('Generated unique session name:', uniqueSessionName);
        
        const createResponse = await chatHistoryAPI.createChatSession(uniqueSessionName);
        if (createResponse.success) {
          sessionId = createResponse.session.id;
          sessionName = createResponse.session.session_name;
          console.log('Session created on first message:', sessionId, 'with name:', sessionName);
          
          // Update the parent component with the new session
          if (onSessionChange) {
            onSessionChange({
              session_id: sessionId,
              session_name: sessionName,
              created_at: createResponse.session.created_at,
              message_count: 0
            });
          }
        } else {
          console.error('Failed to create session on first message:', createResponse.message);
          toast.error(`Failed to create chat session: ${createResponse.message}`);
          setIsCreatingNewSession(false);
          return;
        }
      } catch (error) {
        console.error('Error creating session on first message:', error);
        toast.error(`Failed to create chat session: ${error.message || 'Unknown error'}`);
        setIsCreatingNewSession(false);
        return;
      }
    }

    const question = userInput.trim();
    setUserInput('');
    setIsLoading(true);

    // Add user message to local state
    const userMessage = {
      q: question,
      a: '',
      timestamp: new Date().toLocaleString(),
      type: 'user'
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('Sending message to API:', {
        question,
        knowledgeBase: knowledgeBase ? 'Present' : 'Empty',
        sessionId: currentSessionId,
        currentSessionName: currentSessionData?.session_name
      });
      
      // Get AI response from backend
      const response = await chatAPI.sendMessage(
        question, 
        knowledgeBase, 
        messages, 
        sessionName
      );
      
      if (response.success) {
        // Add AI response as a separate message
        const aiMessage = {
          q: '',
          a: response.response,
          timestamp: response.timestamp,
          type: 'ai',
          tables: response.tables || [],
          plot: response.plot,
          plot_code: response.plot_code,
          sources: response.sources
        };

        // Debug logging
        console.log('🤖 AI Response received:', {
          responseLength: response.response?.length,
          tablesCount: response.tables?.length || 0,
          hasPlot: !!response.plot,
          plotLength: response.plot?.length || 0,
          hasPlotCode: !!response.plot_code,
          plotCodeLength: response.plot_code?.length || 0,
          sourcesCount: response.sources?.length || 0
        });
        
        // Additional plot debugging
        if (response.plot) {
          console.log('🎨 Plot data received:', {
            plotDataLength: response.plot.length,
            plotDataPreview: response.plot.substring(0, 100) + '...',
            plotDataEnd: response.plot.substring(response.plot.length - 50) + '...'
          });
        }
        
        if (response.plot_code) {
          console.log('📝 Plot code received:', {
            plotCodeLength: response.plot_code.length,
            plotCodePreview: response.plot_code.substring(0, 200) + '...'
          });
        }
        
        // Log the complete response structure
        console.log('📊 Complete response structure:', {
          success: response.success,
          hasResponse: !!response.response,
          hasTables: !!response.tables,
          hasPlot: !!response.plot,
          hasPlotCode: !!response.plot_code,
          hasSources: !!response.sources,
          timestamp: response.timestamp
        });

        setMessages(prev => [...prev, aiMessage]);

        // Session already has unique name, no need to rename

      } else {
        toast.error('Failed to get response from AI');
      }

    } catch (error) {
      toast.error('Failed to get response. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setIsCreatingNewSession(false);
    }
  };

  const handleFileUpload = async (files) => {
    setIsUploading(true);
    try {
      const response = await fileAPI.upload(files);
      if (response.success) {
        setKnowledgeBase(response.knowledge_base);
        toast.success(response.message);
        setShowUploadInterface(false);
      } else {
        toast.error('Failed to process files');
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearKnowledgeBase = () => {
    setKnowledgeBase('');
    toast.success('Knowledge base cleared');
  };

  // This line is no longer needed as we're using the messages state directly

  return (
    <ChatContainer>
      {knowledgeBase && (
        <KnowledgeBaseStatus>
          <StatusHeader>
            <StatusTitle>📚 Knowledge Base Active</StatusTitle>
            <ClearButton onClick={clearKnowledgeBase}>
              Clear
            </ClearButton>
          </StatusHeader>
          <StatusText>
            Knowledge base contains {knowledgeBase.length} characters
          </StatusText>
        </KnowledgeBaseStatus>
      )}

      <ChatSection>
        <MessagesContainer>
          {loadingMessages ? (
            <EmptyState>
              <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto 16px' }}></div>
              <p>Loading messages...</p>
            </EmptyState>
          ) : messages.length === 0 ? (
            <EmptyState>
              <h3>How can I help you today? 🤖</h3>
              <p>
                {knowledgeBase 
                  ? "I have access to your uploaded documents. Ask me anything!"
                  : "I'm here to help! Ask me anything or upload documents to get started."
                }
              </p>
            </EmptyState>
          ) : (
            messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))
          )}
          
          {isLoading && (
            <LoadingContainer>
              <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
              <p>Generating response...</p>
            </LoadingContainer>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesContainer>

        <InputSection>
          <InputWrapper>
            {showUploadInterface && (
              <UploadInterface>
                <UploadHeader>
                  <UploadTitle>📁 Upload Documents</UploadTitle>
                  <CloseButton onClick={() => setShowUploadInterface(false)}>
                    <X size={20} />
                  </CloseButton>
                </UploadHeader>
                <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
              </UploadInterface>
            )}
            
            <InputForm onSubmit={handleSubmit}>
              <UploadButton
                type="button"
                onClick={() => setShowUploadInterface(!showUploadInterface)}
                disabled={isLoading}
                title="Upload documents"
              >
                <Paperclip size={20} />
              </UploadButton>
              
              <TextArea
                ref={textareaRef}
                value={userInput}
                onChange={handleInput}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={
                  knowledgeBase 
                    ? "Message TONIC AI..."
                    : "Message TONIC AI..."
                }
                disabled={isLoading}
                // Add attributes to help prevent extension interference
                autoComplete="off"
                spellCheck="false"
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
              <SendButton type="submit" disabled={isLoading || !userInput.trim()}>
                {isLoading ? (
                  <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                ) : (
                  <Send size={20} />
                )}
                Send
              </SendButton>
            </InputForm>
          </InputWrapper>
        </InputSection>
      </ChatSection>
    </ChatContainer>
  );
}

export default ChatInterface;
