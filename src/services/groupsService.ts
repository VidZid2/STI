/**
 * Groups Service - Study Groups Management with Supabase integration
 * Matches the design patterns of usersService, goalsService, pathsService
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Group types
export interface StudyGroup {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    category: GroupCategory;
    course_id?: string;
    course_name?: string;
    avatar?: string; // Custom group avatar image (base64 or URL)
    is_pinned?: boolean; // Whether the group is pinned/favorited
    max_members: number;
    is_private: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface GroupMember {
    id: string;
    group_id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    user_avatar?: string;
    role: 'owner' | 'admin' | 'member';
    joined_at: string;
    is_online?: boolean;
    last_active?: string;
}

export interface GroupWithMembers extends StudyGroup {
    members: GroupMember[];
    member_count: number;
    online_count: number;
    is_member: boolean;
    user_role?: 'owner' | 'admin' | 'member';
    last_activity?: string; // Timestamp of last activity
    unread_messages?: number; // Number of unread messages
}

export interface GroupStats {
    totalGroups: number;
    myGroups: number;
    publicGroups: number;
    totalMembers: number;
    onlineMembers: number;
}

export type GroupCategory = 'study' | 'project' | 'review' | 'discussion' | 'all';
export type GroupFilter = 'all' | 'my-groups' | 'public';
export type GroupSortOption = 'recent' | 'members' | 'name' | 'activity';

// Category configuration
export const groupCategoryConfig: Record<GroupCategory, { label: string; color: string; icon: string }> = {
    study: { label: 'Study Group', color: '#3b82f6', icon: 'book' },
    project: { label: 'Project Team', color: '#8b5cf6', icon: 'code' },
    review: { label: 'Review Session', color: '#10b981', icon: 'check' },
    discussion: { label: 'Discussion', color: '#f59e0b', icon: 'chat' },
    all: { label: 'All Groups', color: '#64748b', icon: 'grid' },
};

// Demo groups data (empty - will be populated from Supabase)
const DEMO_GROUPS: StudyGroup[] = [];

// Demo members data (empty - will be populated from Supabase)
const DEMO_MEMBERS: GroupMember[] = [];

// Current user ID (demo)
const CURRENT_USER_ID = 'demo-user-1';

/**
 * Fetch all groups with member information
 */
export async function fetchGroups(): Promise<GroupWithMembers[]> {
    // Try Supabase first
    if (isSupabaseConfigured() && supabase) {
        try {
            const db = supabase;
            const { data: groups, error } = await db
                .from('study_groups')
                .select('*')
                .order('updated_at', { ascending: false });

            if (!error && groups && groups.length > 0) {
                // Fetch members for each group
                const groupsWithMembers = await Promise.all(
                    groups.map(async (group) => {
                        const { data: members } = await db
                            .from('group_members')
                            .select('*')
                            .eq('group_id', group.id);

                        const memberList = members || [];
                        const isMember = memberList.some(m => m.user_id === CURRENT_USER_ID);
                        const userMember = memberList.find(m => m.user_id === CURRENT_USER_ID);

                        // Calculate last activity from members or group updated_at
                        const memberActivities = memberList
                            .filter(m => m.last_active)
                            .map(m => new Date(m.last_active).getTime());
                        const lastMemberActivity = memberActivities.length > 0 
                            ? new Date(Math.max(...memberActivities)).toISOString()
                            : null;

                        return {
                            ...group,
                            members: memberList,
                            member_count: memberList.length,
                            online_count: memberList.filter(m => m.is_online).length,
                            is_member: isMember,
                            user_role: userMember?.role,
                            last_activity: lastMemberActivity || group.last_activity || group.updated_at,
                            unread_messages: group.unread_count || 0,
                        } as GroupWithMembers;
                    })
                );

                return groupsWithMembers;
            }
        } catch (err) {
            console.warn('Supabase fetch failed, using demo data:', err);
        }
    }

    // Fallback to demo data
    return DEMO_GROUPS.map(group => {
        const members = DEMO_MEMBERS.filter(m => m.group_id === group.id);
        const isMember = members.some(m => m.user_id === CURRENT_USER_ID);
        const userMember = members.find(m => m.user_id === CURRENT_USER_ID);

        return {
            ...group,
            members,
            member_count: members.length,
            online_count: members.filter(m => m.is_online).length,
            is_member: isMember,
            user_role: userMember?.role,
        };
    });
}

/**
 * Get group statistics
 */
export async function getGroupStats(): Promise<GroupStats> {
    const groups = await fetchGroups();
    const myGroups = groups.filter(g => g.is_member);
    const publicGroups = groups.filter(g => !g.is_private);
    const allMembers = groups.flatMap(g => g.members);
    const uniqueMembers = [...new Set(allMembers.map(m => m.user_id))];
    const onlineMembers = allMembers.filter(m => m.is_online);

    return {
        totalGroups: groups.length,
        myGroups: myGroups.length,
        publicGroups: publicGroups.length,
        totalMembers: uniqueMembers.length,
        onlineMembers: [...new Set(onlineMembers.map(m => m.user_id))].length,
    };
}

