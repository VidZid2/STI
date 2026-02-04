/**
 * File Upload Utilities
 * Handles file uploads to Supabase Storage
 */

import { supabase } from '../lib/supabase';

// ============================================
// TYPES
// ============================================
export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    path: string;
    uploadedAt: Date;
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

// ============================================
// CONSTANTS
// ============================================
const BUCKET_NAME = 'assignments';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate file before upload
 */
export const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return { 
            valid: false, 
            error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` 
        };
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { 
            valid: false, 
            error: 'File type not allowed. Please upload documents, images, or archives.' 
        };
    }

    return { valid: true };
};

/**
 * Generate unique file path
 */
const generateFilePath = (file: File, folder: string): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${folder}/${timestamp}-${randomId}-${sanitizedName}`;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file icon based on type
 */
export const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('image')) return '🖼️';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    if (type.includes('text')) return '📃';
    return '📎';
};

// ============================================
// UPLOAD FUNCTIONS
// ============================================

/**
 * Upload a single file to Supabase Storage
 */
export const uploadFile = async (
    file: File,
    folder: string = 'general',
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadedFile> => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    if (!supabase) {
        throw new Error('Database connection not available');
    }

    const filePath = generateFilePath(file, folder);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

    // Simulate progress for now (Supabase doesn't provide real progress)
    if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }

    return {
        id: data.id || data.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: data.path,
        uploadedAt: new Date(),
    };
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (
    files: File[],
    folder: string = 'general',
    onFileProgress?: (index: number, progress: UploadProgress) => void,
    onFileComplete?: (index: number, file: UploadedFile) => void
): Promise<UploadedFile[]> => {
    const uploadedFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
        try {
            const uploaded = await uploadFile(
                files[i],
                folder,
                (progress) => onFileProgress?.(i, progress)
            );
            uploadedFiles.push(uploaded);
            onFileComplete?.(i, uploaded);
        } catch (error) {
            console.error(`Failed to upload file ${i}:`, error);
            throw error;
        }
    }

    return uploadedFiles;
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (path: string): Promise<boolean> => {
    if (!supabase) {
        throw new Error('Database connection not available');
    }

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

    if (error) {
        console.error('Delete error:', error);
        return false;
    }

    return true;
};

/**
 * Get download URL for a file
 */
export const getDownloadUrl = async (path: string): Promise<string> => {
    if (!supabase) {
        throw new Error('Database connection not available');
    }

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
        throw new Error(`Failed to get download URL: ${error.message}`);
    }

    return data.signedUrl;
};

// ============================================
// REACT HOOK FOR FILE UPLOAD
// ============================================
export interface UseFileUploadOptions {
    folder?: string;
    maxFiles?: number;
    onUploadComplete?: (files: UploadedFile[]) => void;
    onError?: (error: Error) => void;
}

export interface UseFileUploadReturn {
    files: UploadedFile[];
    isUploading: boolean;
    progress: number;
    error: string | null;
    upload: (files: FileList | File[]) => Promise<void>;
    removeFile: (index: number) => void;
    clearFiles: () => void;
}
