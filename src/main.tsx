import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/intro.css'
import './styles/horizontal-home.css'
import App from './App.tsx'

import { addXP, saveXPData } from './services/studyTimeService';

// Expose global console helpers for testing XP/Levels
(window as any).awardXP = (amount: number) => {
    addXP(amount);
    console.log(`%c🎉 Awarded ${amount} XP! Persisted to Database & LocalStorage.`, 'color: #3b82f6; font-weight: bold;');
    location.reload();
};

(window as any).resetXP = () => {
    saveXPData({ totalXP: 0, currentLevel: 1, xpInCurrentLevel: 0, lastLevelUp: null });
    console.log('%c🔄 XP reset successfully! Fresh start at Level 1 (0/100 XP) persisted to Database & LocalStorage.', 'color: #ef4444; font-weight: bold;');
    location.reload();
};


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
