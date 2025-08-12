import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import styled from 'styled-components';
import toast from 'react-hot-toast';

const UploadContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
`;

const UploadHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const UploadTitle = styled.h3`
  color: #2d3748;
  margin: 0 0 8px 0;
  font-weight: 600;
  font-size: 18px;
`;

const UploadSubtitle = styled.p`
  color: #718096;
  margin: 0;
  font-size: 14px;
`;

const DropZone = styled.div`
  border: 2px dashed ${props => props.isDragOver ? '#FF6B35' : '#e2e8f0'};
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  background: ${props => props.isDragOver ? 'rgba(255, 107, 53, 0.05)' : '#f8f9fa'};
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    border-color: #FF6B35;
    background: rgba(255, 107, 53, 0.05);
  }
`;

const DropZoneContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const UploadIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const DropZoneText = styled.div`
  color: #4a5568;
  font-weight: 500;
`;

const DropZoneHint = styled.div`
  color: #718096;
  font-size: 14px;
`;

const FileInput = styled.input`
  display: none;
`;

const FileList = styled.div`
  margin-top: 20px;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #FF6B35;
    box-shadow: 0 2px 4px rgba(255, 107, 53, 0.1);
  }
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const FileIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: ${props => {
    if (props.type === 'pdf') return '#e53e3e';
    if (props.type === 'excel') return '#38a169';
    if (props.type === 'csv') return '#3182ce';
    return '#718096';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
`;

const FileDetails = styled.div`
  flex: 1;
`;

const FileName = styled.div`
  color: #2d3748;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 2px;
`;

const FileSize = styled.div`
  color: #718096;
  font-size: 12px;
`;

const FileStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusIcon = styled.div`
  color: ${props => {
    if (props.status === 'success') return '#38a169';
    if (props.status === 'error') return '#e53e3e';
    return '#718096';
  }};
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #e53e3e;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(229, 62, 62, 0.1);
  }
`;

const UploadButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(255, 107, 53, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 12px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(135deg, #FF6B35 0%, #e53e3e 100%);
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

function FileUpload({ onFileUpload, isUploading = false }) {
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const getFileType = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'pdf') return 'pdf';
    if (['xlsx', 'xls'].includes(ext)) return 'excel';
    if (ext === 'csv') return 'csv';
    return 'unknown';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return 'PDF';
      case 'excel': return 'XL';
      case 'csv': return 'CSV';
      default: return '?';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    
    const validFiles = newFiles.filter(file => {
      const type = getFileType(file.name);
      const isValidType = type !== 'unknown';
      const isValidSize = file.size <= maxFileSize;
      
      if (!isValidType) {
        toast.error(`File type not supported: ${file.name}`);
      }
      
      if (!isValidSize) {
        toast.error(`File too large: ${file.name} (${formatFileSize(file.size)})`);
      }
      
      return isValidType && isValidSize;
    });

    if (validFiles.length !== newFiles.length) {
      const skippedCount = newFiles.length - validFiles.length;
      toast.error(`${skippedCount} file(s) were skipped due to size or type restrictions.`);
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploadProgress(0);
    
    try {
      console.log('Starting file upload with files:', files);
      
      // Log file details
      files.forEach((file, index) => {
        console.log(`File ${index}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });
      });
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onFileUpload(files);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset after successful upload
      setTimeout(() => {
        setFiles([]);
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Upload error in FileUpload component:', error);
      setUploadProgress(0);
      toast.error(`Upload failed: ${error.message || 'Please try again.'}`);
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <UploadContainer>
      <UploadHeader>
        <UploadTitle>📁 Upload Documents</UploadTitle>
        <UploadSubtitle>
          Upload PDF, Excel, or CSV files to build your knowledge base
        </UploadSubtitle>
      </UploadHeader>

      <DropZone
        isDragOver={isDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleDropZoneClick}
      >
        <DropZoneContent>
          <UploadIcon>
            <Upload size={24} />
          </UploadIcon>
          <DropZoneText>
            Drag and drop files here, or click to browse
          </DropZoneText>
          <DropZoneHint>
            Supports PDF, Excel (.xlsx, .xls), and CSV files
          </DropZoneHint>
        </DropZoneContent>
      </DropZone>

      <FileInput
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.xlsx,.xls,.csv"
        onChange={handleFileSelect}
      />

      {files.length > 0 && (
        <FileList>
          {files.map((file, index) => (
            <FileItem key={index}>
              <FileInfo>
                <FileIcon type={getFileType(file.name)}>
                  {getFileIcon(getFileType(file.name))}
                </FileIcon>
                <FileDetails>
                  <FileName>{file.name}</FileName>
                  <FileSize>{formatFileSize(file.size)}</FileSize>
                </FileDetails>
              </FileInfo>
              <FileStatus>
                <StatusIcon status="success">
                  <CheckCircle size={16} />
                </StatusIcon>
                <RemoveButton onClick={() => removeFile(index)}>
                  <X size={16} />
                </RemoveButton>
              </FileStatus>
            </FileItem>
          ))}
        </FileList>
      )}

      {files.length > 0 && (
        <>
          <UploadButton
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                Processing Files...
              </>
            ) : (
              <>
                <Upload size={20} />
                Upload {files.length} File{files.length !== 1 ? 's' : ''}
              </>
            )}
          </UploadButton>
          
          {isUploading && (
            <ProgressBar>
              <ProgressFill progress={uploadProgress} />
            </ProgressBar>
          )}
        </>
      )}
    </UploadContainer>
  );
}

export default FileUpload;
