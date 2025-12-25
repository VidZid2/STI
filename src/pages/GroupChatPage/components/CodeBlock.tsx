/**
 * Code Block Component
 * Renders code with syntax highlighting and copy functionality
 * Minimalistic design matching the app's style
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';

interface CodeBlockProps {
    code: string;
    language?: string;
    isOwn?: boolean;
    isDarkMode?: boolean;
}

// Language display names and colors
const LANGUAGE_CONFIG: Record<string, { name: string; color: string }> = {
    javascript: { name: 'JavaScript', color: '#f7df1e' },
    js: { name: 'JavaScript', color: '#f7df1e' },
    typescript: { name: 'TypeScript', color: '#3178c6' },
    ts: { name: 'TypeScript', color: '#3178c6' },
    python: { name: 'Python', color: '#3776ab' },
    py: { name: 'Python', color: '#3776ab' },
    java: { name: 'Java', color: '#ed8b00' },
    cpp: { name: 'C++', color: '#00599c' },
    c: { name: 'C', color: '#a8b9cc' },
    csharp: { name: 'C#', color: '#239120' },
    cs: { name: 'C#', color: '#239120' },
    html: { name: 'HTML', color: '#e34f26' },
    css: { name: 'CSS', color: '#1572b6' },
    json: { name: 'JSON', color: '#292929' },
    sql: { name: 'SQL', color: '#e38c00' },
    bash: { name: 'Bash', color: '#4eaa25' },
    shell: { name: 'Shell', color: '#4eaa25' },
    php: { name: 'PHP', color: '#777bb4' },
    ruby: { name: 'Ruby', color: '#cc342d' },
    go: { name: 'Go', color: '#00add8' },
    rust: { name: 'Rust', color: '#dea584' },
    swift: { name: 'Swift', color: '#fa7343' },
    kotlin: { name: 'Kotlin', color: '#7f52ff' },
    react: { name: 'React', color: '#61dafb' },
    jsx: { name: 'JSX', color: '#61dafb' },
    tsx: { name: 'TSX', color: '#3178c6' },
    vue: { name: 'Vue', color: '#4fc08d' },
    yaml: { name: 'YAML', color: '#cb171e' },
    xml: { name: 'XML', color: '#0060ac' },
    markdown: { name: 'Markdown', color: '#083fa1' },
    md: { name: 'Markdown', color: '#083fa1' },
};

// Simple syntax highlighting (keywords, strings, comments, numbers)
const highlightCode = (code: string, language: string): React.ReactNode[] => {
    const lines = code.split('\n');
    
    // Language-specific keywords
    const keywordSets: Record<string, string[]> = {
        javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof'],
        typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof', 'interface', 'type', 'enum', 'implements', 'extends', 'public', 'private', 'protected'],
        python: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'as', 'try', 'except', 'raise', 'with', 'lambda', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'pass', 'break', 'continue', 'global', 'nonlocal', 'async', 'await', 'yield'],
        java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'static', 'final', 'void', 'int', 'String', 'boolean', 'return', 'if', 'else', 'for', 'while', 'new', 'this', 'super', 'try', 'catch', 'throw', 'throws', 'import', 'package', 'true', 'false', 'null'],
        cpp: ['int', 'float', 'double', 'char', 'void', 'bool', 'class', 'struct', 'public', 'private', 'protected', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'new', 'delete', 'this', 'true', 'false', 'nullptr', 'const', 'static', 'virtual', 'override', 'template', 'typename', 'namespace', 'using', 'include'],
        sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'LIKE', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN'],
        html: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'input', 'button', 'script', 'style', 'link', 'meta', 'title', 'header', 'footer', 'nav', 'section', 'article', 'aside', 'main'],
        css: ['color', 'background', 'margin', 'padding', 'border', 'width', 'height', 'display', 'flex', 'grid', 'position', 'top', 'left', 'right', 'bottom', 'font', 'text', 'align', 'justify', 'transform', 'transition', 'animation', 'opacity', 'z-index', 'overflow', 'cursor', 'box-shadow'],
    };

    const keywords = keywordSets[language] || keywordSets['javascript'] || [];
    
    return lines.map((line, lineIndex) => {
        const tokens: React.ReactNode[] = [];
        let remaining = line;
        let tokenKey = 0;

        while (remaining.length > 0) {
            // Check for comments
            const singleLineComment = remaining.match(/^(\/\/.*|#.*)/);
            if (singleLineComment) {
                tokens.push(
                    <span key={tokenKey++} style={{ color: '#6b7280', fontStyle: 'italic' }}>
                        {singleLineComment[0]}
                    </span>
                );
                remaining = remaining.slice(singleLineComment[0].length);
                continue;
            }

            // Check for strings (double quotes)
            const doubleString = remaining.match(/^"([^"\\]|\\.)*"/);
            if (doubleString) {
                tokens.push(
                    <span key={tokenKey++} style={{ color: '#22c55e' }}>
                        {doubleString[0]}
                    </span>
                );
                remaining = remaining.slice(doubleString[0].length);
                continue;
            }

            // Check for strings (single quotes)
            const singleString = remaining.match(/^'([^'\\]|\\.)*'/);
            if (singleString) {
                tokens.push(
                    <span key={tokenKey++} style={{ color: '#22c55e' }}>
                        {singleString[0]}
                    </span>
                );
                remaining = remaining.slice(singleString[0].length);
                continue;
            }

            // Check for template literals
            const templateLiteral = remaining.match(/^`([^`\\]|\\.)*`/);
            if (templateLiteral) {
                tokens.push(
                    <span key={tokenKey++} style={{ color: '#22c55e' }}>
                        {templateLiteral[0]}
                    </span>
                );
                remaining = remaining.slice(templateLiteral[0].length);
                continue;
            }

            // Check for numbers
            const number = remaining.match(/^\b\d+(\.\d+)?\b/);
            if (number) {
                tokens.push(
                    <span key={tokenKey++} style={{ color: '#f59e0b' }}>
                        {number[0]}
                    </span>
                );
                remaining = remaining.slice(number[0].length);
                continue;
            }

            // Check for keywords
            const wordMatch = remaining.match(/^\b[a-zA-Z_][a-zA-Z0-9_]*\b/);
            if (wordMatch) {
                const word = wordMatch[0];
                const isKeyword = keywords.includes(word) || keywords.includes(word.toUpperCase());
                tokens.push(
                    <span 
                        key={tokenKey++} 
                        style={{ 
                            color: isKeyword ? '#8b5cf6' : undefined,
                            fontWeight: isKeyword ? 500 : undefined,
                        }}
                    >
                        {word}
                    </span>
                );
                remaining = remaining.slice(word.length);
                continue;
            }

            // Check for operators and punctuation
            const operator = remaining.match(/^[+\-*/%=<>!&|^~?:;,.()[\]{}]+/);
            if (operator) {
                tokens.push(
                    <span key={tokenKey++} style={{ color: '#64748b' }}>
                        {operator[0]}
                    </span>
                );
                remaining = remaining.slice(operator[0].length);
                continue;
            }

            // Default: take one character
            tokens.push(remaining[0]);
            remaining = remaining.slice(1);
        }

        return (
            <div key={lineIndex} style={{ minHeight: '1.4em' }}>
                {tokens.length > 0 ? tokens : '\u00A0'}
            </div>
        );
    });
};

