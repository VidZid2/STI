import React from 'react';
import './uiverse-button.css';

interface UiverseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
}

export const UiverseButton: React.FC<UiverseButtonProps> = ({ text, className = '', ...props }) => {
  const chars = text.split('');

  return (
    <button className={`uiverse-btn ${className}`} {...props}>
      <span className="span-mother">
        {chars.map((char, index) => (
          <span
            key={index}
            style={{ transition: `${0.2 + index * 0.05}s` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
      <span className="span-mother2">
        {chars.map((char, index) => (
          <span
            key={index}
            style={{ transition: `${0.2 + index * 0.05}s` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    </button>
  );
};
