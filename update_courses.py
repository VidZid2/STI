import os
file_path = r'c:\Users\JOSIAH DE JESUS\Documents\eLMS Website STI - CASE STUDY\elms-react\src\pages\studentdashboard\content\CourseViewPage\data\demoCourses.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define customized data
custom_data = '''
const TASKS_CP1 = [
    { id: 101, title: 'Week 1 Logic Assignment', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Syntax Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 105, title: 'Weekly Reflection Journal', due: 'Overdue by 2 days', status: 'overdue', score: null, category: 'journal' as TaskCategory, semester: 'first' },
    { id: 201, title: 'OOP Concepts Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
    { id: 203, title: 'Final Semester Reflection', due: 'Locked', status: 'locked', score: null, category: 'journal' as TaskCategory, semester: 'second' },
];

const TASKS_EUTH1 = [
    { id: 101, title: 'STI History Essay', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Study Habits Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 105, title: 'Euthenics Reflection Journal', due: 'Overdue by 2 days', status: 'overdue', score: null, category: 'journal' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Personal Development Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_ITC = [
    { id: 101, title: 'Hardware Identification', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'OS Basics Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Software Architecture Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_NSTP1 = [
    { id: 101, title: 'Community Needs Assessment', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Volunteerism Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 105, title: 'Community Outreach Journal', due: 'Overdue by 2 days', status: 'overdue', score: null, category: 'journal' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Project Planning Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_PE1 = [
    { id: 101, title: 'Fitness Log Week 1', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Nutrition Basics Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Advanced Aerobics Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_PPC = [
    { id: 101, title: 'Media Analysis Essay', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Pop Culture Icons Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Subcultures Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_PURCOM = [
    { id: 101, title: 'Communication Models Draft', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Grammar & Syntax Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Professional Writing Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_TCW = [
    { id: 101, title: 'Globalization Case Study', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Economic Systems Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Global Demography Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

const TASKS_UTS = [
    { id: 101, title: 'Self-Reflection Essay', due: 'Due Today', status: 'pending', score: null, category: 'assignment' as TaskCategory, semester: 'first' },
    { id: 102, title: 'Philosophical Perspectives Quiz', due: 'Due in 3 days', status: 'pending', score: null, category: 'quiz' as TaskCategory, semester: 'first' },
    { id: 201, title: 'Digital Self Quiz', due: 'Locked', status: 'locked', score: null, category: 'quiz' as TaskCategory, semester: 'second' },
];

export const COURSE_DATA: Record<string, CourseDataType> = {
    "cp1": {
        modules: DEFAULT_MODULES,
        tasks: TASKS_CP1,
        instructor: { name: "David Clarence Del Mundo", title: "Instructor", email: "d.delmundo@university.edu" }
    },
    "euth1": {
        modules: [
            { id: 1, title: "Module 1: Introduction to STI and Euthenics", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "video", title: "STI History", completed: false }, { type: "handout-a", title: "Course Syllabus", completed: false }] },
            { id: 2, title: "Module 2: The STI Student", status: "locked", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "Student Guidelines", completed: false }] },
            { id: 3, title: "Module 3: Study Habits", status: "locked", term: "midterm", semester: "first", contents: [{ type: "slideshow", title: "Effective Studying", completed: false }] },
            { id: 6, title: "Module 4: Career Planning", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Career Paths", completed: false }] },
            { id: 7, title: "Module 5: Workplace Ethics", status: "locked", term: "midterm", semester: "second", contents: [{ type: "handout-a", title: "Professionalism", completed: false }] }
        ],
        tasks: TASKS_EUTH1,
        instructor: { name: "Claire Maurillo", title: "Instructor", email: "c.maurillo@university.edu" }
    },
    "itc": {
        modules: [
            { id: 1, title: "Module 1: Computer Hardware", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "video", title: "Inside a PC", completed: false }, { type: "handout-a", title: "Hardware Basics", completed: false }] },
            { id: 2, title: "Module 2: Operating Systems", status: "locked", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "OS Basics", completed: false }] },
            { id: 3, title: "Module 3: Software & Applications", status: "locked", term: "midterm", semester: "first", contents: [{ type: "slideshow", title: "Types of Software", completed: false }] },
            { id: 4, title: "Module 4: Networking Basics", status: "locked", term: "finals", semester: "first", contents: [{ type: "video", title: "How the Internet Works", completed: false }] },
            { id: 6, title: "Module 5: Information Security", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Cybersecurity 101", completed: false }] },
            { id: 7, title: "Module 6: Cloud Computing", status: "locked", term: "midterm", semester: "second", contents: [{ type: "slideshow", title: "Cloud Infrastructure", completed: false }] }
        ],
        tasks: TASKS_ITC,
        instructor: { name: "Psalmmiracle Mariano", title: "Instructor", email: "p.mariano@university.edu" }
    },
    "nstp1": {
        modules: [
            { id: 1, title: "Module 1: Civic Welfare Training", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "CWTS Overview", completed: false }, { type: "video", title: "CWTS Intro", completed: false }] },
            { id: 2, title: "Module 2: Volunteerism", status: "locked", term: "midterm", semester: "first", contents: [{ type: "video", title: "The Spirit of Volunteerism", completed: false }] },
            { id: 3, title: "Module 3: Community Organization", status: "locked", term: "finals", semester: "first", contents: [{ type: "slideshow", title: "Community Project Planning", completed: false }] },
            { id: 6, title: "Module 4: Disaster Risk Reduction", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Safety Protocols", completed: false }] },
            { id: 7, title: "Module 5: Environmental Awareness", status: "locked", term: "midterm", semester: "second", contents: [{ type: "handout-a", title: "Eco Conservation", completed: false }] }
        ],
        tasks: TASKS_NSTP1,
        instructor: { name: "Dan Risty Montojo", title: "Instructor", email: "d.montojo@university.edu" }
    },
    "pe1": {
        modules: [
            { id: 1, title: "Module 1: Physical Fitness Basics", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "Fitness Parameters", completed: false }, { type: "video", title: "Proper Warmups", completed: false }] },
            { id: 2, title: "Module 2: Aerobic Exercises", status: "locked", term: "midterm", semester: "first", contents: [{ type: "video", title: "Aerobics Demo", completed: false }] },
            { id: 3, title: "Module 3: Strength Training", status: "locked", term: "finals", semester: "first", contents: [{ type: "slideshow", title: "Basic Calisthenics", completed: false }] },
            { id: 6, title: "Module 4: Team Sports Basics", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Basketball Fundamentals", completed: false }] },
            { id: 7, title: "Module 5: Individual Sports", status: "locked", term: "midterm", semester: "second", contents: [{ type: "slideshow", title: "Badminton Rules", completed: false }] }
        ],
        tasks: TASKS_PE1,
        instructor: { name: "Mark Joseph Danoy", title: "Instructor", email: "m.danoy@university.edu" }
    },
    "ppc": {
        modules: [
            { id: 1, title: "Module 1: What is Pop Culture?", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "Definitions and Context", completed: false }, { type: "video", title: "Intro to PPC", completed: false }] },
            { id: 2, title: "Module 2: Media and Society", status: "locked", term: "midterm", semester: "first", contents: [{ type: "video", title: "Mass Media Influence", completed: false }] },
            { id: 3, title: "Module 3: Cultural Trends", status: "locked", term: "finals", semester: "first", contents: [{ type: "slideshow", title: "Filipino Internet Culture", completed: false }] },
            { id: 6, title: "Module 4: Subcultures & Fandoms", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Fandom Mechanics", completed: false }] },
            { id: 7, title: "Module 5: Global Pop Culture", status: "locked", term: "midterm", semester: "second", contents: [{ type: "handout-a", title: "K-Pop and Anime", completed: false }] }
        ],
        tasks: TASKS_PPC,
        instructor: { name: "Claire Maurillo", title: "Instructor", email: "c.maurillo@university.edu" }
    },
    "purcom": {
        modules: [
            { id: 1, title: "Module 1: Communication Principles", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "Verbal and Non-verbal", completed: false }, { type: "slideshow", title: "Communication Models", completed: false }] },
            { id: 2, title: "Module 2: Intercultural Communication", status: "locked", term: "midterm", semester: "first", contents: [{ type: "video", title: "Global Contexts", completed: false }] },
            { id: 3, title: "Module 3: Professional Writing", status: "locked", term: "finals", semester: "first", contents: [{ type: "slideshow", title: "Emails and Reports", completed: false }] },
            { id: 6, title: "Module 4: Public Speaking", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Speech Delivery", completed: false }] },
            { id: 7, title: "Module 5: Digital Communication", status: "locked", term: "midterm", semester: "second", contents: [{ type: "handout-a", title: "Netiquette", completed: false }] }
        ],
        tasks: TASKS_PURCOM,
        instructor: { name: "John Denielle San Martin", title: "Instructor", email: "j.sanmartin@university.edu" }
    },
    "tcw": {
        modules: [
            { id: 1, title: "Module 1: Intro to Globalization", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "video", title: "The Global Village", completed: false }, { type: "handout-a", title: "Global Issues", completed: false }] },
            { id: 2, title: "Module 2: Global Economy", status: "locked", term: "midterm", semester: "first", contents: [{ type: "handout-a", title: "Economic Systems", completed: false }] },
            { id: 3, title: "Module 3: Global Demography", status: "locked", term: "finals", semester: "first", contents: [{ type: "slideshow", title: "Population Trends", completed: false }] },
            { id: 6, title: "Module 4: Global Politics", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "International Relations", completed: false }] },
            { id: 7, title: "Module 5: Sustainable Development", status: "locked", term: "midterm", semester: "second", contents: [{ type: "handout-a", title: "SDGs", completed: false }] }
        ],
        tasks: TASKS_TCW,
        instructor: { name: "Claire Maurillo", title: "Instructor", email: "c.maurillo@university.edu" }
    },
    "uts": {
        modules: [
            { id: 1, title: "Module 1: The Self in Philosophy", status: "in-progress", term: "prelims", semester: "first", contents: [{ type: "handout-a", title: "Socrates to Descartes", completed: false }, { type: "slideshow", title: "Philosophers", completed: false }] },
            { id: 2, title: "Module 2: Psychological Perspectives", status: "locked", term: "midterm", semester: "first", contents: [{ type: "video", title: "Cognitive Development", completed: false }] },
            { id: 3, title: "Module 3: The Digital Self", status: "locked", term: "finals", semester: "first", contents: [{ type: "slideshow", title: "Identity Online", completed: false }] },
            { id: 6, title: "Module 4: The Physical Self", status: "locked", term: "prelims", semester: "second", contents: [{ type: "video", title: "Body Image", completed: false }] },
            { id: 7, title: "Module 5: The Emotional Self", status: "locked", term: "midterm", semester: "second", contents: [{ type: "handout-a", title: "Emotional Intelligence", completed: false }] }
        ],
        tasks: TASKS_UTS,
        instructor: { name: "Claire Maurillo", title: "Instructor", email: "c.maurillo@university.edu" }
    } 
};
'''

# Find the start of export const COURSE_DATA
start_idx = content.find('export const COURSE_DATA: Record<string, CourseDataType> = {')
if start_idx == -1:
    print('Could not find COURSE_DATA')
    exit(1)

# Find the end of COURSE_DATA
# We look for `};` that closes COURSE_DATA.
# Given the file structure, it's right before `const DEFAULT_FALLBACK`
end_idx = content.find('const DEFAULT_FALLBACK:', start_idx)

if end_idx != -1:
    # backtrack to previous };
    end_idx = content.rfind('};', start_idx, end_idx) + 2

new_content = content[:start_idx] + custom_data + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Success')
