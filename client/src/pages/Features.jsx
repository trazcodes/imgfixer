import React from 'react';
import { Link } from 'react-router-dom';
import { FaCrop, FaSync, FaMagic, FaFileAlt, FaCloudUploadAlt, FaDownload } from 'react-icons/fa';

const FeatureCard = ({ icon, title, description }) => (
  <div className="card h-100 border-0 shadow-sm">
    <div className="card-body p-4">
      <div className="text-primary mb-3">
        {icon}
      </div>
      <h3 className="h5 fw-bold mb-3">{title}</h3>
      <p className="text-secondary mb-0">{description}</p>
    </div>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: <FaCrop className="fs-1" />,
      title: "Smart Image Resizing",
      description: "Resize your images to exact dimensions or target file sizes while maintaining quality. Perfect for optimizing images for web, social media, or print."
    },
    {
      icon: <FaSync className="fs-1" />,
      title: "Format Conversion",
      description: "Convert images between popular formats including JPEG, PNG, WebP, PDF, and DOCX. Choose the best format for your needs."
    },
    {
      icon: <FaMagic className="fs-1" />,
      title: "OCR Text Extraction",
      description: "Extract text from images using advanced OCR technology. Perfect for digitizing documents, receipts, or any image containing text."
    },
    {
      icon: <FaCloudUploadAlt className="fs-1" />,
      title: "Easy Upload",
      description: "Drag and drop your images or use the file browser. Supports all major image formats up to 10MB."
    },
    {
      icon: <FaFileAlt className="fs-1" />,
      title: "Quality Control",
      description: "Fine-tune image quality with our intuitive slider. Preview changes in real-time before processing."
    },
    {
      icon: <FaDownload className="fs-1" />,
      title: "Instant Download",
      description: "Download your processed images immediately. All files are automatically cleaned up after 1 hour for security."
    }
  ];

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-3">Features</h1>
        <p className="lead text-secondary">
          Everything you need to optimize and process your images
        </p>
      </div>

      <div className="row g-4">
        {features.map((feature, index) => (
          <div key={index} className="col-md-6 col-lg-4">
            <FeatureCard {...feature} />
          </div>
        ))}
      </div>

      <div className="text-center mt-5">
        <h2 className="h3 fw-bold mb-4">Ready to Get Started?</h2>
        <p className="text-secondary mb-4">
          Upload your first image and experience the power of ImgFixer
        </p>
        <Link to="/" className="btn btn-primary btn-lg">
          Start Processing
        </Link>
      </div>
    </div>
  );
};

export default Features; 