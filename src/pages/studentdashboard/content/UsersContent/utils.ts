export const getLastSeenText = (lastActive: string | undefined, isOnline: boolean): string => {
    if (isOnline) return 'Online now';
    if (!lastActive) return 'Offline';
    
    const lastActiveDate = new Date(lastActive);
    const now = new Date();
    const diffMs = now.getTime() - lastActiveDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) return 'Last seen just now';
    if (diffMinutes < 60) return `Last seen ${diffMinutes}m ago`;
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;
    if (diffDays === 1) return 'Last seen yesterday';
    if (diffDays < 7) return `Last seen ${diffDays}d ago`;
    if (diffDays < 30) return `Last seen ${Math.floor(diffDays / 7)}w ago`;
    return `Last seen ${Math.floor(diffDays / 30)}mo ago`;
};
