/**
 * MessageContent Component
 * Renders message text with code blocks and @mention highlighting
 */

import React from 'react';
import { CodeBlock, extractCodeBlocks } from './CodeBlock';

interface MessageContentProps {
    content: string;
    isOwn: boolean;
    
    currentUserName?: string;
}

export const MessageContent = React.memo<MessageContentProps>(({
    content,
    isOwn,
    
    currentUserName }) => {
    const { parts: codeParts, hasCode } = extractCodeBlocks(content);

    return (
        <>
            {codeParts.map((part, partIndex) => {
                if (part.type === 'code') {
                    return (
                        <CodeBlock
                            key={`code-${partIndex}`}
                            code={part.content}
                            language={part.language}
                            isOwn={isOwn}
                            
                        />
                    );
                }

                // Render text with @mention highlighting
                const textContent = part.content;
                const mentionRegex = /@(\w+)/g;
                const textParts: React.ReactNode[] = [];
                let lastIndex = 0;
                let match;
                let key = 0;

                while ((match = mentionRegex.exec(textContent)) !== null) {
                    if (match.index > lastIndex) {
                        textParts.push(textContent.slice(lastIndex, match.index));
                    }
                    const mentionName = match[1];
                    const isSelfMention = currentUserName?.toLowerCase().includes(mentionName.toLowerCase());
                    textParts.push(
                        <span
                            key={key++}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                background: isOwn
                                    ? 'rgba(255,255,255,0.2)'
                                    : (isSelfMention ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)'),
                                color: isOwn
                                    ? 'rgba(255,255,255,0.95)'
                                    : (isSelfMention ? '#3b82f6' : '#8b5cf6'),
                                fontWeight: 600,
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease' }}
                            title={`View ${mentionName}'s profile`}
                        >
                            @{mentionName}
                        </span>
                    );
                    lastIndex = match.index + match[0].length;
                }
                if (lastIndex < textContent.length) {
                    textParts.push(textContent.slice(lastIndex));
                }

                return (
                    <p key={`text-${partIndex}`} style={{
                        margin: hasCode && partIndex > 0 ? '8px 0 0 0' : 0,
                        fontSize: '14px',
                        lineHeight: 1.5,
                        wordBreak: 'break-word' }}>
                        {textParts.length > 0 ? textParts : textContent}
                    </p>
                );
            })}
        </>
    );
});
