import React from 'react';
import styled from 'styled-components';
import { FaDownload, FaRedo, FaCheck, FaFileAlt, FaArrowLeft, FaChevronLeft } from 'react-icons/fa';

const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  position: relative;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateX(-3px);
  }
  
  span {
    font-size: 0.875rem;
    margin-left: 0.25rem;
  }
`;

const ResetButton = styled.button`
  background: none;
  border: none;
  color: var(--dark-gray);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  
  &:hover {
    color: var(--primary-color);
  }
  
  svg {
    margin-right: 0.25rem;
  }
`;

const PreviewHeader = styled.div`
  width: 100%;
  padding: 1.5rem;
  padding-left: 3.5rem; /* Make space for the back button */
  padding-right: 3.5rem; /* Make space for the reset button */
  border-bottom: 1px solid var(--mid-gray);
  text-align: center;
  
  h2 {
    font-size: 1.5rem;
    color: var(--text-color);
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 0.875rem;
    color: var(--dark-gray);
  }
`;

const PreviewContent = styled.div`
  width: 100%;
  padding: 2rem;
  
  @media (max-width: 576px) {
    padding: 1rem;
  }
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  margin-bottom: 2rem;
  background-color: rgba(16, 185, 129, 0.1);
  border-radius: 0.375rem;
  color: var(--success);
  
  svg {
    margin-right: 0.5rem;
    flex-shrink: 0;
  }
  
  @media (max-width: 576px) {
    padding: 0.75rem;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }
`;

const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  
  img {
    max-width: 100%;
    max-height: 400px;
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  @media (max-width: 576px) {
    margin-bottom: 1.5rem;
    
    img {
      max-height: 300px;
    }
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: center;
    width: 100%;
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
  
  svg {
    font-size: 1rem;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: var(--primary-color);
  color: white;
  border: none;
  min-width: 150px;
  max-width: 250px;
  background-color: blue;
  
  &:hover {
    color:white;
    background-color: darkblue;
    // var(--primary-hover;
  }
  
  @media (max-width: 576px) {
    width: 100%;
    max-width: 100%;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: white;
  color: var(--text-color);
  border: 1px solid var(--mid-gray);
  
  &:hover {
    background-color: var(--light-gray);
  }
`;

const OCRResultContainer = styled.div`
  margin-top: 2rem;
  border-top: 1px solid var(--mid-gray);
  padding-top: 2rem;
`;

const OCRHeader = styled.h3`
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  
  svg {
    color: var(--primary-color);
  }
`;

const OCRContent = styled.div`
  padding: 1rem;
  background-color: var(--light-gray);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
`;

const ImagePreview = ({ imageUrl, ocrText, onReset, onBack, imageData }) => {
  // Extract filename from the imageUrl which now contains the MongoDB ID
  const imageId = imageUrl.split('/').pop();
  
  const handleDownload = () => {
    // Use the download endpoint with MongoDB ID
    window.location.href = imageUrl;
  };
  
  // Get the format type from content-type header (this might need adaptation)
  // For now, let's assume we can extract it from the response
  // A more robust implementation would send this info with the API response
  const [formatType, setFormatType] = React.useState('');
  
  React.useEffect(() => {
    // Make a HEAD request to get content-type
    // This is optional and could be replaced by passing format info from parent component
    fetch(imageUrl, { method: 'HEAD' })
      .then(response => {
        const contentType = response.headers.get('content-type');
        if (contentType.includes('pdf')) {
          setFormatType('PDF');
        } else if (contentType.includes('docx') || contentType.includes('document')) {
          setFormatType('DOCX');
        } else {
          // It's an image type
          setFormatType(contentType.split('/')[1].toUpperCase());
        }
      })
      .catch(() => {
        // Default to JPEG if unable to determine
        setFormatType('JPEG');
      });
  }, [imageUrl]);

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <PreviewContainer>
      <div className="d-flex justify-content-between w-100 px-4 pt-3">
        <BackButton onClick={onBack}>
          <FaChevronLeft />
          <span>Back</span>
        </BackButton>
        
        <ResetButton onClick={onReset}>
          <FaRedo />
          Reset
        </ResetButton>
      </div>
      
      <PreviewHeader>
        <h2>Processing Complete</h2>
        <p>Your image has been successfully processed</p>
      </PreviewHeader>
      
      <PreviewContent>
        <SuccessMessage>
          <FaCheck />
          <span>Image processing completed successfully!</span>
        </SuccessMessage>
        
        <ImageContainer>
          {formatType !== 'PDF' && formatType !== 'DOCX' ? (
            <img src={imageUrl} alt="Processed" />
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div 
                style={{ 
                  width: '100px', 
                  height: '120px', 
                  border: '1px solid var(--mid-gray)', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}
              >
                <span style={{ fontSize: '2rem', color: 'var(--dark-gray)' }}>
                  {formatType}
                </span>
              </div>
              <p>
                {formatType} file ready for download
              </p>
            </div>
          )}
        </ImageContainer>
        
        {/* Display file info */}
        <div className="card border-light mb-4">
          <div className="card-body py-3">
            <h3 className="card-title h6 text-center mb-3">File Information</h3>
            <div className="row text-center g-3">
              <div className="col-md-4 col-sm-12">
                <strong>Size:</strong> {formatFileSize(imageData?.size)}
              </div>
              {imageData?.width && imageData?.height && (
                <div className="col-md-4 col-sm-12">
                  <strong>Dimensions:</strong> {imageData.width} × {imageData.height}
                </div>
              )}
              {imageData?.quality && (
                <div className="col-md-4 col-sm-12">
                  <strong>Quality:</strong> {imageData.quality}%
                </div>
              )}
            </div>
          </div>
        </div>
        
        {ocrText && (
          <OCRResultContainer>
            <OCRHeader>
              <FaFileAlt />
              Extracted Text (OCR Result)
            </OCRHeader>
            <OCRContent>
              {ocrText || 'No text was detected in the image.'}
            </OCRContent>
          </OCRResultContainer>
        )}
        
        <ButtonsContainer>
          <PrimaryButton className='btn' onClick={handleDownload}>
            <FaDownload />
            Download
          </PrimaryButton>
        </ButtonsContainer>
      </PreviewContent>
    </PreviewContainer>
  );
};

export default ImagePreview; 