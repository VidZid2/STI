import React from 'react';

// Quick Templates for fast assignment creation
export const QUICK_TEMPLATES = [
    {
        id: 'lab-exercise',
        name: 'Lab Exercise',
        icon: 'lab',
        color: '#3b82f6',
        description: 'Hands-on coding or practical activity',
        defaults: {
            title: 'Lab Exercise - [Topic]',
            assignmentDescription: 'Complete the hands-on laboratory exercise to practice and apply the concepts discussed in class.',
            type: 'assignment' as const,
            points: 50,
            maxAttempts: 3,
            allowLateSubmission: true,
            latePenalty: 5,
            instructions: '<p><strong>Objectives:</strong></p><ul><li>Complete the hands-on exercise</li><li>Submit your source code</li><li>Include screenshots of output</li></ul><p><strong>Submission Requirements:</strong></p><ul><li>Source code files (.java, .py, .cpp, etc.)</li><li>Screenshot of program output</li><li>Brief explanation of your approach</li></ul>',
        },
    },
    {
        id: 'written-report',
        name: 'Written Report',
        icon: 'document',
        color: '#003DA5',
        description: 'Essay, research paper, or documentation',
        defaults: {
            title: 'Written Report - [Topic]',
            assignmentDescription: 'Write a comprehensive report demonstrating your understanding and analysis of the assigned topic.',
            type: 'assignment' as const,
            points: 100,
            maxAttempts: 1,
            allowLateSubmission: true,
            latePenalty: 10,
            instructions: '<p><strong>Format Requirements:</strong></p><ul><li>Font: Times New Roman, 12pt</li><li>Spacing: Double-spaced</li><li>Margins: 1 inch on all sides</li><li>Include cover page with your name and section</li></ul><p><strong>Content Guidelines:</strong></p><ul><li>Introduction with thesis statement</li><li>Body paragraphs with supporting evidence</li><li>Conclusion summarizing key points</li><li>References in APA format</li></ul>',
        },
    },
    {
        id: 'coding-activity',
        name: 'Coding Activity',
        icon: 'code',
        color: 'var(--color-success)',
        description: 'Programming problem or algorithm challenge',
        defaults: {
            title: 'Coding Activity - [Topic]',
            assignmentDescription: 'Solve the programming problem by implementing an efficient algorithm following best coding practices.',
            type: 'assignment' as const,
            points: 75,
            maxAttempts: 5,
            allowLateSubmission: false,
            latePenalty: 0,
            instructions: '<p><strong>Problem Statement:</strong></p><p>[Describe the programming problem here]</p><p><strong>Requirements:</strong></p><ul><li>Your code must compile without errors</li><li>Include comments explaining your logic</li><li>Handle edge cases appropriately</li><li>Follow proper naming conventions</li></ul><p><strong>Sample Input/Output:</strong></p><pre>Input: [example]\nOutput: [expected result]</pre>',
        },
    },
    {
        id: 'quiz-template',
        name: 'Quiz',
        icon: 'quiz',
        color: 'var(--color-warning)',
        description: 'Timed assessment or knowledge check',
        defaults: {
            title: 'Quiz - [Topic]',
            assignmentDescription: 'A timed assessment to evaluate your understanding of the covered topics.',
            type: 'quiz' as const,
            points: 30,
            maxAttempts: 1,
            allowLateSubmission: false,
            latePenalty: 0,
            instructions: '<p><strong>Quiz Instructions:</strong></p><ul><li>Read each question carefully before answering</li><li>You have <strong>30 minutes</strong> to complete this quiz</li><li>No going back to previous questions</li><li>Academic integrity policy applies</li></ul><p><strong>Coverage:</strong></p><ul><li>[Topic 1]</li><li>[Topic 2]</li><li>[Topic 3]</li></ul>',
        },
    },
    {
        id: 'group-project',
        name: 'Group Project',
        icon: 'users',
        color: 'var(--color-danger)',
        description: 'Collaborative team assignment',
        defaults: {
            title: 'Group Project - [Topic]',
            assignmentDescription: 'A collaborative project where teams work together to design, develop, and present a comprehensive solution.',
            type: 'project' as const,
            points: 150,
            maxAttempts: 2,
            allowLateSubmission: true,
            latePenalty: 15,
            instructions: '<p><strong>Project Overview:</strong></p><p>[Describe the project goals and scope]</p><p><strong>Team Requirements:</strong></p><ul><li>Form groups of 3-5 members</li><li>Assign roles: Leader, Developer, Tester, Documenter</li><li>Submit team composition by [date]</li></ul><p><strong>Deliverables:</strong></p><ul><li>Project proposal (Week 1)</li><li>Progress report (Week 2)</li><li>Final submission with documentation</li><li>Presentation slides</li></ul>',
        },
    },
    {
        id: 'presentation',
        name: 'Presentation',
        icon: 'presentation',
        color: '#06b6d4',
        description: 'Oral presentation or demo',
        defaults: {
            title: 'Presentation - [Topic]',
            assignmentDescription: 'Prepare and deliver an oral presentation demonstrating your knowledge and communication skills.',
            type: 'assignment' as const,
            points: 100,
            maxAttempts: 1,
            allowLateSubmission: false,
            latePenalty: 0,
            instructions: '<p><strong>Presentation Guidelines:</strong></p><ul><li>Duration: 10-15 minutes per group/individual</li><li>Include visual aids (slides, demos)</li><li>Q&A session: 5 minutes</li></ul><p><strong>Grading Criteria:</strong></p><ul><li>Content accuracy and depth (40%)</li><li>Presentation skills (30%)</li><li>Visual aids quality (20%)</li><li>Time management (10%)</li></ul>',
        },
    },
];

