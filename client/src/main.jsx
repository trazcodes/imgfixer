import React from 'react';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import './index.css';
import App from './App';

// Create root once and store it
const root = createRoot(document.getElementById('root'));

// Render app with StrictMode for better development experience
root.render(
  <React.StrictMode>
    <App />
    <ToastContainer 
      position="bottom-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover
      theme="light"
    />
  </React.StrictMode>
); 