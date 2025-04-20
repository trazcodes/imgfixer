import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaSync, FaCrop, FaFileAlt, FaMagic, FaRedo, FaSpinner, FaChevronLeft } from 'react-icons/fa';

import axios from 'axios';
import { toast } from 'react-toastify';

const EditorContainer = ({ children, className = "" }) => (
  <div className={`d-flex flex-column w-100 mx-auto bg-white rounded shadow-sm overflow-hidden position-relative ${className}`} style={{ maxWidth: '1000px' }}>
    {children}
  </div>
);

const BackButton = ({ onClick, children }) => (
  <button 
    onClick={onClick}
    className="bg-transparent border-0 text-primary fs-5"
    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
    onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(-3px)'}
    onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
  >
    {children}
  </button>
);

const ResetButton = ({ onClick, children }) => (
  <button 
    onClick={onClick}
    className="bg-transparent border-0 text-secondary fs-6"
    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
    onMouseOver={(e) => e.currentTarget.style.color = 'var(--bs-primary)'}
    onMouseOut={(e) => e.currentTarget.style.color = '#6c757d'}
  >
    {children}
  </button>
);

const EditorHeader = ({ children }) => (
  <div className="p-4 pb-3 pt-5 border-bottom text-center">
    {children}
  </div>
);

const EditorContent = ({ children }) => (
  <div className="d-grid gap-4 p-4 editor-content" 
    style={{ 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gridAutoFlow: 'dense'
    }}>
    {children}
  </div>
);

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ImagePreviewTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--dark-gray);
`;

const ImageBox = styled.div`
  border: 1px solid var(--mid-gray);
  border-radius: 0.375rem;
  overflow: hidden;
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  will-change: transform; /* Optimize rendering */
  contain: layout paint style; /* Improve rendering performance */
  
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    display: block;
    loading: eager;
  }
`;

const EditorControls = styled.div`
  display: flex;
  flex-direction: column;
`;

const ControlsSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.5rem;
    color: var(--primary-color);
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  input, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--mid-gray);
    border-radius: 0.375rem;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
    }
  }
`;

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  gap: 1rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 576px) {
    width: 100%;
    justify-content: center;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 1rem;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: var(--primary-color);
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: var(--primary-hover);
  }
