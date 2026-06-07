/**
 * useKeyboardNavigation - Student Dashboard Keyboard Shortcuts
 * Provides keyboard navigation for main nav items and common actions
 */

import { useEffect, useCallback } from 'react';
import type { DashboardView } from '../types';

interface KeyboardNavOptions {
  activeView: DashboardView;
  setActiveView: (view: DashboardView) => void;
  openSettingsModal: () => void;
  toggleSidebar: () => void;
  isModalOpen?: boolean;
}

export const useKeyboardNavigation = (options: KeyboardNavOptions) => {
  const { activeView, setActiveView, openSettingsModal, toggleSidebar, isModalOpen = false } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs or when modals are open
    if (
      isModalOpen ||
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target instanceof HTMLElement && event.target.isContentEditable)
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;

    // Navigation shortcuts (Alt/Option + Number)
    if (event.altKey) {
      switch (key) {
        case '1':
          event.preventDefault();
          setActiveView('home');
          break;
        case '2':
          event.preventDefault();
          setActiveView('catalog');
          break;
        case '3':
          event.preventDefault();
          setActiveView('paths');
          break;
        case '4':
          event.preventDefault();
          setActiveView('tools');
          break;
        case '5':
          event.preventDefault();
          setActiveView('goals');
          break;
        case '6':
          event.preventDefault();
          setActiveView('groups');
          break;
        case '7':
          event.preventDefault();
          setActiveView('users');
          break;
      }
    }

    // Ctrl/Cmd shortcuts
    if (ctrl) {
      switch (key) {
        case ',': // Cmd/Ctrl + , for settings
          event.preventDefault();
          openSettingsModal();
          break;
        case 'b': // Cmd/Ctrl + b to toggle sidebar
          event.preventDefault();
          toggleSidebar();
          break;
      }
    }

    // Quick escape to go home
    if (key === 'escape' && activeView !== 'home') {
      // Check if no modal is open
      if (!document.querySelector('[role="dialog"]')) {
        setActiveView('home');
      }
    }

    // Question mark for help
    if (key === '?' && !event.shiftKey) {
      event.preventDefault();
      // Dispatch custom event to open keyboard shortcuts modal
      window.dispatchEvent(new CustomEvent('open-keyboard-shortcuts'));
    }
  }, [activeView, setActiveView, openSettingsModal, toggleSidebar, isModalOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

export default useKeyboardNavigation;
