import React from 'react';
import { FaImage } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container-lg py-3">
        <div className="d-flex justify-content-between align-items-center">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <FaImage className="text-primary fs-4" />
            <span className="fw-bold fs-4 text-primary">ImgFixer</span>
          </Link>
          
          <nav>
            <ul className="nav">
              <li className="nav-item">
                <Link className="nav-link text-dark fw-medium" to="/features">Features</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-dark fw-medium" to="/how-it-works">How It Works</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 