import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner({ text = 'Cargando...' }) {
  return (
    <div className="loading-spinner" role="status" aria-label={text}>
      <div className="spinner" />
      <p className="loading-text">{text}</p>
    </div>
  );
}

export default LoadingSpinner;
