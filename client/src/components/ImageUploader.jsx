import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const ImageUploader = ({ onImageUpload, sessionId, apiBaseUrl }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const uploadFile = useRef(null);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;
  
  const handleApiError = (error, message) => {
    console.error(`${message}:`, error);
    let errorMsg = message;
    
    if (error.response) {
      errorMsg = `${message}: ${error.response.data.error || 'Server error'}`;
    } else if (error.request) {
      errorMsg = `${message}: Server not responding`;
    } else {
      errorMsg = `${message}: ${error.message}`;
    }
    
    setUploadError(errorMsg);
    setIsUploading(false);
  };
  
  const uploadWithRetry = async (file) => {
    if (!sessionId) {
      handleApiError(new Error('No session ID available'), 'Session error');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    uploadFile.current = file;
    
    // Create form data
    const formData = new FormData();
    formData.append('image', file);
    formData.append('sessionId', sessionId);
    
    try {
      const response = await axios.post(`${apiBaseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setIsUploading(false);
      retryCount.current = 0;
      
      if (response.data && response.data.imageId) {
        onImageUpload({
          imageId: response.data.imageId,
          filename: response.data.filename,
          size: response.data.size,
          originalWidth: response.data.originalWidth,
          originalHeight: response.data.originalHeight,
          type: file.type
        });
      } else {
        setUploadError('Upload succeeded but received invalid response');
      }
    } catch (error) {
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        // Exponential backoff with jitter for retries
        const delay = Math.min(1000 * (2 ** retryCount.current) + Math.random() * 1000, 10000);
        
        toast.info(`Upload failed, retrying (${retryCount.current}/${MAX_RETRIES})...`);
        
        setTimeout(() => {
          uploadWithRetry(file);
        }, delay);
      } else {
        handleApiError(error, 'Failed to upload image');
        retryCount.current = 0;
      }
    }
  };
  
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file');
      return;
    }
    
    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit');
      return;
    }
    
    uploadWithRetry(file);
  }, [sessionId]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    maxFiles: 1
  });
  
  const handleRetry = () => {
    if (uploadFile.current) {
      uploadWithRetry(uploadFile.current);
    } else {
      setUploadError('No file to retry');
    }
  };
  
  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-xl-8 col-lg-10 col-md-12">
          <div className="text-center mb-4">
            <h1 className="display-5 fw-bold mb-3">Image Optimizer</h1>
            <p className="lead text-secondary mb-4 px-2">
              Upload your image to resize, compress, or convert it. 
              Our tools help you reduce file size while maintaining quality.
            </p>
          </div>
          
          {uploadError && (
            <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
              <FaExclamationTriangle className="me-2 flex-shrink-0" />
              <div className="d-flex justify-content-between align-items-center w-100 flex-wrap gap-2">
                <span>{uploadError}</span>
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={handleRetry}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <div
              {...getRootProps()}
              className={`border border-2 border-dashed rounded p-md-5 p-4 text-center cursor-pointer ${
                isDragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
              }`}
              style={{ cursor: 'pointer' }}
            >
              <input {...getInputProps()} />
              
              <div className={`fs-1 mb-3 ${isDragActive ? 'text-primary' : 'text-secondary'}`}>
                <FaCloudUploadAlt />
              </div>
              
              <p className="fs-5 text-secondary mb-2">
                {isDragActive
                  ? "Drop your image here..."
                  : "Drag & drop your image here, or click to browse"}
              </p>
              <p className="small text-secondary mb-0">
                Supports JPG, PNG, WebP, and GIF up to 10MB
              </p>
            </div>
          </div>
          
          {isUploading && (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-secondary">Uploading your image...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader; 