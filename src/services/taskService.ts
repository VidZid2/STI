/**
 * Task Service - Handles course tasks with Supabase storage
 * 
 * Features:
 * - Create, read, update, delete tasks
 * - File upload to Supabase Storage
 * - Task attachments management
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Task types
export interface TaskAttachment {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedAt: string;
}

export interface CourseTask {
    id: string;
    courseId: string;
    type: 'assignment' | 'performance' | 'quiz' | 'practical' | 'journal';
    title: string;
    description: string;
    instructions: string;
    dueDate: string;
    points: number;
    attachments: TaskAttachment[];
    status: 'draft' | 'published' | 'closed';
    createdAt: string;
    updatedAt: string;
    createdBy: string;
}

export interface CreateTaskInput {
    courseId: string;
    type: CourseTask['type'];
    title: string;
    description?: string;
    instructions?: string;
    dueDate: string;
    points?: number;
    files?: File[];
}

const STORAGE_BUCKET = 'task-attachments';
const TASKS_TABLE = 'course_tasks';

/**
 * Upload a file to Supabase Storage
 */
export const uploadTaskFile = async (
    file: File,
    courseId: string,
    taskId: string
): Promise<TaskAttachment | null> => {
    if (!isSupabaseConfigured() || !supabase) {
        console.error('[TaskService] Supabase not configured');
        return null;
    }

    try {
        // Create unique file path: courseId/taskId/timestamp_filename
        const timestamp = Date.now();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${courseId}/${taskId}/${timestamp}_${sanitizedName}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('[TaskService] Upload error:', error);
            return null;
        }

        // Get public URL for the file
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(data.path);

        const attachment: TaskAttachment = {
            id: `${timestamp}_${Math.random().toString(36).slice(2, 9)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            url: urlData.publicUrl,
            uploadedAt: new Date().toISOString()
        };

        console.log('[TaskService] File uploaded:', attachment.name);
        return attachment;
    } catch (err) {
        console.error('[TaskService] Upload failed:', err);
        return null;
    }
};

/**
 * Upload multiple files
 */
export const uploadTaskFiles = async (
    files: File[],
    courseId: string,
    taskId: string
): Promise<TaskAttachment[]> => {
    const attachments: TaskAttachment[] = [];
    
    for (const file of files) {
        const attachment = await uploadTaskFile(file, courseId, taskId);
        if (attachment) {
            attachments.push(attachment);
        }
    }
    
    return attachments;
};

/**
 * Delete a file from Supabase Storage
 */
export const deleteTaskFile = async (
    filePath: string
): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) {
        return false;
    }

    try {
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([filePath]);

        if (error) {
            console.error('[TaskService] Delete error:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[TaskService] Delete failed:', err);
        return false;
    }
};

/**
 * Create a new task with file attachments
 */
export const createTask = async (input: CreateTaskInput): Promise<CourseTask | null> => {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    // Upload files first if any
    let attachments: TaskAttachment[] = [];
    if (input.files && input.files.length > 0) {
        attachments = await uploadTaskFiles(input.files, input.courseId, taskId);
    }

    const task: CourseTask = {
        id: taskId,
        courseId: input.courseId,
        type: input.type,
        title: input.title,
        description: input.description || '',
        instructions: input.instructions || '',
        dueDate: input.dueDate,
        points: input.points || 100,
        attachments,
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: localStorage.getItem('student_id') || 'unknown'
    };

    // Save to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
        try {
            const { error } = await supabase
                .from(TASKS_TABLE)
                .insert({
                    id: task.id,
                    course_id: task.courseId,
                    type: task.type,
                    title: task.title,
                    description: task.description,
                    instructions: task.instructions,
                    due_date: task.dueDate,
                    points: task.points,
                    attachments: task.attachments,
                    status: task.status,
                    created_by: task.createdBy
                });

            if (error) {
                console.error('[TaskService] Save error:', error);
                // Still save locally even if DB fails
            } else {
                console.log('[TaskService] Task saved to database');
            }
        } catch (err) {
            console.error('[TaskService] Database error:', err);
        }
    }

    // Also save to localStorage for offline support
    saveTaskLocally(task);
    
    return task;
};

/**
 * Get all tasks for a course
 */
export const getCourseTasks = async (courseId: string): Promise<CourseTask[]> => {
    // Try to load from Supabase first
    if (isSupabaseConfigured() && supabase) {
        try {
            const { data, error } = await supabase
                .from(TASKS_TABLE)
                .select('*')
                .eq('course_id', courseId)
                .order('created_at', { ascending: false });

            if (!error && data) {
                // Transform from DB format to app format
                const tasks: CourseTask[] = data.map(row => ({
                    id: row.id,
                    courseId: row.course_id,
                    type: row.type,
                    title: row.title,
                    description: row.description,
                    instructions: row.instructions,
                    dueDate: row.due_date,
                    points: row.points,
                    attachments: row.attachments || [],
                    status: row.status,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at,
                    createdBy: row.created_by
                }));
                
                // Update local cache
                tasks.forEach(task => saveTaskLocally(task));
                
                return tasks;
            }
        } catch (err) {
            console.error('[TaskService] Fetch error:', err);
        }
    }

    // Fallback to localStorage
    return getLocalTasks(courseId);
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId: string, courseId: string): Promise<boolean> => {
    // Delete from Supabase
    if (isSupabaseConfigured() && supabase) {
        try {
            // First get the task to delete its files
            const { data: task } = await supabase
                .from(TASKS_TABLE)
                .select('attachments')
                .eq('id', taskId)
                .single();

            if (task?.attachments) {
                // Delete all attachment files
                for (const attachment of task.attachments) {
                    // Extract file path from URL
                    const urlParts = attachment.url.split('/');
                    const filePath = urlParts.slice(-3).join('/');
                    await deleteTaskFile(filePath);
                }
            }

            // Delete the task record
            const { error } = await supabase
                .from(TASKS_TABLE)
                .delete()
                .eq('id', taskId);

            if (error) {
                console.error('[TaskService] Delete task error:', error);
            }
        } catch (err) {
            console.error('[TaskService] Delete failed:', err);
        }
    }

    // Remove from localStorage
    removeTaskLocally(taskId, courseId);
    
    return true;
};

// ============================================
// Local Storage Helpers
// ============================================

const getLocalStorageKey = (courseId: string) => `course-tasks-${courseId}`;

const saveTaskLocally = (task: CourseTask): void => {
    const key = getLocalStorageKey(task.courseId);
    try {
        const existing = localStorage.getItem(key);
        const tasks: CourseTask[] = existing ? JSON.parse(existing) : [];
        
        // Update or add task
        const index = tasks.findIndex(t => t.id === task.id);
        if (index >= 0) {
            tasks[index] = task;
        } else {
            tasks.unshift(task);
        }
        
        localStorage.setItem(key, JSON.stringify(tasks));
    } catch (err) {
        console.error('[TaskService] Local save error:', err);
    }
};

const getLocalTasks = (courseId: string): CourseTask[] => {
    const key = getLocalStorageKey(courseId);
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error('[TaskService] Local load error:', err);
        return [];
    }
};

const removeTaskLocally = (taskId: string, courseId: string): void => {
    const key = getLocalStorageKey(courseId);
    try {
        const existing = localStorage.getItem(key);
        if (existing) {
            const tasks: CourseTask[] = JSON.parse(existing);
            const filtered = tasks.filter(t => t.id !== taskId);
            localStorage.setItem(key, JSON.stringify(filtered));
        }
    } catch (err) {
        console.error('[TaskService] Local remove error:', err);
    }
};

/**
 * Clear all local task data (for reset)
 */
export const clearAllLocalTasks = (): void => {
    const courseIds = ['cp1', 'euth1', 'itc', 'nstp1', 'pe1', 'ppc', 'purcom', 'tcw', 'uts'];
    courseIds.forEach(id => {
        localStorage.removeItem(getLocalStorageKey(id));
    });
    console.log('[TaskService] All local tasks cleared');
};

export default {
    createTask,
    getCourseTasks,
    deleteTask,
    uploadTaskFile,
    uploadTaskFiles,
    deleteTaskFile,
    clearAllLocalTasks
};
