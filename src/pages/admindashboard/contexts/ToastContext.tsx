import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, x: 50, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            className="pointer-events-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 p-4 flex items-start gap-3 min-w-[300px] max-w-sm overflow-hidden relative"
                        >
                            {/* Accent Line */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                toast.type === 'success' ? 'bg-emerald-500' :
                                toast.type === 'error' ? 'bg-red-500' :
                                toast.type === 'warning' ? 'bg-amber-500' :
                                'bg-blue-500'
                            }`} />

                            {/* Icon */}
                            <div className="shrink-0 mt-0.5">
                                {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
                                {toast.type === 'error' && <XCircle size={18} className="text-red-500" />}
                                {toast.type === 'warning' && <AlertTriangle size={18} className="text-amber-500" />}
                                {toast.type === 'info' && <Info size={18} className="text-blue-500" />}
                            </div>

                            {/* Message */}
                            <div className="flex-1 pr-6">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                                    {toast.message}
                                </p>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
