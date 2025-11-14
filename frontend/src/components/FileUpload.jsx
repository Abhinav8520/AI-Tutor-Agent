import { useState, useRef } from 'react';

const FileUpload = ({ onUpload, isUploading = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const allowedTypes = ['.pdf', '.pptx', '.ppt'];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert(`Please select a valid file type: ${allowedTypes.join(', ')}`);
      return;
    }
    
    setSelectedFile(file);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile && onUpload) {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="card">
      <h2>Upload Study Materials</h2>
      
      <div
        className={`upload-area ${dragActive ? 'dragover' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="upload-icon">File</div>
        <p>
          Drag and drop your files here, or{' '}
          <span
            className="browse-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            browse files
          </span>
        </p>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
          Supported formats: PDF, PPTX, PPT
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx,.ppt"
          onChange={handleFileInput}
          className="file-input"
        />
      </div>

      {selectedFile && (
        <div className="selected-file">
          <div>
            <div style={{ fontWeight: '500' }}>{selectedFile.name}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          <button
            onClick={removeFile}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#999'
            }}
          >
            X
          </button>
        </div>
      )}
      
      <button
        onClick={handleUpload}
        disabled={isUploading || !selectedFile}
        className="upload-btn"
      >
        {isUploading ? (
          <>
            <span className="loading"></span>
            Uploading...
          </>
        ) : (
          'Upload Document'
        )}
      </button>
    </div>
  );
};

export default FileUpload; 