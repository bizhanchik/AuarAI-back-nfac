import { motion } from 'framer-motion';
import { 
  CloudIcon, 
  SunIcon, 
  CloudRainIcon, 
  SnowflakeIcon,
  MapPinIcon,
  ThermometerIcon
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useWeather } from '../contexts/WeatherContext';

const WeatherWidget = () => {
  const { t } = useLanguage();
  const { currentWeather: weather, loading } = useWeather();

  const getWeatherIcon = (condition) => {
    const iconProps = { className: "h-6 w-6 text-white" };
    
    if (condition.includes('cloud')) return <CloudIcon {...iconProps} />;
    if (condition.includes('rain')) return <CloudRainIcon {...iconProps} />;
    if (condition.includes('snow')) return <SnowflakeIcon {...iconProps} />;
    return <SunIcon {...iconProps} />;
  };

  if (loading) {
    return (
      <div className="weather-widget animate-pulse">
        <div className="weather-icon">
          <div className="w-6 h-6 bg-white/30 rounded"></div>
        </div>
        <div>
          <div className="h-6 w-12 bg-white/30 rounded mb-1"></div>
          <div className="h-4 w-20 bg-white/30 rounded mb-1"></div>
          <div className="h-3 w-16 bg-white/30 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="weather-widget"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="weather-icon">
        {getWeatherIcon(weather?.condition || 'sunny')}
      </div>
      <div>
        <div className="weather-temp">{weather?.temperature || 24}°C</div>
        <div className="weather-location">{weather?.location || 'Gorny Gigant'}</div>
        <div className="weather-condition">{weather?.condition || 'few clouds'}</div>
      </div>
    </motion.div>
  );
};

export default WeatherWidget; 