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

export const useWeather = (): UseWeatherReturn => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [weatherError, setWeatherError] = useState<string | null>(null);

    const fetchWeather = async () => {
        try {
            setWeatherLoading(true);
            setWeatherError(null);

            // Default to Meycauayan, Bulacan coordinates (STI location)
            let lat = DEFAULT_LOCATION.lat;
            let lon = DEFAULT_LOCATION.lon;
            let locationName = DEFAULT_LOCATION.name;

            // Try to get user's location
            if (navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    lat = position.coords.latitude;
                    lon = position.coords.longitude;
                    locationName = 'Your Location';
                } catch {
                    // Use default location if geolocation fails
                    console.log('[Weather] Using default location (Meycauayan)');
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

            setWeather({
                temperature: Math.round(current.temperature_2m),
                condition,
                humidity: current.relative_humidity_2m,
                windSpeed: Math.round(current.wind_speed_10m),
                location: locationName,
                icon,
            });
        } catch (err) {
            console.error('[Weather] Error:', err);
            setWeatherError('Unable to load weather');
        } finally {
            setWeatherLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
        // Refresh weather every 30 minutes
        const interval = setInterval(fetchWeather, WEATHER_REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    return {
        weather,
        weatherLoading,
        weatherError,
        refreshWeather: fetchWeather,
    };
};

export default useWeather;
