import React from 'react';
import { motion } from 'motion/react';
import { getRoleInfo } from '../../../../../services/usersService';
import type { UserAccount } from '../../../../../services/usersService';

interface UserAvatarProps {
    user: UserAccount;
    size?: number;
    showOnlineStatus?: boolean;
    reducedMotion?: boolean;
}

const UserAvatar = React.memo<UserAvatarProps>(({
    user,
    size = 44,
    showOnlineStatus = true,
    reducedMotion = false }) => {
    const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
    const roleInfo = getRoleInfo(user.role);

    return (
        <div style={{ position: 'relative', flexShrink: 0 }} role="img" aria-label={`${user.full_name}'s avatar`}>
            <motion.div
                whileHover={reducedMotion ? {} : { scale: 1.05 }}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${roleInfo.color}20 0%, ${roleInfo.color}10 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: size * 0.35,
                    fontWeight: 600,
                    color: roleInfo.color,
                    cursor: 'pointer' }}
            >
                {user.profile_image ? (
                    <img
                        src={user.profile_image}
                        alt={user.full_name}
                        style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                    />
                ) : initials}
            </motion.div>
            {showOnlineStatus && (
                <motion.div
                    initial={reducedMotion ? { scale: 1 } : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 25 }}
                    style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: size * 0.28,
                        height: size * 0.28,
                        borderRadius: '50%',
                        background: user.is_online ? '#10b981' : '#94a3b8',
                        border: '2px solid white',
                        boxShadow: user.is_online ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none' }}
                    role="status"
                    aria-label={user.is_online ? 'Online' : 'Offline'}
                    title={user.is_online ? 'Online' : 'Offline'}
                />
            )}
        </div>
    );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
