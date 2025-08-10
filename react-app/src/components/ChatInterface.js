import React, { useState, useRef, useEffect } from 'react';
import FileUpload from './FileUpload';
import ChatMessage from './ChatMessage';
import { Send } from 'lucide-react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { fileAPI, chatAPI } from '../services/api';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
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
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: #f7fafc;
`;

const InputSection = styled.div`
  padding: 20px;
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  bottom: 0;
  z-index: 10;
`;

const InputForm = styled.form`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  max-width: 800px;
  margin: 0 auto;
`;

const TextArea = styled.textarea`
  flex: 1;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
  max-height: 200px;
  background: white;
  transition: all 0.2s ease;
  
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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions[currentSession]]);

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
          plot: response.plot
        };

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
        setShowFileUpload(false);
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
      {showFileUpload && (
        <FileUploadSection>
          <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
        </FileUploadSection>
      )}

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
              {!knowledgeBase && (
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
              )}
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
          <InputForm onSubmit={handleSubmit}>
            <TextArea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
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
        </InputSection>
      </ChatSection>
    </ChatContainer>
  );
}

export default ChatInterface;