/**
 * Filter groups by category
 */
export function filterGroupsByCategory(groups: GroupWithMembers[], category: GroupCategory): GroupWithMembers[] {
    if (category === 'all') return groups;
    return groups.filter(g => g.category === category);
}

/**
 * Filter groups by membership
 */
export function filterGroupsByMembership(groups: GroupWithMembers[], filter: GroupFilter): GroupWithMembers[] {
    switch (filter) {
        case 'my-groups':
            return groups.filter(g => g.is_member);
        case 'public':
            return groups.filter(g => !g.is_private);
        default:
            return groups;
    }
}

/**
 * Sort groups
 */
export function sortGroups(groups: GroupWithMembers[], sortBy: GroupSortOption): GroupWithMembers[] {
    const sorted = [...groups];
    switch (sortBy) {
        case 'recent':
            return sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        case 'members':
            return sorted.sort((a, b) => b.member_count - a.member_count);
        case 'name':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'activity':
            return sorted.sort((a, b) => b.online_count - a.online_count);
        default:
            return sorted;
    }
}

/**
 * Search groups
 */
export function searchGroups(groups: GroupWithMembers[], query: string): GroupWithMembers[] {
    if (!query.trim()) return groups;
    const lowerQuery = query.toLowerCase();
    return groups.filter(g =>
        g.name.toLowerCase().includes(lowerQuery) ||
        g.description.toLowerCase().includes(lowerQuery) ||
        g.course_name?.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Join a group
 */
export async function joinGroup(groupId: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
        try {
            const { error } = await supabase
                .from('group_members')
                .insert({
                    group_id: groupId,
                    user_id: CURRENT_USER_ID,
                    user_name: 'Josiah P. De Asis',
                    user_email: 'deasis.462124@meycauayan.sti.edu.ph',
                    role: 'member',
                    is_online: true,
                });

            return !error;
        } catch (err) {
            console.warn('Failed to join group:', err);
        }
    }

    // Demo mode - just return success
    return true;
}

/**
 * Leave a group
 */
export async function leaveGroup(groupId: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', CURRENT_USER_ID);

            return !error;
        } catch (err) {
            console.warn('Failed to leave group:', err);
        }
    }

    return true;
}

/**
 * Create a new group
 */
