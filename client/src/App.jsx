import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ImageUploader from './components/ImageUploader';
import ImageEditor from './components/ImageEditor';
import ImagePreview from './components/ImagePreview';
import Header from './components/Header';
import Footer from './components/Footer';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';


// Configure axios with a timeout and base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
axios.defaults.timeout = 30000; // 30 seconds timeout for image processing

// Ensure API_BASE_URL ends with /api
const apiBaseWithPrefix = API_BASE_URL.endsWith('/api') 
  ? API_BASE_URL 
  : `${API_BASE_URL}/api`;

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

const ImageProcessor = () => {
  const [imageData, setImageData] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [processingStep, setProcessingStep] = useState('upload'); // 'upload', 'edit', 'preview'
  const [processedImageUrl, setProcessedImageUrl] = useState('');
  const [processedImageData, setProcessedImageData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  
  // Helper function to handle API errors
  const handleApiError = (error, message) => {
    console.error(`${message}:`, error);
    if (error.response) {
      toast.error(`${message}: ${error.response.data.error || 'Server error'}`);
    } else if (error.request) {
      toast.error(`${message}: Server not responding`);
    } else {
      toast.error(`${message}: ${error.message}`);
    }
  };
  
  // Create session on app load
  useEffect(() => {
    const createSession = async () => {
      try {
        // Use apiBaseWithPrefix to ensure /api is included
        const response = await axios.post(`${apiBaseWithPrefix}/session/create`);
        const newSessionId = response.data.sessionId;
        setSessionId(newSessionId);
        sessionStorage.setItem('imgfixer_session_id', newSessionId);
      } catch (error) {
        handleApiError(error, 'Failed to create session');
      }
    };
    
    // Check if we have a session ID in sessionStorage
    const storedSessionId = sessionStorage.getItem('imgfixer_session_id');
    
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      createSession();
    }
  }, []);
  
  // Keep session alive with periodic pings
  const pingSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      // Use apiBaseWithPrefix to ensure /api is included
      await axios.post(`${apiBaseWithPrefix}/session/ping`, { sessionId });
    } catch (error) {
      handleApiError(error, 'Failed to ping session');
    }
  }, [sessionId]);
  
  // Set up ping interval
  useEffect(() => {
    if (!sessionId) return;
    
    const intervalId = setInterval(pingSession, 30 * 1000); // 30 seconds
    pingSession(); // Initial ping
    
    return () => clearInterval(intervalId);
  }, [sessionId, pingSession]);

  const handleImageUpload = (data) => {
    setImageData(data);
    setProcessingStep('edit');
  };

  const handleProcessingComplete = (result) => {
    // Use apiBaseWithPrefix to ensure /api is included
    setProcessedImageUrl(`${apiBaseWithPrefix}/download/${result.imageId}`);
    setProcessedImageData(result);
    setProcessingStep('preview');
  };

  const handleReset = () => {
    setImageData(null);
    setOcrText('');
    setProcessingStep('upload');
    setProcessedImageUrl('');
    setProcessedImageData(null);
  };
  
  const handleBack = () => {
    if (processingStep === 'preview') {
      setProcessingStep('edit');
    } else if (processingStep === 'edit') {
      setProcessingStep('upload');
      setImageData(null);
    }
  };

  return (
    <div className="container-fluid p-0">
      {/* Step 1: Upload */}
      {processingStep === 'upload' && (
        <div className="container my-5">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div className="card shadow-sm border-0">
                <div className="card-body p-4">
                  <h2 className="text-center mb-4">Upload an Image</h2>
                  <ImageUploader 
                    onImageUpload={handleImageUpload} 
                    sessionId={sessionId}
                    apiBaseUrl={apiBaseWithPrefix}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Edit */}
      {processingStep === 'edit' && imageData && (
        <div className="container-fluid p-0">
          <ImageEditor
            imageData={imageData}
            onBack={handleBack}
            onSave={handleProcessingComplete}
            sessionId={sessionId}
            apiBaseUrl={apiBaseWithPrefix}
          />
        </div>
      )}

      {/* Step 3: Preview */}
      {processingStep === 'preview' && processedImageData && (
        <div className="container-fluid p-0">
          <ImagePreview
            processedImage={processedImageUrl}
            originalImageData={imageData}
            onBack={handleBack}
            onReset={handleReset}
            sessionId={sessionId}
            apiBaseUrl={apiBaseWithPrefix}
          />
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Header />
        <Routes>
          <Route path="/" element={<ImageProcessor />} />
          <Route path="/features" element={<Features />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 