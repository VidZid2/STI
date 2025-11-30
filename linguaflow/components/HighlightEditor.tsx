import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Issue, IssueType } from '../types';
import { X, Check, ExternalLink, Wand2 } from 'lucide-react';

interface HighlightEditorProps {
  text: string;
  setText: (text: string) => void;
  issues: Issue[];
  onSelectIssue: (issue: Issue | null) => void;
  selectedIssueId: string | null;
  onApplyFix: (issue: Issue, replacement: string) => void;
  onDismiss: (issue: Issue) => void;
}

const HighlightEditor: React.FC<HighlightEditorProps> = ({
  text,
  setText,
  issues,
  onSelectIssue,
  selectedIssueId,
  onApplyFix,
  onDismiss
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  
  const [hoveredIssue, setHoveredIssue] = useState<Issue | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{x: number, y: number} | null>(null);

  // Sync scrolling
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
    // Hide tooltip on scroll to prevent misalignment
    setHoveredIssue(null);
  };

  const getBorderColor = (type: IssueType) => {
    switch (type) {
      case IssueType.Correctness: return 'border-red-500 bg-red-100/50';
      case IssueType.Clarity: return 'border-blue-500 bg-blue-100/50';
      case IssueType.Engagement: return 'border-purple-500 bg-purple-100/50';
      case IssueType.Delivery: return 'border-yellow-500 bg-yellow-100/50';
      default: return 'border-gray-400';
    }
  };

  // Construct text segments
  const renderHighlights = useMemo(() => {
    if (!text) return null;
    
    let segments: { text: string; issue?: Issue }[] = [];
    let lastIndex = 0;
    
    // Find ranges. Note: This simple find logic assumes first occurrence. 
    // Production apps use character indices from the backend.
    const issueIndices: { start: number; end: number; issue: Issue }[] = [];
    
    issues.forEach(issue => {
      // Find the first occurrence after the last checked index to somewhat handle duplicates sequentially? 
      // Actually, simple regex global is safer for this mockup.
      const regex = new RegExp(issue.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      let match;
      while ((match = regex.exec(text)) !== null) {
        // Simple overlap check
        const start = match.index;
        const end = match.index + issue.original.length;
        const overlap = issueIndices.some(existing => 
          (start >= existing.start && start < existing.end) || 
          (end > existing.start && end <= existing.end)
        );

        if (!overlap) {
            issueIndices.push({ start, end, issue });
            // Optimization: Only mark the first one found to avoid "sea of red" if a common word is wrong
            break; 
        }
      }
    });

    issueIndices.sort((a, b) => a.start - b.start);

    issueIndices.forEach(item => {
      if (item.start > lastIndex) {
        segments.push({ text: text.slice(lastIndex, item.start) });
      }
      segments.push({ text: text.slice(item.start, item.end), issue: item.issue });
      lastIndex = item.end;
    });
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex) });
    }

    return segments.map((segment, idx) => {
      if (segment.issue) {
        return (
          <span
            key={idx}
            className={`border-b-[3px] pb-[1px] cursor-pointer pointer-events-auto transition-colors duration-200 ${getBorderColor(segment.issue.type)}`}
            onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const containerRect = containerRef.current?.getBoundingClientRect();
                if (containerRect) {
                    setHoverPosition({
                        x: rect.left - containerRect.left,
                        y: rect.bottom - containerRect.top + 5 // +5 for padding
                    });
                    setHoveredIssue(segment.issue || null);
                }
            }}
            onMouseLeave={() => {
                // We handle mouse leave on the tooltip container usually, 
                // but let's delay clearing to allow moving to tooltip.
            }}
            onClick={() => onSelectIssue(segment.issue || null)}
          >
            {segment.text}
          </span>
        );
      }
      return <span key={idx}>{segment.text}</span>;
    });
  }, [text, issues, onSelectIssue]);

  return (
    <div 
        ref={containerRef} 
        className="relative w-full h-full text-lg leading-loose font-sans overflow-hidden group"
        onMouseLeave={() => setHoveredIssue(null)}
    >
      {/* Backdrop Layer (Highlights) */}
      <div 
        ref={backdropRef}
        className="absolute inset-0 p-8 whitespace-pre-wrap break-words overflow-hidden pointer-events-none text-transparent font-sans z-10"
        aria-hidden="true"
      >
        {renderHighlights}
        <br />
      </div>

      {/* Input Layer (Textarea) */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onScroll={handleScroll}
        className="relative z-0 w-full h-full p-8 bg-transparent text-gray-800 caret-black outline-none resize-none break-words font-sans selection:bg-blue-200"
        placeholder="Type or paste text..."
        spellCheck={false}
      />

      {/* Hover Tooltip */}
      {hoveredIssue && hoverPosition && (
        <div 
            className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-100 p-4 w-72 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
            style={{ top: hoverPosition.y, left: Math.min(hoverPosition.x, (containerRef.current?.offsetWidth || 0) - 300) }}
            onMouseEnter={() => {}} // Keep open when hovering the tooltip itself
            onMouseLeave={() => setHoveredIssue(null)} // Close when leaving tooltip
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    hoveredIssue.type === IssueType.Correctness ? 'bg-red-100 text-red-700' :
                    hoveredIssue.type === IssueType.Clarity ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                }`}>
                    {hoveredIssue.type}
                </span>
                <div className="flex space-x-1">
                    <button 
                        onClick={() => {
                            onDismiss(hoveredIssue);
                            setHoveredIssue(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <p className="text-gray-600 text-sm mb-3">{hoveredIssue.explanation}</p>

            {/* Suggestions */}
            <div className="space-y-2">
                {hoveredIssue.replacements.map((replacement, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            onApplyFix(hoveredIssue, replacement);
                            setHoveredIssue(null);
                        }}
                        className="w-full text-left px-3 py-2 bg-green-50 hover:bg-green-100 text-green-800 font-medium rounded-md text-sm transition-colors flex items-center justify-between group"
                    >
                        <span>{replacement}</span>
                        <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                ))}
            </div>

            {/* Grounding Source */}
            {hoveredIssue.sources && hoveredIssue.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1 flex items-center">
                        <ExternalLink className="w-3 h-3 mr-1" /> Source
                    </p>
                    <a 
                        href={hoveredIssue.sources[0]} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate block"
                    >
                        {new URL(hoveredIssue.sources[0]).hostname}
                    </a>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default HighlightEditor;