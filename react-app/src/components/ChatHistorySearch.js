import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { chatHistoryAPI } from '../services/api';
import styled from 'styled-components';
import toast from 'react-hot-toast';

const SearchContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const SearchModal = styled.div`
  background: white;
  border-radius: 12px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const SearchHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #FF6B35;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: #718096;
  
  &:hover {
    background: #f7fafc;
  }
`;

const SearchResults = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const ResultItem = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #f8fafc;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SessionName = styled.div`
  font-weight: 600;
  color: #1a202c;
  font-size: 14px;
`;

const Timestamp = styled.div`
  font-size: 12px;
  color: #718096;
`;

const Question = styled.div`
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 4px;
  font-weight: 500;
`;

const Answer = styled.div`
  font-size: 13px;
  color: #718096;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NoResults = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #718096;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  border-top-color: #FF6B35;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

function ChatHistorySearch({ isOpen, onClose, onResultClick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      setSearched(true);
      const response = await chatHistoryAPI.searchChatHistory(query.trim());
      if (response.success) {
        setResults(response.search_results || []);
      } else {
        toast.error('Search failed');
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultClick = (result) => {
    if (onResultClick) {
      onResultClick(result);
    }
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!isOpen) return null;

  return (
    <SearchContainer onClick={onClose}>
      <SearchModal onClick={(e) => e.stopPropagation()}>
        <SearchHeader>
          <Search size={20} color="#718096" />
          <SearchInput
            placeholder="Search your chat history..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
          />
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </SearchHeader>
        
        <SearchResults>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <LoadingSpinner />
              <div style={{ marginTop: '12px', color: '#718096' }}>Searching...</div>
            </div>
          ) : searched && results.length === 0 ? (
            <NoResults>
              <Search size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div>No results found for "{query}"</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>
                Try different keywords or check your spelling
              </div>
            </NoResults>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <ResultItem key={index} onClick={() => handleResultClick(result)}>
                <ResultHeader>
                  <SessionName>{result.session_name}</SessionName>
                  <Timestamp>{formatDate(result.timestamp)}</Timestamp>
                </ResultHeader>
                <Question>{truncateText(result.question)}</Question>
                <Answer>{truncateText(result.answer)}</Answer>
              </ResultItem>
            ))
          ) : (
            <NoResults>
              <Search size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div>Search your chat history</div>
              <div style={{ fontSize: '14px', marginTop: '8px' }}>
                Type your query and press Enter to search
              </div>
            </NoResults>
          )}
        </SearchResults>
      </SearchModal>
    </SearchContainer>
  );
}

export default ChatHistorySearch;
