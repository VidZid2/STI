import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

const FilePreviewModal: React.FC<{
    file: { name: string; url: string; type: string } | null;
    onClose: () => void;
}> = ({ file, onClose }) => {
    const [iframeError, setIframeError] = useState(false);
    const [useGoogleViewer, setUseGoogleViewer] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const autoFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (file) { setIframeError(false); setUseGoogleViewer(false); setIframeLoaded(false); }
        return () => { if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current); };
    }, [file?.url]);

    useEffect(() => {
        if (!file || useGoogleViewer || iframeError) return;
        const isPdfFile = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdfFile) return;
        autoFallbackTimerRef.current = setTimeout(() => { if (!iframeLoaded) setUseGoogleViewer(true); }, 5000);
        return () => { if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current); };
    }, [file?.url, useGoogleViewer, iframeError, iframeLoaded]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    if (!file) return null;

    const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.includes('image') || /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(file.name);
    const pdfSrc = useGoogleViewer
        ? `https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true`
        : file.url;

    const isDemoFile = file.url.includes('pdfobject.com') || file.url.includes('picsum.photos') || file.url.includes('dummy.pdf');
    const fileTypeColor = isPdf ? 'var(--color-danger)' : isImage ? 'var(--color-success)' : 'var(--accent-primary)';
    const fileTypeBg = isPdf ? 'var(--color-danger-bg)' : isImage ? 'var(--color-success-bg)' : 'var(--accent-bg)';

    const modalContent = (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-5 backdrop-blur-[8px]"
            style={{ background: 'rgba(10,15,30,0.75)' }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col overflow-hidden rounded-[20px]"
                style={{
                    width: '90vw', maxWidth: '1100px', height: '90vh',
                    background: 'var(--bg-surface)',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.08)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 shrink-0"
                    style={{ borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(135deg, var(--bg-canvas) 0%, var(--bg-surface-alt) 100%)' }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                            style={{ background: fileTypeBg }}>
                            {isPdf ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={fileTypeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                            ) : isImage ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={fileTypeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={fileTypeColor} strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <div className="text-sm font-semibold max-w-[500px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                                {file.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] mt-px" style={{ color: 'var(--text-secondary)' }}>
                                <span>{isPdf ? 'PDF Document' : isImage ? 'Image' : 'File'}</span>
                                {useGoogleViewer && <span style={{ color: 'var(--accent-primary)' }}>— via Google Docs Viewer</span>}
                                {isDemoFile ? (
                                    <span className="px-1.5 py-px rounded text-[10px] font-semibold"
                                        style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                                        ⚠️ DEMO FILE
                                    </span>
                                ) : (
                                    <span className="px-1.5 py-px rounded text-[10px] font-semibold"
                                        style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                                        ✓ Real file
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {isPdf && iframeError && !useGoogleViewer && (
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                onClick={() => { setUseGoogleViewer(true); setIframeError(false); }}
                                className="flex items-center gap-[5px] px-3 py-[7px] rounded-lg text-xs font-medium cursor-pointer"
                                style={{ border: '1px solid var(--border-subtle)', background: 'var(--accent-bg)', color: 'var(--accent-primary)' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                Try Google Viewer
                            </motion.button>
                        )}
                        <motion.a href={file.url} target="_blank" rel="noopener noreferrer"
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                            className="flex items-center gap-[5px] px-3 py-[7px] rounded-lg text-xs font-medium cursor-pointer no-underline"
                            style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Open / Download
                        </motion.a>
                        <motion.button whileHover={{ scale: 1.08, background: 'rgba(0,0,0,0.08)' }} whileTap={{ scale: 0.93 }}
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg border-none flex items-center justify-center cursor-pointer"
                            style={{ background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </motion.button>
                    </div>
                </div>

                {/* Preview Body */}
                <div className="flex-1 overflow-hidden relative" style={{ background: 'var(--bg-surface-alt)' }}>
                    {isPdf ? (
                        iframeError ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'var(--text-secondary)' }}>
                                <div className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-danger-bg)' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.5">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                </div>
                                <div className="text-center">
                                    <div className="text-[15px] font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Preview blocked by browser</div>
                                    <div className="text-[13px] max-w-[380px] leading-relaxed">The PDF server doesn't allow embedding. Try Google Viewer or open it directly.</div>
                                </div>
                                <div className="flex gap-2.5 flex-wrap justify-center">
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => { setUseGoogleViewer(true); setIframeError(false); }}
                                        className="px-[18px] py-[9px] rounded-[9px] border-none text-[13px] font-medium cursor-pointer text-white"
                                        style={{ background: 'var(--accent-primary)' }}>
                                        Open in Google Viewer
                                    </motion.button>
                                    <motion.a href={file.url} target="_blank" rel="noopener noreferrer"
                                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        className="inline-flex items-center gap-[5px] px-[18px] py-[9px] rounded-[9px] text-[13px] font-medium cursor-pointer no-underline"
                                        style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                        Open in New Tab
                                    </motion.a>
                                </div>
                            </div>
                        ) : (
                            <iframe key={pdfSrc} src={pdfSrc} className="w-full h-full border-none" title={`Preview: ${file.name}`}
                                onError={() => { setIframeError(true); if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current); }}
                                onLoad={(e) => {
                                    try {
                                        const doc = (e.target as HTMLIFrameElement).contentDocument;
                                        if (doc && doc.body && doc.body.innerHTML.trim() === '') { setIframeError(true); }
                                        else { setIframeLoaded(true); if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current); }
                                    } catch {
                                        setIframeLoaded(true);
                                        if (autoFallbackTimerRef.current) clearTimeout(autoFallbackTimerRef.current);
                                    }
                                }} />
                        )
                    ) : isImage ? (
                        <div className="w-full h-full flex items-center justify-center p-6">
                            <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain rounded-[10px]"
                                style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4" style={{ color: 'var(--text-secondary)' }}>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-bg)' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <div className="text-center">
                                <div className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Preview not available</div>
                                <div className="text-[13px]">This file type cannot be previewed in the browser</div>
                            </div>
                            <motion.a href={file.url} target="_blank" rel="noopener noreferrer"
                                whileHover={{ scale: 1.03, boxShadow: '0 4px 16px rgba(59,130,246,0.25)' }} whileTap={{ scale: 0.97 }}
                                className="px-[22px] py-2.5 rounded-[10px] border-none text-[13px] font-medium cursor-pointer no-underline text-white"
                                style={{ background: 'var(--accent-primary)' }}>
                                Download File
                            </motion.a>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );

    return createPortal(modalContent, document.body);
};

export default FilePreviewModal;
