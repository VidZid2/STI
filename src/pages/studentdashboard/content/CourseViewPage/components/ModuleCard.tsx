/**
 * ModuleCard
 * Individual module card in the Modules tab of CourseViewPage.
 * Extracted from CourseViewPage.tsx during Phase 8.1
 */
import * as React from 'react';
import { useState } from 'react';
import { motion } from 'motion/react';
import type { ContentType } from '../data/demoCourses';

// Content type icon config — kept local to avoid circular imports
const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: React.ReactNode; color: string }> = {
    'handout-a': {
        label: 'Handout A',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
        color: 'blue' },
    'handout-b': {
        label: 'Handout B',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
        color: 'indigo' },
    'slideshow': {
        label: 'Slideshow',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
        ),
        color: 'amber' },
    'video': {
        label: 'Video',
        icon: (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
        ),
        color: 'rose' } };

const COLOR_CLASSES: Record<string, { base: string; hover: string }> = {
    blue: { base: 'bg-blue-50 text-blue-500 border-blue-100', hover: 'hover:bg-blue-100' },
    indigo: { base: 'bg-indigo-50 text-indigo-500 border-indigo-100', hover: 'hover:bg-indigo-100' },
    amber: { base: 'bg-amber-50 text-amber-500 border-amber-100', hover: 'hover:bg-amber-100' },
    rose: { base: 'bg-rose-50 text-rose-500 border-rose-100', hover: 'hover:bg-rose-100' } };

const MUTED_COLOR_CLASSES: Record<string, { base: string; hover: string }> = {
    blue: { base: 'bg-zinc-50 text-zinc-400 border-zinc-100', hover: 'hover:bg-zinc-100' },
    indigo: { base: 'bg-zinc-50 text-zinc-400 border-zinc-100', hover: 'hover:bg-zinc-100' },
    amber: { base: 'bg-zinc-50 text-zinc-400 border-zinc-100', hover: 'hover:bg-zinc-100' },
    rose: { base: 'bg-zinc-50 text-zinc-400 border-zinc-100', hover: 'hover:bg-zinc-100' } };

// ─── ContentIconWithTooltip ───────────────────────────────────────────────────
interface ContentIconProps {
    content: { type: ContentType; title: string; completed: boolean };
    config: { label: string; icon: React.ReactNode; color: string };
    colorClasses: Record<string, { base: string; hover: string }>;
    isLocked: boolean;
    index: number;
    cIndex: number;
}

const ContentIconWithTooltip: React.FC<ContentIconProps> = ({
    content, config, colorClasses, isLocked, index, cIndex }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="group relative">
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (index * 0.05) + (cIndex * 0.03), duration: 0.1 }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => !isLocked && setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={(e) => e.stopPropagation()}
                disabled={isLocked}
                aria-label={config.label}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-cursor-pointer border ${colorClasses[config.color].base} ${!isLocked ? colorClasses[config.color].hover : ''}`}
            >
                {config.icon}
            </motion.button>

            {!isLocked && (
                <div
                    className={`absolute z-50 pointer-events-none transition-all duration-150 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}
                    style={{ bottom: 'calc(100% + 12px)', left: '50%', transform: 'translateX(-50%)' }}
                >
                    <div className="relative bg-white border border-blue-200 rounded-lg px-3 py-2 shadow-lg shadow-blue-500/10 whitespace-nowrap">
                        <p className="text-xs font-semibold text-blue-600">{config.label}</p>
                        <p className="text-[10px] text-blue-500/80 mt-0.5 max-w-[140px] truncate">{content.title}</p>
                        {content.completed && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[9px] text-emerald-600 font-medium">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Completed
                            </span>
                        )}
                        <div className="absolute w-2.5 h-2.5 bg-white border-r border-b border-blue-200"
                            style={{ bottom: '-5px', left: '50%', marginLeft: '-5px', transform: 'rotate(45deg)' }} />
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── ModuleCard ───────────────────────────────────────────────────────────────
export interface ModuleData {
    id: number;
    title: string;
    status: string;
    contents: { type: ContentType; title: string; completed: boolean }[];
    term?: 'prelims' | 'midterm' | 'prefinals' | 'finals';
    semester?: 'first' | 'second';
}

interface ModuleCardProps {
    module: ModuleData;
    index: number;
}

const TERM_BADGE: Record<string, { label: string; bg: string; border: string; text: string }> = {
    prelims:  { label: 'Prelim',      bg: 'rgba(59, 130, 246, 0.08)',  border: 'rgba(59, 130, 246, 0.2)',  text: '#3b82f6' },
    midterm:  { label: 'Midterm',     bg: 'rgba(6, 182, 212, 0.08)',   border: 'rgba(6, 182, 212, 0.2)',   text: '#06b6d4' },
    prefinals:{ label: 'Pre-Finals',  bg: 'rgba(249, 115, 22, 0.08)',  border: 'rgba(249, 115, 22, 0.2)',  text: '#f97316' },
    finals:   { label: 'Finals',      bg: 'rgba(16, 185, 129, 0.08)',  border: 'rgba(16, 185, 129, 0.2)',  text: '#10b981' } };

