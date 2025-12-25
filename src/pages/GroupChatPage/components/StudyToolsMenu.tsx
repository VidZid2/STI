/**
 * StudyToolsMenu Component
 * Minimalistic floating menu for study and collaboration tools
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Tooltip } from './Tooltip';
import { ToolIcon } from './ToolIcon';
import { TOOL_COLOR_CONFIG } from '../constants';

export interface StudyToolsMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTool: (tool: string) => void;
    colors: {
        cardBg: string;
        textPrimary: string;
        textSecondary: string;
        accent: string;
        border: string;
    };
}

export const StudyToolsMenu: React.FC<StudyToolsMenuProps> = ({
    isOpen,
    onClose,
    onSelectTool,
    colors,
}) => {
    const [activeTab, setActiveTab] = useState<'study' | 'collab'>('study');
    const [hoveredTool, setHoveredTool] = useState<string | null>(null);

    const studyTools = [
        { id: 'flashcard', label: 'Flashcard' },
        { id: 'poll', label: 'Poll' },
        { id: 'schedule', label: 'Schedule' },
        { id: 'pin', label: 'Pin' },
    ];

    const collabTools = [
        { id: 'whiteboard', label: 'Whiteboard' },
        { id: 'voicenote', label: 'Voice' },
        { id: 'file', label: 'File' },
        { id: 'material', label: 'Link' },
    ];

    const tools = activeTab === 'study' ? studyTools : collabTools;

    if (!isOpen) return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'transparent',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '20px',
            }}
        >
            <motion.div
                initial={{ x: 80, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 80, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '18px',
                    padding: '12px 8px',
                    boxShadow:
                        '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    outline: '1px solid rgba(255, 255, 255, 0.5)',
                    outlineOffset: '-1px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                }}
            >
                {/* Tab Switcher - Vertical compact pill */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        background: 'rgba(0, 0, 0, 0.04)',
                        borderRadius: '10px',
                        padding: '3px',
                        marginBottom: '4px',
                    }}
                >
                    <motion.div
                        layoutId="dock-tab-indicator"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        style={{
                            position: 'absolute',
                            left: '3px',
                            right: '3px',
                            top: activeTab === 'study' ? '3px' : 'calc(50% + 1px)',
                            height: 'calc(50% - 4px)',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                        }}
                    />
                    {[
                        {
                            id: 'study' as const,
                            label: 'Study Tools',
                            icon: (
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                            ),
                        },
                        {
                            id: 'collab' as const,
                            label: 'Collaborate',
                            icon: (
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            ),
                        },
                    ].map((tab) => (
                        <Tooltip key={tab.id} text={tab.label} placement="left">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    zIndex: 1,
                                    color:
                                        activeTab === tab.id
                                            ? colors.accent
                                            : 'rgba(0, 0, 0, 0.4)',
                                    transition: 'color 0.2s ease',
                                }}
                            >
                                {tab.icon}
                            </motion.button>
                        </Tooltip>
                    ))}
                </div>

                {/* Divider */}
                <div
                    style={{
                        width: '28px',
                        height: '1px',
                        background: 'rgba(0, 0, 0, 0.08)',
                        marginBottom: '2px',
                    }}
                />

                {/* Tools Column */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: activeTab === 'study' ? -8 : 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: activeTab === 'study' ? 8 : -8 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                        }}
                    >
                        {tools.map((tool, index) => {
                            const config = TOOL_COLOR_CONFIG[tool.id];
                            const isHovered = hoveredTool === tool.id;

                            return (
                                <Tooltip key={tool.id} text={tool.label} placement="left">
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        onMouseEnter={() => setHoveredTool(tool.id)}
                                        onMouseLeave={() => setHoveredTool(null)}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            onSelectTool(tool.id);
                                            onClose();
                                        }}
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: isHovered ? config.bg : 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '2px',
                                            transition: 'background 0.2s ease',
                                            position: 'relative',
                                        }}
                                    >
                                        <motion.div
                                            animate={{
                                                scale: isHovered ? 1.15 : 1,
                                                x: isHovered ? -2 : 0,
                                            }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 20,
                                            }}
                                        >
                                            <ToolIcon
                                                type={tool.id}
                                                color={
                                                    isHovered ? config.color : 'rgba(0, 0, 0, 0.5)'
                                                }
                                                size={20}
                                            />
                                        </motion.div>
                                    </motion.button>
                                </Tooltip>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>

                {/* Divider */}
                <div
                    style={{
                        width: '28px',
                        height: '1px',
                        background: 'rgba(0, 0, 0, 0.08)',
                        marginTop: '2px',
                    }}
                />

                {/* Close button */}
                <Tooltip text="Close" placement="left">
                    <motion.button
                        whileHover={{ scale: 1.05, background: 'rgba(239, 68, 68, 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(0, 0, 0, 0.4)',
                            marginTop: '4px',
                            transition: 'color 0.2s ease',
                        }}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>
                </Tooltip>
            </motion.div>
        </motion.div>,
        document.body
    );
};
