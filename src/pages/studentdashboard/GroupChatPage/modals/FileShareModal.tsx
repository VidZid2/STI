/**
 * File Share Modal Component - OPTIMIZED
 * Allows users to share files in the chat
 * Performance optimized while keeping all animations
 */

import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import type { ModalColors, FileShareData } from './types';

interface FileShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (fileName: string, fileType: string, fileSize: string, preview?: string, files?: FileShareData[]) => void;
    
}

// Memoized SVG Icons - prevents re-creation on every render
const UploadIcon = memo(({ size = 24, color = '#6366F1' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
));

const CloseIcon = memo(({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
));

const FileIcon = memo(({ size = 16, color = '#6366F1' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
));

const FolderIcon = memo(() => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="rgba(251, 191, 36, 0.15)" stroke="#F59E0B" />
    </svg>
));

const ImageIcon = memo(({ size = 16, color = '#10B981' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
));

interface FileData {
    name: string;
    type: string;
    size: number;
    lastModified: number;
    preview?: string;
    file?: File;
}

const MAX_FILES = 5;
const MAX_VISIBLE_FILES = 1;

// Optimized spring config - smoother with less computation
const smoothSpring = { type: 'spring' as const, damping: 28, stiffness: 280, mass: 0.8 };
const quickSpring = { type: 'spring' as const, damping: 30, stiffness: 400 };

// Static styles moved outside component
const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)', // Reduced blur for better performance
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 1001,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    willChange: 'opacity' };

const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isImageFile = (type: string, fileName?: string) => {
    if (type && type.startsWith('image/')) return true;
    if (fileName) {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
            return true;
        }
    }
    return false;
};


// Memoized File Card Component
const FileCard = memo(({ 
    file, 
    idx, 
    onRemove 
}: { 
    file: FileData; 
    idx: number; 
    onRemove: (idx: number, e: React.MouseEvent) => void;
}) => {
    const isImage = isImageFile(file.type, file.name);
    
    return (
        <motion.div
            key={"file" + idx}
            layout="position"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={smoothSpring}
            style={{
                position: 'relative',
                overflow: 'hidden',
                zIndex: 40,
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
                width: '100%',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                willChange: 'transform, opacity' }}
        >
            {/* Image Preview */}
            {file.preview && isImage && (
                <div style={{
                    width: '100%',
                    height: '120px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '12px',
                    background: '#f3f4f6' }}>
                    <img
                        src={file.preview}
                        alt={file.name}
                        loading="lazy"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover' }}
                    />
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    {isImage ? <ImageIcon size={20} color="#10B981" /> : <FileIcon size={20} color="#6366F1" />}
                    <p style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                        margin: 0 }}>
                        {file.name}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        color: '#059669',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0' }}>
                        {formatFileSize(file.size)}
                    </span>
                    <motion.button
                        whileHover={{ background: '#f3f4f6' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => onRemove(idx, e)}
                        style={{
                            padding: '4px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9ca3af' }}
                    >
                        <CloseIcon size={16} />
                    </motion.button>
                </div>
            </div>

            <div style={{
                display: 'flex',
                fontSize: '12px',
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                marginTop: '8px',
                justifyContent: 'space-between',
                color: '#6b7280' }}>
                <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#f3f4f6' }}>
                    {file.type || 'Unknown type'}
                </span>
                <span>
                    modified {new Date(file.lastModified).toLocaleDateString()}
                </span>
            </div>
        </motion.div>
    );
});


// Memoized Additional Files Summary
const AdditionalFilesSummary = memo(({ 
    files, 
    additionalCount 
}: { 
    files: FileData[]; 
    additionalCount: number;
}) => (
    <motion.div
        key="collapsed-summary"
        layout="position"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={smoothSpring}
        style={{
            position: 'relative',
            zIndex: 40,
            background: 'linear-gradient(to right, #eff6ff, #eef2ff)',
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            width: '100%',
            borderRadius: '12px',
            border: '1px solid #bfdbfe',
            willChange: 'transform, opacity' }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex' }}>
                {files.slice(MAX_VISIBLE_FILES, MAX_VISIBLE_FILES + 3).map((f, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05, type: 'spring' as const, damping: 30, stiffness: 400 }}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'white',
                            border: '1px solid #bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            marginLeft: i > 0 ? '-8px' : 0,
                            overflow: 'hidden' }}
                    >
                        {f.preview && isImageFile(f.type, f.name) ? (
                            <img src={f.preview} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <FileIcon size={16} color="#6366F1" />
                        )}
                    </motion.div>
                ))}
            </div>
            <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#1d4ed8', margin: 0 }}>
                    +{additionalCount} {additionalCount === 1 ? 'file' : 'files'}
                </p>
                <p style={{ fontSize: '12px', color: '#3b82f6', margin: 0 }}>
                    {formatFileSize(files.slice(MAX_VISIBLE_FILES).reduce((acc, f) => acc + f.size, 0))} total
                </p>
            </div>
        </div>
    </motion.div>
));


