/**
 * RichTextEditorToolbar — The full toolbar for RichTextEditor.
 * Uses Tiptap API. Migrated: inline styles → Tailwind + CSS variables.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type Editor } from '@tiptap/react';
import ToolbarButton from './ToolbarButton';
import { editorIcons } from './editorIcons';

const headingOptions = [
    { value: 0, label: 'Paragraph', tag: 'Normal text' },
    { value: 1, label: 'Heading 1', tag: 'Large title' },
    { value: 2, label: 'Heading 2', tag: 'Section title' },
    { value: 3, label: 'Heading 3', tag: 'Subsection' },
] as const;

const Divider = () => <div className="w-px h-6 mx-1" style={{ background: 'var(--border-strong)' }} />;
const Group: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-0.5 rounded-lg p-[3px]" style={{ background: 'var(--bg-surface-alt)' }}>{children}</div>
);

const RichTextEditorToolbar: React.FC<{ editor: Editor | null }> = ({ editor }) => {
    const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);

    if (!editor) return null;

    const setHeading = (level: 0 | 1 | 2 | 3) => {
        if (level === 0) editor.chain().focus().setParagraph().run();
        else editor.chain().focus().toggleHeading({ level }).run();
    };

    const isHeadingActive = editor.isActive('heading');
    const currentHeadingLabel = isHeadingActive
        ? headingOptions.find(opt => opt.value !== 0 && editor.isActive('heading', { level: opt.value }))?.label || 'Heading'
        : 'Paragraph';

    return (
        <div className="flex items-center gap-1 px-2.5 py-1.5 flex-nowrap overflow-visible rounded-tl-xl rounded-tr-xl"
            style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-canvas)' }}>

            {/* Heading Dropdown */}
            <div className="relative">
                <motion.button type="button"
                    whileHover={{ background: 'var(--accent-bg)' }} whileTap={{ scale: 0.98 }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
                    className="flex items-center gap-1 px-2 py-[5px] rounded-[7px] text-[11px] font-medium cursor-pointer min-w-[88px]"
                    style={{
                        border: '1px solid var(--border-subtle)',
                        background: showHeadingDropdown ? 'var(--accent-bg)' : 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                    }}
                >
                    {editorIcons.heading}
                    <span>{currentHeadingLabel}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ml-auto">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </motion.button>
                <AnimatePresence>
                    {showHeadingDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            className="absolute top-full left-0 mt-1 rounded-[10px] p-1.5 z-[100] min-w-[200px]"
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                        >
                            {headingOptions.map((opt, idx) => (
                                <motion.button key={opt.value} type="button"
                                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03, duration: 0.15 }}
                                    whileHover={{ background: 'var(--accent-bg)' }}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { setHeading(opt.value); setShowHeadingDropdown(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md border-none text-[13px] cursor-pointer text-left"
                                    style={{
                                        background: 'transparent',
                                        color: 'var(--text-primary)',
                                        fontWeight: opt.value === 0 ? 400 : 600,
                                    }}
                                >
                                    <span className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0"
                                        style={{ background: 'var(--accent-bg)', color: 'var(--accent-primary)' }}>
                                        {opt.value === 0 ? 'P' : `H${opt.value}`}
                                    </span>
                                    <div className="flex flex-col gap-px flex-1">
                                        <span>{opt.label}</span>
                                        <span className="text-[10px] font-normal" style={{ color: 'var(--text-secondary)' }}>{opt.tag}</span>
                                    </div>
                                    {((opt.value === 0 && !isHeadingActive) || (opt.value !== 0 && editor.isActive('heading', { level: opt.value }))) && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" className="shrink-0">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Divider />
            <Group>
                <ToolbarButton title="Bold (Ctrl+B)" isActive={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>{editorIcons.bold}</ToolbarButton>
                <ToolbarButton title="Italic (Ctrl+I)" isActive={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>{editorIcons.italic}</ToolbarButton>
                <ToolbarButton title="Underline (Ctrl+U)" isActive={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>{editorIcons.underline}</ToolbarButton>
                <ToolbarButton title="Strikethrough" isActive={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>{editorIcons.strikethrough}</ToolbarButton>
            </Group>
            <Divider />
            <Group>
                <ToolbarButton title="Align Left (Ctrl+L)" isActive={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>{editorIcons.alignLeft}</ToolbarButton>
                <ToolbarButton title="Align Center (Ctrl+E)" isActive={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>{editorIcons.alignCenter}</ToolbarButton>
                <ToolbarButton title="Align Right (Ctrl+R)" isActive={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>{editorIcons.alignRight}</ToolbarButton>
            </Group>
            <Divider />
            <Group>
                <ToolbarButton title="Insert Link" isActive={editor.isActive('link')} onClick={() => {
                    if (editor.isActive('link')) { editor.chain().focus().unsetLink().run(); return; }
                    const url = prompt('Enter URL:');
                    if (url) editor.chain().focus().setLink({ href: url }).run();
                }}>{editorIcons.link}</ToolbarButton>
                <ToolbarButton title="Block Quote" isActive={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>{editorIcons.quote}</ToolbarButton>
                <ToolbarButton title="Code Block" isActive={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{editorIcons.code}</ToolbarButton>
            </Group>
            <Divider />
            <Group>
                <ToolbarButton title="Bullet List" isActive={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>{editorIcons.ul}</ToolbarButton>
                <ToolbarButton title="Numbered List" isActive={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>{editorIcons.ol}</ToolbarButton>
            </Group>

            <div className="flex-1 min-w-2" />

            <Group>
                <ToolbarButton title="Undo (Ctrl+Z)" isActive={false} onClick={() => editor.chain().focus().undo().run()}>{editorIcons.undo}</ToolbarButton>
                <ToolbarButton title="Redo (Ctrl+Y)" isActive={false} onClick={() => editor.chain().focus().redo().run()}>{editorIcons.redo}</ToolbarButton>
            </Group>
            <Divider />
            <ToolbarButton title="Clear Formatting" isActive={false} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} tooltipRight>
                {editorIcons.clear}
            </ToolbarButton>
        </div>
    );
};

export default RichTextEditorToolbar;
