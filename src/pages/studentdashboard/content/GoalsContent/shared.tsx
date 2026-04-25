import React from 'react';
import type { GoalPriority, GoalType } from '../../../../services/goalsService';

// Priority info helper
export const getPriorityInfo = (priority: GoalPriority): { label: string; color: string } => {
    const info: Record<GoalPriority, { label: string; color: string }> = {
        low: { label: 'Low', color: '#94a3b8' },
        medium: { label: 'Medium', color: '#f59e0b' },
        high: { label: 'High', color: '#ef4444' } };
    return info[priority];
};

// Format time remaining
export const formatTimeRemaining = (days?: number): string => {
    if (days === undefined) return 'No deadline';
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day left';
    if (days < 7) return `${days} days left`;
    if (days < 30) return `${Math.floor(days / 7)} weeks left`;
    return `${Math.floor(days / 30)} months left`;
};

// Goal Type Icons for Modal
export const GoalTypeIcons: Record<GoalType, React.ReactNode> = {
    study_time: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    course_completion: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M8 7h8" /><path d="M8 11h6" />
        </svg>
    ),
    streak: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
    ),
    grade: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ) };

// Priority Icons
export const PriorityIcons: Record<GoalPriority, React.ReactNode> = {
    low: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
        </svg>
    ),
    medium: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 12h8" /><path d="M12 8v8" />
        </svg>
    ),
    high: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 8 4-4 4 4" /><path d="M7 4v16" />
            <path d="m13 16 4 4 4-4" /><path d="M17 20V4" />
        </svg>
    ) };
