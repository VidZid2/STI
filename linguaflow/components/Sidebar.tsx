import React from 'react';
import { CheckCircle, AlertCircle, Zap, MessageCircle, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import { Issue, IssueType, AnalysisStats } from '../types';

interface SidebarProps {
  stats: AnalysisStats;
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (issue: Issue) => void;
  onApplyFix: (issue: Issue, replacement?: string) => void;
  onDismiss: (issue: Issue) => void;
  isAnalyzing: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  stats,
  issues,
  selectedIssueId,
  onSelectIssue,
  onApplyFix,
  onDismiss,
  isAnalyzing
}) => {

  const getIcon = (type: IssueType) => {
    switch (type) {
      case IssueType.Correctness: return <AlertCircle className="w-5 h-5 text-red-500" />;
      case IssueType.Clarity: return <BookOpen className="w-5 h-5 text-blue-500" />;
      case IssueType.Engagement: return <Zap className="w-5 h-5 text-purple-500" />;
      case IssueType.Delivery: return <MessageCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getTitle = (type: IssueType) => {
    switch (type) {
      case IssueType.Correctness: return 'Correctness';
      case IssueType.Clarity: return 'Clarity';
      case IssueType.Engagement: return 'Engagement';
      case IssueType.Delivery: return 'Delivery';
    }
  };

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  const counts = {
    [IssueType.Correctness]: issues.filter(i => i.type === IssueType.Correctness).length,
    [IssueType.Clarity]: issues.filter(i => i.type === IssueType.Clarity).length,
    [IssueType.Engagement]: issues.filter(i => i.type === IssueType.Engagement).length,
    [IssueType.Delivery]: issues.filter(i => i.type === IssueType.Delivery).length,
  };

  if (isAnalyzing) {
    return (
        <div className="w-96 border-l border-gray-200 bg-white h-full p-8 flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 bg-indigo-100 rounded-full animate-pulse"></div>
                </div>
            </div>
            <h3 className="text-gray-900 font-semibold text-lg mb-2">Analyzing Document</h3>
            <p className="text-gray-500 text-sm">Checking grammar, tone, and verifying facts with Google Search...</p>
        </div>
    )
  }

  return (
    <div className="w-96 border-l border-gray-200 bg-gray-50 h-full flex flex-col overflow-hidden">
      {/* Overall Score Header */}
      <div className="p-6 bg-white border-b border-gray-100 shadow-sm z-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-800">Overall Score</h2>
          <span className={`text-2xl font-bold ${stats.score >= 90 ? 'text-green-600' : stats.score >= 70 ? 'text-yellow-600' : 'text-red-500'}`}>
            {stats.score}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-1000 ${stats.score >= 90 ? 'bg-green-500' : stats.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${stats.score}%` }}
          />
        </div>
        <div className="flex justify-between mt-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">
            <div>Words: {stats.wordCount}</div>
            <div>Readability: {stats.readabilityScore}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selected Issue Card */}
        {selectedIssue && (
          <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-5 transform transition-all duration-300">
             <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    {getIcon(selectedIssue.type)}
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{getTitle(selectedIssue.type)}</span>
                </div>
                <button 
                    onClick={() => onDismiss(selectedIssue)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-1"
                >
                    <span className="sr-only">Dismiss</span>
                    &times;
                </button>
             </div>

             <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="text-sm text-gray-500 line-through mb-1">{selectedIssue.original}</div>
                
                {selectedIssue.replacements.length > 0 ? (
                    <div className="space-y-1">
                        {selectedIssue.replacements.map((rep, idx) => (
                             <div key={idx} className="text-lg font-bold text-indigo-700 flex items-center">
                                {rep}
                             </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm italic text-gray-400">No suggestion (remove)</div>
                )}
             </div>

             <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {selectedIssue.explanation}
             </p>

             {selectedIssue.sources && selectedIssue.sources.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Fact Checked via Google
                    </p>
                    <ul className="space-y-1">
                        {selectedIssue.sources.slice(0, 2).map((src, idx) => (
                             <li key={idx} className="text-xs text-blue-600 truncate hover:underline">
                                <a href={src} target="_blank" rel="noopener noreferrer">{new URL(src).hostname}</a>
                             </li>
                        ))}
                    </ul>
                </div>
             )}

             <div className="space-y-2">
                 {selectedIssue.replacements.map((rep, idx) => (
                    <button 
                        key={idx}
                        onClick={() => onApplyFix(selectedIssue, rep)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center shadow-sm"
                    >
                        Accept: {rep}
                    </button>
                 ))}
                 {selectedIssue.replacements.length === 0 && (
                     <button 
                        onClick={() => onApplyFix(selectedIssue, "")}
                        className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-sm transition-colors"
                    >
                        Delete Text
                    </button>
                 )}
             </div>
          </div>
        )}

        {/* Categories List */}
        {!selectedIssue && (
            <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Issues Found</h3>
                {Object.entries(counts).map(([type, count]) => {
                     const issueType = type as IssueType;
                     if (count === 0) return null;
                     return (
                        <button 
                            key={type}
                            className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow group hover:border-indigo-300"
                            onClick={() => {
                                const first = issues.find(i => i.type === issueType);
                                if(first) onSelectIssue(first);
                            }}
                        >
                            <div className="flex items-center space-x-3">
                                {getIcon(issueType)}
                                <span className="font-medium text-gray-700">{getTitle(issueType)}</span>
                            </div>
                            <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-bold group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                                {count}
                            </span>
                        </button>
                     );
                })}

                {issues.length === 0 && (
                     <div className="text-center py-10">
                        <CheckCircle className="w-12 h-12 text-green-100 mx-auto mb-3" />
                        <h3 className="text-gray-900 font-medium">All clear!</h3>
                        <p className="text-gray-500 text-sm mt-1">Great job. No issues found in your text.</p>
                     </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default Sidebar;