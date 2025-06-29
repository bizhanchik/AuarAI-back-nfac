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

  if (loading) {
    return (
      <div className="text-neutral-700 font-bold text-lg">
        --°C
      </div>
    );
  }

  return (
    <div className="text-neutral-900 font-bold text-lg font-display">
      {weather?.temperature || 24}°C
    </div>
  );
};

export default WeatherWidget; 