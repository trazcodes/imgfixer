import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-top py-4 mt-auto">
      <div className="container-lg text-center">
        <p className="mb-2">ImgFixer - Your all-in-one image processing solution</p>
        <p className="text-secondary small mb-0">
          &copy; {year} ImgFixer. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer; 