/**
 * MessageTypeIndicator Component
 * Displays AI-powered message classification badge (urgent, question, answer, resource)
 */

import React from 'react';
import type { MessageType } from '../../../../services/chatService';

interface MessageTypeIndicatorProps {
    messageType: MessageType | undefined;
    isOwn: boolean;
}

// Icon components for each message type
const UrgentIcon = () => (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const QuestionIcon = () => (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const AnswerIcon = () => (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const ResourceIcon = () => (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
);

export const MessageTypeIndicator: React.FC<MessageTypeIndicatorProps> = ({
    messageType,
    isOwn }) => {
    if (!messageType || messageType === 'general') return null;

    const typeConfig: Record<MessageType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
        urgent: {
            label: 'Urgent',
            color: isOwn ? 'rgba(255,255,255,0.95)' : '#ef4444',
            bg: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(239, 68, 68, 0.12)',
            icon: <UrgentIcon /> },
        question: {
            label: 'Question',
            color: isOwn ? 'rgba(255,255,255,0.9)' : '#f59e0b',
            bg: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(245, 158, 11, 0.1)',
            icon: <QuestionIcon /> },
        answer: {
            label: 'Answer',
            color: isOwn ? 'rgba(255,255,255,0.9)' : '#22c55e',
            bg: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(34, 197, 94, 0.1)',
            icon: <AnswerIcon /> },
        resource: {
            label: 'Resource',
            color: isOwn ? 'rgba(255,255,255,0.9)' : '#3b82f6',
            bg: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(59, 130, 246, 0.1)',
            icon: <ResourceIcon /> },
        general: { label: '', color: '', bg: '', icon: null } };

    const config = typeConfig[messageType];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '4px' }}>
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    fontSize: '9px',
                    color: config.color,
                    padding: '2px 5px',
                    borderRadius: '4px',
                    background: config.bg,
                    fontWeight: 500 }}
                title={`AI classified as ${config.label}`}
            >
                {config.icon}
                {config.label}
            </span>
        </div>
    );
};
