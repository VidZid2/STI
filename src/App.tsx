import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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
import { NotificationProvider } from './contexts/NotificationContext'

function HomePage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const clickSoundRef = useRef<HTMLAudioElement>(null);

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

function App() {
  return (
    <Router>
      <SmoothCursor />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/dashboard" element={<NotificationProvider><DashboardPage /></NotificationProvider>} />
      </Routes>
    </Router>
  )
}

export default App
