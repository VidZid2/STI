/**
 * Whiteboard Modal Component
 * Minimalistic professional design matching GroupsContent/CatalogContent/GoalsContent
 * Blue accent color scheme with smooth hover effects
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { ModalColors } from './types';

interface WhiteboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (dataUrl: string) => void;
    colors: ModalColors;
}

// Tool types
type Tool = 'pen' | 'eraser';

export const WhiteboardModal: React.FC<WhiteboardModalProps> = ({ isOpen, onClose, onSend, colors }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushColor, setBrushColor] = useState('#3b82f6');
    const [brushSize, setBrushSize] = useState(3);
    const [tool, setTool] = useState<Tool>('pen');
    const [hasDrawn, setHasDrawn] = useState(false);

    // Blue accent colors
    const blueAccent = '#3b82f6';
    const isDarkMode = colors.cardBg === '#1e293b' || colors.cardBg.includes('30, 41, 59');
    const blueBg = isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)';
    const blueBorder = isDarkMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)';
    const subtleBg = isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
    const borderColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    const brushColors = [
        { color: '#3b82f6', name: 'Blue' },
        { color: '#ef4444', name: 'Red' },
        { color: '#22c55e', name: 'Green' },
        { color: '#f59e0b', name: 'Orange' },
        { color: '#8b5cf6', name: 'Purple' },
        { color: '#1e293b', name: 'Dark' },
    ];


    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        setIsDrawing(true);
        setHasDrawn(true);
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        ctx.beginPath();
        ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : brushColor;
        ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
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
        setHasDrawn(false);
    };

    useEffect(() => {
        if (isOpen) {
            clearCanvas();
            setTool('pen');
            setBrushColor('#3b82f6');
            setBrushSize(3);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            onSend(dataUrl);
            onClose();
        }
    };

    if (!isOpen) return null;


    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0,
                        background: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(8px)', zIndex: 1001,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: colors.cardBg, borderRadius: '20px',
                            width: '100%', maxWidth: '540px',
                            boxShadow: isDarkMode
                                ? '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
                                : '0 24px 48px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px 24px', borderBottom: `1px solid ${borderColor}`,
                            display: 'flex', alignItems: 'center', gap: '14px',
                        }}>
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
                                style={{
                                    width: 44, height: 44, borderRadius: '12px',
                                    background: blueBg, border: `1px solid ${blueBorder}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={blueAccent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                                    <path d="M2 2l7.586 7.586" />
                                    <circle cx="11" cy="11" r="2" />
                                </svg>
                            </motion.div>
                            <div style={{ flex: 1 }}>
                                <motion.h3 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                                    style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
                                    Whiteboard
                                </motion.h3>
                                <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                                    style={{ margin: '4px 0 0', fontSize: '12px', color: colors.textSecondary }}>
                                    Draw and share with your group
                                </motion.p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                style={{
                                    width: 32, height: 32, borderRadius: '10px', border: 'none',
                                    background: subtleBg, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary,
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </motion.button>
                        </div>


                        {/* Content */}
                        <div style={{ padding: '20px 24px' }}>
                            {/* Canvas */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                style={{
                                    border: `1px solid ${borderColor}`,
                                    borderRadius: '14px',
                                    overflow: 'hidden',
                                    marginBottom: '16px',
                                    background: '#fff',
                                    boxShadow: isDarkMode ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.03)',
                                }}
                            >
                                <canvas
                                    ref={canvasRef}
                                    width={492}
                                    height={280}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        cursor: tool === 'eraser' ? 'cell' : 'crosshair',
                                        background: '#fff',
                                    }}
                                />
                            </motion.div>

                            {/* Toolbar */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                style={{
                                    display: 'flex', flexDirection: 'column', gap: '10px',
                                    padding: '12px 14px', borderRadius: '12px',
                                    background: subtleBg, border: `1px solid ${borderColor}`,
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Row 1: Tools and Colors */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    {/* Tool Selector */}
                                    <div style={{
                                        display: 'flex', gap: '4px', padding: '4px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                        borderRadius: '10px', flexShrink: 0,
                                    }}>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setTool('pen')}
                                            style={{
                                                width: 32, height: 32, borderRadius: '8px', border: 'none',
                                                background: tool === 'pen' ? blueAccent : 'transparent',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: tool === 'pen' ? '#fff' : colors.textSecondary,
                                                transition: 'all 0.15s ease',
                                            }}
                                            title="Pen"
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                                                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                                            </svg>
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setTool('eraser')}
                                            style={{
                                                width: 32, height: 32, borderRadius: '8px', border: 'none',
                                                background: tool === 'eraser' ? blueAccent : 'transparent',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: tool === 'eraser' ? '#fff' : colors.textSecondary,
                                                transition: 'all 0.15s ease',
                                            }}
                                            title="Eraser"
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 20H7L3 16c-.6-.6-.6-1.5 0-2.1l10-10c.6-.6 1.5-.6 2.1 0l6 6c.6.6.6 1.5 0 2.1L13 20" />
                                                <path d="M6 11l8 8" />
                                            </svg>
                                        </motion.button>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ width: 1, height: 24, background: borderColor, flexShrink: 0 }} />

                                    {/* Color Palette */}
                                    <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                        {brushColors.map((c) => (
                                            <motion.button
                                                key={c.color}
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => { setBrushColor(c.color); setTool('pen'); }}
                                                title={c.name}
                                                style={{
                                                    width: 24, height: 24, borderRadius: '50%',
                                                    background: c.color,
                                                    border: brushColor === c.color && tool === 'pen'
                                                        ? `2px solid ${isDarkMode ? '#fff' : '#1e293b'}`
                                                        : '2px solid transparent',
                                                    cursor: 'pointer', flexShrink: 0,
                                                    boxShadow: brushColor === c.color && tool === 'pen'
                                                        ? `0 0 0 2px ${c.color}40`
                                                        : 'none',
                                                    transition: 'all 0.15s ease',
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {/* Clear Button - moved to row 1 */}
                                    <div style={{ flex: 1 }} />
                                    <motion.button
                                        whileHover={{ scale: 1.02, background: isDarkMode ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={clearCanvas}
                                        style={{
                                            padding: '6px 12px', borderRadius: '8px',
                                            border: `1px solid ${isDarkMode ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)'}`,
                                            background: isDarkMode ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
                                            cursor: 'pointer', fontSize: '11px', fontWeight: 500,
                                            color: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px',
                                            transition: 'all 0.15s ease', flexShrink: 0,
                                        }}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 6h18" />
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        </svg>
                                        Clear
                                    </motion.button>
                                </div>

                                {/* Row 2: Brush Size */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    paddingTop: '8px', borderTop: `1px solid ${borderColor}`,
                                }}>
                                    {/* Brush Size Label */}
                                    <span style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 500, flexShrink: 0 }}>
                                        Size
                                    </span>

                                    {/* Brush Size Preview */}
                                    <div style={{
                                        width: 26, height: 26, borderRadius: '8px',
                                        background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <div style={{
                                            width: Math.min(brushSize * 2 + 4, 18),
                                            height: Math.min(brushSize * 2 + 4, 18),
                                            borderRadius: '50%',
                                            background: tool === 'pen' ? brushColor : colors.textMuted,
                                            transition: 'all 0.15s ease',
                                        }} />
                                    </div>

                                    {/* Brush Size Slider */}
                                    <input
                                        type="range"
                                        min="1"
                                        max="12"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        style={{
                                            flex: 1,
                                            minWidth: 80,
                                            maxWidth: 140,
                                            accentColor: blueAccent,
                                            cursor: 'pointer',
                                        }}
                                    />

                                    {/* Size Value */}
                                    <span style={{
                                        fontSize: '11px', color: blueAccent, fontWeight: 600,
                                        minWidth: 20, textAlign: 'center',
                                    }}>
                                        {brushSize}
                                    </span>
                                </div>
                            </motion.div>
                        </div>


                        {/* Footer */}
                        <div style={{
                            padding: '16px 24px 20px', borderTop: `1px solid ${borderColor}`,
                            display: 'flex', gap: '10px', justifyContent: 'flex-end', background: subtleBg,
                        }}>
                            <motion.button
                                whileHover={{ scale: 1.02, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                style={{
                                    padding: '10px 18px', borderRadius: '10px',
                                    border: `1px solid ${borderColor}`, background: 'transparent',
                                    cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: colors.textSecondary,
                                }}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={hasDrawn ? { scale: 1.02, boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)' } : {}}
                                whileTap={hasDrawn ? { scale: 0.98 } : {}}
                                onClick={handleSubmit}
                                disabled={!hasDrawn}
                                style={{
                                    padding: '10px 20px', borderRadius: '10px', border: 'none',
                                    background: hasDrawn
                                        ? `linear-gradient(135deg, ${blueAccent} 0%, #2563eb 100%)`
                                        : isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                    cursor: hasDrawn ? 'pointer' : 'not-allowed',
                                    fontSize: '13px', fontWeight: 600,
                                    color: hasDrawn ? '#fff' : colors.textMuted,
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: hasDrawn ? '0 2px 8px rgba(59, 130, 246, 0.25)' : 'none',
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                                Share Drawing
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
