import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Clock, Download, BarChart3, Table as TableIcon } from 'lucide-react';
import styled from 'styled-components';
import ChartRenderer from './ChartRenderer';
import ErrorBoundary from './ErrorBoundary';

const MessageContainer = styled.div`
  display: flex;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 20px;
  padding: 0 20px;
  width: 100%;
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

const VisualizationSection = styled.div`
  margin-top: 20px;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
`;

const SectionTitle = styled.h4`
  color: #2d3748;
  margin: 0 0 12px 0;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TableContainer = styled.div`
  margin: 16px 0;
  overflow-x: auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
  border: 1px solid #e2e8f0;
`;

const TableHeader = styled.div`
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #edf2f7 100%);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
`;

const TableTitle = styled.h5`
  color: #2d3748;
  margin: 0;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DownloadButton = styled.button`
  padding: 8px 16px;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }
  
  &:active {
    transform: translateY(0);
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
  padding: 12px 16px;
  text-align: left;
  background: #f8f9fa;
  font-weight: 600;
  color: #4a5568;
  font-size: 13px;
`;

const Td = styled.td`
  border: 1px solid #e2e8f0;
  padding: 12px 16px;
  color: #4a5568;
  font-size: 13px;
`;

const PlotContainer = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #edf2f7 100%);
  padding: 24px;
  border-radius: 12px;
  margin-top: 16px;
  text-align: center;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const PlotTitle = styled.h5`
  margin: 0 0 16px 0;
  color: #2d3748;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const PlotImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
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
  margin-bottom: 16px;
`;

const PlotDownloadButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  margin: 0 auto;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const NoDataMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #718096;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
`;

function ChatMessage({ message }) {
  const isUser = message.type === 'user';
  
  // Debug logging for plot data
  if (!isUser && (message.plot || message.plot_code)) {
    console.log('📊 Plot data in message:', {
      hasPlot: !!message.plot,
      plotLength: message.plot?.length || 0,
      hasPlotCode: !!message.plot_code,
      plotCodeLength: message.plot_code?.length || 0,
      plotCodePreview: message.plot_code?.substring(0, 100) + '...'
    });
  }
  
  const downloadTableAsCSV = (table, index) => {
    const headers = table.headers.join(',');
    
    // Handle both array format and object format
    const rows = table.data.map(row => {
      if (Array.isArray(row)) {
        // If row is an array, join it directly
        return row.join(',');
      } else {
        // If row is an object, extract values based on headers
        return table.headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas by wrapping in quotes
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value || '';
        }).join(',');
      }
    }).join('\n');
    
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table_${index + 1}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const downloadPlotAsPNG = (plotImage) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${plotImage}`;
    link.download = `plot_${Date.now()}.png`;
    link.click();
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
                
                {/* Show visualizations if available */}
                {(message.tables && message.tables.length > 0) || message.plot ? (
                  <VisualizationSection>
                    {/* Tables Section */}
                    {message.tables && message.tables.length > 0 && (
                      <>
                        <SectionTitle>
                          <TableIcon size={18} />
                          Extracted Tables ({message.tables.length})
                        </SectionTitle>
                        {message.tables.map((tableData, index) => {
                          // Handle both old format (headers/data) and new format (array of objects)
                          const headers = tableData.headers || Object.keys(tableData[0] || {});
                          const data = tableData.data || tableData;
                          
                          return (
                            <TableContainer key={index}>
                              <TableHeader>
                                <TableTitle>
                                  <TableIcon size={16} />
                                  Table {index + 1}
                                </TableTitle>
                                <DownloadButton onClick={() => downloadTableAsCSV({ headers, data }, index)}>
                                  <Download size={14} />
                                  Download CSV
                                </DownloadButton>
                              </TableHeader>
                              <Table>
                                <thead>
                                  <tr>
                                    {headers.map((header, i) => (
                                      <Th key={i}>{header}</Th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {data.map((row, i) => (
                                    <tr key={i}>
                                      {Array.isArray(row) ? 
                                        row.map((cell, j) => (
                                          <Td key={j}>{cell}</Td>
                                        )) :
                                        headers.map((header, j) => (
                                          <Td key={j}>{row[header] || ''}</Td>
                                        ))
                                      }
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </TableContainer>
                          );
                        })}
                      </>
                    )}
                    
                    {/* Plot Section */}
                    {(message.plot || message.plot_code) && (
                      <>
                        <SectionTitle>
                          <BarChart3 size={18} />
                          Generated Visualization
                        </SectionTitle>
                        
                        {/* Debug info */}
                        {process.env.NODE_ENV === 'development' && (
                          <div style={{ 
                            background: '#f0f0f0', 
                            padding: '8px', 
                            margin: '8px 0', 
                            borderRadius: '4px', 
                            fontSize: '12px' 
                          }}>
                            Debug: Plot={!!message.plot}, PlotCode={!!message.plot_code}
                          </div>
                        )}
                        
                        {/* Use ChartRenderer for interactive charts */}
                        {message.plot_code && (
                          <ErrorBoundary>
                            <ChartRenderer 
                              plotCode={message.plot_code} 
                              title="Interactive Data Visualization"
                            />
                          </ErrorBoundary>
                        )}
                        
                        {/* Fallback to base64 image if available */}
                        {message.plot && (
                          <PlotContainer>
                            <PlotTitle>
                              <BarChart3 size={16} />
                              Data Visualization
                            </PlotTitle>
                            <PlotImage 
                              src={`data:image/png;base64,${message.plot}`} 
                              alt="Generated Plot"
                              onLoad={() => console.log('✅ Plot image loaded successfully')}
                              onError={(e) => console.error('❌ Plot image failed to load:', e)}
                            />
                            <PlotDownloadButton onClick={() => downloadPlotAsPNG(message.plot)}>
                              <Download size={16} />
                              Download Plot as PNG
                            </PlotDownloadButton>
                          </PlotContainer>
                        )}
                      </>
                    )}
                  </VisualizationSection>
                ) : null}
              </>
            )}
          </MessageText>
        </MessageContent>
      </MessageWrapper>
    </MessageContainer>
  );
}

export default ChatMessage;
