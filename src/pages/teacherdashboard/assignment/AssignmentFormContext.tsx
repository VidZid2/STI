/**
 * AssignmentFormContext — Phase 16
 * Wraps CreateAssignmentModal inner contents so tab components can
 * consume form state directly without prop drilling.
 */

import { createContext, useContext } from 'react';
import type { AssignmentFormData, RecentAssignment } from './types';

interface AssignmentFormContextValue {
    // Form
    formData: AssignmentFormData;
    updateFormData: <K extends keyof AssignmentFormData>(key: K, value: AssignmentFormData[K]) => void;
    isSubmitting: boolean;
    handleSubmit: () => void;
    // Responsive
    isMobile: boolean;
    isSmallMobile: boolean;
    // Data
    courses: { id: string; name: string; sections: string[] }[];
    loadingCourses: boolean;
    recentAssignments: RecentAssignment[];
    loadingRecentAssignments: boolean;
    availableSections: string[];
    availablePrerequisites: { id: string; title: string; course: string; type: string }[];
    otherCourses: { id: string; name: string; sections: string[] }[];
    // Tab
    activeTab: 'details' | 'rubric' | 'settings' | 'attachments' | 'preview';
    setActiveTab: (tab: 'details' | 'rubric' | 'settings' | 'attachments' | 'preview') => void;
    // AI
    aiInstructionsLoading: boolean;
    setAiInstructionsLoading: (v: boolean) => void;
    handleAISend: (msg?: string) => void;
}

const AssignmentFormContext = createContext<AssignmentFormContextValue | null>(null);

export const AssignmentFormProvider = AssignmentFormContext.Provider;

export function useAssignmentContext(): AssignmentFormContextValue {
    const ctx = useContext(AssignmentFormContext);
    if (!ctx) throw new Error('useAssignmentContext must be used inside AssignmentFormProvider');
    return ctx;
}
