import React from 'react';
import { Link } from 'react-router-dom';
import { FaCloudUploadAlt, FaCrop, FaSync, FaMagic, FaDownload } from 'react-icons/fa';

const StepCard = ({ number, icon, title, description }) => (
  <div className="card border-0 shadow-sm h-100">
    <div className="card-body p-4">
      <div className="d-flex align-items-center mb-3">
        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
          style={{ width: '40px', height: '40px' }}>
          {number}
        </div>
        <div className="text-primary">
          {icon}
        </div>
      </div>
      <h3 className="h5 fw-bold mb-3">{title}</h3>
      <p className="text-secondary mb-0">{description}</p>
    </div>
  </div>
);

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: <FaCloudUploadAlt className="fs-4" />,
      title: "Upload Your Image",
      description: "Drag and drop your image or click to browse. We support JPG, PNG, WebP, and GIF files up to 10MB."
    },
    {
      number: 2,
      icon: <FaCrop className="fs-4" />,
      title: "Choose Your Operation",
      description: "Select from three powerful options: resize your image, convert its format, or extract text using OCR."
    },
    {
      number: 3,
      icon: <FaSync className="fs-4" />,
      title: "Customize Settings",
      description: "Fine-tune your image with our intuitive controls. Set target size, adjust quality, or choose output format."
    },
    {
      number: 4,
      icon: <FaMagic className="fs-4" />,
      title: "Process Your Image",
      description: "Our advanced algorithms process your image while maintaining quality. Real-time previews show you the results."
    },
    {
      number: 5,
      icon: <FaDownload className="fs-4" />,
      title: "Download Result",
      description: "Download your processed image instantly. All files are automatically cleaned up after 1 hour for security."
    }
  ];

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-3">How It Works</h1>
        <p className="lead text-secondary">
          Simple, fast, and powerful image processing in five easy steps
        </p>
      </div>

      <div className="row g-4">
        {steps.map((step, index) => (
          <div key={index} className="col-md-6 col-lg-4">
            <StepCard {...step} />
          </div>
        ))}
      </div>

      <div className="row mt-5">
        <div className="col-lg-8 mx-auto">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="h4 fw-bold mb-3">Technical Details</h2>
              <p className="text-secondary mb-0">
                ImgFixer uses advanced image processing libraries and algorithms to ensure the best results. 
                Our server processes images using Sharp for resizing and format conversion, Tesseract.js for OCR, 
                and MongoDB GridFS for secure file storage. All processing is done server-side for optimal performance 
                and security. Files are automatically cleaned up after 1 hour to maintain server efficiency.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-5">
        <h2 className="h3 fw-bold mb-4">Ready to Try It Out?</h2>
        <p className="text-secondary mb-4">
          Start processing your images now with our powerful tools
        </p>
        <Link to="/" className="btn btn-primary btn-lg">
          Start Processing
        </Link>
      </div>
    </div>
  );
};

export default HowItWorks; 