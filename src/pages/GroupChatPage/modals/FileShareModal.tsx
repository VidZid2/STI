/**
 * File Share Modal Component
 * Allows users to share files in the chat
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import type { ModalColors } from './types';

interface FileShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (fileName: string, fileType: string, fileSize: string) => void;
    colors: ModalColors;
}

export const FileShareModal: React.FC<FileShareModalProps> = ({ isOpen, onClose, onSend, colors }) => {
    const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; size: string } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (file: File) => {
        const size = file.size < 1024 * 1024 
            ? `${(file.size / 1024).toFixed(1)} KB` 
            : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        setSelectedFile({ name: file.name, type: file.type || 'file', size });
    };

    if (!isOpen) return null;

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
                    background: colors.cardBg, borderRadius: '16px', padding: '24px',
                    width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }}
            >
                <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600, color: colors.textPrimary }}>
                    📁 Share File
                </h3>
                <motion.div
                    animate={{ borderColor: isDragging ? colors.accent : colors.border }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                    }}
                    style={{
                        border: `2px dashed ${colors.border}`,
                        borderRadius: '12px',
                        padding: '32px 20px',
                        textAlign: 'center',
                        marginBottom: '16px',
                        background: isDragging ? `${colors.accent}08` : 'transparent',
                        transition: 'background 0.2s',
                        position: 'relative',
                    }}
                >
                    {selectedFile ? (
                        <div>
                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>
                                {selectedFile.type.includes('pdf') ? '📄' : 
                                 selectedFile.type.includes('image') ? '🖼️' : 
                                 selectedFile.type.includes('video') ? '🎬' : '📎'}
                            </div>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: colors.textPrimary }}>
                                {selectedFile.name}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: colors.textSecondary }}>
                                {selectedFile.size}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📤</div>
                            <p style={{ margin: 0, fontSize: '14px', color: colors.textSecondary }}>
                                Drag & drop or click to upload
                            </p>
                        </>
                    )}
                    <input
                        type="file"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    />
                </motion.div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedFile(null); onClose(); }}
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
                            if (selectedFile) {
                                onSend(selectedFile.name, selectedFile.type, selectedFile.size);
                                setSelectedFile(null);
                                onClose();
                            }
                        }}
                        disabled={!selectedFile}
                        style={{
                            padding: '10px 16px', borderRadius: '10px', border: 'none',
                            background: selectedFile ? colors.accent : 'rgba(0,0,0,0.1)',
                            cursor: selectedFile ? 'pointer' : 'not-allowed',
                            fontSize: '13px', fontWeight: 500, color: '#fff',
                        }}
                    >
                        Share File
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};
