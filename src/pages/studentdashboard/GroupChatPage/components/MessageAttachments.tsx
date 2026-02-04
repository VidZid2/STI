/**
 * MessageAttachments Component
 * Renders link previews and file attachments for a message
 */

import React from 'react';
import { LinkPreviewCard, extractUrls } from './LinkPreviewCard';
import { FilePreviewCard } from './FilePreviewCard';
import type { ChatColors } from '../types';
import type { FileAttachment } from '../../../../services/chatService';

interface MessageAttachmentsProps {
    messageId: string;
    content: string;
    attachments?: FileAttachment[];
    isOwn: boolean;
    isDarkMode: boolean;
    colors: ChatColors;
}

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
    messageId,
    content,
    attachments,
    isOwn,
    isDarkMode,
    colors,
}) => {
    const urls = extractUrls(content);

    return (
        <>
            {/* Link Previews - for shared resources */}
            {urls.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {urls.slice(0, 3).map((url, idx) => (
                        <LinkPreviewCard
                            key={`${messageId}-link-${idx}`}
                            url={url}
                            isOwn={isOwn}
                            isDarkMode={isDarkMode}
                            colors={colors}
                        />
                    ))}
                </div>
            )}

            {/* File/Image Attachments */}
            {attachments && attachments.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginTop: '4px',
                }}>
                    {attachments.map((attachment) => (
                        <FilePreviewCard
                            key={attachment.id}
                            attachment={attachment}
                            isOwn={isOwn}
                            isDarkMode={isDarkMode}
                            colors={colors}
                        />
                    ))}
                </div>
            )}
        </>
    );
};
