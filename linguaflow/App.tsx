import React, { useState, useCallback } from 'react';
import { PenTool, Menu, Settings, Sliders, Layout, Wand2, Search } from 'lucide-react';
import HighlightEditor from './components/HighlightEditor';
import Sidebar from './components/Sidebar';
import { analyzeTextWithGemini } from './services/geminiService';
import { Issue, AnalysisStats } from './types';

const INITIAL_TEXT = `The Mars Rover, Spirit, landed on the read planet in 2004. Its mission was expected to last 90 days, but it continued analyzing the surface for over six years. NASA lost contact with Spirit in 2011. In contrast, the Curiosity rover arrived in August 2013 and discovered evidence of ancient water.

I think space exploration is super cool and realy important for humanitys future. We should definitely spend more money on it because who knows what we'll find out there? Maybe aliens!`;

const App: React.FC = () => {
  const [text, setText] = useState<string>(INITIAL_TEXT);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<AnalysisStats>({ score: 0, wordCount: 0, readabilityScore: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const performAnalysis = useCallback(async () => {
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    setSelectedIssueId(null);

    try {
      const result = await analyzeTextWithGemini(text);
      setIssues(result.issues);
      setStats({
        ...result.stats,
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length
      });
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Something went wrong with the analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [text]);

  const handleApplyFix = (issue: Issue, replacementStr?: string) => {
    // Use the provided replacement string or default to the first one
    const replaceWith = replacementStr || (issue.replacements.length > 0 ? issue.replacements[0] : null);
    
    if (!replaceWith) return;

    // Replace first occurrence. In production, use start/end indices.
    const newText = text.replace(issue.original, replaceWith);
    setText(newText);
    
    // Remove the issue from the list
    setIssues(prev => prev.filter(i => i.id !== issue.id));
    setSelectedIssueId(null);
  };

  const handleDismiss = (issue: Issue) => {
    setIssues(prev => prev.filter(i => i.id !== issue.id));
    setSelectedIssueId(null);
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 overflow-hidden font-sans">
      {/* Left Navigation Sidebar */}
      <nav className="w-16 md:w-20 flex-shrink-0 bg-gray-900 flex flex-col items-center py-6 space-y-8 z-20">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <PenTool className="text-white w-6 h-6" />
        </div>
        
        <div className="flex-1 flex flex-col space-y-6 w-full items-center">
            <button className="p-3 bg-gray-800 rounded-xl text-indigo-400 shadow-inner">
                <Layout className="w-5 h-5" />
            </button>
            <button className="p-3 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
                <Sliders className="w-5 h-5" />
            </button>
            <button className="p-3 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
            </button>
        </div>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 border-2 border-gray-800"></div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-gray-100 bg-white z-10">
            <div className="flex items-center space-x-4">
                <Menu className="w-5 h-5 text-gray-400 md:hidden" />
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">Untitled Document</h1>
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md font-medium">Draft</span>
            </div>
            
            <div className="flex items-center space-x-4">
                 <div className="hidden md:flex items-center text-xs text-gray-400 space-x-4 mr-4">
                     <span className="flex items-center text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full"><Search className="w-3 h-3 mr-1" /> Search Grounding Active</span>
                 </div>
                <button 
                    onClick={performAnalysis}
                    disabled={isAnalyzing}
                    className={`flex items-center px-5 py-2.5 rounded-full font-semibold text-sm shadow-md transition-all transform active:scale-95 ${
                        isAnalyzing 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-200'
                    }`}
                >
                    {isAnalyzing ? (
                        <>Processing...</>
                    ) : (
                        <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Check Text
                        </>
                    )}
                </button>
            </div>
        </header>

        {/* Editor Container */}
        <div className="flex-1 relative overflow-hidden bg-gray-50/50">
            <div className="max-w-4xl mx-auto h-full bg-white shadow-xl shadow-gray-200/50 my-0 md:my-8 rounded-none md:rounded-lg overflow-hidden border border-gray-100">
                <HighlightEditor 
                    text={text}
                    setText={setText}
                    issues={issues}
                    onSelectIssue={(issue) => setSelectedIssueId(issue ? issue.id : null)}
                    selectedIssueId={selectedIssueId}
                    onApplyFix={handleApplyFix}
                    onDismiss={handleDismiss}
                />
            </div>
        </div>
      </main>

      {/* Assistant Sidebar */}
      <aside className="hidden lg:block h-full z-10 shadow-xl">
        <Sidebar 
            stats={stats}
            issues={issues}
            selectedIssueId={selectedIssueId}
            onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
            onApplyFix={handleApplyFix}
            onDismiss={handleDismiss}
            isAnalyzing={isAnalyzing}
        />
      </aside>
    </div>
  );
};

export default App;