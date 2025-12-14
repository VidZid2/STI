import React, { useEffect, useState } from 'react';

interface NotificationToastProps {
    id: number;
    title: string;
    message: string;
    type: 'assignment' | 'grade' | 'announcement' | 'system' | 'warning';
    onClose: (id: number) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ id, title, message, type, onClose }) => {
    const [progress, setProgress] = useState(100);
    const [isRemoving, setIsRemoving] = useState(false);

    useEffect(() => {
        const duration = 6000; // 6 seconds
        const intervalTime = 50;
        const decrement = (100 / duration) * intervalTime;

        const timer = setInterval(() => {
            setProgress((prev) => {
                const newProgress = prev - decrement;
                if (newProgress <= 0) {
                    clearInterval(timer);
                    handleClose();
                    return 0;
                }
                return newProgress;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, []);

    const handleClose = () => {
        setIsRemoving(true);
        setTimeout(() => {
            onClose(id);
        }, 400); // Match animation duration
    };

    const getIcon = () => {
        switch (type) {
            case 'assignment': return 'fa-book';
            case 'grade': return 'fa-star';
            case 'announcement': return 'fa-bullhorn';
            case 'system': return 'fa-info-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-bell';
        }
    };

    return (
        <div className={`notification-toast ${isRemoving ? 'removing' : 'show'}`} data-notification-id={id}>
            <div className={`toast-icon ${type}`}>
                <i className={`fas ${getIcon()}`}></i>
            </div>
            <div className="toast-content">
                <div className="toast-title">{title}</div>
                <div className="toast-message">{message}</div>
            </div>
            <button className="toast-close" onClick={handleClose}>
                <i className="fas fa-times"></i>
            </button>
            <div className="toast-progress" style={{ width: `${progress}%` }}></div>
        </div>
    );
};

export default NotificationToast;
