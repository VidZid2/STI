/**
 * AddTaskModal
 * Extracted from CourseViewPage.tsx during Phase 1.1
 * Teacher-mode modal for creating new course tasks.
 */
import * as React from 'react';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createTask, type CreateTaskInput } from '../../../../../services/taskService';

type TaskCategory = 'all' | 'assignment' | 'performance' | 'quiz' | 'practical' | 'journal' | 'overdue';

const TASK_CATEGORIES: { id: TaskCategory; label: string; icon: React.ReactNode; color: string }[] = [
    {
        id: 'assignment', label: 'Assignments', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ), color: 'emerald'
    },
    {
        id: 'performance', label: 'Performance Tasks', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
        ), color: 'purple'
    },
    {
        id: 'quiz', label: 'Quizzes', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ), color: 'amber'
    },
    {
        id: 'practical', label: 'Practical Exams', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
        ), color: 'rose'
    },
    {
        id: 'journal', label: 'Journals', icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
        ), color: 'cyan'
    },
];

interface AddTaskModalProps {
    isOpen: boolean;
    isTeacherMode: boolean;
    courseId: string;
    onClose: () => void;
    onTaskCreated?: () => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
    isOpen,
    isTeacherMode,
    courseId,
    onClose,
    onTaskCreated,
}) => {
    const [selectedTaskType, setSelectedTaskType] = React.useState<TaskCategory>('assignment');
    const [newTaskTitle, setNewTaskTitle] = React.useState('');
    const [newTaskDescription, setNewTaskDescription] = React.useState('');
    const [newTaskDueDate, setNewTaskDueDate] = React.useState('');
    const [newTaskPoints, setNewTaskPoints] = React.useState('100');
    const [newTaskInstructions, setNewTaskInstructions] = React.useState('');
    const [newTaskFiles, setNewTaskFiles] = React.useState<File[]>([]);
    const [isCreatingTask, setIsCreatingTask] = React.useState(false);
    const taskFileInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskDueDate('');
        setNewTaskPoints('100');
        setNewTaskInstructions('');
        setNewTaskFiles([]);
    };

    const handleClose = () => {
        onClose();
        resetForm();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 pt-16 pb-4 px-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className={`rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-full ${isTeacherMode ? 'bg-zinc-900' : 'bg-white'}`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between px-5 py-4 border-b ${isTeacherMode ? 'border-zinc-700' : 'border-zinc-100'}`}>
                            <div>
                                <h3 className={`text-base font-semibold ${isTeacherMode ? 'text-white' : 'text-zinc-800'}`}>Create Task</h3>
                                <p className={`text-xs mt-0.5 ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Add a new task for your students</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleClose}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isTeacherMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'}`}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Task Type Pills */}
                            <div>
                                <label className={`text-xs font-medium mb-2 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {TASK_CATEGORIES.map((cat) => (
                                        <motion.button
                                            key={cat.id}
                                            whileTap={{ scale: 0.97 }}
                                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${selectedTaskType === cat.id
                                                ? 'bg-blue-600 text-white'
                                                : isTeacherMode
                                                    ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                                }`}
                                            onClick={() => setSelectedTaskType(cat.id)}
                                        >
                                            {cat.icon}
                                            {cat.label.replace('s', '')}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className={`text-xs font-medium mb-1.5 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Enter task title..."
                                    className={`w-full h-10 px-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isTeacherMode
                                        ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                                        : 'bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400'
                                        }`}
                                />
                            </div>

                            {/* Due Date and Points */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`text-xs font-medium mb-1.5 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                        Due Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={newTaskDueDate}
                                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                                        className={`w-full h-10 px-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isTeacherMode
                                            ? 'bg-zinc-800 border-zinc-700 text-white [color-scheme:dark]'
                                            : 'bg-white border border-zinc-200 text-zinc-900'
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-xs font-medium mb-1.5 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Points</label>
                                    <input
                                        type="number"
                                        value={newTaskPoints}
                                        onChange={(e) => setNewTaskPoints(e.target.value)}
                                        placeholder="100"
                                        min="0"
                                        className={`w-full h-10 px-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isTeacherMode
                                            ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                                            : 'bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400'
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className={`text-xs font-medium mb-1.5 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Description</label>
                                <textarea
                                    value={newTaskDescription}
                                    onChange={(e) => setNewTaskDescription(e.target.value)}
                                    placeholder="Brief description..."
                                    rows={2}
                                    className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none ${isTeacherMode
                                        ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                                        : 'bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400'
                                        }`}
                                />
                            </div>

                            {/* Instructions */}
                            <div>
                                <label className={`text-xs font-medium mb-1.5 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Instructions</label>
                                <textarea
                                    value={newTaskInstructions}
                                    onChange={(e) => setNewTaskInstructions(e.target.value)}
                                    placeholder="Detailed instructions for students..."
                                    rows={3}
                                    className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none ${isTeacherMode
                                        ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                                        : 'bg-white border border-zinc-200 text-zinc-900 placeholder-zinc-400'
                                        }`}
                                />
                            </div>

                            {/* File Attachments */}
                            <div>
                                <label className={`text-xs font-medium mb-1.5 block ${isTeacherMode ? 'text-zinc-400' : 'text-zinc-600'}`}>Attachments</label>
                                <input
                                    ref={taskFileInputRef}
                                    type="file"
                                    multiple
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setNewTaskFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }
                                    }}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                                />
                                <motion.div
                                    onClick={() => newTaskFiles.length === 0 && taskFileInputRef.current?.click()}
                                    whileHover={newTaskFiles.length === 0 ? "animate" : undefined}
                                    className={`p-6 group/file block rounded-2xl w-full relative border-2 border-dashed transition-colors ${newTaskFiles.length === 0
                                        ? isTeacherMode
                                            ? "cursor-pointer border-zinc-700 hover:border-blue-500 bg-zinc-800/50"
                                            : "cursor-pointer border-gray-200 hover:border-blue-400 bg-gray-50/50"
                                        : isTeacherMode
                                            ? "border-zinc-700 bg-zinc-800/50"
                                            : "border-gray-200 bg-gray-50/50"
                                        }`}
                                >
                                    <AnimatePresence mode="wait">
                                        {newTaskFiles.length === 0 ? (
                                            <motion.div
                                                key="upload-area"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col items-center justify-center"
                                            >
                                                <div className="relative w-full max-w-xl mx-auto mb-4 flex items-center justify-center">
                                                    <div className="relative h-20 w-20">
                                                        <motion.div
                                                            variants={{
                                                                initial: { x: 0, y: 0 },
                                                                animate: { x: 20, y: -20, opacity: 0.9 }
                                                            }}
                                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                            className={`relative group-hover/file:shadow-xl z-40 flex items-center justify-center h-20 w-20 rounded-xl shadow-md ${isTeacherMode ? 'bg-zinc-800 border border-zinc-600' : 'bg-white border border-gray-200'}`}
                                                        >
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isTeacherMode ? "#71717a" : "#9ca3af"} strokeWidth="2" strokeLinecap="round">
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                <polyline points="17 8 12 3 7 8" />
                                                                <line x1="12" y1="3" x2="12" y2="15" />
                                                            </svg>
                                                        </motion.div>
                                                        <motion.div
                                                            variants={{ initial: { opacity: 0 }, animate: { opacity: 1 } }}
                                                            className="absolute top-0 left-0 opacity-0 border-2 border-dashed border-blue-400 z-30 bg-transparent h-20 w-20 rounded-xl"
                                                        />
                                                    </div>
                                                </div>
                                                <p className={`font-semibold text-sm ${isTeacherMode ? 'text-zinc-300' : 'text-gray-700'}`}>Upload files</p>
                                                <p className={`font-normal text-xs mt-1 ${isTeacherMode ? 'text-zinc-500' : 'text-gray-400'}`}>PDF, DOC, PPT, Images (Max 10MB)</p>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="file-list"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex flex-col gap-2"
                                            >
                                                <AnimatePresence mode="popLayout">
                                                    {newTaskFiles.slice(0, 2).map((file, idx) => (
                                                        <motion.div
                                                            key={"file" + idx}
                                                            layout
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                            transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                                                            className={`relative overflow-hidden z-40 flex flex-col items-start justify-start p-3 w-full rounded-xl shadow-sm ${isTeacherMode ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-200'}`}
                                                        >
                                                            <div className="flex justify-between w-full items-center gap-3">
                                                                <p className={`text-sm font-medium truncate flex-1 min-w-0 ${isTeacherMode ? 'text-zinc-200' : 'text-gray-800'}`}>{file.name}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`rounded-lg px-2 py-0.5 text-xs ${isTeacherMode ? 'text-emerald-400 bg-emerald-900/30 border border-emerald-800' : 'text-emerald-600 bg-emerald-50 border border-emerald-200'}`}>
                                                                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                                    </span>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setNewTaskFiles(prev => prev.filter((_, i) => i !== idx)); }}
                                                                        className={`p-1 rounded-full transition-colors ${isTeacherMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-100'}`}
                                                                    >
                                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={isTeacherMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'}>
                                                                            <path d="M18 6L6 18M6 6l12 12" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className={`flex text-xs flex-row items-center w-full mt-1.5 justify-between ${isTeacherMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                                                                <span className={`px-2 py-0.5 rounded-md ${isTeacherMode ? 'bg-zinc-700' : 'bg-gray-100'}`}>{file.type || "Unknown type"}</span>
                                                                <span>modified {new Date(file.lastModified).toLocaleDateString()}</span>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                    {newTaskFiles.length > 2 && (
                                                        <motion.div
                                                            key="collapsed-summary"
                                                            layout
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                            className={`relative z-40 flex items-center p-3 w-full rounded-xl ${isTeacherMode ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-800' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex -space-x-2">
                                                                    {newTaskFiles.slice(2, 5).map((_, i) => (
                                                                        <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1 }}
                                                                            className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm ${isTeacherMode ? 'bg-zinc-800 border border-blue-700' : 'bg-white border border-blue-200'}`}>
                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
                                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                                <polyline points="14 2 14 8 20 8" />
                                                                            </svg>
                                                                        </motion.div>
                                                                    ))}
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className={`text-xs font-medium ${isTeacherMode ? 'text-blue-400' : 'text-blue-700'}`}>
                                                                        +{newTaskFiles.length - 2} more {newTaskFiles.length - 2 === 1 ? 'file' : 'files'}
                                                                    </p>
                                                                    <p className={`text-[10px] ${isTeacherMode ? 'text-blue-500' : 'text-blue-500'}`}>
                                                                        {(newTaskFiles.slice(2).reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB total
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <motion.button
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                    onClick={(e) => { e.stopPropagation(); taskFileInputRef.current?.click(); }}
                                                    className={`w-full py-2.5 px-4 rounded-xl border-2 border-dashed text-sm font-medium hover:border-blue-400 hover:text-blue-500 transition-colors mt-1 ${isTeacherMode ? 'border-zinc-600 text-zinc-400' : 'border-gray-300 text-gray-500'}`}
                                                >
                                                    + Add more files
                                                </motion.button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`px-5 py-3 border-t flex items-center justify-end gap-2 ${isTeacherMode ? 'border-zinc-700' : 'border-zinc-100'}`}>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleClose}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isTeacherMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'}`}
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                disabled={!newTaskTitle || !newTaskDueDate || isCreatingTask}
                                onClick={async () => {
                                    setIsCreatingTask(true);
                                    try {
                                        const taskInput: CreateTaskInput = {
                                            courseId,
                                            type: (selectedTaskType === 'all' || selectedTaskType === 'overdue') ? 'assignment' : selectedTaskType,
                                            title: newTaskTitle,
                                            description: newTaskDescription,
                                            instructions: newTaskInstructions,
                                            dueDate: newTaskDueDate,
                                            points: parseInt(newTaskPoints) || 100,
                                            files: newTaskFiles.length > 0 ? newTaskFiles : undefined
                                        };
                                        const createdTask = await createTask(taskInput);
                                        if (createdTask) {
                                            console.log('[AddTaskModal] Task created:', createdTask.id);
                                            onTaskCreated?.();
                                        }
                                    } catch (err) {
                                        console.error('[AddTaskModal] Error:', err);
                                    } finally {
                                        setIsCreatingTask(false);
                                        handleClose();
                                    }
                                }}
                                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-1.5 ${!newTaskTitle || !newTaskDueDate || isCreatingTask
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {isCreatingTask ? (
                                    <>
                                        <motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                            animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                                        </motion.svg>
                                        Creating...
                                    </>
                                ) : 'Create Task'}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddTaskModal;
