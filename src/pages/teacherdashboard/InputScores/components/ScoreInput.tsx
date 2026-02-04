/**
 * Score Input Component with validation and ref forwarding
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface ScoreInputProps {
    value: number | null;
    maxScore: number;
    onChange: (value: number | null) => void;
    studentName: string;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const ScoreInput = React.forwardRef<HTMLInputElement, ScoreInputProps>(
    ({ value, maxScore, onChange, studentName, onKeyDown }, ref) => {
        const [localValue, setLocalValue] = useState(value?.toString() || '');
        const [error, setError] = useState<string | null>(null);
        const [isFocused, setIsFocused] = useState(false);

        useEffect(() => {
            setLocalValue(value?.toString() || '');
            setError(null);
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setLocalValue(val);
            
            if (val === '') {
                setError(null);
                onChange(null);
                return;
            }

            const numVal = parseFloat(val);
            if (isNaN(numVal)) {
                setError('Invalid');
            } else if (numVal < 0) {
                setError('Min: 0');
            } else if (numVal > maxScore) {
                setError(`Max: ${maxScore}`);
            } else {
                setError(null);
                onChange(numVal);
            }
        };

        return (
            <div style={{ position: 'relative' }}>
                <input
                    ref={ref}
                    type="number"
                    value={localValue}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={onKeyDown}
                    min={0}
                    max={maxScore}
                    step={0.5}
                    aria-label={`Score for ${studentName}`}
                    aria-invalid={!!error}
                    style={{
                        width: '70px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${error ? '#ef4444' : isFocused ? '#3b82f6' : 'rgba(0,0,0,0.08)'}`,
                        fontSize: '14px',
                        fontWeight: 500,
                        textAlign: 'center',
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                        background: error ? 'rgba(239, 68, 68, 0.05)' : '#ffffff',
                    }}
                />
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '10px',
                            color: '#ef4444',
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {error}
                    </motion.div>
                )}
            </div>
        );
    }
);

ScoreInput.displayName = 'ScoreInput';

export default ScoreInput;
