/**
 * RichTextEditor — Tiptap-powered rich text editor.
 * Replaces deprecated document.execCommand API.
 * Keeps exact UI styling.
 */
import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import RichTextEditorToolbar from './editor/RichTextEditorToolbar';

const RichTextEditor: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    icon?: React.ReactNode;
    onAISuggest?: () => void;
    aiSuggestLoading?: boolean;
}> = ({ label, value, onChange, placeholder, required, icon, onAISuggest, aiSuggestLoading }) => {
    
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder: placeholder || 'Start typing...' }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    const lastExternalValueRef = useRef(value);
    useEffect(() => {
        if (editor && value !== lastExternalValueRef.current) {
            const currentHTML = editor.getHTML();
            if (value !== currentHTML) {
                editor.commands.setContent(value);
            }
            lastExternalValueRef.current = value;
        }
    }, [value, editor]);

    const isFocused = editor?.isFocused || false;

    return (
        <div style={{ marginBottom: '16px' }} className="tiptap-editor-wrapper">
            <style>{`
                .tiptap-editor-wrapper .ProseMirror {
                    min-height: 180px;
                    padding: 16px 18px;
                    font-size: 14px;
                    color: var(--text-primary);
                    outline: none;
                    line-height: 1.7;
                    background: var(--bg-surface);
                    direction: ltr;
                    text-align: left;
                    unicode-bidi: plaintext;
                }
                .tiptap-editor-wrapper .ProseMirror p.is-editor-empty:first-child::before {
                    color: var(--text-muted);
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .tiptap-editor-wrapper .ProseMirror p { margin: 0 0 1em 0; }
                .tiptap-editor-wrapper .ProseMirror h1 { font-size: 1.8em; margin-bottom: 0.5em; }
                .tiptap-editor-wrapper .ProseMirror h2 { font-size: 1.5em; margin-bottom: 0.5em; }
                .tiptap-editor-wrapper .ProseMirror h3 { font-size: 1.25em; margin-bottom: 0.5em; }
                .tiptap-editor-wrapper .ProseMirror ul, .tiptap-editor-wrapper .ProseMirror ol { padding-left: 1.5em; margin-bottom: 1em; }
                .tiptap-editor-wrapper .ProseMirror pre { background: var(--bg-surface-alt); padding: 1em; border-radius: 8px; font-family: monospace; }
                .tiptap-editor-wrapper .ProseMirror blockquote { border-left: 3px solid var(--border-strong); padding-left: 1em; margin-left: 0; color: var(--text-secondary); }
                .tiptap-editor-wrapper .ProseMirror a { color: var(--accent-primary); text-decoration: underline; cursor: pointer; }
            `}</style>
            
            <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
            }}>
                {icon && <span style={{ color: 'var(--accent-primary)' }}>{icon}</span>}
                {label}
                {required && <span style={{ color: 'var(--color-danger)', marginLeft: '2px' }}>*</span>}
            </label>
            <motion.div
                initial={false}
                animate={{
                    borderColor: isFocused ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    boxShadow: isFocused ? 'var(--ring-focus)' : 'none',
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                    borderRadius: '12px',
                    border: '1px solid',
                    background: 'var(--bg-surface)',
                    overflow: 'visible',
                }}
            >
                {/* Toolbar */}
                <RichTextEditorToolbar editor={editor} />

                {/* Editor Area */}
                <EditorContent editor={editor} />

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'var(--bg-canvas)',
                    borderBottomLeftRadius: '11px',
                    borderBottomRightRadius: '11px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {[['B', 'Bold'], ['I', 'Italic'], ['U', 'Underline']].map(([key, label]) => (
                            <span key={key} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'var(--bg-surface-alt)', fontSize: '9px', fontFamily: 'inherit' }}>Ctrl</kbd>
                                <span style={{ margin: '0 3px' }}>+</span>
                                <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'var(--bg-surface-alt)', fontSize: '9px', fontFamily: 'inherit' }}>{key}</kbd>
                                <span style={{ marginLeft: '4px' }}>{label}</span>
                            </span>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {onAISuggest && (
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={onAISuggest}
                                disabled={aiSuggestLoading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    padding: '4px 10px',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '7px',
                                    background: 'var(--accent-bg)',
                                    color: 'var(--accent-primary)',
                                    fontSize: '10.5px', fontWeight: 600,
                                    cursor: aiSuggestLoading ? 'wait' : 'pointer',
                                    opacity: aiSuggestLoading ? 0.7 : 1,
                                    transition: 'all 0.2s ease',
                                    letterSpacing: '0.01em',
                                }}
                            >
                                {aiSuggestLoading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            style={{ width: '11px', height: '11px', display: 'flex' }}
                                        >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5">
                                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                            </svg>
                                        </motion.div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                        </svg>
                                        ✨ AI Suggest
                                    </>
                                )}
                            </motion.button>
                        )}
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Rich text editor for teachers
                        </span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RichTextEditor;
