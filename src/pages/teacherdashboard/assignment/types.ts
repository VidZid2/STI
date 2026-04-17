export interface RubricCriterion {
    id: string;
    name: string;
    description: string;
    points: number;
    levels: { label: string; points: number; description: string }[];
}

export interface AssignmentFormData {
    title: string;
    description: string;
    course: string;
    section: string;
    sections: string[];
    type: 'assignment' | 'quiz' | 'project' | 'journal';
    dueDate: string;
    dueTime: string;
    points: number;
    instructions: string;
    attachments: File[];
    allowLateSubmission: boolean;
    latePenalty: number;
    maxAttempts: number;
    rubricEnabled: boolean;
    rubricCriteria: RubricCriterion[];
    notifyStudents: boolean;
    schedulePublish: boolean;
    publishDate: string;
    publishTime: string;
    copyToOtherCourses: string[];
    prerequisiteEnabled: boolean;
    prerequisiteAssignment: string;
    saveAsTemplate: boolean;
    templateName: string;
}

export interface CreateAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AssignmentFormData) => void;
    onReopen?: () => void;
}

export interface RecentAssignment {
    id: string;
    title: string;
    course: string;
    courseName: string;
    date: string;
    type: string;
    description: string;
    instructions: string;
    points: number;
}