const SEMESTER_BADGE: Record<string, { label: string; bg: string; border: string; text: string }> = {
    first:  { label: '1st Sem', bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.2)', text: '#8b5cf6' },
    second: { label: '2nd Sem', bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.2)', text: '#6366f1' } };

export const ModuleCard: React.FC<ModuleCardProps> = ({ module, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const completedContents = module.contents.filter(c => c.completed).length;
    const progressPercent = module.contents.length > 0
        ? Math.round((completedContents / module.contents.length) * 100)
        : 0;

    const term = module.term || 'prelims';
    const semester = module.semester || 'first';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: isHovered ? -4 : 0, scale: isHovered ? 1.01 : 1 }}
            transition={{
                opacity: { delay: index * 0.05, duration: 0.4 },
                y: isHovered ? { duration: 0.1 } : { delay: index * 0.05, duration: 0.4 },
                scale: { duration: 0.1 } }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group rounded-2xl border cursor-pointer relative ${
                module.status === 'locked' ? 'bg-zinc-50/50 border-zinc-100 opacity-60' : 'bg-white border-zinc-100'
            }`}
            style={{
                boxShadow: isHovered && module.status !== 'locked' ? '0 12px 32px rgba(59, 130, 246, 0.12)' : 'none',
                borderColor: isHovered && module.status !== 'locked' ? 'rgba(59, 130, 246, 0.3)' : undefined }}
        >
            {/* Term + Semester Badges */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                <motion.div
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 + 0.15, duration: 0.3 }}
                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md cursor-default"
                    style={{ background: TERM_BADGE[term].bg, border: `1px solid ${TERM_BADGE[term].border}`, color: TERM_BADGE[term].text }}
                >
                    {TERM_BADGE[term].label}
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 + 0.2, duration: 0.3 }}
                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md cursor-default"
                    style={{ background: SEMESTER_BADGE[semester].bg, border: `1px solid ${SEMESTER_BADGE[semester].border}`, color: SEMESTER_BADGE[semester].text }}
                >
                    {SEMESTER_BADGE[semester].label}
                </motion.div>
            </div>

            <div className="p-5 pt-6 flex flex-col items-center text-center overflow-hidden rounded-2xl">
                {/* Status Icon */}
                <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 ${
                        module.status === 'completed'
                            ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : module.status === 'in-progress'
                                ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-zinc-200 text-zinc-400'
                    }`}
                    style={{ transform: isHovered ? 'scale(1.05) rotate(3deg)' : 'scale(1) rotate(0deg)', transition: 'transform 0.1s' }}
                >
                    {module.status === 'completed' ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : module.status === 'in-progress' ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    )}
                </div>

                {/* Status Badge */}
                {module.status !== 'locked' && (
                    <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg mb-3 ${
                        module.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                        {module.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                )}

                <h3 className="text-sm font-semibold text-zinc-800 mb-1 line-clamp-2">{module.title}</h3>
                <p className="text-xs text-zinc-500 mb-4">{completedContents}/{module.contents.length} items completed</p>

                {/* Progress Bar */}
                <div className="mb-4 w-full">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">Progress</span>
                        <span className={`text-xs font-bold ${progressPercent === 100 ? 'text-emerald-600' : 'text-blue-600'}`}>{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className={`h-full rounded-full ${progressPercent === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'}`}
                        />
                    </div>
                </div>

                {/* Content Type Icons */}
                <div className="flex items-center justify-center gap-2 mb-4">
                    {module.contents.slice(0, 4).map((content, cIndex) => {
                        const config = CONTENT_TYPE_CONFIG[content.type];
                        const colorClasses = content.completed ? COLOR_CLASSES : MUTED_COLOR_CLASSES;
                        return (
                            <ContentIconWithTooltip
                                key={cIndex}
                                content={content}
                                config={config}
                                colorClasses={colorClasses}
                                isLocked={module.status === 'locked'}
                                index={index}
                                cIndex={cIndex}
                            />
                        );
                    })}
                    {module.contents.length > 4 && (
                        <span className="text-[10px] text-zinc-400 font-medium px-2 py-1 bg-zinc-50 rounded-lg border border-zinc-100">
                            +{module.contents.length - 4}
                        </span>
                    )}
                </div>

                {/* Action Button */}
                <button
                    className={`w-full py-2.5 text-xs font-semibold rounded-xl transition-all duration-100 ${
                        module.status === 'locked'
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            : module.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                    }`}
                    disabled={module.status === 'locked'}
                    onClick={(e) => e.stopPropagation()}
                >
                    {module.status === 'locked' ? 'Locked' : module.status === 'completed' ? 'Review Module' : 'Continue Learning'}
                </button>
            </div>
        </motion.div>
    );
};

export default ModuleCard;
