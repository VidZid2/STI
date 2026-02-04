/**
 * useDashboardState Hook
 * Handles main dashboard UI state (modals, views, sidebar toggles)
 */

import { useState, useEffect } from 'react';
import type { DashboardView, PreviousView, SelectedCourse } from '../types';

interface UseDashboardStateReturn {
    // Sidebar state
    sidebarActive: boolean;
    setSidebarActive: (active: boolean) => void;
    toggleSidebar: () => void;
    
    // Widgets sidebar state
    widgetsSidebarActive: boolean;
    setWidgetsSidebarActive: (active: boolean) => void;
    toggleWidgetsSidebar: () => void;
    
    // Modal state
    settingsModalActive: boolean;
    setSettingsModalActive: (active: boolean) => void;
    openSettingsModal: () => void;
    closeSettingsModal: () => void;
    
    welcomeModalActive: boolean;
    setWelcomeModalActive: (active: boolean) => void;
    showWelcomeModal: () => void;
    closeWelcomeModal: () => void;
    
    tutorialActive: boolean;
    setTutorialActive: (active: boolean) => void;
    closeTutorial: () => void;
    
    // View state
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    previousView: PreviousView;
    setPreviousView: (view: PreviousView) => void;
    
    // Course state
    selectedCourse: SelectedCourse | null;
    setSelectedCourse: (course: SelectedCourse | null) => void;
    
    // Confetti state
    showConfetti: boolean;
    setShowConfetti: (show: boolean) => void;
    
    // Intro state
    showIntro: boolean;
    setShowIntro: (show: boolean) => void;
    
    // Demo mode
    isDemoMode: boolean;
}

export const useDashboardState = (): UseDashboardStateReturn => {
    // Sidebar state
    const [sidebarActive, setSidebarActive] = useState(false);
    const [widgetsSidebarActive, setWidgetsSidebarActive] = useState(false);
    
    // Modal state
    const [settingsModalActive, setSettingsModalActive] = useState(false);
    const [welcomeModalActive, setWelcomeModalActive] = useState(() => {
        // Don't show welcome modal if intro hasn't been shown yet
        const introNotShown = sessionStorage.getItem('dashboardIntroShown') !== 'true';
        if (introNotShown) return false;
        return localStorage.getItem('welcome-modal-completed') !== 'true';
    });
    const [tutorialActive, setTutorialActive] = useState(false);
    
    // Demo mode state
    const [isDemoMode] = useState(() => {
        return localStorage.getItem('demo-mode-active') === 'true';
    });
    
    // View state - persist across page refreshes
    const [activeView, setActiveView] = useState<DashboardView>(() => {
        const saved = sessionStorage.getItem('dashboard_active_view');
        return (saved as DashboardView) || 'home';
    });
    const [previousView, setPreviousView] = useState<PreviousView>('home');
    
    // Course state - persist across page refreshes
    const [selectedCourse, setSelectedCourse] = useState<SelectedCourse | null>(() => {
        try {
            const saved = sessionStorage.getItem('dashboard_selected_course');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    
    // Confetti and intro state
    const [showConfetti, setShowConfetti] = useState(false);
    const [showIntro, setShowIntro] = useState(() => {
        return sessionStorage.getItem('dashboardIntroShown') !== 'true';
    });

    // Persist active view to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('dashboard_active_view', activeView);
    }, [activeView]);

    // Persist selected course to sessionStorage
    useEffect(() => {
        if (selectedCourse) {
            sessionStorage.setItem('dashboard_selected_course', JSON.stringify(selectedCourse));
        } else {
            sessionStorage.removeItem('dashboard_selected_course');
        }
    }, [selectedCourse]);

    // Setup confetti trigger for intro
    useEffect(() => {
        (window as any).triggerConfettiFromIntro = () => {
            setWelcomeModalActive(true);
            setShowConfetti(true);
        };

        return () => {
            delete (window as any).triggerConfettiFromIntro;
        };
    }, []);

    // Handlers
    const toggleSidebar = () => setSidebarActive(!sidebarActive);
    const toggleWidgetsSidebar = () => setWidgetsSidebarActive(!widgetsSidebarActive);
    
    const openSettingsModal = () => setSettingsModalActive(true);
    const closeSettingsModal = () => setSettingsModalActive(false);
    
    const showWelcomeModal = () => {
        setWelcomeModalActive(true);
        setShowConfetti(false);
    };
    
    const closeWelcomeModal = () => {
        setWelcomeModalActive(false);
        localStorage.setItem('welcome-modal-completed', 'true');
        // Start tutorial after closing welcome modal (only if tutorial hasn't been completed)
        if (localStorage.getItem('tutorial-completed') !== 'true') {
            setTimeout(() => setTutorialActive(true), 300);
        }
    };
    
    const closeTutorial = () => {
        setTutorialActive(false);
        localStorage.setItem('tutorial-completed', 'true');
    };

    return {
        // Sidebar
        sidebarActive,
        setSidebarActive,
        toggleSidebar,
        widgetsSidebarActive,
        setWidgetsSidebarActive,
        toggleWidgetsSidebar,
        
        // Modals
        settingsModalActive,
        setSettingsModalActive,
        openSettingsModal,
        closeSettingsModal,
        welcomeModalActive,
        setWelcomeModalActive,
        showWelcomeModal,
        closeWelcomeModal,
        tutorialActive,
        setTutorialActive,
        closeTutorial,
        
        // Views
        activeView,
        setActiveView,
        previousView,
        setPreviousView,
        
        // Course
        selectedCourse,
        setSelectedCourse,
        
        // Confetti & Intro
        showConfetti,
        setShowConfetti,
        showIntro,
        setShowIntro,
        
        // Demo
        isDemoMode,
    };
};

export default useDashboardState;
