import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { HorizontalHome, IntroAnimation } from './components/landing'
import { LoginModal } from './components/modals'
import { SmoothCursor } from '@/components/ui/smooth-cursor'
import StudentLogin from './pages/studentdashboard/StudentLogin'
import DashboardPage from './pages/studentdashboard'
import JoinGroupPage from './pages/studentdashboard/JoinGroupPage'
import FocusModePage from './pages/studentdashboard/FocusModePage'
import TeacherDashboard from './pages/teacherdashboard'
import AdminDashboard from './pages/admindashboard'
import MaintenanceGuard from './components/MaintenanceGuard'
import AdminLogin from './pages/admindashboard/AdminLogin'
import AdminRouteGuard from './components/guards/AdminRouteGuard'
import TeacherRouteGuard from './components/guards/TeacherRouteGuard'
import { NotificationProvider } from './contexts/NotificationContext'
import { QuickViewSettingsProvider } from './contexts/QuickViewSettingsContext'
import { DisplaySettingsProvider, useDisplaySettings } from './contexts/DisplaySettingsContext'
import { NotificationSettingsProvider } from './contexts/NotificationSettingsContext'
import { SystemConfigProvider } from './contexts/SystemConfigContext'
import { ErrorBoundary } from './components/shared'
import { NotFoundPage } from '@/components/ui/404-page-not-found'


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
      <HorizontalHome onLoginClick={() => setIsLoginOpen(true)} />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <audio id="click-sound" src="/sounds/clicksfx.mp3" preload="auto" ref={clickSoundRef}></audio>
    </>
  );
}

// Wrapper component to conditionally render cursor based on route and settings
function AppContent() {
  const location = useLocation();
  const { settings: displaySettings } = useDisplaySettings();

  // Hide cursor on student-login page OR if user has disabled it in settings
  const hideCustomCursor = location.pathname === '/student-login' || displaySettings.hideCustomCursor;

  // Add/remove class on html element to control default cursor visibility
  useEffect(() => {
    if (hideCustomCursor) {
      document.documentElement.classList.add('show-default-cursor');
    } else {
      document.documentElement.classList.remove('show-default-cursor');
    }

    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove('show-default-cursor');
    };
  }, [hideCustomCursor]);

  return (
    <>
      {!hideCustomCursor && <SmoothCursor />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/student-login" element={<MaintenanceGuard><StudentLogin /></MaintenanceGuard>} />
        <Route path="/dashboard" element={<MaintenanceGuard><NotificationProvider><QuickViewSettingsProvider><DashboardPage /></QuickViewSettingsProvider></NotificationProvider></MaintenanceGuard>} />
        <Route path="/teacher-dashboard" element={<TeacherRouteGuard><ErrorBoundary name="TeacherDashboard"><MaintenanceGuard><TeacherDashboard /></MaintenanceGuard></ErrorBoundary></TeacherRouteGuard>} />
        <Route path="/admin-dashboard" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/join/:inviteCode" element={<MaintenanceGuard><JoinGroupPage /></MaintenanceGuard>} />
        <Route path="/focus" element={<MaintenanceGuard><FocusModePage /></MaintenanceGuard>} />
        <Route path="/focus/:groupId" element={<MaintenanceGuard><FocusModePage /></MaintenanceGuard>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <SystemConfigProvider>
        <DisplaySettingsProvider>
          <NotificationSettingsProvider>
            <AppContent />
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 500,
                },
              }}
            />
          </NotificationSettingsProvider>
        </DisplaySettingsProvider>
      </SystemConfigProvider>
    </Router>
  )
}

export default App
