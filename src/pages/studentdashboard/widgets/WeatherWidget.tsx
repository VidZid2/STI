/**
 * WeatherWidget Component
 * Displays current weather with animated icons
 */

import * as React from 'react';
import { motion } from 'motion/react';
import type { WeatherData } from '../types';

interface WeatherWidgetProps {
    weather: WeatherData | null;
    weatherLoading: boolean;
    weatherError: string | null;
    compactMode: boolean;
    onClose: () => void;
}

export const WeatherWidget = React.memo<WeatherWidgetProps>(({
    weather,
    weatherLoading,
    weatherError,
    compactMode,
    onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            className={`bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-sm rounded-[20px] overflow-hidden transition-all duration-300 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 relative`}
            id="weather-widget"
        >
            <div className={`relative ${compactMode ? 'p-3.5' : 'p-4.5'}`}>
                {/* Close button */}
                <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className={`absolute top-3 right-3 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors ${compactMode ? 'w-5 h-5' : 'w-6 h-6'}`}
                >
                    <svg className={compactMode ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </motion.button>

                {weatherLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full"
                        />
                    </div>
                ) : weatherError ? (
                    <div className="flex flex-col items-center justify-center py-4">
                        <svg className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                        <p className={`text-slate-400 dark:text-slate-500 ${compactMode ? 'text-[10px]' : 'text-xs'}`}>{weatherError}</p>
                    </div>
                ) : weather && (
                    <div className="flex items-center gap-3.5">
                        {/* Weather Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className={`flex-shrink-0 ${compactMode ? 'w-10 h-10' : 'w-12 h-12'}`}
                        >
                            {weather.icon === 'sunny' && (
                                <motion.svg
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="w-full h-full text-amber-400" fill="currentColor" viewBox="0 0 24 24"
                                >
                                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                                </motion.svg>
                            )}
                            {weather.icon === 'night' && (
                                <svg className="w-full h-full text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                </svg>
                            )}
                            {weather.icon === 'cloudy' && (
                                <svg className="w-full h-full text-slate-400 dark:text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
                                </svg>
                            )}
                            {weather.icon === 'partly-cloudy' && (
                                <svg className="w-full h-full text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
                                </svg>
                            )}
                            {weather.icon === 'rainy' && (
                                <svg className="w-full h-full text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
                                </svg>
                            )}
                            {weather.icon === 'stormy' && (
                                <svg className="w-full h-full text-slate-650" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4.5 9.75a6 6 0 0111.573-2.226 3.75 3.75 0 014.133 4.303A4.5 4.5 0 0118 20.25H6.75a5.25 5.25 0 01-2.23-10.004 6.072 6.072 0 01-.02-.496z" />
                                </svg>
                            )}
                        </motion.div>

                        {/* Weather Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1">
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`font-black text-slate-800 dark:text-slate-100 ${compactMode ? 'text-2xl' : 'text-3xl'}`}
                                >
                                    {weather.temperature}°
                                </motion.span>
                                <span className={`text-slate-400 dark:text-slate-500 font-bold ${compactMode ? 'text-[10px]' : 'text-xs'}`}>C</span>
                            </div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className={`text-slate-600 dark:text-slate-350 font-semibold ${compactMode ? 'text-[10px]' : 'text-xs'}`}
                            >
                                {weather.condition}
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className={`flex items-center gap-2 mt-2 text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-wider`}
                            >
                                <span className="flex items-center gap-0.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
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
});

WeatherWidget.displayName = 'WeatherWidget';

export default WeatherWidget;
