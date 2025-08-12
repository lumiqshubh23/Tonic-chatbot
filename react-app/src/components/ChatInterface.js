import React, { useState, useRef, useEffect } from 'react';
import FileUpload from './FileUpload';
import ChatMessage from './ChatMessage';
import { Send, Paperclip, X } from 'lucide-react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { fileAPI, chatAPI } from '../services/api';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 105px);
  background: #f7fafc;
`;

const FileUploadSection = styled.div`
  margin: 20px;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
`;

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
  align-items: flex-end;
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
  align-items: flex-end;
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

function ChatInterface({ currentSession, sessions, setSessions }) {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showUploadInterface, setShowUploadInterface] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  useEffect(() => {
    scrollToBottom();
  }, [sessions[currentSession]]);

  // Adjust textarea height when userInput changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [userInput]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const question = userInput.trim();
    setUserInput('');
    setIsLoading(true);

    // Add user message to session
    const userMessage = {
      q: question,
      a: '',
      timestamp: new Date().toLocaleString(),
      type: 'user'
    };

    setSessions(prev => ({
      ...prev,
      [currentSession]: [...prev[currentSession], userMessage]
    }));

    try {
      console.log('Sending message to API:', {
        question,
        knowledgeBase: knowledgeBase ? 'Present' : 'Empty',
        sessionMessages: sessions[currentSession]?.length || 0,
        currentSession
      });
      
      // Get AI response from backend
      const response = await chatAPI.sendMessage(
        question, 
        knowledgeBase, 
        sessions[currentSession], 
        currentSession
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
            plotDataPreview: response.plot.substring(0, 100) + '...'
          });
        }
        
        if (response.plot_code) {
          console.log('📝 Plot code received:', {
            plotCodeLength: response.plot_code.length,
            plotCodePreview: response.plot_code.substring(0, 200) + '...'
          });
        }

        setSessions(prev => ({
          ...prev,
          [currentSession]: [...prev[currentSession], aiMessage]
        }));

      } else {
        toast.error('Failed to get response from AI');
      }

    } catch (error) {
      toast.error('Failed to get response. Please try again.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
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

  const currentSessionMessages = sessions[currentSession] || [];

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
          {currentSessionMessages.length === 0 ? (
            <EmptyState>
              <h3>Welcome to TONIC AI! 🤖</h3>
              <p>
                {knowledgeBase 
                  ? "Start a conversation by asking a question about your uploaded documents."
                  : "Upload some documents to build your knowledge base, then start asking questions!"
                }
              </p>
              {/* {!knowledgeBase && (
                <button 
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {showFileUpload ? 'Hide File Upload' : 'Upload Documents'}
                </button>
              )} */}
            </EmptyState>
          ) : (
            currentSessionMessages.map((message, index) => (
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
                onChange={(e) => setUserInput(e.target.value)}
                onInput={adjustTextareaHeight}
                onKeyDown={handleKeyDown}
                placeholder={
                  knowledgeBase 
                    ? "Ask me anything about your uploaded documents or any general question..."
                    : "Upload documents first to ask questions about them..."
                }
                disabled={isLoading}
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
