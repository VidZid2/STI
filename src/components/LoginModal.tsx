import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (modalRef.current && contentRef.current) {
                modalRef.current.style.display = 'flex';
                setTimeout(() => {
                    modalRef.current?.classList.add('show');
                    contentRef.current?.classList.add('show');
                }, 10);
            }
        } else {
            if (modalRef.current && contentRef.current) {
                modalRef.current.classList.remove('show');
                contentRef.current.classList.remove('show');
                setTimeout(() => {
                    if (modalRef.current) {
                        modalRef.current.style.display = 'none';
                    }
                    document.body.style.overflow = 'auto';
                }, 400);
            }
        }
    }, [isOpen]);

    const handleRoleClick = (role: string) => {
        if (role === 'student') {
            navigate('/student-login');
            onClose();
        } else if (role === 'admin') {
            window.location.href = 'https://elms.sti.edu/admin';
        }
    };

    return (
        <div id="loginBox" className="login-overlay" ref={modalRef} onClick={(e) => {
            if (e.target === modalRef.current) onClose();
        }}>
            <div className="login-box" ref={contentRef}>
                <button className="close-btn" onClick={onClose}>&times;</button>
                <div className="login-container">
                    <div className="login-form">
                        <h3>Select Login Type</h3>

                        <div className="role-selector">
                            <button type="button" className="role-btn" onClick={() => handleRoleClick('student')}>
                                {/* @ts-ignore */}
                                <lord-icon
                                    src="https://cdn.lordicon.com/bushiqea.json"
                                    trigger="hover"
                                    colors="primary:#3b82f6,secondary:#1e40af"
                                    style={{ width: '48px', height: '48px' }}>
                                    {/* @ts-ignore */}
                                </lord-icon>
                                <span>Student</span>
                            </button>
                            <button type="button" className="role-btn" onClick={() => handleRoleClick('admin')}>
                                {/* @ts-ignore */}
                                <lord-icon
                                    src="https://cdn.lordicon.com/urswgamh.json"
                                    trigger="hover"
                                    colors="primary:#3b82f6,secondary:#1e40af"
                                    style={{ width: '48px', height: '48px' }}>
                                    {/* @ts-ignore */}
                                </lord-icon>
                                <span>Admin</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