export const ASSIGNMENT_TYPES = [
    { id: 'assignment', label: 'Assignment', icon: 'assignment', color: '#3b82f6' },
    { id: 'quiz', label: 'Quiz', icon: 'quiz', color: 'var(--color-warning)' },
    { id: 'project', label: 'Project', icon: 'project', color: 'var(--color-success)' },
    { id: 'journal', label: 'Journal', icon: 'journal', color: 'var(--color-danger)' },
];

export const COURSE_SUGGESTIONS: Record<string, { text: string; emoji: string }[]> = {
    'computer programming 1': [
        { text: 'Lab exercise: write a program using loops and conditionals', emoji: '💻' },
        { text: 'Quiz on data types, operators, and control structures', emoji: '📝' },
        { text: 'Written report on the history and evolution of programming languages', emoji: '📄' },
        { text: 'Project: build a console-based student grading system', emoji: '🛠️' },
        { text: 'Coding exercise: implement array sorting and searching', emoji: '🔢' },
        { text: 'Debug and fix a program with intentional logic errors', emoji: '🐛' },
    ],
    'introduction to computing': [
        { text: 'Lab activity: identify computer hardware components', emoji: '🖥️' },
        { text: 'Quiz on number systems: binary, octal, decimal, hexadecimal', emoji: '📝' },
        { text: 'Essay on the impact of computing technology on modern society', emoji: '✍️' },
        { text: 'Group project: create a presentation on emerging technologies', emoji: '👥' },
        { text: 'Research paper on the evolution of operating systems', emoji: '📚' },
        { text: 'Case study: compare cloud computing platforms and their uses', emoji: '☁️' },
    ],
    'euthenics 1': [
        { text: 'Reflection paper on personal values and ethical decision-making', emoji: '💭' },
        { text: 'Quiz on campus rules, policies, and student conduct guidelines', emoji: '📝' },
        { text: 'Essay on the importance of discipline in academic life', emoji: '✍️' },
        { text: 'Group activity: role-play scenarios on proper school etiquette', emoji: '🎭' },
        { text: 'Create a poster on responsible use of social media', emoji: '📱' },
        { text: 'Journal entry on goal-setting and time management strategies', emoji: '📓' },
    ],
    'purposive communication': [
        { text: 'Write a formal business letter for a professional scenario', emoji: '💼' },
        { text: 'Quiz on communication models and barriers to effective communication', emoji: '📝' },
        { text: 'Persuasive essay on a current social or technological issue', emoji: '✍️' },
        { text: 'Group presentation: deliver a 5-minute informative speech', emoji: '🎤' },
        { text: 'Create a technical documentation for a simple process', emoji: '📖' },
        { text: 'Analysis of a real-world miscommunication case and its effects', emoji: '🔍' },
    ],
    'the contemporary world': [
        { text: 'Research paper on the effects of globalization on the Philippines', emoji: '🌍' },
        { text: 'Quiz on global governance, international organizations, and treaties', emoji: '📝' },
        { text: 'Essay on how technology drives cultural exchange worldwide', emoji: '✍️' },
        { text: 'Group project: compare economic systems of developing nations', emoji: '👥' },
        { text: 'Debate paper on the advantages and disadvantages of globalization', emoji: '⚖️' },
        { text: 'Case study on a contemporary global issue and proposed solutions', emoji: '📊' },
    ],
    'understanding the self': [
        { text: 'Reflection paper on personal identity and self-concept', emoji: '🪞' },
        { text: 'Quiz on psychological theories of the self (Freud, Erikson, Rogers)', emoji: '📝' },
        { text: 'Essay on the role of culture and society in shaping identity', emoji: '✍️' },
        { text: 'Journal activity: document a week of self-observation and insights', emoji: '📓' },
        { text: 'Presentation on mental health awareness and self-care practices', emoji: '🧠' },
        { text: 'Case study: analyze how social media affects self-esteem', emoji: '📱' },
    ],
    'philippine popular culture': [
        { text: 'Research paper on the evolution of Filipino pop culture trends', emoji: '🇵🇭' },
        { text: 'Quiz on Filipino cultural icons, traditions, and media history', emoji: '📝' },
        { text: 'Essay on the influence of K-pop and Western media on Filipino youth', emoji: '✍️' },
        { text: 'Group project: create a multimedia presentation on a local cultural phenomenon', emoji: '🎬' },
        { text: 'Critique a Filipino film or TV show from a cultural perspective', emoji: '🎥' },
        { text: 'Photo essay: document examples of popular culture in everyday life', emoji: '📸' },
    ],
    'p.e./pathfit 1': [
        { text: 'Create a personalized weekly fitness and exercise routine', emoji: '🏋️' },
        { text: 'Quiz on basic anatomy, body systems, and physical fitness concepts', emoji: '📝' },
        { text: 'Written report on the benefits of regular physical activity', emoji: '✍️' },
        { text: 'Activity log: track daily physical activities for one week', emoji: '📊' },
        { text: 'Research paper on nutrition and its role in student wellness', emoji: '🥗' },
        { text: 'Reflection journal on personal fitness goals and progress', emoji: '📓' },
    ],
    'nstp 1': [
        { text: 'Community mapping activity: identify local needs and resources', emoji: '🗺️' },
        { text: 'Quiz on the NSTP law, its components, and civic responsibilities', emoji: '📝' },
        { text: 'Reflection paper on the importance of community engagement', emoji: '✍️' },
        { text: 'Group project: plan a community outreach or clean-up drive', emoji: '🤝' },
        { text: 'Documentation report on a completed community service activity', emoji: '📋' },
        { text: 'Essay on how youth volunteerism strengthens nation-building', emoji: '🇵🇭' },
    ],
};

