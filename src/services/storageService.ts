/**
 * Storage Service - Upload files to Supabase Storage
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET_NAME = 'chat-attachments';

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

/**
 * Convert base64 data URL to Blob
 */
const base64ToBlob = (base64: string): Blob | null => {
    try {
        const parts = base64.split(',');
        if (parts.length !== 2) return null;
        
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (!mimeMatch) return null;
        
        const mime = mimeMatch[1];
        const bstr = atob(parts[1]);
        const n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        for (let i = 0; i < n; i++) {
            u8arr[i] = bstr.charCodeAt(i);
        }
        
        return new Blob([u8arr], { type: mime });
    } catch (e) {
        console.error('[StorageService] Failed to convert base64 to blob:', e);
        return null;
    }
};

/**
 * Generate unique file path for storage
 */
const generateFilePath = (groupId: string, fileName: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${groupId}/${timestamp}-${random}-${safeName}`;
};

/**
 * Upload a file to Supabase Storage
 */
export const uploadFile = async (
    groupId: string,
    fileName: string,
    fileData: string | Blob | File,
    contentType?: string
): Promise<UploadResult> => {
    if (!isSupabaseConfigured()) {
        console.log('[StorageService] Demo mode - returning original data');
        // In demo mode, return the base64 as-is
        if (typeof fileData === 'string') {
            return { success: true, url: fileData };
        }
        return { success: false, error: 'Demo mode - cannot upload blob' };
    }

    try {
        const filePath = generateFilePath(groupId, fileName);
        let blob: Blob;

        // Convert to blob if needed
        if (typeof fileData === 'string' && fileData.startsWith('data:')) {
            const converted = base64ToBlob(fileData);
            if (!converted) {
                return { success: false, error: 'Failed to convert base64 to blob' };
            }
            blob = converted;
        } else if (fileData instanceof Blob) {
            blob = fileData;
        } else {
            return { success: false, error: 'Invalid file data format' };
        }

        console.log('[StorageService] Uploading file:', { filePath, size: blob.size, type: blob.type });

        const { data, error } = await supabase!.storage
            .from(BUCKET_NAME)
            .upload(filePath, blob, {
                contentType: contentType || blob.type,
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('[StorageService] Upload error:', error.message);
            return { success: false, error: error.message };
        }

        // Get public URL
        const { data: urlData } = supabase!.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        console.log('[StorageService] Upload successful:', urlData.publicUrl);
        return { success: true, url: urlData.publicUrl };
    } catch (error) {
        console.error('[StorageService] Error:', error);
        return { success: false, error: 'Upload failed' };
    }
};

/**
 * Upload multiple files and return their URLs
 */
export const uploadMultipleFiles = async (
    groupId: string,
    files: Array<{ name: string; data: string | Blob | File; type?: string }>
): Promise<Array<{ name: string; url: string | null; error?: string }>> => {
    const results = await Promise.all(
        files.map(async (file) => {
            const result = await uploadFile(groupId, file.name, file.data, file.type);
            return {
                name: file.name,
                url: result.success ? result.url! : null,
                error: result.error,
            };
        })
    );
    return results;
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (fileUrl: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) return true;

    try {
        // Extract path from URL
        const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
        if (urlParts.length !== 2) return false;
        
        const filePath = urlParts[1];
        const { error } = await supabase!.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (error) {
            console.error('[StorageService] Delete error:', error.message);
            return false;
        }
        return true;
    } catch (error) {
        console.error('[StorageService] Error deleting file:', error);
        return false;
    }
};
