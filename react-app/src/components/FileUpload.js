import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import styled from 'styled-components';
import toast from 'react-hot-toast';

const UploadContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const UploadHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8f9fa;
`;

const UploadTitle = styled.h3`
  color: #4a5568;
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Dropzone = styled.div`
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8f9fa;
  
  ${props => props.isDragActive && `
    border-color: #FF6B35;
    background: rgba(255, 107, 53, 0.05);
  `}
  
  &:hover {
    border-color: #FF6B35;
    background: rgba(255, 107, 53, 0.05);
  }
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  color: #718096;
  margin-bottom: 15px;
  
  ${props => props.isDragActive && `
    color: #FF6B35;
  `}
`;

const UploadText = styled.p`
  color: #4a5568;
  margin: 0 0 10px 0;
  font-size: 1.1rem;
`;

const UploadSubtext = styled.p`
  color: #718096;
  margin: 0;
  font-size: 0.9rem;
`;

const FileList = styled.div`
  padding: 20px;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #e2e8f0;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FileIcon = styled.div`
  color: #FF6B35;
`;

const FileDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const FileName = styled.span`
  font-weight: 500;
  color: #4a5568;
`;

const FileSize = styled.span`
  font-size: 0.8rem;
  color: #718096;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #e53e3e;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: rgba(229, 62, 62, 0.1);
  }
`;

const SupportedFormats = styled.div`
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #718096;
`;

function FileUpload({ onFileUpload }) {
  const [files, setFiles] = React.useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    onFileUpload(acceptedFiles);
    
    toast.success(`Added ${acceptedFiles.length} file(s)`);
  }, [onFileUpload]);

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success('File removed');
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: true
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <UploadContainer>
      <UploadHeader>
        <UploadTitle>
          <Upload size={20} />
          Upload Files
        </UploadTitle>
      </UploadHeader>
      
      <div style={{ padding: '20px' }}>
        <Dropzone {...getRootProps()} isDragActive={isDragActive}>
          <input {...getInputProps()} />
          <UploadIcon isDragActive={isDragActive}>
            <Upload size={48} />
          </UploadIcon>
          <UploadText>
            {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
          </UploadText>
          <UploadSubtext>
            Supports PDF, Excel (.xlsx, .xls), and CSV files
          </UploadSubtext>
        </Dropzone>
      </div>

      {files.length > 0 && (
        <FileList>
          {files.map((fileItem) => (
            <FileItem key={fileItem.id}>
              <FileInfo>
                <FileIcon>
                  <File size={20} />
                </FileIcon>
                <FileDetails>
                  <FileName>{fileItem.name}</FileName>
                  <FileSize>{formatFileSize(fileItem.size)}</FileSize>
                </FileDetails>
              </FileInfo>
              <RemoveButton onClick={() => removeFile(fileItem.id)}>
                <X size={16} />
              </RemoveButton>
            </FileItem>
          ))}
        </FileList>
      )}

      <SupportedFormats>
        <strong>Supported formats:</strong> PDF, Excel (.xlsx, .xls), CSV
      </SupportedFormats>
    </UploadContainer>
  );
}

export default FileUpload;
