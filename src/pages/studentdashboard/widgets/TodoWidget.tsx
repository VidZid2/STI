import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { TodoItem } from '../types';
import CreateGoalModal from '../content/GoalsContent/modals/CreateGoalModal';
import { fetchGoals, createGoal, updateGoalStatus, syncAllGoalsProgress } from '../../../services/goalsService';
import type { GoalWithProgress } from '../../../services/goalsService';
import { AnimatedCircularProgressBar } from '../../../components/ui/animated-circular-progress-bar';
import { Checkbox } from '../../../components/ui/r-checkbox';

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
    compactMode,
    onClose,
}) => {
    // Local input state
    const [localIsAdding, setLocalIsAdding] = useState(false);

    // Goals Database State
    const [goals, setGoals] = useState<GoalWithProgress[]>([]);
    
    const loadGoals = useCallback(async () => {
        const fetchedGoals = await fetchGoals();
        const syncedGoals = fetchedGoals.length > 0 ? await syncAllGoalsProgress() : [];
        setGoals(syncedGoals.length > 0 ? syncedGoals : fetchedGoals);
    }, []);

    useEffect(() => {
        loadGoals();
        const intervalId = setInterval(loadGoals, 3000);
        return () => clearInterval(intervalId);
    }, [loadGoals]);

    const handleCreateGoal = async (newGoalData: any) => {
        await createGoal(newGoalData);
        await loadGoals();
        setLocalIsAdding(false);
    };

    const handleToggleGoal = async (goal: GoalWithProgress) => {
        const newStatus = goal.status === 'completed' ? 'active' : 'completed';
        await updateGoalStatus(goal.id, newStatus);
        await loadGoals();
    };

    const completedGoalsCount = goals.filter(g => g.status === 'completed').length;
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
                        key={goals.length}
                        initial={{ scale: 1.3 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                        className={`px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-semibold ${compactMode ? 'text-[9px]' : 'text-[10px]'}`}
                    >
                        {goals.length}
                    </motion.span>
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
                onCreate={handleCreateGoal}
            />

            {/* Todo List */}
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {goals.length === 0 ? (
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
                            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-450 dark:hover:text-blue-350 transition-colors font-medium"
                        >
                            + Create New Goal
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.ul layout className="p-2 space-y-1">
                        <AnimatePresence mode="popLayout">
                            {goals.map((goal) => (
                                <motion.li
                                    key={goal.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    className="group flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                    {/* Checkbox and Status */}
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 flex items-center justify-center">
                                            <Checkbox
                                                checked={goal.status === 'completed'}
                                                id={`goal-${goal.id}`}
                                                onCheckedChange={() => handleToggleGoal(goal)}
                                            />
                                        </div>
                                        <AnimatePresence>
                                            {goal.status === 'completed' && (
                                                <motion.div
                                                    initial={{ width: 0, opacity: 0 }}
                                                    animate={{ width: 'auto', opacity: 1 }}
                                                    exit={{ width: 0, opacity: 0 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                    className="overflow-hidden whitespace-nowrap flex items-center"
                                                >
                                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider ml-2 flex items-center justify-center leading-none mt-[1px]">
                                                        DONE
                                                    </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Text */}
                                    <motion.span
                                        animate={{
                                            color: goal.status === 'completed' ? '#94a3b8' : 'currentColor',
                                            textDecoration: goal.status === 'completed' ? 'line-through' : 'none'
                                        }}
                                        transition={{ duration: 0.2 }}
                                        className={`flex-1 text-[13px] truncate ${goal.status === 'completed' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}
                                    >
                                        {goal.title}
                                    </motion.span>

                                    {/* View Full Details Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: 'goals' } }));
                                        }}
                                        className="text-[10px] font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                    >
                                        View full details
                                    </motion.button>
                                </motion.li>
                            ))}
                        </AnimatePresence>
                    </motion.ul>
                )}
            </div>

            {/* Progress Footer */}
            {goals.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AnimatedCircularProgressBar
                                max={goals.length}
                                min={0}
                                value={completedGoalsCount}
                                gaugePrimaryColor="rgb(59 130 246)"
                                gaugeSecondaryColor="rgba(148, 163, 184, 0.2)"
                                className="w-5 h-5 text-[8px]"
                            />
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {completedGoalsCount} of {goals.length} completed
                            </span>
                        </div>
                        {completedGoalsCount === goals.length && goals.length > 0 && (
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
                </motion.div>
            )}
        </motion.div>
    );
});

TodoWidget.displayName = 'TodoWidget';

export default TodoWidget;
