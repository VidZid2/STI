import { Component, type ErrorInfo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal } from '../ui/terminal';
import { RefreshCw } from 'lucide-react';
interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isExpanded: boolean;
  showModal: boolean;
  isAnalyzing: boolean;
  aiSuggestion: string | null;
}

const parseError = (errorMsg: string) => {
    const msg = errorMsg.toLowerCase();
    if (msg.includes("rendered more hooks") || msg.includes("rendered fewer hooks")) {
        return {
            title: "React Hook Rule Violation",
            description: "A hook (like useState or useEffect) was called conditionally, after an early return, or inside a loop.",
            fix: "Move all hooks to the top level of your component, outside of any if-statements or loops."
        };
    }
    if (msg.includes("undefined (reading") || msg.includes("null (reading")) {
        return {
            title: "Missing Data (Null/Undefined)",
            description: "The component tried to read a property from an object that doesn't exist or hasn't loaded yet.",
            fix: "Use optional chaining (e.g., data?.property) or add a loading state before rendering."
        };
    }
    if (msg.includes("not a function")) {
        return {
            title: "Invalid Function Call",
            description: "You tried to execute something that isn't a function. This often happens with missing or misspelled props.",
            fix: "Verify the props passed to this component, and check for typos in the function name."
        };
    }
    if (msg.includes("objects are not valid as a react child")) {
        return {
            title: "Invalid React Child",
            description: "You tried to render an entire object directly into the UI instead of a string, number, or component.",
            fix: "Ensure you are rendering specific properties (e.g., {user.name} instead of {user})."
        };
    }
    if (msg.includes("minified react error")) {
        return {
            title: "Production React Error",
            description: "A fatal React error occurred. The full message is hidden in production.",
            fix: "Use the link provided in the raw error below to view the full error details on the React website."
        };
    }
    return {
        title: "Unexpected Runtime Error",
        description: "The application encountered an unexpected error while executing the code.",
        fix: "Check the raw error details below and the browser console for more context."
    };
};

