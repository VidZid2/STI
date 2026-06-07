import re

with open('.original_streak.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the close button
old_button = '''                            {/* Close button */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className={cn(
                                    'absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center transition-colors z-[60]',
                                    isDarkMode ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                                )}
                            >'''

new_button = '''                            {/* Close button */}
                            <motion.button
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                onClick={onClose}
                                className={cn(
                                    'absolute top-4 right-4 w-[36px] h-[36px] rounded-[14px] flex items-center justify-center transition-all duration-200 z-[60] border shadow-sm',
                                    isDarkMode 
                                        ? 'bg-zinc-800/90 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 hover:shadow-md' 
                                        : 'bg-white border-zinc-200/60 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 hover:shadow-md hover:border-zinc-300/60'
                                )}
                            >'''

content = content.replace(old_button, new_button)

# 2. Re-apply the scrollbar hiding to the content div
old_scroll_div = '''                            {/* Content */}
                            <div className='relative rounded-[24px] pt-5 sm:pt-8 px-4 sm:px-7 pb-4 sm:pb-6 flex flex-col gap-4 sm:gap-6 overflow-y-auto overflow-x-hidden max-h-[85vh] sm:max-h-[80vh] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:mt-4 [&::-webkit-scrollbar-track]:mb-4'>'''

new_scroll_div = '''                            {/* Content */}
                            <div 
                                onScroll={(e) => {
                                    if (!hasScrolled && e.currentTarget.scrollTop > 10) {
                                        setHasScrolled(true);
                                        sessionStorage.setItem('streak-modal-scrolled', 'true');
                                    }
                                }}
                                className='relative rounded-[24px] pt-5 sm:pt-8 px-4 sm:px-7 pb-4 sm:pb-6 flex flex-col gap-4 sm:gap-6 overflow-y-auto overflow-x-hidden max-h-[85vh] sm:max-h-[80vh] max-md:[&::-webkit-scrollbar]:hidden max-md:[-ms-overflow-style:none] max-md:[scrollbar-width:none] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:mt-4 [&::-webkit-scrollbar-track]:mb-4'
                            >'''

content = content.replace(old_scroll_div, new_scroll_div)

# 3. Add hasScrolled state to component
old_state = '''    const [isOpen, setIsOpen] = useState(false);
    const [tierLabel, setTierLabel] = useState<string>('');'''

new_state = '''    const [isOpen, setIsOpen] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);
    const [tierLabel, setTierLabel] = useState<string>('');'''

content = content.replace(old_state, new_state)

# 4. Add effect for session storage
old_effect = '''    useEffect(() => {
        if (!isOpen) {'''

new_effect = '''    useEffect(() => {
        setHasScrolled(sessionStorage.getItem('streak-modal-scrolled') === 'true');
    }, []);

    useEffect(() => {
        if (!isOpen) {'''

content = content.replace(old_effect, new_effect)

# 5. Insert Scroll Indicator
scroll_indicator = '''
                            {/* Scroll Indicator */}
                            <AnimatePresence>
                                {!hasScrolled && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 15, scale: 0.8 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className="md:hidden absolute bottom-8 left-0 right-0 mx-auto w-max flex flex-col items-center justify-center text-orange-500 dark:text-orange-400 z-[70] pointer-events-none drop-shadow-sm bg-white/95 dark:bg-zinc-800/95 px-5 py-2 rounded-full backdrop-blur-md border border-orange-200/60 dark:border-orange-500/30 shadow-lg"
                                    >
                                        <motion.div
                                            animate={{ y: [0, 4, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                            className="flex flex-col items-center justify-center"
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-widest pl-[0.1em] mb-0.5">Scroll</span>
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>'''

content = content.replace('                        </motion.div>', scroll_indicator, 1)

with open('src/components/modals/DailyStreakModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
