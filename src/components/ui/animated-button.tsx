import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps {
  text: string;
  onClick?: () => void;
  href?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function AnimatedButton({ text, onClick, href, className, icon }: AnimatedButtonProps) {
  const characters = text.split('');

  const renderContent = () => (
    <>
      <span className="span-mother">
        {icon && <span className="btn-icon" style={{ transition: '0.2s' }}>{icon}</span>}
        {characters.map((char, i) => (
          <span key={i} style={{ transition: `${0.2 + (icon ? i + 1 : i) * 0.1}s` }}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
      <span className="span-mother2">
        {icon && <span className="btn-icon" style={{ transition: '0.2s' }}>{icon}</span>}
        {characters.map((char, i) => (
          <span key={i} style={{ transition: `${0.2 + (icon ? i + 1 : i) * 0.1}s` }}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cn("animated-cta-button", className)}>
        {renderContent()}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={cn("animated-cta-button", className)}>
      {renderContent()}
    </button>
  );
}
