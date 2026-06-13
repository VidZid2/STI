import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { TodoItem } from '../types';
import CreateGoalModal from '../content/GoalsContent/modals/CreateGoalModal';

interface TodoWidgetProps {
    todos: TodoItem[];
    addTodo: () => void;
    toggleTodo: (id: string) => void;
    deleteTodo: (id: string) => void;
    clearAllTodos: () => void;
    completedCount: number;
    setNewTodoText: (text: string) => void;
    compactMode: boolean;
    onClose: () => void;
}

export const TodoWidget = React.memo<TodoWidgetProps>(({
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearAllTodos,
    completedCount,
    setNewTodoText,
    compactMode,
    onClose,
}) => {
    // Phase 1B: Local input state to prevent parent re-renders while typing

    const [localIsAdding, setLocalIsAdding] = useState(false);
    const localInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when localIsAdding becomes true
    useEffect(() => {
        if (localIsAdding && localInputRef.current) {
            localInputRef.current.focus();
        }
    }, [localIsAdding]);



    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ y: -2 }}
            className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[20px] overflow-hidden transition-all duration-300 hover:border-slate-350 dark:hover:border-slate-650 ${compactMode ? 'shadow-none' : 'shadow-sm hover:shadow-md'}`}
            id="todo-widget"
        >
            {/* Header */}
            <div className={`flex items-center justify-between ${compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`rounded-xl bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100/30 dark:border-orange-850/30 flex items-center justify-center ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                    >
                        <svg className={`text-amber-600 dark:text-amber-400 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </motion.div>
                    <span className={`font-bold text-slate-800 dark:text-slate-200 ${compactMode ? 'text-xs' : 'text-sm'}`}>Goal</span>
                    <motion.span
                        key={todos.length}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                        className={`px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}
                    >
                        {todos.length}
                    </motion.span>
                    {completedCount > 0 && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`text-emerald-600 dark:text-emerald-450 font-medium ${compactMode ? 'text-[8px]' : 'text-[10px]'}`}
                        >
                            {completedCount} done
                        </motion.span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setLocalIsAdding(true)}
                        className={`flex items-center justify-center rounded-md text-blue-500 hover:text-blue-600 dark:text-blue-450 dark:hover:text-blue-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                    >
                        <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </motion.button>
                    {todos.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={clearAllTodos}
                            className={`flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 dark:text-slate-550 dark:hover:text-red-450 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                            title="Clear all tasks"
                        >
                            <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onClose()}
                        className={`flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                    >
                        <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </motion.button>
                </div>
            </div>

            {/* Goal Modal */}
            <CreateGoalModal
                isOpen={localIsAdding}
                onClose={() => setLocalIsAdding(false)}
                onCreate={(goal) => {
                    setNewTodoText(goal.title);
                    addTodo();
                    setLocalIsAdding(false);
                }}
            />

            {/* Todo List */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {todos.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-4 py-8 flex flex-col items-center justify-center"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm text-slate-400 dark:text-slate-500 mb-2">No tasks yet</p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setLocalIsAdding(true)}
                            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-450 dark:hover:text-blue-350 transition-colors"
                        >
                            + Create a goal please
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.ul layout className="p-2 space-y-1">
                        <AnimatePresence mode="popLayout">
                            {todos.map((todo) => (
                                <motion.li
                                    key={todo.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="group flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                    {/* Checkbox */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleTodo(todo.id)}
                                        className={`w-5 h-5 rounded-[4px] border-[1.5px] flex items-center justify-center transition-all duration-200 ${todo.completed
                                                ? 'bg-blue-500 border-blue-500 text-white'
                                                : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20'
                                            }`}
                                    >
                                        <AnimatePresence>
                                            {todo.completed && (
                                                <motion.svg
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                                    className="w-3 h-3 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </motion.svg>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>

                                    {/* Text */}
                                    <motion.span
                                        animate={{
                                            color: todo.completed ? '#94a3b8' : 'currentColor',
                                            textDecoration: todo.completed ? 'line-through' : 'none'
                                        }}
                                        transition={{ duration: 0.2 }}
                                        className={`flex-1 text-[13px] ${todo.completed ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}
                                    >
                                        {todo.text}
                                    </motion.span>

                                    {/* Delete button */}
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => deleteTodo(todo.id)}
                                        className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-450 hover:bg-slate-100 dark:hover:bg-slate-700/50 opacity-0 group-hover:opacity-100 transition-all duration-150"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </motion.button>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </motion.ul>
                )}
            </div>

            {/* Progress Footer */}
            {todos.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {completedCount} of {todos.length} completed
                        </span>
                        {completedCount === todos.length && todos.length > 0 && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className="text-[10px] text-blue-500 dark:text-blue-400 font-medium flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                All done!
                            </motion.span>
                        )}
                    </div>
                    <div className="h-1.5 bg-slate-200/60 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%` }}
                            transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.1 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 rounded-full"
                        />
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
});

TodoWidget.displayName = 'TodoWidget';

export default TodoWidget;