function ShiningText({text}: {text: string}) {
  return (
    <motion.h1
      className="m-0 bg-[linear-gradient(110deg,#10b981,35%,#fff,50%,#10b981,75%,#10b981)] dark:bg-[linear-gradient(110deg,#34d399,35%,#fff,50%,#34d399,75%,#34d399)] bg-[length:200%_100%] bg-clip-text text-[14px] font-medium text-transparent"
      initial={{ backgroundPosition: "200% 0" }}
      animate={{ backgroundPosition: "-200% 0" }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      }}
    >
      {text}
    </motion.h1>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isExpanded: false,
    showModal: false,
    isAnalyzing: false,
    aiSuggestion: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isExpanded: false, showModal: false, isAnalyzing: false, aiSuggestion: null };
  }

  private fetchAIAnalysis = async (error: Error, errorInfo: ErrorInfo) => {
    const apiKey = import.meta.env.VITE_OPENCODE_API_KEY;
    const baseUrl = import.meta.env.VITE_AI_BASE_URL && import.meta.env.VITE_AI_BASE_URL !== 'https://api.openai.com/v1/chat/completions' && import.meta.env.VITE_AI_BASE_URL !== 'https://opencode.ai/zen/v1/chat/completions'
        ? import.meta.env.VITE_AI_BASE_URL 
        : '/api/ai/zen/v1/chat/completions';
    
    if (!apiKey) {
      this.setState({ 
          aiSuggestion: "⚠️ API Key is missing! Vite could not read VITE_OPENCODE_API_KEY from .env.local. Make sure you restarted your dev server."
      });
      return;
    }

    this.setState({ isAnalyzing: true, aiSuggestion: null });

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'mimo-v2.5-free',
          messages: [
            {
              role: 'system',
              content: 'You are an expert React developer. Use HIGH THINKING REASONING. Provide a brutally honest, accurate, and concise 1-2 sentence fix for the following React error. Do not explain what it is, just tell the user exactly what to move or change based on the provided stack trace. Format any code references with backticks.'
            },
            {
              role: 'user',
              content: `Error: ${error.message}\n\nStack Trace:\n${errorInfo.componentStack}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const suggestion = data.choices?.[0]?.message?.content || "AI Analysis failed to generate a response.";
      
      this.setState({ aiSuggestion: suggestion, isAnalyzing: false });
    } catch (e) {
      this.setState({ 
          isAnalyzing: false,
          aiSuggestion: `⚠️ AI Analysis failed: ${(e as Error).message}. (Check if VITE_AI_BASE_URL is correct for opencode ai)`
      });
      console.error('AI Analysis failed', e);
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary - ${this.props.name || 'Global'}]`, error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    this.fetchAIAnalysis(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, isExpanded: false, showModal: false, isAnalyzing: false, aiSuggestion: null });
  };

  private toggleExpand = () => {
    this.setState(prev => ({ isExpanded: !prev.isExpanded }));
  };

  private closeModal = () => {
    this.setState({ showModal: false });
  };

  public render() {
    if (this.state.hasError) {
      const parsedError = this.state.error ? parseError(this.state.error.message) : null;

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full h-full min-h-[80vh] flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="relative w-full max-w-4xl min-h-[400px] flex items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Elegant Background Elements */}
            <div className="hidden sm:block absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" aria-hidden="true" />
            <div className="hidden sm:block absolute bottom-0 left-0 w-64 h-64 bg-orange-400/5 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" aria-hidden="true" />

            <div className="max-w-3xl w-full flex flex-col items-center justify-center text-center relative z-10">
            
              {/* Top: Image & Oops */}
              <div className="w-full max-w-md mx-auto">
                <div
                  className="bg-[url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif)] w-full h-[200px] sm:h-[250px] md:h-[300px] bg-center bg-no-repeat bg-contain"
                  aria-hidden="true"
                >
                  <h1 className="text-center font-bold text-5xl sm:text-6xl md:text-7xl pt-6 sm:pt-8 md:pt-10 tracking-tighter text-slate-900 dark:text-white drop-shadow-sm">
                    Oops!
                  </h1>
                </div>
              </div>

              {/* Middle: Subtitles & Primary Action */}
              <div className="-mt-10 sm:-mt-16 md:-mt-12 w-full flex flex-col items-center relative z-10">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-3">
                  Looks like something broke
                </h3>
                <p className="mb-6 text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium max-w-sm mx-auto leading-relaxed">
                  The component <span className="font-semibold text-slate-700 dark:text-slate-300">"{this.props.name || 'Application'}"</span> encountered a runtime error and crashed.
                </p>
                
                <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
                  <motion.button
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1, transition: { delay: 0.3 } }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={this.handleRetry}
                    className="flex-1 sm:flex-none py-2 sm:py-2.5 px-4 sm:px-5 text-[12px] sm:text-[13px] font-bold rounded-[14px] transition-colors shadow-sm flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/70 text-red-700 dark:text-red-300 focus-visible:ring-red-500"
                  >
                    <RefreshCw className="w-[18px] h-[18px]" strokeWidth={2.5} />
                    Try Again
                  </motion.button>
                  
                  {this.state.error && (
                    <motion.button
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1, transition: { delay: 0.4 } }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => this.setState({ showModal: true })}
                      className="w-fit py-2 sm:py-2.5 px-4 sm:px-5 text-[12px] sm:text-[13px] font-bold rounded-[14px] transition-colors shadow-sm flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 focus-visible:ring-slate-500"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      Debug Details
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Overlay for Premium Error Translation Card */}
            {this.state.showModal && this.state.error && parsedError && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xl rounded-[24px] flex flex-col text-left w-full max-w-xl relative overflow-hidden group"
                >
                  
                  {/* Premium Header matching InstructionsModal */}
                  <div className="relative border-b border-slate-200/60 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 p-3 pb-0 rounded-t-[24px]">
                      <div className="flex items-start gap-3 sm:gap-4 mb-2.5">
                          {/* Header Card */}
                          <div className="flex-1 relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm rounded-[20px] sm:rounded-[24px] flex items-center p-3 gap-3 group/header transition-all duration-300 hover:shadow-md hover:border-red-200/80 dark:hover:border-red-800/50 text-left">
                              
                              {/* SaaS Background Accents */}
                              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-red-500/10 dark:bg-red-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover/header:scale-150" aria-hidden="true" />
                              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-orange-400/10 dark:bg-orange-400/5 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover/header:scale-150" aria-hidden="true" />

                              <div className="bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-red-600 dark:text-red-400 relative z-10 transition-transform duration-300 group-hover/header:scale-105 group-hover/header:-rotate-3">
                                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                  </svg>
                              </div>
                              
                              <div className="relative z-10 flex-1 min-w-0 pr-2 sm:pr-4">
                                  <h2 className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-[16px] sm:text-[18px] mb-0.5 truncate">
                                      {parsedError.title}
                                  </h2>
                                  <p className="text-[12px] sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed m-0 truncate">
                                      System Error Details
                                  </p>
                              </div>
                              
                              <div className="relative z-20 self-start">
                                  <motion.button
                                      onClick={this.closeModal}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="flex-shrink-0 flex items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md p-2 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 focus:outline-none"
                                      aria-label="Close modal"
                                  >
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                  </motion.button>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6 sm:p-8 bg-white dark:bg-slate-800 overflow-y-auto max-h-[60vh] custom-scrollbar">
                      <p className="text-[14px] sm:text-[15px] font-medium text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                          {parsedError.description}
                      </p>
                      
                      <div className="mb-8">
                          <div className="flex items-center gap-2.5 mb-3">
                              <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>
                              </div>
                              <span className="text-[11.5px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                  Suggested Fix
                                  {this.state.aiSuggestion && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full dark:bg-emerald-900/50 dark:text-emerald-300 font-bold tracking-normal normal-case border border-emerald-200 dark:border-emerald-700/50">
                                      ✨ MiMo v2.5 AI Analysis
                                    </span>
                                  )}
                              </span>
                          </div>
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 flex flex-col group transition-all duration-300 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 w-full overflow-hidden text-[14px] text-emerald-900 dark:text-emerald-100 relative font-medium leading-relaxed">
                              {this.state.isAnalyzing ? (
                                <div className="pl-2 m-0 flex items-center gap-2">
                                    <ShiningText text="✨ MiMo v2.5 is analyzing the stack trace..." />
                                </div>
                              ) : (
                                <div className="pl-2 m-0 whitespace-pre-wrap markdown-content">
                                    {this.state.aiSuggestion || parsedError.fix}
                                </div>
                              )}
                          </div>
                      </div>

                      {/* Expandable Raw Error */}
                      <div className="pt-2">
                          <button 
                            onClick={this.toggleExpand}
                            className="flex items-center justify-between w-full p-3 sm:p-4 rounded-[16px] border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 group/btn focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                          >
                              <span className="flex items-center gap-3 text-[12px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                  <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm group-hover/btn:border-slate-300 transition-colors">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover/btn:text-slate-600 dark:group-hover/btn:text-slate-300 transition-colors"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                                  </div>
                                  Technical Details (Raw Error)
                              </span>
                              <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 group-hover/btn:border-slate-300 transition-colors">
                                  <svg className={`w-3.5 h-3.5 text-slate-400 group-hover/btn:text-slate-600 dark:group-hover/btn:text-slate-300 transition-transform duration-300 ${this.state.isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                              </div>
                          </button>
                          
                          <AnimatePresence>
                              {this.state.isExpanded && (
                                  <motion.div 
                                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                      transition={{ duration: 0.3, ease: "easeInOut" }}
                                      className="overflow-hidden"
                                  >
                                      <div className="mt-2 text-left">
                                          <Terminal
                                            username="System-Error"
                                            commands={[
                                                "diagnose --error",
                                                "cat error.log"
                                            ]}
                                            outputs={{
                                                0: [
                                                    "Analyzing application state...",
                                                    <span key="1" className="text-red-500 font-bold">✔ Diagnostic complete. Found 1 critical exception.</span>
                                                ],
                                                1: [
                                                    <span key="2" className="text-red-400 font-medium">{this.state.error.message}</span>,
                                                    "Check the console for full stack trace."
                                                ]
                                            }}
                                            typingSpeed={20}
                                            delayBetweenCommands={600}
                                          />
                                      </div>
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>
                  </div>

                </motion.div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
