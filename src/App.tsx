import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import WelcomeNotification from './components/WelcomeNotification'
import Hero from './components/Hero'
import Features from './components/Features'
import NeoLMS from './components/NeoLMS'
import LoginModal from './components/LoginModal'
import Footer from './components/Footer'
import IntroAnimation from './components/IntroAnimation'
import { SmoothCursor } from '../@/components/ui/smooth-cursor'
import StudentLogin from './pages/StudentLogin'
import DashboardPage from './pages/DashboardPage'
import JoinGroupPage from './pages/JoinGroupPage'
import GroupChatPage from './pages/GroupChatPage'
import { NotificationProvider } from './contexts/NotificationContext'
import { QuickViewSettingsProvider } from './contexts/QuickViewSettingsContext'

function HomePage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showFadeIn, setShowFadeIn] = useState(false);
  const clickSoundRef = useRef<HTMLAudioElement>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if coming from sign out (via location state or sessionStorage)
    const fromSignOut = sessionStorage.getItem('fromSignOut');
    if (fromSignOut) {
      setShowFadeIn(true);
      sessionStorage.removeItem('fromSignOut');
      // Remove fade after animation
      setTimeout(() => setShowFadeIn(false), 800);
    }
  }, [location]);

  useEffect(() => {
    const handleClick = () => {
      if (clickSoundRef.current) {
        clickSoundRef.current.currentTime = 0;
        clickSoundRef.current.play().catch(e => console.log("Audio play failed", e));
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      {/* Fade out overlay when coming from sign out - covers everything */}
      {showFadeIn && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'white',
            zIndex: 2147483647, // Maximum z-index value
            pointerEvents: 'none',
            animation: 'fadeOut 0.8s ease-out forwards',
          }}
        />
      )}
      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
      <IntroAnimation />
      <Navbar onLoginClick={() => setIsLoginOpen(true)} />
      <WelcomeNotification />
      <Hero />
      <Features />
      <NeoLMS />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <Footer />
      <audio id="click-sound" src="sounds/clicksfx.mp3" preload="auto" ref={clickSoundRef}></audio>
    </>
  );
}

// Wrapper component to conditionally render cursor based on route
function AppContent() {
  const location = useLocation();
  const hideCustomCursor = location.pathname === '/student-login';

  return (
    <>
      {!hideCustomCursor && <SmoothCursor />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/dashboard" element={<NotificationProvider><QuickViewSettingsProvider><DashboardPage /></QuickViewSettingsProvider></NotificationProvider>} />
        <Route path="/join/:inviteCode" element={<JoinGroupPage />} />
        <Route path="/chat/:groupId" element={<NotificationProvider><QuickViewSettingsProvider><GroupChatPage /></QuickViewSettingsProvider></NotificationProvider>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
