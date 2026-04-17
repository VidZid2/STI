import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// AI Loading Steps — thin SVG icon builder helper
const aiIcon = (d: string) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{d.split('|').map((p, i) => <path key={i} d={p} />)}</svg>
);
const aiIconCircle = (cx: string, cy: string, r: string) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx={cx} cy={cy} r={r} /></svg>
);

// Generic steps (always available)
const GENERIC_STEPS: { label: string; icon: React.ReactNode }[] = [
    { label: 'Interpreting your request...', icon: aiIcon('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z') },
    { label: 'Analyzing assignment requirements...', icon: aiIcon('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8') },
    { label: 'Composing assignment title...', icon: aiIcon('M12 20h9|M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z') },
    { label: 'Drafting assignment description...', icon: aiIcon('M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z') },
    { label: 'Writing detailed instructions...', icon: aiIcon('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2') },
    { label: 'Structuring learning objectives...', icon: aiIcon('M22 11.08V12a10 10 0 1 1-5.93-9.14|M22 4L12 14.01l-3-3') },
    { label: 'Defining evaluation criteria...', icon: aiIcon('M18 20V10|M12 20V4|M6 20v-6') },
    { label: 'Calibrating point distribution...', icon: aiIcon('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z') },
    { label: 'Setting up rubric performance levels...', icon: aiIcon('M4 6h16|M4 12h16|M4 18h16') },
    { label: 'Configuring submission parameters...', icon: aiIcon('M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z') },
    { label: 'Applying academic standards...', icon: aiIcon('M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z|M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z') },
    { label: 'Assigning point values to criteria...', icon: aiIconCircle('12', '12', '10') },
    { label: 'Reviewing content alignment...', icon: aiIcon('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z') },
    { label: 'Optimizing rubric descriptions...', icon: aiIcon('M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z|M4 22v-7') },
    { label: 'Validating assignment structure...', icon: aiIcon('M9 11l3 3L22 4|M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11') },
    { label: 'Preparing final output...', icon: aiIcon('M22 11.08V12a10 10 0 1 1-5.93-9.14|M22 4L12 14.01l-3-3') },
    { label: 'Organizing content sections...', icon: aiIcon('M3 3h7v7H3z|M14 3h7v7h-7z|M3 14h7v7H3z|M14 14h7v7h-7z') },
    { label: 'Fine-tuning grading rubric...', icon: aiIcon('M2 12h4|M18 12h4|M12 2v4|M12 18v4') },
    { label: 'Formatting instructions layout...', icon: aiIcon('M21 10H3|M21 6H3|M21 14H3|M21 18H3') },
    { label: 'Finalizing assignment details...', icon: aiIcon('M20 6L9 17l-5-5') },
];

// Context-specific steps keyed by topic
const CONTEXT_STEPS: Record<string, { label: string; icon: React.ReactNode }[]> = {
    quiz: [
        { label: 'Structuring quiz questions...', icon: aiIcon('M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3|M12 17h.01') },
        { label: 'Defining answer keys...', icon: aiIcon('M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4') },
        { label: 'Balancing question difficulty...', icon: aiIcon('M18 20V10|M12 20V4|M6 20v-6') },
    ],
    coding: [
        { label: 'Defining coding requirements...', icon: aiIcon('M16 18l6-6-6-6|M8 6l-6 6 6 6') },
        { label: 'Structuring programming tasks...', icon: aiIcon('M4 17l6-6-6-6|M12 19h8') },
        { label: 'Setting up test case criteria...', icon: aiIcon('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z') },
    ],
    essay: [
        { label: 'Outlining writing requirements...', icon: aiIcon('M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z') },
        { label: 'Defining formatting standards...', icon: aiIcon('M21 10H3|M21 6H3|M21 14H3|M21 18H3') },
        { label: 'Building citation guidelines...', icon: aiIcon('M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z|M3 6h18|M16 10a4 4 0 0 1-8 0') },
    ],
    project: [
        { label: 'Defining project deliverables...', icon: aiIcon('M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z') },
        { label: 'Setting up milestone criteria...', icon: aiIcon('M12 2v4|M12 18v4|M4.93 4.93l2.83 2.83|M16.24 16.24l2.83 2.83|M2 12h4|M18 12h4|M4.93 19.07l2.83-2.83|M16.24 7.76l2.83-2.83') },
        { label: 'Structuring team collaboration guidelines...', icon: aiIcon('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2|M23 21v-2a4 4 0 0 0-3-3.87') },
    ],
    database: [
        { label: 'Structuring database schema tasks...', icon: aiIcon('M12 2C6.48 2 2 4.02 2 6.5v11C2 19.98 6.48 22 12 22s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2z') },
        { label: 'Defining query requirements...', icon: aiIcon('M4 17l6-6-6-6|M12 19h8') },
    ],
};

// Detect context from user prompt
function getContextualSteps(userPrompt: string): { label: string; icon: React.ReactNode }[] {
    const lower = userPrompt.toLowerCase();
    const contextual: { label: string; icon: React.ReactNode }[] = [];

    if (lower.match(/quiz|exam|test|mcq|multiple.choice|true.false/)) {
        contextual.push(...CONTEXT_STEPS.quiz);
    }
    if (lower.match(/code|coding|programming|java|python|html|css|javascript|c\+\+|lab.exercise|lab.activity/)) {
        contextual.push(...CONTEXT_STEPS.coding);
    }
    if (lower.match(/essay|report|paper|writing|write|documentation|thesis|research/)) {
        contextual.push(...CONTEXT_STEPS.essay);
    }
    if (lower.match(/project|group|team|collaborate|presentation|capstone/)) {
        contextual.push(...CONTEXT_STEPS.project);
    }
    if (lower.match(/database|sql|schema|query|table|erd|normalization/)) {
        contextual.push(...CONTEXT_STEPS.database);
    }

    return contextual;
}

// Shuffle + pick N items from an array
function shufflePick<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
}

const AILoadingSteps: React.FC<{ userPrompt?: string }> = ({ userPrompt = '' }) => {
    const [steps, setSteps] = useState<{ label: string; icon: React.ReactNode }[]>([]);
    const [stepIndex, setStepIndex] = useState(0);

    // Build the step list once on mount (or when prompt changes)
    useEffect(() => {
        const contextual = getContextualSteps(userPrompt);
        // Pick up to 3 contextual + fill the rest from generic, for 8 total steps
        const ctxPicks = shufflePick(contextual, Math.min(3, contextual.length));
        const genericPicks = shufflePick(GENERIC_STEPS, 8 - ctxPicks.length);
        // Interleave: start generic, mix in contextual in the middle
        const combined = [
            genericPicks[0], // always start with "Interpreting..." style
            ...ctxPicks,
            ...genericPicks.slice(1),
        ].filter(Boolean);
        setSteps(combined);
        setStepIndex(0);
    }, [userPrompt]);

    useEffect(() => {
        if (steps.length === 0) return;
        const interval = setInterval(() => {
            setStepIndex(prev => (prev + 1) % steps.length);
        }, 2200);
        return () => clearInterval(interval);
    }, [steps]);

    if (steps.length === 0) return null;

    return (
        <div style={{ position: 'relative', height: '16px', overflow: 'hidden', marginTop: '3px' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        fontSize: '11px',
                        color: 'var(--text-primary)',
                        position: 'absolute',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                    }}
                >
                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-primary)' }}>
                        {steps[stepIndex].icon}
                    </span>
                    {steps[stepIndex].label}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

// Rich Text Editor Component - Professional Teacher-Focused Design

export default AILoadingSteps;