export const CodeBlock: React.FC<CodeBlockProps> = ({
    code,
    language = '',
    isOwn = false,
    isDarkMode = false,
}) => {
    const [copied, setCopied] = useState(false);
    
    const langConfig = LANGUAGE_CONFIG[language.toLowerCase()] || { 
        name: language || 'Code', 
        color: '#64748b' 
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const bgColor = isOwn 
        ? 'rgba(0, 0, 0, 0.2)' 
        : (isDarkMode ? '#0f172a' : '#1e293b');
    
    const textColor = '#e2e8f0';

    return (
        <div style={{
            borderRadius: '10px',
            overflow: 'hidden',
            marginTop: '6px',
            maxWidth: '100%',
            border: isOwn ? '1px solid rgba(255,255,255,0.1)' : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: isOwn ? 'rgba(0, 0, 0, 0.15)' : (isDarkMode ? '#1e293b' : '#334155'),
                borderBottom: `1px solid ${isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Language indicator dot */}
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: langConfig.color,
                    }} />
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        {langConfig.name}
                    </span>
                </div>
                
                {/* Copy button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                        color: copied ? '#22c55e' : '#94a3b8',
                        fontSize: '10px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                >
                    {copied ? (
                        <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Copied!
                        </>
                    ) : (
                        <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copy
                        </>
                    )}
                </motion.button>
            </div>
            
            {/* Code content */}
            <div style={{
                padding: '12px 14px',
                background: bgColor,
                overflowX: 'auto',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                lineHeight: 1.5,
                color: textColor,
                whiteSpace: 'pre',
            }}>
                {highlightCode(code, language.toLowerCase())}
            </div>
        </div>
    );
};

// Helper function to extract code blocks from message content
export const extractCodeBlocks = (content: string): { 
    parts: Array<{ type: 'text' | 'code'; content: string; language?: string }>;
    hasCode: boolean;
} => {
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    let lastIndex = 0;
    let match;
    let hasCode = false;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        hasCode = true;
        
        // Add text before code block
        if (match.index > lastIndex) {
            const textBefore = content.slice(lastIndex, match.index).trim();
            if (textBefore) {
                parts.push({ type: 'text', content: textBefore });
            }
        }
        
        // Add code block
        parts.push({
            type: 'code',
            content: match[2].trim(),
            language: match[1] || 'text',
        });
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
        const remainingText = content.slice(lastIndex).trim();
        if (remainingText) {
            parts.push({ type: 'text', content: remainingText });
        }
    }
    
    // If no code blocks found, return original content as text
    if (parts.length === 0) {
        parts.push({ type: 'text', content });
    }
    
    return { parts, hasCode };
};

export default CodeBlock;
