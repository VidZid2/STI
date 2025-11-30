import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../student-login.css';

const StudentLogin: React.FC = () => {
    const navigate = useNavigate();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showTroubleshooting, setShowTroubleshooting] = useState(false);
    const [showTroubleshootingModal, setShowTroubleshootingModal] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoadingBarActive, setIsLoadingBarActive] = useState(false);
    const [isAccountActive, setIsAccountActive] = useState(false);
    const [copyConfirmationVisible, setCopyConfirmationVisible] = useState(false);
    const [copyConfirmationModalVisible, setCopyConfirmationModalVisible] = useState(false);
    const [flaggingEnabled, setFlaggingEnabled] = useState(false);
    const [flaggingModalEnabled, setFlaggingModalEnabled] = useState(false);
    const [showForgetDropdown, setShowForgetDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowForgetDropdown(false);
            }
        };

        if (showForgetDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showForgetDropdown]);

    const handleAccountClick = () => {
        setShowTroubleshooting(false);
        setIsAccountActive(true);
        setIsLoadingBarActive(true);

        setTimeout(() => {
            setShowPasswordModal(true);
            setIsLoadingBarActive(false);
            setIsAccountActive(false);
        }, 800);
    };

    const handleBackClick = () => {
        setShowPasswordModal(false);
        setShowTroubleshootingModal(false);
    };

    const handleUseAnotherAccount = () => {
        setShowTroubleshooting(false);
        // Redirect to actual eLMS
        window.location.href = 'https://elms.sti.edu';
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'testing101') {
            // Navigate to dashboard
            navigate('/dashboard');
        } else {
            alert('Incorrect password. Please try again.');
            setPassword('');
        }
    };

    const handleCopyInfo = () => {
        const text = `Error Code: 50058\nRequest Id: 1035bd5b-ecc3-42f6-9311-2a24af781600\nCorrelation Id: e28caa2e-a04f-49bd-b0a3-be28f5a625ab\nTimestamp: 2025-10-10T04:40:29.494Z`;
        navigator.clipboard.writeText(text).then(() => {
            setCopyConfirmationVisible(true);
        });
    };

    const handleCopyInfoModal = () => {
        const text = `Error Code: 50058\nRequest Id: 1035bd5b-ecc3-42f6-9311-2a24af781600\nCorrelation Id: e28caa2e-a04f-49bd-b0a3-be28f5a625ab\nTimestamp: 2025-10-10T04:40:29.494Z`;
        navigator.clipboard.writeText(text).then(() => {
            setCopyConfirmationModalVisible(true);
        });
    };

    return (
        <div className="student-login-wrapper">
            {!showPasswordModal ? (
                <div className="login-container">
                    <div className="login-card">
                        {isLoadingBarActive && (
                            <div className="dot-floating-container">
                                <div className="dot-floating">
                                    <span className="dot dot-1"></span>
                                    <span className="dot dot-2"></span>
                                    <span className="dot dot-3"></span>
                                </div>
                            </div>
                        )}

                        <div className="logo">
                            <img src="/images/Microsoft-Logo.png" alt="Microsoft" className="microsoft-logo-img" />
                        </div>

                        <h1 className="title">Pick an account</h1>

                        <div className="account-list">
                            <div
                                className={`account-item first-account${isAccountActive ? ' active' : ''}`}
                                tabIndex={0}
                                onClick={handleAccountClick}
                            >
                                <div className="account-avatar">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" color="#666666" fill="none">
                                        <path d="M8.5 18C10.3135 16.0463 13.667 15.9543 15.5 18M13.9406 12C13.9406 13.1046 13.0688 14 11.9934 14C10.918 14 10.0462 13.1046 10.0462 12C10.0462 10.8954 10.918 10 11.9934 10C13.0688 10 13.9406 10.8954 13.9406 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                                        <path d="M9.5 4.00195C6.85561 4.01181 5.44101 4.10427 4.52513 4.97195C3.5 5.94312 3.5 7.5062 3.5 10.6324V15.3692C3.5 18.4954 3.5 20.0584 4.52513 21.0296C5.55025 22.0008 7.20017 22.0008 10.5 22.0008H13.5C16.7998 22.0008 18.4497 22.0008 19.4749 21.0296C20.5 20.0584 20.5 18.4954 20.5 15.3692V10.6324C20.5 7.5062 20.5 5.94312 19.4749 4.97195C18.559 4.10427 17.1444 4.01181 14.5 4.00195" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <path d="M9.77216 3.63163C9.8681 3.21682 9.91608 3.00942 10.0082 2.84004C10.2229 2.44546 10.6188 2.15548 11.0914 2.0467C11.2943 2 11.5296 2 12 2C12.4704 2 12.7057 2 12.9086 2.0467C13.3812 2.15548 13.7771 2.44545 13.9918 2.84004C14.0839 3.00942 14.1319 3.21682 14.2278 3.63163L14.3111 3.99176C14.4813 4.72744 14.5664 5.09528 14.438 5.37824C14.3549 5.5615 14.2132 5.71842 14.031 5.82911C13.7496 6 13.3324 6 12.4981 6H11.5019C10.6676 6 10.2504 6 9.96901 5.82911C9.78677 5.71842 9.6451 5.5615 9.56197 5.37824C9.43361 5.09528 9.51869 4.72744 9.68886 3.99176L9.77216 3.63163Z" stroke="currentColor" strokeWidth="1.5"></path>
                                    </svg>
                                </div>
                                <div className="account-info">
                                    <span className="account-email">deasis.462124@meycauayan.sti.edu.ph</span>
                                </div>
                                <div className="account-options-wrapper" ref={dropdownRef}>
                                    <button
                                        className="account-options"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowForgetDropdown(!showForgetDropdown);
                                        }}
                                        aria-label="More options"
                                    >⋮</button>
                                    {showForgetDropdown && (
                                        <div className="forget-dropdown">
                                            <button
                                                className="forget-option"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowForgetDropdown(false);
                                                    // Handle forget action
                                                }}
                                            >
                                                Forget
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div
                                className="account-item add-account"
                                tabIndex={0}
                                onClick={handleUseAnotherAccount}
                            >
                                <div className="account-avatar add-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 5V19M5 12H19" stroke="#666666" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div className="account-info">
                                    <span className="account-email">Use another account</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {showTroubleshooting && (
                        <div className="troubleshooting-card">
                            <div className="troubleshooting-header">
                                <h2 className="troubleshooting-title">Troubleshooting details</h2>
                            </div>
                            <p className="troubleshooting-intro">If you contact your administrator, send this info to them.</p>
                            <div className="copy-section">
                                <a href="#" className="copy-link" onClick={(e) => { e.preventDefault(); handleCopyInfo(); }}>Copy info to clipboard</a>
                                {copyConfirmationVisible && (
                                    <div className="copy-confirmation show">
                                        {/* @ts-ignore */}
                                        <lord-icon
                                            src="https://cdn.lordicon.com/uvofdfal.json"
                                            trigger="in"
                                            state="in-reveal"
                                            colors="primary:#109121"
                                            style={{ width: '20px', height: '20px', display: 'block' }}>
                                            {/* @ts-ignore */}
                                        </lord-icon>
                                        <span className="copied-text">Copied</span>
                                    </div>
                                )}
                            </div>

                            <div className="troubleshooting-info">
                                <div className="info-row">
                                    <span className="info-label">Error Code:</span>
                                    <span className="info-value">50058</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Request Id:</span>
                                    <span className="info-value">1035bd5b-ecc3-42f6-9311-2a24af781600</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Correlation Id:</span>
                                    <span className="info-value">e28caa2e-a04f-49bd-b0a3-be28f5a625ab</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Timestamp:</span>
                                    <span className="info-value">2025-10-10T04:40:29.494Z</span>
                                </div>
                            </div>

                            <div className="flag-section">
                                <p className="flag-title">
                                    <span className="info-label">Flag sign-in errors for review:</span>{' '}
                                    <a
                                        href="#"
                                        className="troubleshooting-link"
                                        onClick={(e) => { e.preventDefault(); setFlaggingEnabled(!flaggingEnabled); }}
                                    >
                                        {flaggingEnabled ? 'Disable flagging' : 'Enable flagging'}
                                    </a>
                                </p>
                                <p className="flag-description">If you plan on getting help for this problem, enable flagging and try to reproduce the error within 20 minutes. Flagged events make diagnostics available and are raised to admin attention.</p>
                            </div>
                        </div>
                    )}

                    <footer className="page-footer">
                        <a href="https://www.microsoft.com/en-US/servicesagreement/" target="_blank" rel="noreferrer" className="footer-link-small">Terms of use</a>
                        <a href="https://www.microsoft.com/en-US/privacy/privacystatement" target="_blank" rel="noreferrer" className="footer-link-small">Privacy & cookies</a>
                        <a href="#" className="footer-link-small footer-dots" onClick={(e) => { e.preventDefault(); setShowTroubleshooting(!showTroubleshooting); }}>•  •  •</a>
                    </footer>
                </div>
            ) : (
                <div className="password-modal" style={{ display: 'flex' }}>
                    <div className="login-card password-card">
                        <div className="logo">
                            <img src="/images/Microsoft-Logo.png" alt="Microsoft" className="microsoft-logo-img" />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', marginLeft: '-8px' }}>
                            <button className="back-btn-wrapper" onClick={handleBackClick} aria-label="Back">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                    <path d="M18,11.578v.844H7.617l3.921,3.928-.594.594L6,12l4.944-4.944.594.594L7.617,11.578Z" fill="#404040" />
                                    <path d="M10.944,7.056l.594.594L7.617,11.578H18v.844H7.617l3.921,3.928-.594.594L6,12l4.944-4.944m0-.141-.071.07L5.929,11.929,5.858,12l.071.071,4.944,4.944.071.07.071-.07.594-.595.071-.07-.071-.071L7.858,12.522H18.1V11.478H7.858l3.751-3.757.071-.071-.071-.07-.594-.595-.071-.07Z" fill="#404040" />
                                </svg>
                            </button>
                            <span className="email-text">deasis.462124@mycauayan.sti.edu.ph</span>
                        </div>

                        <h1 className="title">Enter password</h1>

                        <form className="password-form" onSubmit={handlePasswordSubmit}>
                            <div className="form-group">
                                <input
                                    type="password"
                                    id="password"
                                    className="form-input"
                                    placeholder="Password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <a href="#" className="forgot-password">Forgot my password</a>
                            <div className="button-group">
                                <button type="submit" className="submit-btn">Sign in</button>
                            </div>
                        </form>
                    </div>

                    {showTroubleshootingModal && (
                        <div className="troubleshooting-card">
                            <div className="troubleshooting-header">
                                <h2 className="troubleshooting-title">Troubleshooting details</h2>
                                <button
                                    className="close-btn"
                                    onClick={() => setShowTroubleshootingModal(false)}
                                    aria-label="Close"
                                >×</button>
                            </div>
                            <p className="troubleshooting-intro">If you contact your administrator, send this info to them.</p>
                            <div className="copy-section">
                                <a href="#" className="copy-link" onClick={(e) => { e.preventDefault(); handleCopyInfoModal(); }}>Copy info to clipboard</a>
                                {copyConfirmationModalVisible && (
                                    <div className="copy-confirmation show">
                                        {/* @ts-ignore */}
                                        <lord-icon
                                            src="https://cdn.lordicon.com/uvofdfal.json"
                                            trigger="in"
                                            state="in-reveal"
                                            colors="primary:#109121"
                                            style={{ width: '20px', height: '20px', display: 'block' }}>
                                            {/* @ts-ignore */}
                                        </lord-icon>
                                        <span className="copied-text">Copied</span>
                                    </div>
                                )}
                            </div>

                            <div className="troubleshooting-info">
                                <div className="info-row">
                                    <span className="info-label">Error Code:</span>
                                    <span className="info-value">50058</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Request Id:</span>
                                    <span className="info-value">1035bd5b-ecc3-42f6-9311-2a24af781600</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Correlation Id:</span>
                                    <span className="info-value">e28caa2e-a04f-49bd-b0a3-be28f5a625ab</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Timestamp:</span>
                                    <span className="info-value">2025-10-10T04:40:29.494Z</span>
                                </div>
                            </div>

                            <div className="flag-section">
                                <p className="flag-title">
                                    <span className="info-label">Flag sign-in errors for review:</span>{' '}
                                    <a
                                        href="#"
                                        className="troubleshooting-link"
                                        onClick={(e) => { e.preventDefault(); setFlaggingModalEnabled(!flaggingModalEnabled); }}
                                    >
                                        {flaggingModalEnabled ? 'Disable flagging' : 'Enable flagging'}
                                    </a>
                                </p>
                                <p className="flag-description">If you plan on getting help for this problem, enable flagging and try to reproduce the error within 20 minutes. Flagged events make diagnostics available and are raised to admin attention.</p>
                            </div>
                        </div>
                    )}

                    <footer className="page-footer">
                        <a href="https://www.microsoft.com/en-US/servicesagreement/" target="_blank" rel="noreferrer" className="footer-link-small">Terms of use</a>
                        <a href="https://www.microsoft.com/en-US/privacy/privacystatement" target="_blank" rel="noreferrer" className="footer-link-small">Privacy & cookies</a>
                        <a href="#" className="footer-link-small" onClick={(e) => { e.preventDefault(); setShowTroubleshootingModal(!showTroubleshootingModal); }}>...</a>
                    </footer>
                </div>
            )}
        </div>
    );
};

export default StudentLogin;
