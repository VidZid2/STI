const fs = require('fs');
const file = 'c:/Users/JOSIAH DE JESUS/Documents/eLMS Website STI - CASE STUDY/elms-react/src/components/tools/LanguageToolGrammarChecker.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the start of the return block
const returnIndex = content.indexOf('return (\\n        <motion.div');
if (returnIndex === -1) {
    console.log('Return block not found');
    process.exit(1);
}

// Keep everything before the return block
const beforeReturn = content.substring(0, returnIndex);

// Add the new return block and exports
const newRender = `  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-[1400px] mx-auto h-auto min-h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-8"
    >
      {/* Main Editor Column (70%) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Editor Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-5 px-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm relative overflow-hidden group">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
          
          {/* Title Area */}
          <motion.div
            className="flex items-center gap-4 relative z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <motion.div
              className="flex items-center justify-center w-12 h-12 rounded-[16px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50"
              whileHover={{ scale: 1.05, rotate: -5 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </motion.div>
            
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Grammar Checker</h1>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  LanguageTool
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  AI
                </span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 w-full sm:w-auto relative z-10"
          >
            <motion.button
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800/50 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </motion.button>

            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2 hidden sm:block"></div>

            <LayoutGroup>
              <motion.button
                layout
                onClick={handleClear}
                disabled={!text}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                Clear
              </motion.button>

              <AnimatePresence mode="popLayout">
                  {issues.length > 0 && (
                      <motion.button
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={handleFixAll}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.97 }}
                      >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 4V2" />
                              <path d="M15 16v-2" />
                              <path d="M8 9h2" />
                              <path d="M20 9h2" />
                              <path d="M17.8 11.8L19 13" />
                              <path d="M15 9h0" />
                              <path d="M17.8 6.2L19 5" />
                              <path d="M3 21l9-9" />
                              <path d="M12.2 6.2L11 5" />
                          </svg>
                          Fix All
                          <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-md ml-1">{issues.length}</span>
                      </motion.button>
                  )}
              </AnimatePresence>

              <motion.button
                layout
                onClick={performAnalysis}
                disabled={isAnalyzing || !text.trim() || !apiStatus.canRequest}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ y: -1, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)' }}
                whileTap={{ scale: 0.97 }}
              >
                  {isAnalyzing ? 'Analyzing...' : 'Check'}
              </motion.button>
            </LayoutGroup>
          </motion.div>
        </div>

        {/* Text Area (The "Paper") */}
        <motion.div
          className="flex-1 relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm flex flex-col overflow-hidden min-h-[500px]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 px-6 text-sm font-semibold flex justify-between items-center border-b border-red-100 dark:border-red-900/30">
                  <span>{error}</span>
                  <button onClick={() => setError(null)}>×</button>
              </div>
          )}

          <div ref={containerRef} className="relative flex-1 w-full h-full p-8 lg:p-10">
              {/* Highlight Overlay (Must perfectly sync with textarea) */}
              <div className="absolute inset-0 p-8 lg:p-10 font-sans text-[17px] leading-[1.8] text-transparent whitespace-pre-wrap break-words pointer-events-none z-10 overflow-hidden" aria-hidden="true" style={{ top: textareaRef.current ? -textareaRef.current.scrollTop : 0 }}>
                  {renderHighlights}
              </div>

              {/* Tooltip Popup */}
              <AnimatePresence>
                  {hoveredIssue && hoverPosition && (
                      <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                          style={{
                              position: 'absolute',
                              left: hoverPosition.x,
                              top: hoverPosition.y,
                              zIndex: 50
                          }}
                          className="w-80 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] p-4 overflow-hidden pointer-events-auto"
                          onMouseLeave={() => setHoveredIssue(null)}
                      >
                          <div className="flex justify-between items-start mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-700/50">
                              <div className="flex items-center gap-2">
                                  <div className={\`w-2 h-2 rounded-full \${
                                      hoveredIssue.category === 'error' ? 'bg-red-500' : 
                                      hoveredIssue.category === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                  }\`}></div>
                                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                      {hoveredIssue.category}
                                  </span>
                              </div>
                              <button onClick={() => handleDismiss(hoveredIssue)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 bg-zinc-100 dark:bg-zinc-700/50 rounded-lg">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                              </button>
                          </div>
                          
                          <p className="text-sm text-zinc-800 dark:text-zinc-200 mb-4 font-medium leading-relaxed">
                              {hoveredIssue.message}
                          </p>
                          
                          {hoveredIssue.replacements && hoveredIssue.replacements.length > 0 && (
                              <div className="flex flex-col gap-1.5">
                                  <span className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Suggestions</span>
                                  {hoveredIssue.replacements.slice(0, 3).map((rep, i) => (
                                      <button
                                          key={i}
                                          onClick={() => handleApplyFix(hoveredIssue, rep)}
                                          className="flex justify-between items-center w-full p-3 bg-white dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-800 rounded-xl transition-all text-sm font-semibold shadow-sm group"
                                      >
                                          {rep}
                                          <svg className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                              <polyline points="20 6 9 17 4 12"></polyline>
                                          </svg>
                                      </button>
                                  ))}
                              </div>
                          )}
                      </motion.div>
                  )}
              </AnimatePresence>

              <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onScroll={handleScroll}
                  className="absolute inset-0 w-full h-full p-8 lg:p-10 bg-transparent border-none resize-none text-zinc-800 dark:text-zinc-200 focus:ring-0 focus:outline-none text-[17px] leading-[1.8] z-0 placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                  placeholder="Type or paste your text here to check grammar..."
                  spellCheck="false"
              />
          </div>
        </motion.div>
      </div>

      {/* Sidebar Column (30%) */}
      <motion.div 
        className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-8"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        
        {/* Issues Found Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Issues Found</h3>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              {issues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-emerald-500">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-3">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                      </div>
                      <span className="font-bold text-sm">No issues found!</span>
                  </div>
              ) : (
                  <>
                      {/* Errors */}
                      <motion.div whileHover={{ scale: 1.02 }} className="flex items-center justify-between p-3.5 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                          <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <span className="text-sm font-bold text-red-700 dark:text-red-400">Spelling / Errors</span>
                          </div>
                          <span className="font-black text-red-700 dark:text-red-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-lg shadow-sm border border-red-100 dark:border-red-900/50">{issueCounts.errors}</span>
                      </motion.div>
                      {/* Warnings */}
                      <motion.div whileHover={{ scale: 1.02 }} className="flex items-center justify-between p-3.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                          <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                              <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Style / Warnings</span>
                          </div>
                          <span className="font-black text-yellow-700 dark:text-yellow-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-lg shadow-sm border border-yellow-100 dark:border-yellow-900/50">{issueCounts.warnings}</span>
                      </motion.div>
                      {/* Info */}
                      <motion.div whileHover={{ scale: 1.02 }} className="flex items-center justify-between p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                          <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">Punctuation</span>
                          </div>
                          <span className="font-black text-blue-700 dark:text-blue-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900/50">{issueCounts.info}</span>
                      </motion.div>
                  </>
              )}
            </div>
        </div>

        {/* Statistics Grid */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-[24px] shadow-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Document Stats</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 relative z-10">
                <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-0.5">{stats.words.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Words</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-0.5">{stats.chars.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Characters</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-0.5">{stats.sentences.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Sentences</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-0.5">{stats.readingTime}m</span>
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Read Time</span>
                </motion.div>
            </div>
        </div>

        {/* API Status Dot (Moved to bottom, very subtle) */}
        <div className="mt-auto flex items-center justify-end gap-2 px-2 py-4">
            <div className="relative flex h-2 w-2">
              {apiStatus.canRequest && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={\`relative inline-flex rounded-full h-2 w-2 \${apiStatus.canRequest ? 'bg-emerald-500' : 'bg-red-500'}\`}></span>
            </div>
            <span className="text-xs font-semibold text-zinc-400">API \${apiStatus.canRequest ? 'Ready' : 'Limited'}</span>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default LanguageToolGrammarChecker;
`;

fs.writeFileSync(file, beforeReturn + newRender);
