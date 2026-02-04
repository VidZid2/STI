/**
 * DashboardPage Constants
 * Static data and configuration values
 */

import type { SidebarCourse, WidgetVisibility } from './types';

// Courses base data - defined outside component to prevent recreation
// Progress is loaded dynamically from studyTimeService/database
export const SIDEBAR_COURSES_BASE: Omit<SidebarCourse, 'progress'>[] = [
    { id: 'cp1', title: "Computer Programming 1 - SY2526-1T", subtitle: "CITE1003 · BSIT101A", image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=300&h=200&fit=crop&crop=center" },
    { id: 'euth1', title: "Euthenics 1 - SY2526-1T", subtitle: "STIC1002 · BSIT101A", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop&crop=center" },
    { id: 'itc', title: "Introduction to Computing - SY2526-1T", subtitle: "CITE1004 · BSIT101A", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center" },
    { id: 'nstp1', title: "National Service Training Program 1 - SY2526-1T", subtitle: "NSTP1008 · BSIT101A", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&h=200&fit=crop&crop=center" },
    { id: 'pe1', title: "P.E./PATHFIT 1: Movement Competency Training - SY2526-1T", subtitle: "PHED1005 · BSIT101A", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=200&fit=crop&crop=center" },
    { id: 'ppc', title: "Philippine Popular Culture - SY2526-1T", subtitle: "GEDC1041 · BSIT101A", image: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=300&h=200&fit=crop&crop=center" },
    { id: 'purcom', title: "Purposive Communication - SY2526-1T", subtitle: "GEDC1016 · BSIT101A", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=200&fit=crop&crop=center" },
    { id: 'tcw', title: "The Contemporary World - SY2526-1T", subtitle: "GEDC1002 · BSIT101A", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop&crop=center" },
    { id: 'uts', title: "Understanding the Self - SY2526-1T", subtitle: "GEDC1008 · BSIT101A", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=center" },
];

// Course name mappings for display
export const COURSE_NAMES: Record<string, string> = {
    'cp1': 'Computer Programming 1',
    'euth1': 'Euthenics 1',
    'itc': 'Intro to Computing',
    'nstp1': 'NSTP 1',
    'pe1': 'PE/PATHFIT 1',
    'ppc': 'Philippine Popular Culture',
    'purcom': 'Purposive Communication',
    'tcw': 'The Contemporary World',
    'uts': 'Understanding the Self',
};

// Default widget visibility state
export const DEFAULT_WIDGET_VISIBILITY: WidgetVisibility = {
    'mastery-widget': true,
    'calendar-widget': true,
    'todo-widget': true,
    'announcements-widget': true,
    'activity-widget': true,
    'courses-widget': true,
    'quote-widget': true,
    'weather-widget': true,
    'grade-predictor-widget': true,
    'achievements-widget': true,
};

// Motivational Quotes - rotates daily
export const MOTIVATIONAL_QUOTES = [
    { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
    { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "Education is not preparation for life; education is life itself.", author: "John Dewey" },
    { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
    { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
    { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "The only person who is educated is the one who has learned how to learn and change.", author: "Carl Rogers" },
    { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
    { text: "The purpose of education is to replace an empty mind with an open one.", author: "Malcolm Forbes" },
    { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
    { text: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.", author: "Richard Feynman" },
    { text: "The function of education is to teach one to think intensively and to think critically.", author: "Martin Luther King Jr." },
    { text: "Anyone who stops learning is old, whether at twenty or eighty.", author: "Henry Ford" },
    { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
    { text: "The best way to predict your future is to create it.", author: "Abraham Lincoln" },
    { text: "What we learn with pleasure we never forget.", author: "Alfred Mercier" },
    { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
    { text: "Intelligence plus character—that is the goal of true education.", author: "Martin Luther King Jr." },
    { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Your limitation—it's only your imagination.", author: "Unknown" },
];

// Weather refresh interval (30 minutes)
export const WEATHER_REFRESH_INTERVAL = 30 * 60 * 1000;

// Default location (Meycauayan, Bulacan - STI location)
export const DEFAULT_LOCATION = {
    lat: 14.7569,
    lon: 120.9603,
    name: 'Meycauayan',
};

// Day names for calendar/insights
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Month names
export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