export const GENERIC_SUGGESTIONS: { text: string; emoji: string }[] = [
    { text: 'Create a quiz with multiple choice and identification items', emoji: '📝' },
    { text: 'Write a reflective essay on a recent classroom discussion', emoji: '✍️' },
    { text: 'Lab exercise with step-by-step practical instructions', emoji: '🔬' },
    { text: 'Group project with clear deliverables and rubric criteria', emoji: '👥' },
    { text: 'Research and present findings in a structured report', emoji: '📊' },
    { text: 'Case study analysis with discussion questions', emoji: '📋' },
    { text: 'Prepare and deliver a 5-minute class presentation', emoji: '🎤' },
    { text: 'Problem-solving worksheet with guided exercises', emoji: '🧩' },
    { text: 'Coding exercise on fundamental programming concepts', emoji: '💻' },
    { text: 'Write a summary and critique of an assigned reading', emoji: '📖' },
    { text: 'Design an infographic about a key course concept', emoji: '🎨' },
    { text: 'Create a portfolio compiling completed coursework', emoji: '📁' },
];

export function getSuggestionsForCourse(courseName: string): { text: string; emoji: string }[] {
    if (!courseName) return GENERIC_SUGGESTIONS;
    const lower = courseName.toLowerCase().trim();
    if (COURSE_SUGGESTIONS[lower]) return COURSE_SUGGESTIONS[lower];
    for (const [key, suggestions] of Object.entries(COURSE_SUGGESTIONS)) {
        if (lower.includes(key) || key.includes(lower)) return suggestions;
    }
    return GENERIC_SUGGESTIONS;
}

