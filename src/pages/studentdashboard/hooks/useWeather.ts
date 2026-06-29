/**
 * useWeather Hook
 * Handles weather data fetching and state management
 */

import { useState, useEffect } from 'react';
import type { WeatherData } from '../types';
import { DEFAULT_LOCATION, WEATHER_REFRESH_INTERVAL, mapWeatherCode } from '../utils';

interface UseWeatherReturn {
    weather: WeatherData | null;
    weatherLoading: boolean;
    weatherError: string | null;
    refreshWeather: () => Promise<void>;
}

export const useWeather = (skipGeolocation: boolean = false): UseWeatherReturn => {
    const [weather, setWeather] = useState<WeatherData | null>(() => {
        try {
            const cached = sessionStorage.getItem('dashboard_weather_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
                    return parsed.data;
                }
            }
        } catch {}
        return null;
    });
    const [weatherLoading, setWeatherLoading] = useState(() => {
        try {
            const cached = sessionStorage.getItem('dashboard_weather_cache');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
                    return false;
                }
            }
        } catch {}
        return true;
    });
    const [weatherError, setWeatherError] = useState<string | null>(null);

    const fetchWeather = async (force: boolean = false) => {
        try {
            if (!force) {
                // Check cache first
                const cached = sessionStorage.getItem('dashboard_weather_cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
                        setWeather(parsed.data);
                        setWeatherLoading(false);
                        return;
                    }
                }
            }

            setWeatherLoading(true);
            setWeatherError(null);

            // Default to Meycauayan, Bulacan coordinates (STI location)
            let lat = DEFAULT_LOCATION.lat;
            let lon = DEFAULT_LOCATION.lon;
            let locationName = DEFAULT_LOCATION.name;

            // Try to get user's location, skip if requested (e.g. during intro)
            if (navigator.geolocation && !skipGeolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    lat = position.coords.latitude;
                    lon = position.coords.longitude;
                    locationName = 'Your Location';
                } catch {
                    // Use default location if geolocation fails
                }
            }

            // Fetch weather from Open-Meteo API (free, no API key needed)
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
            );

            if (!response.ok) throw new Error('Weather fetch failed');

            const data = await response.json();
            const current = data.current;

            // Map weather code to condition and icon
            const { condition, icon } = mapWeatherCode(current.weather_code);

            const newWeatherData = {
                temperature: Math.round(current.temperature_2m),
                condition,
                humidity: current.relative_humidity_2m,
                windSpeed: Math.round(current.wind_speed_10m),
                location: locationName,
                icon 
            };
            
            setWeather(newWeatherData);

            // Save to cache ONLY if we didn't skip geolocation
            // (so that when intro completes and skipGeolocation=false, it re-fetches with real location)
            if (!skipGeolocation) {
                try {
                    sessionStorage.setItem('dashboard_weather_cache', JSON.stringify({
                        data: newWeatherData,
                        timestamp: Date.now()
                    }));
                } catch {}
            }
        } catch (err) {
            setWeatherError('Unable to load weather');
        } finally {
            setWeatherLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
        // Refresh weather every 30 minutes
        const interval = setInterval(() => fetchWeather(true), WEATHER_REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [skipGeolocation]);

    return {
        weather,
        weatherLoading,
        weatherError,
        refreshWeather: () => fetchWeather(true) 
    };
};

export default useWeather;
