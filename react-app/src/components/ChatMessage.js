import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Clock, Download } from 'lucide-react';
import styled from 'styled-components';

const MessageContainer = styled.div`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 20px;
  padding: 0 20px;
`;

const MessageWrapper = styled.div`
  max-width: 70%;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-direction: ${props => props.isUser ? 'row-reverse' : 'row'};
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: bold;
  color: white;
  
  ${props => props.type === 'user' && `
    background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  `}
  
  ${props => props.type === 'ai' && `
    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  `}
`;

const MessageContent = styled.div`
  background: ${props => props.isUser ? 'linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%)' : 'white'};
  color: ${props => props.isUser ? 'white' : '#4a5568'};
  border-radius: 18px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid ${props => props.isUser ? 'transparent' : '#e2e8f0'};
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  position: relative;
  
  ${props => props.isUser && `
    border-bottom-right-radius: 6px;
  `}
  
  ${props => !props.isUser && `
    border-bottom-left-radius: 6px;
  `}
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid ${props => props.isUser ? 'rgba(255, 255, 255, 0.2)' : '#f1f5f9'};
`;

const MessageAuthor = styled.span`
  font-weight: 600;
  color: ${props => props.isUser ? 'white' : '#2d3748'};
  font-size: 14px;
`;

const MessageTime = styled.span`
  font-size: 0.8rem;
  color: ${props => props.isUser ? 'rgba(255, 255, 255, 0.8)' : '#718096'};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MessageText = styled.div`
  color: ${props => props.isUser ? 'white' : '#4a5568'};
  line-height: 1.7;
  font-size: 15px;
  
  p {
    margin: 0 0 16px 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  h1, h2, h3, h4, h5, h6 {
    color: ${props => props.isUser ? 'white' : '#2d3748'};
    margin: 20px 0 12px 0;
    font-weight: 600;
  }
  
  h1 { font-size: 1.8rem; }
  h2 { font-size: 1.6rem; }
  h3 { font-size: 1.4rem; }
  h4 { font-size: 1.2rem; }
  h5 { font-size: 1.1rem; }
  h6 { font-size: 1rem; }
  
  ul, ol {
    margin: 12px 0;
    padding-left: 24px;
  }
  
  li {
    margin: 6px 0;
  }
  
  blockquote {
    border-left: 4px solid ${props => props.isUser ? 'rgba(255, 255, 255, 0.6)' : '#FF6B35'};
    padding-left: 16px;
    margin: 16px 0;
    color: ${props => props.isUser ? 'rgba(255, 255, 255, 0.9)' : '#718096'};
    font-style: italic;
  }
  
  code {
    background: ${props => props.isUser ? 'rgba(255, 255, 255, 0.2)' : '#f8f9fa'};
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    color: ${props => props.isUser ? 'white' : '#e53e3e'};
  }
  
  pre {
    background: ${props => props.isUser ? 'rgba(255, 255, 255, 0.1)' : '#f8f9fa'};
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
    border: 1px solid ${props => props.isUser ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0'};
    
    code {
      background: none;
      padding: 0;
      color: ${props => props.isUser ? 'white' : '#4a5568'};
    }
  }
  
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
    font-size: 0.9rem;
    background: ${props => props.isUser ? 'rgba(255, 255, 255, 0.1)' : 'white'};
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  th, td {
    border: 1px solid ${props => props.isUser ? 'rgba(255, 255, 255, 0.2)' : '#e2e8f0'};
    padding: 12px;
    text-align: left;
  }
  
  th {
    background: ${props => props.isUser ? 'rgba(255, 255, 255, 0.2)' : '#f8f9fa'};
    font-weight: 600;
    color: ${props => props.isUser ? 'white' : '#4a5568'};
  }
  
  tr:nth-child(even) {
    background: ${props => props.isUser ? 'rgba(255, 255, 255, 0.05)' : '#f8f9fa'};
  }
  
  tr:hover {
    background: ${props => props.isUser ? 'rgba(255, 255, 255, 0.1)' : '#edf2f7'};
  }
`;

const TableContainer = styled.div`
  margin: 16px 0;
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
  border: 1px solid #e2e8f0;
`;

const TableHeader = styled.div`
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TableTitle = styled.h4`
  color: #2d3748;
  margin: 0;
  font-weight: 600;
  font-size: 14px;
`;

const DownloadButton = styled.button`
  padding: 6px 12px;
  background: #FF6B35;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e53e3e;
    transform: translateY(-1px);
  }
`;

const Table = styled.table`
  border-collapse: collapse;
  width: 100%;
  font-size: 0.9rem;
  background: white;
`;

const Th = styled.th`
  border: 1px solid #e2e8f0;
  padding: 12px;
  text-align: left;
  background: #f8f9fa;
  font-weight: 600;
  color: #4a5568;
`;

const Td = styled.td`
  border: 1px solid #e2e8f0;
  padding: 12px;
  color: #4a5568;
`;

const PlotContainer = styled.div`
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-top: 16px;
  text-align: center;
  border: 1px solid #e2e8f0;
`;

const PlotTitle = styled.p`
  margin: 0 0 12px 0;
  color: #4a5568;
  font-weight: 500;
`;

const PlotImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
`;

const EmptyPlot = styled.div`
  width: 100%;
  height: 200px;
  background: white;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #718096;
  font-style: italic;
`;

function ChatMessage({ message }) {
  const isUser = message.type === 'user';
  
  const downloadTableAsCSV = (table, index) => {
    const headers = table.headers.join(',');
    const rows = table.data.map(row => row.join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table_${index + 1}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <MessageContainer isUser={isUser}>
      <MessageWrapper isUser={isUser}>
        <Avatar type={message.type}>
          {isUser ? <User size={20} /> : <Bot size={20} />}
        </Avatar>
        
        <MessageContent isUser={isUser}>
          <MessageHeader isUser={isUser}>
            <MessageAuthor isUser={isUser}>
              {isUser ? 'You' : 'TONIC AI Assistant'}
            </MessageAuthor>
            <MessageTime isUser={isUser}>
              <Clock size={12} />
              {message.timestamp}
            </MessageTime>
          </MessageHeader>
          
          <MessageText isUser={isUser}>
            {isUser ? (
              <p>{message.q}</p>
            ) : (
              <>
                <ReactMarkdown>{message.a}</ReactMarkdown>
                
                {message.tables && message.tables.length > 0 && (
                  message.tables.map((table, index) => (
                    <TableContainer key={index}>
                      <TableHeader>
                        <TableTitle>📊 Table {index + 1}</TableTitle>
                        <DownloadButton onClick={() => downloadTableAsCSV(table, index)}>
                          <Download size={14} />
                          Download CSV
                        </DownloadButton>
                      </TableHeader>
                      <Table>
                        <thead>
                          <tr>
                            {table.headers.map((header, i) => (
                              <Th key={i}>{header}</Th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.data.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <Td key={j}>{cell}</Td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </TableContainer>
                  ))
                )}
                
                {message.plot && (
                  <PlotContainer>
                    <PlotTitle>📊 Generated Visualization</PlotTitle>
                    {message.plot.image ? (
                      <PlotImage 
                        src={`data:image/png;base64,${message.plot.image}`} 
                        alt="Generated Plot"
                      />
                    ) : (
                      <EmptyPlot>
                        Chart visualization would be displayed here
                      </EmptyPlot>
                    )}
                  </PlotContainer>
                )}
              </>
            )}
          </MessageText>
        </MessageContent>
      </MessageWrapper>
    </MessageContainer>
  );
}

export default ChatMessage;
