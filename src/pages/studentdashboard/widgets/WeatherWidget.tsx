/**
 * WeatherWidget Component
 * Displays current weather with animated icons
 */

import React from 'react';
import { motion } from 'motion/react';
import type { WeatherData } from '../types';

interface WeatherWidgetProps {
    weather: WeatherData | null;
    loading: boolean;
    error: string | null;
    compactMode?: boolean;
    onClose: () => void;
}

const WeatherIcon: React.FC<{ icon: WeatherData['icon']; size: string }> = ({ icon }) => {
    const iconClass = `w-full h-full`;
    
    switch (icon) {
        case 'sunny':
            return (
                <motion.svg
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className={`${iconClass} text-amber-400`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </motion.svg>
            );
        case 'night':
            return (
                <svg className={`${iconClass} text-indigo-400`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
            );
        case 'cloudy':
            return (
                <svg className={`${iconClass} text-slate-400`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
                </svg>
            );
        case 'partly-cloudy':
            return (
                <svg className={`${iconClass} text-sky-400`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
                </svg>
            );
        case 'rainy':
            return (
                <svg className={`${iconClass} text-blue-500`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
                </svg>
            );
        case 'stormy':
            return (
                <svg className={`${iconClass} text-slate-600`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
                </svg>
            );
        default:
            return null;
    }
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
    weather,
    loading,
    error,
    compactMode = false,
    onClose,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            className={`bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 rounded-xl border border-sky-100/60 overflow-hidden ${compactMode ? 'shadow-none' : 'shadow-sm'}`}
            id="weather-widget"
        >
            <div className={`relative ${compactMode ? 'p-3' : 'p-4'}`}>
                {/* Close button */}
                <motion.button
                    whileHover={{ scale: 1.15, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className={`absolute top-2 right-2 flex items-center justify-center rounded-md text-sky-300 hover:text-red-400 transition-colors ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                >
                    <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>

                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-6 h-6 border-2 border-sky-200 border-t-sky-500 rounded-full"
                        />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-4">
                        <svg className="w-8 h-8 text-sky-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                        <p className={`text-sky-400 ${compactMode ? 'text-[10px]' : 'text-xs'}`}>{error}</p>
                    </div>
                ) : weather && (
                    <div className="flex items-center gap-3">
                        {/* Weather Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className={`flex-shrink-0 ${compactMode ? 'w-12 h-12' : 'w-14 h-14'}`}
                        >
                            <WeatherIcon icon={weather.icon} size={compactMode ? 'w-12 h-12' : 'w-14 h-14'} />
                        </motion.div>

                        {/* Weather Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1">
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`font-bold text-slate-700 ${compactMode ? 'text-2xl' : 'text-3xl'}`}
                                >
                                    {weather.temperature}°
                                </motion.span>
                                <span className={`text-slate-400 ${compactMode ? 'text-[10px]' : 'text-xs'}`}>C</span>
                            </div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className={`text-slate-600 font-medium ${compactMode ? 'text-[10px]' : 'text-xs'}`}
                            >
                                {weather.condition}
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className={`flex items-center gap-2 mt-1 text-slate-400 ${compactMode ? 'text-[8px]' : 'text-[9px]'}`}
                            >
                                <span className="flex items-center gap-0.5">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                    </svg>
                                    {weather.location}
                                </span>
                                <span>•</span>
                                <span>{weather.humidity}% humidity</span>
                            </motion.div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default WeatherWidget;