export const getTemplateIcon = (iconType: string, color: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
        lab: (
            React.createElement('svg', { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                React.createElement('path', { d: 'M9 3h6v2H9z' }),
                React.createElement('path', { d: 'M8 5v3.764a2 2 0 0 1-.211.894L4.105 17.21A2 2 0 0 0 5.882 20h12.236a2 2 0 0 0 1.777-2.79L16.21 9.658A2 2 0 0 1 16 8.764V5' }),
                React.createElement('path', { d: 'M9 8h6' }),
                React.createElement('circle', { cx: '12', cy: '15', r: '2' })
            )
        ),
        document: (
            React.createElement('svg', { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                React.createElement('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
                React.createElement('polyline', { points: '14 2 14 8 20 8' }),
                React.createElement('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
                React.createElement('line', { x1: '16', y1: '17', x2: '8', y2: '17' }),
                React.createElement('line', { x1: '10', y1: '9', x2: '8', y2: '9' })
            )
        ),
        code: (
            React.createElement('svg', { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                React.createElement('polyline', { points: '16 18 22 12 16 6' }),
                React.createElement('polyline', { points: '8 6 2 12 8 18' }),
                React.createElement('line', { x1: '14', y1: '4', x2: '10', y2: '20' })
            )
        ),
        quiz: (
            React.createElement('svg', { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
                React.createElement('path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }),
                React.createElement('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
            )
        ),
        users: (
            React.createElement('svg', { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                React.createElement('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
                React.createElement('circle', { cx: '9', cy: '7', r: '4' }),
                React.createElement('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
                React.createElement('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
            )
        ),
        presentation: (
            React.createElement('svg', { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                React.createElement('path', { d: 'M2 3h20' }),
                React.createElement('path', { d: 'M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3' }),
                React.createElement('path', { d: 'M12 16v5' }),
                React.createElement('path', { d: 'M8 21h8' }),
                React.createElement('path', { d: 'M12 7v4' }),
                React.createElement('path', { d: 'M8 9h8' })
            )
        ),
    };
    return icons[iconType] || icons.document;
};

export const getAssignmentTypeIcon = (iconType: string, color: string, isSelected: boolean): React.ReactNode => {
    const isPinkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('pink-theme');
    const pink = '#ec4899';

    // In pink mode: always use pink for both selected and unselected
    const iconColor = isPinkMode
        ? (isSelected ? pink : `${pink}80`)
        : (isSelected ? color : 'var(--text-muted)');
    const bgColor = isPinkMode
        ? (isSelected ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.06)')
        : (isSelected ? `${color}15` : 'rgba(148, 163, 184, 0.1)');

    const wrap = (children: React.ReactNode) => React.createElement('div', {
        style: {
            width: '40px', height: '40px', borderRadius: '10px', background: bgColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
        }
    }, children);

    const icons: Record<string, React.ReactNode> = {
        assignment: wrap(
            React.createElement('svg', { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: iconColor, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                React.createElement('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
                React.createElement('polyline', { points: '14 2 14 8 20 8' }),
                React.createElement('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
                React.createElement('line', { x1: '16', y1: '17', x2: '8', y2: '17' }),
                React.createElement('polyline', { points: '10 9 9 9 8 9' })
            )
        ),
        quiz: wrap(
            React.createElement('svg', { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: iconColor, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
                React.createElement('path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' }),
                React.createElement('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
            )
        ),
        project: wrap(
            React.createElement('svg', { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: iconColor, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                React.createElement('circle', { cx: '12', cy: '12', r: '10' }),
                React.createElement('circle', { cx: '12', cy: '12', r: '6' }),
                React.createElement('circle', { cx: '12', cy: '12', r: '2' })
            )
        ),
        journal: wrap(
            React.createElement('svg', { width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: iconColor, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' },
                React.createElement('path', { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' }),
                React.createElement('path', { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' }),
                React.createElement('line', { x1: '9', y1: '7', x2: '17', y2: '7' }),
                React.createElement('line', { x1: '9', y1: '11', x2: '15', y2: '11' })
            )
        ),
    };

    return icons[iconType] || icons.assignment;
};
