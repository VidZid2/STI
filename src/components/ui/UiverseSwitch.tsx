import React from 'react';
import './UiverseSwitch.css';

interface UiverseSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
}

export const UiverseSwitch: React.FC<UiverseSwitchProps> = ({ checked, onChange, className = '' }) => {
    return (
        <label className={`uiverse-switch ${className}`} onClick={(e) => e.stopPropagation()}>
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={(e) => onChange(e.target.checked)} 
            />
            <span className="uiverse-slider">
                <span className="uiverse-glow"></span>
                <span className="uiverse-icon-on">✓</span>
                <span className="uiverse-icon-off">✕</span>
            </span>
        </label>
    );
};
