import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { TodoItem } from '../types';

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
    const [localText, setLocalText] = useState('');
    const [localIsAdding, setLocalIsAdding] = useState(false);
    const localInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when localIsAdding becomes true
    useEffect(() => {
        if (localIsAdding && localInputRef.current) {
            localInputRef.current.focus();
        }
    }, [localIsAdding]);

    const handleSubmit = useCallback(() => {
        if (!localText.trim()) return;
        setNewTodoText(localText);
        addTodo();
        setLocalText('');
        setLocalIsAdding(false);
    }, [localText, setNewTodoText, addTodo]);

    const handleCancel = useCallback(() => {
        setLocalText('');
        setLocalIsAdding(false);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            className={`bg-white rounded-xl border border-zinc-100/80 overflow-hidden ${compactMode ? 'shadow-none' : 'shadow-sm'}`}
            id="todo-widget"
        >
            {/* Header */}
            <div className={`flex items-center justify-between ${compactMode ? 'px-3 py-2' : 'px-4 py-3'}`}>
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 flex items-center justify-center ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                    >
                        <svg className={`text-amber-500 ${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </motion.div>
                    <span className={`font-medium text-zinc-700 ${compactMode ? 'text-xs' : 'text-sm'}`}>To-do</span>
                    <motion.span
                        key={todos.length}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                        className={`px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}
                    >
                        {todos.length}
                    </motion.span>
                    {completedCount > 0 && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`text-emerald-500 ${compactMode ? 'text-[8px]' : 'text-[10px]'}`}
                        >
                            {completedCount} done
                        </motion.span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setLocalIsAdding(true)}
                        className={`flex items-center justify-center rounded-md text-blue-500 hover:text-blue-600 transition-${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                    >
                        <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </motion.button>
                    {todos.length > 0 && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={clearAllTodos}
                            className={`flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 transition-${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                            title="Clear all tasks"
                        >
                            <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onClose()}
                        className={`flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 transition-${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                    >
                        <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </motion.button>
                </div>
            </div>

            {/* Add Todo Input */}
            <AnimatePresence>
                {localIsAdding && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-b border-zinc-50"
                    >
                        <div className="p-3 flex items-center gap-2">
                            <input
                                ref={localInputRef}
                                type="text"
                                value={localText}
                                onChange={(e) => setLocalText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSubmit();
                                    if (e.key === 'Escape') handleCancel();
                                }}
                                placeholder="What needs to be done?"
                                className="flex-1 text-sm bg-zinc-50 rounded-lg px-3 py-2 border-none outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-zinc-400"
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSubmit}
                                disabled={!localText.trim()}
                                className="px-3 py-2 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-"
                            >
                                Add
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCancel}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Todo List */}
            <div className="max-h-64 overflow-y-auto">
                {todos.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-4 py-8 flex flex-col items-center justify-center"
                    >
                        <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-sm text-zinc-400 mb-2">No tasks yet</p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setLocalIsAdding(true)}
                            className="text-xs text-blue-500 hover:text-blue-600 transition-"
                        >
                            + Add your first task
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
                                    className="group flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50 transition-"
                                >
                                    {/* Checkbox */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleTodo(todo.id)}
                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${todo.completed
                                                ? 'bg-blue-500 border-blue-500'
                                                : 'border-zinc-300 hover:border-blue-400 hover:bg-blue-50'
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
                                            color: todo.completed ? '#a1a1aa' : '#3f3f46',
                                            textDecoration: todo.completed ? 'line-through' : 'none'
                                        }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-1 text-[13px]"
                                    >
                                        {todo.text}
                                    </motion.span>

                                    {/* Delete button */}
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => deleteTodo(todo.id)}
                                        className="w-6 h-6 flex items-center justify-center rounded-md text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
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
                    className="px-3 py-2.5 border-t border-zinc-100 bg-zinc-50/30"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-zinc-500 font-medium">
                            {completedCount} of {todos.length} completed
                        </span>
                        {completedCount === todos.length && todos.length > 0 && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className="text-[10px] text-blue-500 font-medium flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                All done!
                            </motion.span>
                        )}
                    </div>
                    <div className="h-1.5 bg-zinc-200/60 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%` }}
                            transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.1 }}
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                        />
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
});

TodoWidget.displayName = 'TodoWidget';

export default TodoWidget;
