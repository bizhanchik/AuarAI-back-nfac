import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { weatherAPI } from '../services/api';
import toast from 'react-hot-toast';

const WeatherContext = createContext();

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};

export const WeatherProvider = ({ children }) => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Cache duration in milliseconds (10 minutes)
  const CACHE_DURATION = 10 * 60 * 1000;

  // Check if cache is still valid
  const isCacheValid = useCallback(() => {
    if (!lastUpdated) return false;
    return Date.now() - lastUpdated < CACHE_DURATION;
  }, [lastUpdated]);

  // Fetch current weather
  const fetchCurrentWeather = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && currentWeather && isCacheValid()) {
      return currentWeather;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await weatherAPI.getUserLocationWeather();
      const weatherData = response.data;
      
      setCurrentWeather(weatherData);
      setLastUpdated(Date.now());
      return weatherData;
    } catch (error) {
      console.error('Error fetching current weather:', error);
      const fallbackWeather = {
        temperature: 24,
        location: 'Almaty',
        condition: 'few clouds',
        humidity: 45,
        wind_speed: 5,
        icon: 'partly-cloudy'
      };
      setCurrentWeather(fallbackWeather);
      setError('Using fallback weather data');
      return fallbackWeather;
    } finally {
      setLoading(false);
    }
  }, [currentWeather, isCacheValid]);

  // Fetch weather forecast
  const fetchForecast = useCallback(async (days = 5, forceRefresh = false) => {
    if (!forceRefresh && forecastData && isCacheValid()) {
      return forecastData;
    }

    setForecastLoading(true);
    setError(null);

    try {
      const response = await weatherAPI.getUserLocationForecast(days);
      const forecast = response.data;
      
      setForecastData(forecast);
      setLastUpdated(Date.now());
      return forecast;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      setError('Failed to fetch weather forecast');
      toast.error('Failed to load weather forecast');
      return null;
    } finally {
      setForecastLoading(false);
    }
  }, [forecastData, isCacheValid]);

  // Get weather by specific coordinates
  const fetchWeatherByCoordinates = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);

    try {
      const response = await weatherAPI.getWeatherByCoordinates(lat, lon);
      return response.data;
    } catch (error) {
      console.error('Error fetching weather by coordinates:', error);
      setError('Failed to fetch weather for location');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get weather forecast by specific coordinates
  const fetchForecastByCoordinates = useCallback(async (lat, lon, days = 5) => {
    setForecastLoading(true);
    setError(null);

    try {
      const response = await weatherAPI.getWeatherForecast(lat, lon, days);
      return response.data;
    } catch (error) {
      console.error('Error fetching forecast by coordinates:', error);
      setError('Failed to fetch forecast for location');
      return null;
    } finally {
      setForecastLoading(false);
    }
  }, []);

  // Refresh all weather data
  const refreshWeatherData = useCallback(async () => {
    await Promise.all([
      fetchCurrentWeather(true),
      fetchForecast(5, true)
    ]);
  }, [fetchCurrentWeather, fetchForecast]);

  // Auto-fetch weather data on mount
  useEffect(() => {
    fetchCurrentWeather();
  }, [fetchCurrentWeather]);

  // Weather utility functions
  const getWeatherIcon = useCallback((condition, className = "h-6 w-6") => {
    const lowerCondition = condition?.toLowerCase() || '';
    
    if (lowerCondition.includes('rain')) return 'cloud-rain';
    if (lowerCondition.includes('snow')) return 'snowflake';
    if (lowerCondition.includes('cloud')) return 'cloud';
    if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) return 'cloud-lightning';
    if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) return 'cloud-fog';
    if (lowerCondition.includes('wind')) return 'wind';
    return 'sun';
  }, []);

  const getTemperatureColor = useCallback((temp) => {
    if (temp < 0) return 'text-blue-600';
    if (temp < 10) return 'text-blue-500';
    if (temp < 20) return 'text-green-500';
    if (temp < 30) return 'text-yellow-500';
    return 'text-red-500';
  }, []);

  const getWeatherCategory = useCallback((temp) => {
    if (temp < 0) return 'freezing';
    if (temp < 10) return 'cold';
    if (temp < 20) return 'cool';
    if (temp < 25) return 'mild';
    if (temp < 30) return 'warm';
    return 'hot';
  }, []);

  const isWeatherDataStale = useCallback(() => {
    return !isCacheValid();
  }, [isCacheValid]);

  const value = {
    // State
    currentWeather,
    forecastData,
    loading,
    forecastLoading,
    error,
    lastUpdated,
    
    // Actions
    fetchCurrentWeather,
    fetchForecast,
    fetchWeatherByCoordinates,
    fetchForecastByCoordinates,
    refreshWeatherData,
    
    // Utilities
    getWeatherIcon,
    getTemperatureColor,
    getWeatherCategory,
    isWeatherDataStale,
    isCacheValid
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
};

export default WeatherContext; 