`;

const SecondaryButton = styled(Button)`
  background-color: white;
  color: var(--text-color);
  border: 1px solid var(--mid-gray);
  
  &:hover:not(:disabled) {
    background-color: var(--light-gray);
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: normal;
  
  @media (max-width: 576px) {
    width: 100%;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.25rem;
    flex-shrink: 0;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  
  svg {
    animation: spin 1s linear infinite;
    font-size: 1.5rem;
    color: var(--primary-color);
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const OperationSelector = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  
  @media (max-width: 576px) {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
  
  @media (max-width: 400px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const OperationButton = ({ onClick, active, children }) => (
  <button
    onClick={onClick}
    className={`d-flex flex-column align-items-center justify-content-center p-3 rounded border ${
      active 
        ? 'border-primary bg-primary bg-opacity-10 text-primary' 
        : 'border-gray-300 bg-white text-secondary'
    }`}
    style={{ 
      cursor: 'pointer',
      transition: 'all 0.2s',
      flex: '1 1 30%',
      minWidth: '100px'
    }}
    onMouseOver={(e) => {
      if (!active) {
        e.currentTarget.classList.remove('border-gray-300');
        e.currentTarget.classList.add('border-primary', 'text-primary');
      }
    }}
    onMouseOut={(e) => {
      if (!active) {
        e.currentTarget.classList.remove('border-primary', 'text-primary');
        e.currentTarget.classList.add('border-gray-300', 'text-secondary');
      }
    }}
  >
    {children}
  </button>
);

const SliderContainer = styled.div`
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--mid-gray);
  border-radius: 0.375rem;
  padding: 1rem;
  background-color: white;
`;

const SliderWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: stretch;
  }
  
  input[type="range"] {
    flex: 1;
  }
`;

const InlineResizeButton = styled.button`
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  white-space: nowrap;
  
  &:hover {
    background-color: var(--primary-hover);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 0.9rem;
  }
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  
  span {
    font-size: 0.875rem;
    color: var(--dark-gray);
    font-weight: 500;
  }
  
  span.quality-value {
    color: var(--primary-color);
    font-weight: 600;
    font-size: 1rem;
  }
`;

const Slider = styled.input`
  width: 100%;
  height: 5px;
  background: var(--mid-gray);
  border-radius: 5px;
  appearance: none;
  outline: none;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 15px;
    height: 15px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 15px;
    height: 15px;
    background: var(--primary-color);
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`;

const FileSizeIndicator = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
`;

const QualityIndicator = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 0.25rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--mid-gray);
    z-index: 1;
  }
`;

const QualityLevel = styled.div`
  position: relative;
  z-index: 2;
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  background-color: ${props => props.$active ? 'var(--primary-color)' : 'var(--light-gray)'};
  color: ${props => props.$active ? 'white' : 'var(--dark-gray)'};
  font-weight: ${props => props.$active ? '600' : '400'};
  transition: all 0.2s;
`;

const QualityDescription = styled.div`
  font-size: 0.8rem;
  color: var(--dark-gray);
  margin-top: 0.75rem;
  padding: 0.5rem;
  background-color: ${props => 
    props.level === 'high' ? 'rgba(240, 180, 0, 0.1)' : 
    props.level === 'medium' ? 'rgba(0, 150, 136, 0.1)' : 
    'rgba(0, 123, 255, 0.1)'
  };
  border-left: 3px solid ${props => 
    props.level === 'high' ? '#f0b400' : 
    props.level === 'medium' ? '#009688' : 
    '#007bff'
  };
  border-radius: 0 0.25rem 0.25rem 0;
`;

const SizeInput = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 14px;
  background-color: var(--cream-bg);
  
  /* Remove increment/decrement arrows */
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* Firefox */
  -moz-appearance: textfield;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    background-color: var(--cream-bg);
  }
`;

const SizeInfo = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
`;

const ImageEditor = ({ imageData, onComplete, onReset, onBack, setOcrText, sessionId, apiBaseUrl }) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [targetFormat, setTargetFormat] = useState('jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('resize');
  const [quality, setQuality] = useState(80);
  const [targetSize, setTargetSize] = useState(100); // Default 100KB
  const [estimatedSize, setEstimatedSize] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [preciseSizeEstimate, setPreciseSizeEstimate] = useState(null);
  const [processingResult, setProcessingResult] = useState(null);
  const [error, setError] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const estimateTimeoutRef = useRef(null);
  const debouncedFetchTimeout = useRef(null);
  
  useEffect(() => {
    // Preload the image if we have an ID
    if (imageData.imageId) {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = `${apiBaseUrl}/download/${imageData.imageId}`;
      document.head.appendChild(preloadLink);
      
      setPreviewUrl(`${apiBaseUrl}/download/${imageData.imageId}`);
      
      if (imageData.size) {
        setOriginalSize(parseInt(imageData.size));
      }
      
      const img = new Image();
      img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = previewUrl;
      img.fetchPriority = "high";
      
      if (!imageData.size) {
        // Fetch file info
        fetch(`${apiBaseUrl}/file-info/${imageData.imageId}`)
          .then(response => response.json())
          .then(data => {
            if (data.size) {
              setOriginalSize(parseInt(data.size));
            }
          })
          .catch(error => console.error('Error fetching file info:', error));
      }
      
      return () => {
        // Clean up the preload link when component unmounts
        if (preloadLink.parentNode) {
          preloadLink.parentNode.removeChild(preloadLink);
        }
      };
    }
  }, [imageData, previewUrl, apiBaseUrl]);
  
  // Get precise size estimation from server when parameters change
  useEffect(() => {
    // Clear any pending debounced fetches
    if (debouncedFetchTimeout.current) {
      clearTimeout(debouncedFetchTimeout.current);
    }
    
    // Only fetch if we have all necessary parameters and are in resize mode
    if (imageData.imageId && selectedOperation === 'resize' && 
        (width || height) && quality && !isProcessing) {
      
      // Debounce the fetch to avoid too many requests during slider movement
      debouncedFetchTimeout.current = setTimeout(async () => {
        setIsEstimating(true);
        
        try {
          const response = await axios.post(`${apiBaseUrl}/estimate-size`, {
            imageId: imageData.imageId,
            width: width ? parseInt(width) : null,
            height: height ? parseInt(height) : null,
            quality: parseInt(quality),
            format: selectedOperation === 'convert' ? targetFormat : null
          });
          
          if (response.data && response.data.estimatedSize) {
            setPreciseSizeEstimate(response.data.estimatedSize);
          }
        } catch (error) {
          console.error('Error estimating size:', error);
          // If server estimation fails, we still have the client-side estimate
          setPreciseSizeEstimate(null);
        } finally {
          setIsEstimating(false);
        }
      }, 500); // 500ms debounce
    }
    
    return () => {
      if (debouncedFetchTimeout.current) {
        clearTimeout(debouncedFetchTimeout.current);
      }
    };
  }, [imageData.imageId, width, height, quality, selectedOperation, targetFormat, isProcessing, apiBaseUrl]);
  
  // Client-side size estimation (as a fallback)
  useEffect(() => {
    if (width && height && originalSize) {
      let estimatedBytes;
      
      // Get file format from image data
      const format = imageData.type ? imageData.type.split('/')[1] : 'jpeg';
      
      // Calculate area ratio (how much the image is being scaled)
      let areaRatio = 1;
      if (imageData.originalWidth && imageData.originalHeight) {
        const originalPixels = parseInt(imageData.originalWidth) * parseInt(imageData.originalHeight);
        const newPixels = parseInt(width) * parseInt(height);
        areaRatio = newPixels / originalPixels;
        // If expanding the image, the ratio is capped at 1 since we don't add information
        if (areaRatio > 1) areaRatio = 1; 
      }
      
      // Different compression algorithms behave differently with quality settings
      // These coefficients are derived from empirical testing
      let sizeEstimate;
      
      // JPEG and similar lossy formats
      if (['jpeg', 'jpg', 'webp'].includes(format.toLowerCase())) {
        // JPEG/WebP have non-linear relationship between quality and file size
        // Exponential model provides better estimate
        const qualityFactor = Math.pow(parseInt(quality) / 100, 1.5);
        
        // Base size estimate considering area ratio
        sizeEstimate = originalSize * areaRatio;
        
        // Apply quality-specific adjustments
        if (quality >= 90) {
          // High quality has disproportionately larger files
          sizeEstimate = sizeEstimate * qualityFactor * 1.5;
        } else if (quality >= 70) {
          // Medium quality
          sizeEstimate = sizeEstimate * qualityFactor * 1.2;
        } else {
          // Low quality
          sizeEstimate = sizeEstimate * qualityFactor * 0.8;
        }
      } 
      // PNG and other lossless formats
      else if (['png', 'gif', 'bmp', 'tiff'].includes(format.toLowerCase())) {
        // Lossless formats scale more directly with pixel count
        // PNG compression is less affected by quality slider
        // Quality in PNG is more about compression strategy than lossy compression
        
        // For PNG, compression level (0-9) is inverse of quality (100-0)
        const compressionLevel = Math.floor((100 - parseInt(quality)) / 11);
        
        // PNG size is primarily determined by image complexity and pixel count
        // Higher compression levels have diminishing returns
        const compressionFactor = 1 - (compressionLevel * 0.03);
        
        sizeEstimate = originalSize * areaRatio * compressionFactor;
      }
      // Unknown/other formats - fall back to simpler model
      else {
        const qualityFactor = parseInt(quality) / 100;
        sizeEstimate = originalSize * areaRatio * qualityFactor;
      }
      
      // Apply format-specific minimum sizes to prevent unrealistically small estimates
      let minSize;
      if (['jpeg', 'jpg'].includes(format.toLowerCase())) {
        minSize = 2 * 1024; // Minimum 2KB for JPEG
      } else if (format.toLowerCase() === 'webp') {
        minSize = 1 * 1024; // Minimum 1KB for WebP
      } else if (format.toLowerCase() === 'png') {
        minSize = 3 * 1024; // Minimum 3KB for PNG
      } else {
        minSize = 1 * 1024; // Minimum 1KB for other formats
      }
      
      // Set estimated size with appropriate minimum
      setEstimatedSize(Math.max(minSize, Math.round(sizeEstimate)));
    }
  }, [width, height, quality, originalSize, imageData]);
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const handleResize = async () => {
    if (!sessionId) {
      toast.error('Session not initialized. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    setProcessingResult(null);
    setError(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/resize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId: imageData.imageId,
          targetSize: parseInt(targetSize),
          quality: parseInt(quality),
          sessionId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const data = await response.json();
      setProcessedImage(data);
      setProcessingResult({
        targetSize: data.targetSize,
        actualSize: data.actualSize,
        quality: data.quality,
        width: data.width,
        height: data.height
      });
      toast.success('Image processed successfully');
      onComplete(data);
    } catch (err) {
      setError(err.message || 'Failed to process image');
      toast.error(err.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleConvert = async () => {
    if (!sessionId) {
      toast.error('Session not initialized. Please refresh the page.');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const response = await axios.post(`${apiBaseUrl}/convert`, {
        imageId: imageData.imageId,
        format: targetFormat,
        sessionId
      });
      
      if (response.data && response.data.imageId) {
        onComplete(response.data);
        toast.success(`Image converted to ${targetFormat} successfully!`);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error(error.response?.data?.error || 'Failed to convert image');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleOcrProcess = async () => {
    if (!sessionId) {
      toast.error('Session not initialized. Please refresh the page.');
      return;
    }
    
    try {
      setIsOcrProcessing(true);
      
      const response = await axios.post(`${apiBaseUrl}/ocr`, {
        imageId: imageData.imageId,
        sessionId
      });
      
      if (response.data && response.data.text) {
        setOcrResult(response.data.text);
        setOcrText(response.data.text);
        toast.success('OCR processing completed!');
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast.error(error.response?.data?.error || 'Failed to process OCR');
    } finally {
      setIsOcrProcessing(false);
    }
  };
  
  if (isProcessing) {
    return (
      <EditorContainer>
        <LoadingContainer>
          <FaSpinner />
          <span style={{ marginLeft: '0.75rem' }}>Processing your image...</span>
        </LoadingContainer>
      </EditorContainer>
    );
  }
  
  return (
    <EditorContainer>
      <div className="d-flex justify-content-between w-100 px-4 pt-3">
        <BackButton onClick={onBack}>
          <FaChevronLeft />
          <span className="fs-6 ms-1">Back</span>
        </BackButton>
        
        <ResetButton onClick={onReset}>
          <FaRedo className="me-1" />
          Reset
        </ResetButton>
      </div>
      
      <EditorHeader>
        <h2 className="fs-4 mb-2">Edit Image</h2>
      </EditorHeader>
      
      <EditorContent>
        <ImagePreviewContainer className="mb-md-0 mb-4">
          <ImagePreviewTitle>Image Preview</ImagePreviewTitle>
          <ImageBox>
            {previewUrl && (
              <img 
                src={previewUrl} 
                alt="Uploaded" 
                loading="eager" 
                fetchpriority="high"
              />
            )}
          </ImageBox>
          
          {ocrResult && selectedOperation === 'ocr' && (
            <div style={{ marginTop: '1rem' }}>
              <SectionTitle>
                <FaFileAlt />
                OCR Result
              </SectionTitle>
              <div
                style={{
                  border: '1px solid var(--mid-gray)',
                  padding: '1rem',
                  borderRadius: '0.375rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {ocrResult}
              </div>
            </div>
          )}
        </ImagePreviewContainer>
        
        <EditorControls>
          <OperationSelector>
            <OperationButton 
              active={selectedOperation === 'resize'}
              onClick={() => setSelectedOperation('resize')}
            >
              <FaCrop className="fs-5 mb-2" />
              <span className="small">Resize</span>
            </OperationButton>
            
            <OperationButton 
              active={selectedOperation === 'convert'}
              onClick={() => setSelectedOperation('convert')}
            >
              <FaSync className="fs-5 mb-2" />
              <span className="small">Convert</span>
            </OperationButton>
            
            <OperationButton 
              active={selectedOperation === 'ocr'}
              onClick={() => setSelectedOperation('ocr')}
            >
              <FaMagic className="fs-5 mb-2" />
              <span className="small">OCR Text</span>
            </OperationButton>
          </OperationSelector>
          
          {selectedOperation === 'resize' && (
            <ControlsSection>
              <SectionTitle>
                <FaCrop />
                Resize Image
              </SectionTitle>

              {/* Option 1: Target size-based resize (now first) */}
              <div className="border border-1 rounded-3 p-3 mb-4">
                <h4 className="fs-6 fw-semibold mb-3 text-secondary">
                  Option 1: Resize to Target Size
                </h4>
                
                <div className="row">
                  <div className="col-12">
                    <div className="mb-3">
                      <label htmlFor="targetSize" className="form-label">Target Size (KB)</label>
                      <input
                        type="text"
                        className="form-control"
                        id="targetSize"
                        value={targetSize}
                        onChange={(e) => {
                          // Allow empty or numeric values
                          const val = e.target.value;
                          if (val === '' || /^\d+$/.test(val)) {
                            setTargetSize(val);
                          }
                        }}
                        onBlur={() => {
                          // Apply minimum value constraint on blur
                          if (targetSize === '' || parseInt(targetSize) < 1) {
                            setTargetSize('1');
                          }
                        }}
                        placeholder="Enter target size in KB"
                      />
                    </div>
                  </div>
                </div>
                <SizeInfo>
                  Enter any size starting from 1KB. Very small sizes may reduce image quality.
                </SizeInfo>
                
                <ActionButton
                  onClick={handleResize}
                  className="btn btn-primary w-100 mt-3"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner className="spinner me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCrop className="me-2" />
                      Resize to Target Size
                    </>
                  )}
                </ActionButton>
              </div>
              
              {/* Option 2: Quality-based resize (now second) */}
              <div className="border border-1 rounded-3 p-3 mb-4">
                <h4 className="fs-6 fw-semibold mb-3 text-secondary">
                  Option 2: Resize by Quality
                </h4>
                
                <SliderContainer>
                  <SliderLabel>
                    <span>Quality</span>
                    <span className="quality-value">{quality}%</span>
                  </SliderLabel>
                  <SliderWrapper>
                    <input
                      type="range"
                      className="form-range"
                      min="1"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                    />
                  </SliderWrapper>
                  
                  <QualityIndicator>
                    <div className="d-flex justify-content-between mt-2 mb-1">
                      <small className={`${parseInt(quality) < 40 ? 'text-primary fw-bold' : 'text-secondary'}`}>Low</small>
                      <small className={`${parseInt(quality) >= 40 && parseInt(quality) < 75 ? 'text-primary fw-bold' : 'text-secondary'}`}>Medium</small>
                      <small className={`${parseInt(quality) >= 75 ? 'text-primary fw-bold' : 'text-secondary'}`}>High</small>
                    </div>
                  </QualityIndicator>
                  
                  <QualityDescription level={parseInt(quality) >= 75 ? 'high' : parseInt(quality) >= 40 ? 'medium' : 'low'}>
                    <div className="mt-2 small text-secondary">
                      {parseInt(quality) >= 75 ? (
                        'High quality with minimal compression artifacts. Larger file size.'
                      ) : parseInt(quality) >= 40 ? (
                        'Balanced quality with good compression. Recommended for most uses.'
                      ) : (
                        'Maximum compression with smaller file size. May show visible artifacts.'
                      )}
                    </div>
                  </QualityDescription>
                </SliderContainer>
                
                {(estimatedSize || preciseSizeEstimate) && (
                  <div className="card mt-3 border-light">
                    <div className="card-body py-2 px-3">
                      {isEstimating ? (
                        <div className="text-center">
                          <small className="d-flex align-items-center justify-content-center">
                            <FaSpinner className="spinner me-2" />
                            Calculating precise size...
                          </small>
                        </div>
                      ) : (
                        <>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-secondary">Estimated size:</small>
                            <small className="fw-bold">{formatFileSize(preciseSizeEstimate || estimatedSize)}</small>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-secondary">Original size:</small>
                            <small>{formatFileSize(originalSize)}</small>
                          </div>
                          {originalSize && (preciseSizeEstimate || estimatedSize) && (
                            <div className="mt-1 pt-1 border-top d-flex justify-content-between align-items-center">
                              <small className="text-secondary">Reduction:</small>
                              <small className={`${
                                (1 - (preciseSizeEstimate || estimatedSize) / originalSize) > 0.5 
                                  ? 'text-success fw-bold' 
                                  : 'text-secondary'
                              }`}>
                                {Math.round(100 * (1 - (preciseSizeEstimate || estimatedSize) / originalSize))}%
                              </small>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                <ActionButton
                  onClick={() => {
                    // Quality-based resize - pass quality but not target size
                    setIsProcessing(true);
                    setProcessingResult(null);
                    setError(null);
                    
                    fetch(`${apiBaseUrl}/resize`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        imageId: imageData.imageId,
                        quality: parseInt(quality),
                        sessionId
                      }),
                    })
                    .then(response => {
                      if (!response.ok) {
                        return response.json().then(data => {
                          throw new Error(data.error || 'Failed to process image');
                        });
                      }
                      return response.json();
                    })
                    .then(data => {
                      setProcessedImage(data);
                      setProcessingResult({
                        targetSize: data.targetSize,
                        actualSize: data.actualSize,
                        quality: data.quality,
                        width: data.width,
                        height: data.height
                      });
                      toast.success('Image processed successfully');
                      onComplete(data);
                    })
                    .catch(err => {
                      setError(err.message || 'Failed to process image');
                      toast.error(err.message || 'Failed to process image');
                    })
                    .finally(() => {
                      setIsProcessing(false);
                    });
                  }}
                  className="btn btn-primary w-100 mt-3"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner className="spinner me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCrop className="me-2" />
                      Resize with Quality Setting
                    </>
                  )}
                </ActionButton>
              </div>
              
              {processingResult && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'rgba(0, 180, 0, 0.1)',
                  border: '1px solid rgba(0, 180, 0, 0.2)'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    Processing Results:
                  </div>
                  <div style={{ fontSize: '0.75rem' }}>
                    Target Size: {formatFileSize(processingResult.targetSize)}<br />
                    Actual Size: {formatFileSize(processingResult.actualSize)}<br />
                    Final Quality: {processingResult.quality}%<br />
                    Dimensions: {processingResult.width}×{processingResult.height}
                  </div>
                </div>
              )}
              
              {error && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'rgba(220, 53, 69, 0.1)',
                  border: '1px solid rgba(220, 53, 69, 0.2)',
                  color: '#dc3545',
                  fontSize: '0.875rem'
                }}>
                  <strong>Error:</strong> {error}
                </div>
              )}
            </ControlsSection>
          )}
          
          {selectedOperation === 'convert' && (
            <ControlsSection>
              <SectionTitle>
                <FaSync />
                Convert Format
              </SectionTitle>
              <InputGroup>
                <label htmlFor="format">Target Format</label>
                <select
                  id="format"
                  className="form-select"
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                </select>
              </InputGroup>
              <ActionButton
                onClick={handleConvert}
                className="btn btn-primary w-100 mt-3"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <FaSpinner className="spinner me-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaSync className="me-2" />
                    Convert Image
                  </>
                )}
              </ActionButton>
            </ControlsSection>
          )}
          
          {selectedOperation === 'ocr' && (
            <ControlsSection>
              <SectionTitle>
                <FaMagic />
                OCR - Text Extraction
              </SectionTitle>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--dark-gray)' }}>
                Extract text from your image using Optical Character Recognition
              </p>
              <ActionButton
                onClick={handleOcrProcess}
                className="btn btn-primary w-100 mt-3"
                disabled={isOcrProcessing}
              >
                {isOcrProcessing ? (
                  <>
                    <FaSpinner className="spinner me-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaMagic className="me-2" />
                    Extract Text
                  </>
                )}
              </ActionButton>
            </ControlsSection>
          )}
          
          {!selectedOperation && (
            <div style={{ textAlign: 'center', color: 'var(--dark-gray)', padding: '2rem 0' }}>
              <p>Please select an operation from above to continue</p>
            </div>
          )}
        </EditorControls>
      </EditorContent>
    </EditorContainer>
  );
};

export default ImageEditor; 