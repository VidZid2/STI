/**
 * GifDisplay Component
 * Renders GIF messages with animation
 */

import React from 'react';
import { motion } from 'motion/react';

interface GifDisplayProps {
    content: string;
}

export const GifDisplay: React.FC<GifDisplayProps> = ({ content }) => {
    // Extract GIF URL from content format "[GIF] url"
    const gifUrl = content.replace('[GIF] ', '');

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                borderRadius: '12px',
                overflow: 'hidden',
                maxWidth: '280px',
                marginTop: '4px',
            }}
        >
            <img
                src={gifUrl}
                alt="GIF"
                style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '12px',
                }}
                loading="lazy"
            />
        </motion.div>
    );
};
