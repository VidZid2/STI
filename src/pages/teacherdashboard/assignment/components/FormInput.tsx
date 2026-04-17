import React, { useState } from 'react';

const FormInput: React.FC<{
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    required?: boolean;
    icon?: React.ReactNode;
    helpText?: string;
}> = ({ label, value, onChange, type = 'text', placeholder, required, icon, helpText }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="mb-4">
            <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {icon && <span style={{ color: 'var(--accent-primary)' }}>{icon}</span>}
                {label}
                {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full text-[13px] rounded-[10px] outline-none transition-all h-10 box-border"
                style={{
                    padding: '10px 12px',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: `1px solid ${isFocused ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    boxShadow: isFocused ? '0 0 0 3px var(--ring-focus)' : 'none',
                }}
            />
            {helpText && <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>{helpText}</p>}
        </div>
    );
};

export default FormInput;