// Main Component
export const FileShareModal: React.FC<FileShareModalProps> = ({ isOpen, onClose, onSend }) => {
    const { modalRef, modalProps } = useModalAccessibility(isOpen, onClose, 'fileshare-modal-title');
    const [files, setFiles] = useState<FileData[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Memoized modal styles
    const modalStyle = useMemo<React.CSSProperties>(() => ({
        background: 'var(--dashboard-surface)',
        borderRadius: '20px',
        padding: '28px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        border: `1px solid var(--border-color)`,
        position: 'relative',
        willChange: 'transform, opacity' }), ['var(--dashboard-surface)', 'var(--border-color)']);

    // Memoized handlers
    const handleFileSelect = useCallback((newFiles: File[]) => {
        const remainingSlots = MAX_FILES - files.length;
        const filesToAdd = newFiles.slice(0, remainingSlots);
        
        const fileDataPromises = filesToAdd.map(file => {
            return new Promise<FileData>((resolve) => {
                let fileType = file.type || 'Unknown type';
                if (!fileType || fileType === 'Unknown type') {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
                        fileType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
                    }
                }

                const fileData: FileData = {
                    name: file.name,
                    type: fileType,
                    size: file.size,
                    lastModified: file.lastModified,
                    file: file };

                if (isImageFile(fileType, file.name)) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        fileData.preview = e.target?.result as string;
                        resolve(fileData);
                    };
                    reader.onerror = () => resolve(fileData);
                    reader.readAsDataURL(file);
                } else {
                    resolve(fileData);
                }
            });
        });

        Promise.all(fileDataPromises).then(newFileData => {
            setFiles(prev => [...prev, ...newFileData].slice(0, MAX_FILES));
        });
    }, [files.length]);

    const handleRemoveFile = useCallback((idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setFiles(prev => prev.filter((_, i) => i !== idx));
    }, []);

    const handleClick = useCallback(() => {
        if (files.length === 0) {
            fileInputRef.current?.click();
        }
    }, [files.length]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        if (droppedFiles.length > 0) {
            handleFileSelect(droppedFiles);
        }
    }, [handleFileSelect]);

    const handleShare = useCallback(() => {
        if (files.length > 0) {
            const file = files[0];
            const fileShareData: FileShareData[] = files.map(f => ({
                name: f.name,
                type: f.type,
                size: f.size,
                lastModified: f.lastModified,
                preview: f.preview,
                file: f.file }));
            onSend(file.name, file.type, formatFileSize(file.size), file.preview, fileShareData);
            setFiles([]);
        }
    }, [files, onSend]);

    const handleClose = useCallback(() => {
        setFiles([]);
        onClose();
    }, [onClose]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 0) {
            handleFileSelect(selectedFiles);
        }
        e.target.value = '';
    }, [handleFileSelect]);

    const handleAddMore = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => setFiles([]);
    }, []);

    if (!isOpen) return null;

    const additionalFilesCount = files.length - MAX_VISIBLE_FILES;


    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={overlayStyle}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={smoothSpring}
                ref={modalRef}
                {...modalProps}
                onClick={(e) => e.stopPropagation()}
                style={modalStyle}
            >
                {/* Close Button */}
                <motion.button
                    whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        zIndex: 10 }}
                >
                    <CloseIcon />
                </motion.button>

                <LayoutGroup>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center' }}>
                            <FolderIcon />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                                Share File
                            </h3>
                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                Upload and share with your group (max {MAX_FILES} files)
                            </p>
                        </div>
                    </div>

                    {/* Drop Zone */}
                    <motion.div
                        layout="position"
                        transition={smoothSpring}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                        onClick={handleClick}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        whileHover={files.length === 0 ? "animate" : undefined}
                        style={{
                            padding: '32px',
                            borderRadius: '16px',
                            border: `2px dashed ${files.length === 0 ? (isDragging ? '#6366F1' : '#e5e7eb') : '#e5e7eb'}`,
                            background: 'rgba(249, 250, 251, 0.5)',
                            cursor: files.length === 0 ? 'pointer' : 'default',
                            transition: 'border-color 0.2s, background 0.2s',
                            position: 'relative',
                            marginBottom: '20px',
                            overflow: 'hidden' }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="*/*"
                            onChange={handleInputChange}
                            style={{ display: 'none' }}
                        />

                        <AnimatePresence mode="wait">
                            {files.length === 0 ? (
                                <motion.div
                                    key="upload-area"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <p style={{ fontWeight: 600, color: '#374151', fontSize: '16px', margin: 0 }}>
                                        Upload file
                                    </p>
                                    <p style={{ fontWeight: 400, color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>
                                        Drag or drop your files here or click to upload
                                    </p>
                                    
                                    {/* Animated upload box */}
                                    <div style={{ position: 'relative', width: '100%', marginTop: '24px', maxWidth: '320px', margin: '24px auto 0', height: '96px' }}>
                                        <motion.div
                                            layoutId="file-upload-box"
                                            variants={{
                                                initial: { x: 0, y: 0 },
                                                animate: { x: 20, y: -20, opacity: 0.9 } }}
                                            transition={quickSpring}
                                            style={{
                                                position: 'relative',
                                                zIndex: 40,
                                                background: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                height: '96px',
                                                width: '96px',
                                                margin: '0 auto',
                                                borderRadius: '12px',
                                                border: '1px solid #e5e7eb',
                                                boxShadow: isHovering ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                transition: 'box-shadow 0.2s',
                                                willChange: 'transform' }}
                                        >
                                            {isDragging ? (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#6366F1', fontSize: '14px' }}
                                                >
                                                    <span>Drop it</span>
                                                    <UploadIcon size={20} color="#6366F1" />
                                                </motion.div>
                                            ) : (
                                                <UploadIcon size={24} color="#9ca3af" />
                                            )}
                                        </motion.div>

                                        {/* Secondary dashed border box */}
                                        <motion.div
                                            variants={{
                                                initial: { opacity: 0 },
                                                animate: { opacity: 1 } }}
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                opacity: isHovering ? 1 : 0,
                                                border: '2px dashed #6366F1',
                                                zIndex: 30,
                                                background: 'transparent',
                                                height: '96px',
                                                width: '96px',
                                                margin: '0 auto',
                                                left: 0,
                                                right: 0,
                                                borderRadius: '12px',
                                                transition: 'opacity 0.2s' }}
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="file-list"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                                >
                                    <AnimatePresence mode="popLayout">
                                        {files.slice(0, MAX_VISIBLE_FILES).map((file, idx) => (
                                            <FileCard key={"file" + idx} file={file} idx={idx} onRemove={handleRemoveFile} />
                                        ))}

                                        {additionalFilesCount > 0 && (
                                            <AdditionalFilesSummary files={files} additionalCount={additionalFilesCount} />
                                        )}
                                    </AnimatePresence>

                                    {/* Add more files button */}
                                    {files.length < MAX_FILES && (
                                        <motion.button
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 }}
                                            onClick={handleAddMore}
                                            style={{
                                                flex: 1,
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                border: '2px dashed #d1d5db',
                                                background: 'transparent',
                                                color: '#6b7280',
                                                fontWeight: 500,
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                transition: 'border-color 0.2s, color 0.2s',
                                                marginTop: '8px' }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = '#6366F1';
                                                e.currentTarget.style.color = '#6366F1';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = '#d1d5db';
                                                e.currentTarget.style.color = '#6b7280';
                                            }}
                                        >
                                            + Add more files ({MAX_FILES - files.length} remaining)
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Share Button */}
                    <motion.div layout="position" style={{ display: 'flex', justifyContent: 'center' }}>
                        <motion.button
                            layout="position"
                            whileHover={{ 
                                scale: files.length > 0 ? 1.02 : 1,
                                boxShadow: files.length > 0 ? '0 6px 20px rgba(245, 158, 11, 0.35)' : 'none' }}
                            whileTap={{ scale: files.length > 0 ? 0.98 : 1 }}
                            onClick={handleShare}
                            disabled={files.length === 0}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 32px',
                                background: files.length > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(0,0,0,0.04)',
                                color: files.length > 0 ? '#F59E0B' : 'rgba(0,0,0,0.3)',
                                border: files.length > 0 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(0,0,0,0.08)',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: files.length > 0 ? 'pointer' : 'not-allowed',
                                transition: 'background 0.2s, border-color 0.2s' }}
                        >
                            Share {files.length > 1 ? `${files.length} Files` : 'File'}
                        </motion.button>
                    </motion.div>
                </LayoutGroup>
            </motion.div>
        </motion.div>,
        document.body
    );
};
