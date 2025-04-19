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
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
axios.defaults.timeout = 30000; // 30 seconds timeout for image processing
// We're using the API_BASE_URL for API requests

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
        const response = await axios.post('/api/session/create');
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
      await axios.post('/api/session/ping', { sessionId });
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
    setProcessedImageUrl(`/api/download/${result.imageId}`);
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
    <div className="container-lg">
      {processingStep === 'upload' && (
        <ImageUploader onImageUpload={handleImageUpload} sessionId={sessionId} />
      )}
      
      {processingStep === 'edit' && imageData && (
        <ImageEditor 
          imageData={imageData} 
          onComplete={handleProcessingComplete}
          onReset={handleReset}
          onBack={handleBack}
          setOcrText={setOcrText}
          sessionId={sessionId}
        />
      )}
      
      {processingStep === 'preview' && (
        <ImagePreview 
          imageUrl={processedImageUrl}
          imageData={processedImageData}
          ocrText={ocrText}
          onReset={handleReset}
          onBack={handleBack}
        />
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