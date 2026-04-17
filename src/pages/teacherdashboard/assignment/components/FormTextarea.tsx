import React, { useState } from 'react';

const FormTextarea: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    required?: boolean;
    icon?: React.ReactNode;
}> = ({ label, value, onChange, placeholder, rows = 4, required, icon }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div style={{ marginBottom: '16px' }}>
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
                {icon && <span className="text-accent">{icon}</span>}
                {label}
                {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
            </label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full bg-surface text-text-primary text-[13px] rounded-[10px] outline-none resize-y transition-all duration-200"
                style={{
                    padding: '10px 12px',
                    border: `1px solid ${isFocused ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    boxShadow: isFocused ? '0 0 0 3px var(--ring-focus)' : 'none',
                    minHeight: '80px',
                    lineHeight: 1.5,
                }}
            />
        </div>
    );
};

export default FormTextarea;