export async function createGroup(group: Omit<StudyGroup, 'id' | 'created_at' | 'updated_at'>): Promise<StudyGroup | null> {
    const newGroup: StudyGroup = {
        ...group,
        id: `group-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
        try {
            const db = supabase;
            const { data, error } = await db
                .from('study_groups')
                .insert(newGroup)
                .select()
                .single();

            if (!error && data) {
                // Add creator as owner
                await db.from('group_members').insert({
                    group_id: data.id,
                    user_id: CURRENT_USER_ID,
                    user_name: 'Josiah P. De Asis',
                    user_email: 'deasis.462124@meycauayan.sti.edu.ph',
                    role: 'owner',
                    is_online: true,
                });

                return data;
            }
        } catch (err) {
            console.warn('Failed to create group:', err);
        }
    }

    return newGroup;
}

/**
 * Group invite link interface
 */
export interface GroupInvite {
    id: string;
    group_id: string;
    invite_code: string;
    created_by: string;
    created_at: string;
    expires_at: string | null;
    max_uses: number | null;
    use_count: number;
    is_active: boolean;
}

/**
 * Generate a unique invite code
 */
function generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Create an invite link for a group
 */
export async function createInviteLink(groupId: string, expiresInDays?: number, maxUses?: number): Promise<GroupInvite | null> {
    const inviteCode = generateInviteCode();
    const now = new Date();
    const expiresAt = expiresInDays ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : null;

    const invite: GroupInvite = {
        id: `invite-${Date.now()}`,
        group_id: groupId,
        invite_code: inviteCode,
        created_by: CURRENT_USER_ID,
        created_at: now.toISOString(),
        expires_at: expiresAt,
        max_uses: maxUses || null,
        use_count: 0,
        is_active: true,
    };

    if (isSupabaseConfigured() && supabase) {
        try {
            const { data, error } = await supabase
                .from('group_invites')
                .insert(invite)
                .select()
                .single();

            if (!error && data) {
                return data;
            }
        } catch (err) {
            console.warn('Failed to create invite:', err);
        }
    }

    return invite;
}

/**
 * Get active invite links for a group
 */
export async function getGroupInvites(groupId: string): Promise<GroupInvite[]> {
    if (isSupabaseConfigured() && supabase) {
        try {
            const { data, error } = await supabase
                .from('group_invites')
                .select('*')
                .eq('group_id', groupId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (!error && data) {
                return data;
            }
        } catch (err) {
            console.warn('Failed to fetch invites:', err);
        }
    }
    return [];
}

/**
 * Join a group using an invite code
 */
export async function joinGroupByInvite(inviteCode: string): Promise<{ success: boolean; groupId?: string; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
        try {
            // Find the invite
            const { data: invite, error: inviteError } = await supabase
                .from('group_invites')
                .select('*')
                .eq('invite_code', inviteCode)
                .eq('is_active', true)
                .single();

            if (inviteError || !invite) {
                return { success: false, error: 'Invalid or expired invite link' };
            }

            // Check if expired
            if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
                return { success: false, error: 'This invite link has expired' };
            }

            // Check max uses
            if (invite.max_uses && invite.use_count >= invite.max_uses) {
                return { success: false, error: 'This invite link has reached its maximum uses' };
            }

            // Check if already a member
            const { data: existingMember } = await supabase
                .from('group_members')
                .select('id')
                .eq('group_id', invite.group_id)
                .eq('user_id', CURRENT_USER_ID)
                .single();

            if (existingMember) {
                return { success: false, error: 'You are already a member of this group' };
            }

            // Join the group
            const { error: joinError } = await supabase
                .from('group_members')
                .insert({
                    group_id: invite.group_id,
                    user_id: CURRENT_USER_ID,
                    user_name: 'Josiah P. De Asis',
                    user_email: 'deasis.462124@meycauayan.sti.edu.ph',
                    role: 'member',
                    is_online: true,
                });

            if (joinError) {
                return { success: false, error: 'Failed to join group' };
            }

            // Increment use count
            await supabase
                .from('group_invites')
                .update({ use_count: invite.use_count + 1 })
                .eq('id', invite.id);

            return { success: true, groupId: invite.group_id };
        } catch (err) {
            console.warn('Failed to join by invite:', err);
            return { success: false, error: 'An error occurred' };
        }
    }

    return { success: false, error: 'Database not configured' };
}

/**
 * Deactivate an invite link
 */
export async function deactivateInvite(inviteId: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
        try {
            const { error } = await supabase
                .from('group_invites')
                .update({ is_active: false })
                .eq('id', inviteId);

            return !error;
        } catch (err) {
            console.warn('Failed to deactivate invite:', err);
        }
    }
    return false;
}

/**
 * Toggle pin status for a group
 */
export async function togglePinGroup(groupId: string, isPinned: boolean): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
        try {
            const { error } = await supabase
                .from('study_groups')
                .update({ is_pinned: isPinned })
                .eq('id', groupId);

            return !error;
        } catch (err) {
            console.warn('Failed to toggle pin:', err);
        }
    }
    return true;
}

/**
 * Get role display info
 */
export function getRoleInfo(role: 'owner' | 'admin' | 'member'): { label: string; color: string } {
    const info = {
        owner: { label: 'Owner', color: '#f59e0b' },
        admin: { label: 'Admin', color: '#8b5cf6' },
        member: { label: 'Member', color: '#64748b' },
    };
    return info[role];
}

/**
 * Format last active time
 */
export function formatLastActive(lastActive?: string): string {
    if (!lastActive) return 'Offline';
    
    const diff = Date.now() - new Date(lastActive).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
}


/**
 * Update user's online status in all their groups
 */
export async function updateOnlineStatus(isOnline: boolean): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
        try {
            const db = supabase;
            await db
                .from('group_members')
                .update({ 
                    is_online: isOnline,
                    last_active: new Date().toISOString()
                })
                .eq('user_id', CURRENT_USER_ID);
        } catch (err) {
            console.warn('Failed to update online status:', err);
        }
    }
}

/**
 * Subscribe to real-time online status changes for a group
 */
export function subscribeToGroupMembers(
    groupId: string, 
    onUpdate: (members: GroupMember[]) => void
): (() => void) | null {
    if (!isSupabaseConfigured() || !supabase) return null;

    const db = supabase;
    const channel = db
        .channel(`group-members-${groupId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'group_members',
                filter: `group_id=eq.${groupId}`
            },
            async () => {
                // Fetch updated members when any change occurs
                const { data } = await db
                    .from('group_members')
                    .select('*')
                    .eq('group_id', groupId);
                if (data) {
                    onUpdate(data);
                }
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        db.removeChannel(channel);
    };
}

/**
 * Subscribe to all groups' member changes (for the groups list)
 */
export function subscribeToAllGroupMembers(
    onUpdate: () => void
): (() => void) | null {
    if (!isSupabaseConfigured() || !supabase) return null;

    const db = supabase;
    const channel = db
        .channel('all-group-members')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'group_members'
            },
            () => {
                onUpdate();
            }
        )
        .subscribe();

    return () => {
        db.removeChannel(channel);
    };
}
