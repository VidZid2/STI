import { motion } from 'motion/react';
import { SPACING, BORDER_RADIUS } from '../constants';

const AtRiskSkeleton: React.FC = () => {
    const shimmer = 'linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 100%)';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg, padding: SPACING.lg, borderRadius: BORDER_RADIUS.xl, background: 'rgba(0,0,0,0.02)' }}>
            <motion.div
                animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,0,0,0.06)', backgroundImage: shimmer, backgroundSize: '200% 100%' }}
            />
            <div style={{ flex: 1 }}>
                <motion.div
                    animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '60%', height: '16px', borderRadius: '4px', background: 'rgba(0,0,0,0.06)', backgroundImage: shimmer, backgroundSize: '200% 100%', marginBottom: '8px' }}
                />
                <motion.div
                    animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '40%', height: '12px', borderRadius: '4px', background: 'rgba(0,0,0,0.06)', backgroundImage: shimmer, backgroundSize: '200% 100%' }}
                />
            </div>
        </div>
    );
};

export default AtRiskSkeleton;
