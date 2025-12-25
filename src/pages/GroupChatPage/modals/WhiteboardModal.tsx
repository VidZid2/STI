/**
 * Whiteboard Modal Component
 * Allows users to draw and share whiteboard sketches in the chat
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import type { ModalColors } from './types';

interface WhiteboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (dataUrl: string) => void;
    colors: ModalColors;
}

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({ isOpen, onClose, onSend, colors }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState('#3b82f6');
    const [brushSize, setBrushSize] = useState(3);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    useEffect(() => {
        if (isOpen) clearCanvas();
    }, [isOpen]);

    if (!isOpen) return null;

    const brushColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#1e293b'];

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(4px)', zIndex: 1001,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: colors.cardBg, borderRadius: '16px', padding: '20px',
                    width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }}
            >
                <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 600, color: colors.textPrimary }}>
                    🎨 Whiteboard
                </h3>
                <div style={{ 
                    border: `1px solid ${colors.border}`, 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    marginBottom: '12px',
                }}>
                    <canvas
                        ref={canvasRef}
                        width={460}
                        height={260}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        style={{ display: 'block', cursor: 'crosshair', background: '#fff' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    {brushColors.map((c) => (
                        <motion.button
                            key={c}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setBrushColor(c)}
                            style={{
                                width: 24, height: 24, borderRadius: '50%',
                                background: c, border: brushColor === c ? '2px solid #1e293b' : '2px solid transparent',
                                cursor: 'pointer',
                            }}
                        />
                    ))}
                    <div style={{ flex: 1 }} />
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        style={{ width: 80 }}
                    />
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={clearCanvas}
                        style={{
                            padding: '6px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`,
                            background: 'transparent', cursor: 'pointer', fontSize: '12px', color: colors.textSecondary,
                        }}
                    >
                        Clear
                    </motion.button>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        style={{
                            padding: '10px 16px', borderRadius: '10px', border: `1px solid ${colors.border}`,
                            background: 'transparent', cursor: 'pointer', fontSize: '13px',
                            fontWeight: 500, color: colors.textSecondary,
                        }}
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            const canvas = canvasRef.current;
                            if (canvas) {
                                const dataUrl = canvas.toDataURL('image/png');
                                onSend(dataUrl);
                                onClose();
                            }
                        }}
                        style={{
                            padding: '10px 16px', borderRadius: '10px', border: 'none',
                            background: colors.accent, cursor: 'pointer',
                            fontSize: '13px', fontWeight: 500, color: '#fff',
                        }}
                    >
                        Share Drawing
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};
