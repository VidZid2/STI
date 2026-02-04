/**
 * Resource Service - Manages shared resources in group chats
 * Resources are tagged and indexed for AI/Groq context
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { FileAttachment } from './chatService';

export interface GroupResource {
    id: string;
    group_id: string;
    message_id?: string;
    user_id: string;
    user_name: string;
    name: string;
    type: string;
    size: number;
    url: string;
    thumbnail_url?: string;
    resource_type: 'image' | 'document' | 'file' | 'link';
    tags: string[];
    description?: string;
    is_indexed: boolean;
    created_at: string;
    updated_at?: string;
}

/**
 * Determine resource type from MIME type
 */
const getResourceType = (mimeType: string): GroupResource['resource_type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) return 'document';
    return 'file';
};

/**
 * Generate basic tags from file metadata
 */
const generateTags = (name: string, type: string): string[] => {
    const tags: string[] = [];
    
    // Add type-based tags
    if (type.startsWith('image/')) {
        tags.push('image', 'visual', 'media');
        if (type.includes('png')) tags.push('png');
        if (type.includes('jpeg') || type.includes('jpg')) tags.push('jpeg', 'photo');
        if (type.includes('gif')) tags.push('gif', 'animated');
    } else if (type.includes('pdf')) {
        tags.push('pdf', 'document', 'reading');
    } else if (type.includes('word') || type.includes('document')) {
        tags.push('document', 'word', 'text');
    } else if (type.includes('spreadsheet') || type.includes('excel')) {
        tags.push('spreadsheet', 'data', 'excel');
    } else if (type.includes('presentation') || type.includes('powerpoint')) {
        tags.push('presentation', 'slides');
    }
    
    // Add extension-based tags
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext && !tags.includes(ext)) {
        tags.push(ext);
    }
    
    // Add 'shared' and 'resource' tags
    tags.push('shared', 'resource');
    
    return [...new Set(tags)]; // Remove duplicates
};

/**
 * Save attachments as group resources
 */
export const saveAttachmentsAsResources = async (
    groupId: string,
    messageId: string,
    userId: string,
    userName: string,
    attachments: FileAttachment[]
): Promise<GroupResource[]> => {
    if (!attachments || attachments.length === 0) return [];
    
    const resources: GroupResource[] = attachments.map(att => ({
        id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        group_id: groupId,
        message_id: messageId,
        user_id: userId,
        user_name: userName,
        name: att.name,
        type: att.type,
        size: att.size,
        url: att.url,
        thumbnail_url: att.thumbnail_url,
        resource_type: getResourceType(att.type),
        tags: generateTags(att.name, att.type),
        is_indexed: false,
        created_at: new Date().toISOString(),
    }));
    
    if (!isSupabaseConfigured()) {
        // Return mock resources for demo
        console.log('[ResourceService] Demo mode - resources created:', resources.length);
        return resources;
    }
    
    try {
        const { data, error } = await supabase!
            .from('group_resources')
            .insert(resources.map(r => ({
                id: r.id,
                group_id: r.group_id,
                message_id: r.message_id,
                user_id: r.user_id,
                user_name: r.user_name,
                name: r.name,
                type: r.type,
                size: r.size,
                url: r.url,
                thumbnail_url: r.thumbnail_url,
                resource_type: r.resource_type,
                tags: r.tags,
                is_indexed: r.is_indexed,
            })))
            .select();
        
        if (error) {
            console.warn('[ResourceService] Supabase error:', error.message);
            return resources; // Return local resources on error
        }
        
        console.log('[ResourceService] Resources saved to database:', data?.length);
        return data || resources;
    } catch (error) {
        console.error('[ResourceService] Error saving resources:', error);
        return resources;
    }
};

/**
 * Fetch resources for a group
 */
export const fetchGroupResources = async (
    groupId: string,
    limit: number = 50,
    resourceType?: GroupResource['resource_type']
): Promise<GroupResource[]> => {
    if (!isSupabaseConfigured()) {
        return [];
    }
    
    try {
        let query = supabase!
            .from('group_resources')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (resourceType) {
            query = query.eq('resource_type', resourceType);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.warn('[ResourceService] Error fetching resources:', error.message);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('[ResourceService] Error:', error);
        return [];
    }
};

/**
 * Search resources by tags
 */
export const searchResourcesByTags = async (
    groupId: string,
    tags: string[]
): Promise<GroupResource[]> => {
    if (!isSupabaseConfigured() || tags.length === 0) {
        return [];
    }
    
    try {
        const { data, error } = await supabase!
            .from('group_resources')
            .select('*')
            .eq('group_id', groupId)
            .overlaps('tags', tags)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.warn('[ResourceService] Error searching resources:', error.message);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('[ResourceService] Error:', error);
        return [];
    }
};

/**
 * Get resources for AI context (formatted for Groq)
 */
export const getResourcesForAIContext = async (
    groupId: string,
    limit: number = 20
): Promise<string> => {
    const resources = await fetchGroupResources(groupId, limit);
    
    if (resources.length === 0) {
        return 'No shared resources in this group yet.';
    }
    
    const resourceList = resources.map(r => {
        const tags = r.tags.join(', ');
        return `- ${r.name} (${r.resource_type}) shared by ${r.user_name} [tags: ${tags}]`;
    }).join('\n');
    
    return `Shared resources in this group:\n${resourceList}`;
};
