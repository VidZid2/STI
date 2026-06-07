import os

file_path = r'c:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\pages\studentdashboard\content\CourseViewPage\CourseViewPage.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target_start = '''                        {filteredModules.length === 0 ? (
                            <EmptyState'''
target_end = '''                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        )}'''

if target_start in content and target_end in content:
    start_idx = content.find(target_start)
    end_idx = content.find(target_end) + len(target_end)
    
    replacement = """                        {/* Sidebar-Detail Navigation Layout */}
                        {(() => {
                            const selectedModule = filteredModules.find(m => m.id === selectedModuleId) || filteredModules[0];
                            const itemsPerPage = 3;
                            const totalPages = Math.ceil(filteredModules.length / itemsPerPage);
                            const currentPage = Math.min(modulesPage, totalPages || 1);
                            const startIndex = (currentPage - 1) * itemsPerPage;
                            const paginatedModules = filteredModules.slice(startIndex, startIndex + itemsPerPage);
                            
                            return (
                                <div className=\"flex flex-col lg:flex-row items-stretch lg:items-stretch gap-6 w-full max-w-7xl mx-auto mt-2\">
                                    {/* Sidebar Navigation */}
                                    <div className=\"w-full lg:w-[320px] xl:w-[380px] shrink-0 flex flex-col justify-between p-4 rounded-[20px] bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm relative min-h-[380px]\">
                                        <div className=\"flex flex-col gap-3 flex-1 py-1\">
                                            <AnimatePresence mode=\"wait\">
                                                {filteredModules.length === 0 ? (
                                                    <motion.div 
                                                        key=\"empty-sidebar-modules\"
                                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                        transition={{ duration: 0.2, ease: \"easeOut\" }}
                                                        className=\"flex flex-col items-center justify-center h-full text-center py-10 px-4\"
                                                    >
                                                        <div className=\"w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-3 border border-slate-100 dark:border-zinc-800 shadow-sm\">
                                                            <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"1.5\" strokeLinecap=\"round\" strokeLinejoin=\"round\">
                                                                <path d=\"M4 19.5A2.5 2.5 0 0 1 6.5 17H20\" />
                                                                <path d=\"M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z\" />
                                                                <path d=\"M8 7h8M8 11h6M8 15h4\" />
                                                            </svg>
                                                        </div>
                                                        <h3 className=\"text-[13px] font-bold text-slate-700 dark:text-zinc-300 mb-1\">
                                                            {searchQuery ? `No modules match \"${searchQuery}\"` : termFilter !== 'all' ? `No modules in ${termFilter === 'prelims' ? 'Preliminaries' : termFilter === 'midterm' ? 'Midterm' : termFilter === 'prefinals' ? 'Pre-Finals' : 'Finals'}` : \"No modules found\"}
                                                        </h3>
                                                        <p className=\"text-[11px] font-medium text-slate-500 dark:text-zinc-500 tracking-wide\">
                                                            Nothing yet, so be ready!
                                                        </p>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key={paginatedModules.map(m => m.id).join('-')}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        transition={{ duration: 0.2, ease: \"easeOut\" }}
                                                        className=\"flex flex-col gap-3\"
                                                    >
                                                        {paginatedModules.map((m, index) => {
                                                            const globalIndex = startIndex + index;
                                                            const isSelected = m.id === selectedModuleId;
                                                            const completedCount = m.contents.filter(c => c.completed).length;
                                                            const progress = m.contents.length > 0 ? Math.round((completedCount / m.contents.length) * 100) : 0;
                                                            
                                                            let statusIcon;
                                                            if (m.status === 'locked') {
                                                                statusIcon = (
                                                                    <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2.5\" strokeLinecap=\"round\" strokeLinejoin=\"round\" className=\"opacity-80\">
                                                                        <rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\" ry=\"2\"></rect>
                                                                        <path d=\"M7 11V7a5 5 0 0 1 10 0v4\"></path>
                                                                    </svg>
                                                                );
                                                            } else if (progress === 100) {
                                                                statusIcon = (
                                                                    <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2.5\" strokeLinecap=\"round\" strokeLinejoin=\"round\">
                                                                        <path d=\"M22 11.08V12a10 10 0 1 1-5.93-9.14\"></path>
                                                                        <polyline points=\"22 4 12 14.01 9 11.01\"></polyline>
                                                                    </svg>
                                                                );
                                                            } else {
                                                                statusIcon = (
                                                                    <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2.5\" strokeLinecap=\"round\" strokeLinejoin=\"round\">
                                                                        <circle cx=\"12\" cy=\"12\" r=\"10\"></circle>
                                                                        <polygon points=\"10 8 16 12 10 16 10 8\"></polygon>
                                                                    </svg>
                                                                );
                                                            }

                                                            return (
                                                                <motion.button
                                                                    key={m.id}
                                                                    onClick={() => setSelectedModuleId(m.id)}
                                                                    whileHover={m.status !== 'locked' ? { scale: 1.02, y: -2 } : {}}
                                                                    whileTap={m.status !== 'locked' ? { scale: 0.98 } : {}}
                                                                    className={`relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border transition-colors duration-200 min-w-[250px] lg:min-w-0 w-full ${
                                                                        isSelected 
                                                                            ? 'bg-white border-blue-200/80 shadow-sm dark:bg-zinc-900 dark:border-blue-800/50 hover:shadow-md hover:border-blue-200/80 dark:hover:border-blue-800/50 group' 
                                                                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 group'
                                                                    } ${m.status === 'locked' ? 'opacity-70 grayscale-[0.2]' : ''}`}
                                                                >
                                                                    {/* SaaS Background Accents */}
                                                                    {isSelected && (
                                                                        <>
                                                                            <div className=\"absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-300 group-hover:scale-150\" aria-hidden=\"true\" />
                                                                            <div className=\"absolute bottom-0 left-0 -ml-12 -mb-12 w-24 h-24 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-300 group-hover:scale-150\" aria-hidden=\"true\" />
                                                                        </>
                                                                    )}

                                                                    <div className=\"flex items-center gap-3.5 min-w-0 flex-1 relative z-10\">
                                                                        {/* Custom Icon Container */}
                                                                        <motion.div
                                                                            whileHover={m.status !== 'locked' ? { scale: 1.05, rotate: -5 } : {}}
                                                                            transition={{ type: \"spring\", stiffness: 400, damping: 15 }}
                                                                            className={`w-11 h-11 rounded-[12px] flex items-center justify-center border shrink-0 shadow-sm relative transition-colors duration-200 ${
                                                                                m.status === 'locked'
                                                                                    ? 'border-zinc-200/40 dark:border-zinc-800/40 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 dark:text-zinc-500'
                                                                                    : isSelected
                                                                                        ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400'
                                                                                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20 group-hover:border-blue-200 dark:group-hover:border-blue-800/50 group-hover:text-blue-500 dark:group-hover:text-blue-400'
                                                                            }`}
                                                                        >
                                                                            {statusIcon}
                                                                        </motion.div>

                                                                        {/* Title text & Material description */}
                                                                        <div className=\"min-w-0 flex-1 text-left flex flex-col items-start justify-center\">
                                                                            <p className={`text-[14px] font-bold leading-snug tracking-tight transition-colors truncate pr-1 w-full ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400'}`} title={m.title}>
                                                                                {m.title.replace(/^Module \d+:\s*/i, '').replace(/^Chapter \d+:\s*/i, '').replace(/^Unit \d+:\s*/i, '')}
                                                                            </p>
                                                                            <p className=\"text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-normal mt-0.5 mb-2 truncate w-full\">
                                                                                {progress === 100 ? 'All contents completed.' : m.status === 'locked' ? getLockedReason(m).short : 'Continue your progress.'}
                                                                            </p>
                                                                            <motion.div 
                                                                                whileHover={{ scale: 1.03 }}
                                                                                whileTap={{ scale: 0.97 }}
                                                                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border shadow-sm transition-colors duration-150 ${
                                                                                    isSelected
                                                                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200/80 dark:border-blue-800/50 text-blue-600 dark:text-blue-400'
                                                                                        : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 group-hover:border-blue-200/80 dark:group-hover:border-blue-800/50 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                                                                }`}
                                                                            >
                                                                                <span className=\"shrink-0 flex items-center justify-center w-3.5 h-3.5 transition-colors\">
                                                                                    <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2.5\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><path d=\"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20\"></path></svg>
                                                                                </span>
                                                                                <span>MODULE {globalIndex + 1}</span>
                                                                            </motion.div>
                                                                        </div>
                                                                    </div>
                                                                    {/* Action / Percentage Badge Redesign */}
                                                                    {(() => {
                                                                        const radius = 10;
                                                                        const circumference = 2 * Math.PI * radius;
                                                                        const strokeDashoffset = circumference - (progress / 100) * circumference;

                                                                        return (
                                                                            <div className=\"relative w-auto h-10 px-3 flex items-center justify-center shrink-0 ml-3 z-10 bg-zinc-50 dark:bg-zinc-800/50 rounded-[12px] border border-zinc-200/80 dark:border-zinc-700 shadow-sm transition-all duration-300 group-hover:border-blue-200 dark:group-hover:border-blue-700/50 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20\">
                                                                                {progress === 100 ? (
                                                                                    <div className=\"flex items-center gap-1.5\">
                                                                                        <svg className=\"w-4 h-4 text-emerald-500 dark:text-emerald-400\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"3\" viewBox=\"0 0 24 24\" strokeLinecap=\"round\" strokeLinejoin=\"round\">
                                                                                            <polyline points=\"20 6 9 17 4 12\" />
                                                                                        </svg>
                                                                                        <span className=\"text-[11px] font-bold text-emerald-600 dark:text-emerald-400\">DONE</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className=\"flex items-center gap-1.5\">
                                                                                        <div className=\"relative w-4 h-4 flex items-center justify-center\">
                                                                                            <svg className=\"w-full h-full transform -rotate-90\" viewBox=\"0 0 24 24\">
                                                                                                <circle cx=\"12\" cy=\"12\" r={radius} fill=\"transparent\" stroke=\"currentColor\" strokeWidth=\"4\" className=\"text-zinc-200 dark:text-zinc-700\" />
                                                                                                <motion.circle
                                                                                                    cx=\"12\" cy=\"12\" r={radius} fill=\"transparent\" stroke=\"currentColor\" strokeWidth=\"4\" strokeLinecap=\"round\"
                                                                                                    strokeDasharray={circumference}
                                                                                                    initial={{ strokeDashoffset: circumference }}
                                                                                                    animate={{ strokeDashoffset }}
                                                                                                    transition={{ duration: 0.8, ease: \"easeOut\" }}
                                                                                                    className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'}
                                                                                                />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <span className={`text-[11px] font-bold tracking-tight ${
                                                                                            isSelected
                                                                                                ? 'text-blue-700 dark:text-blue-400'
                                                                                                : 'text-blue-700 dark:text-blue-400 transition-colors duration-200'
                                                                                        }`}>
                                                                                            {progress}%
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </motion.button>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Pagination Controls */}
                                        {filteredModules.length > 3 && (
                                            <div className=\"w-full pt-2.5 mt-2.5 border-t border-zinc-100 dark:border-zinc-800/80\">
                                                <div className=\"flex items-center justify-between w-full gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-[14px] border border-zinc-200/60 dark:border-zinc-700/50 shadow-sm transition-all duration-300 hover:shadow-md\">
                                                    <motion.button 
                                                        type=\"button\"
                                                        onClick={() => setModulesPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentPage === 1}
                                                        whileHover={currentPage > 1 ? { scale: 1.05 } : {}}
                                                        whileTap={currentPage > 1 ? { scale: 0.95 } : {}}
                                                        className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors duration-150 shadow-sm cursor-pointer border ${
                                                            currentPage === 1
                                                                ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                                                : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                                                        }`}
                                                    >
                                                        <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"3\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" d=\"M15 19l-7-7 7-7\" /></svg>
                                                    </motion.button>
                                                    <span className=\"text-[13px] font-bold text-zinc-700 dark:text-zinc-300 text-center tracking-wide flex-1\">
                                                        Page {currentPage} <span className=\"text-zinc-400 dark:text-zinc-500 font-medium mx-0.5\">/</span> {totalPages}
                                                    </span>
                                                    <motion.button 
                                                        type=\"button\"
                                                        onClick={() => setModulesPage(prev => Math.min(prev + 1, totalPages))}
                                                        disabled={currentPage === totalPages}
                                                        whileHover={currentPage < totalPages ? { scale: 1.05 } : {}}
                                                        whileTap={currentPage < totalPages ? { scale: 0.95 } : {}}
                                                        className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-colors duration-150 shadow-sm cursor-pointer border ${
                                                            currentPage === totalPages
                                                                ? 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/40 text-zinc-300 dark:text-zinc-700 cursor-not-allowed'
                                                                : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 hover:border-blue-300 dark:hover:border-blue-500'
                                                        }`}
                                                    >
                                                        <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"3\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" d=\"M9 5l7 7-7 7\" /></svg>
                                                    </motion.button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Detail Panel */}
                                    <div className=\"flex-1 min-w-0\" ref={modulesScrollRef}>
                                        <AnimatePresence mode=\"wait\">
                                            {filteredModules.length === 0 ? (
                                                <motion.div
                                                    key=\"empty-detail-modules\"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                                    className=\"h-full\"
                                                >
                                                    <EmptyState
                                                        icon={
                                                            <svg width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"1.5\" strokeLinecap=\"round\">
                                                                <path d=\"M4 19.5A2.5 2.5 0 0 1 6.5 17H20\" />
                                                                <path d=\"M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z\" />
                                                                <path d=\"M8 7h8M8 11h6M8 15h4\" />
                                                            </svg>
                                                        }
                                                        title={searchQuery ? `No modules match \"${searchQuery}\"` : termFilter !== 'all' ? `No modules in ${termFilter === 'prelims' ? 'Preliminaries' : termFilter === 'midterm' ? 'Midterm' : termFilter === 'prefinals' ? 'Pre-Finals' : 'Finals'}` : \"No modules found\"}
                                                        description=\"Nothing yet, so be ready!\"
                                                        className=\"h-full min-h-[480px]\"
                                                        action={(searchQuery || termFilter !== 'all') ? {
                                                            label: searchQuery ? 'Clear search' : 'Show all',
                                                            onClick: () => { setSearchQuery(''); setTermFilter('all'); }
                                                        } : undefined}
                                                    />
                                                </motion.div>
                                            ) : selectedModule && (
                                                <motion.div
                                                    key={selectedModule.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                                >
                                                    <ModuleCard module={selectedModule} index={filteredModules.findIndex(m => m.id === selectedModule.id)} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })()}"""

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content[:start_idx] + replacement + content[end_idx:])
    print("Successfully replaced.")
else:
    print("Target not found.")
