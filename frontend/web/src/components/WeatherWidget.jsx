import { CloudIcon, SunIcon, CloudRainIcon, SnowflakeIcon } from 'lucide-react';

const WeatherWidget = ({ weather }) => {
  if (!weather) {
    return (
      <div className="flex items-center px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="w-8 h-8 bg-gray-300 rounded mr-2"></div>
        <div className="space-y-1">
          <div className="w-16 h-3 bg-gray-300 rounded"></div>
          <div className="w-12 h-2 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  const getWeatherIcon = (condition) => {
    const iconClass = "h-6 w-6";
    
    if (condition?.toLowerCase().includes('rain')) {
      return <CloudRainIcon className={`${iconClass} text-blue-500`} />;
    } else if (condition?.toLowerCase().includes('snow')) {
      return <SnowflakeIcon className={`${iconClass} text-blue-300`} />;
    } else if (condition?.toLowerCase().includes('cloud')) {
      return <CloudIcon className={`${iconClass} text-gray-500`} />;
    } else {
      return <SunIcon className={`${iconClass} text-yellow-500`} />;
    }
  };

  const formatTemperature = (temp) => {
    if (typeof temp === 'number') {
      return `${Math.round(temp)}°C`;
    }
    return temp || 'N/A';
  };

  return (
    <div className="flex items-center px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
      <div className="mr-2">
        {getWeatherIcon(weather.description || weather.condition)}
      </div>
      
      <div className="text-sm">
        <div className="font-medium text-gray-900">
          {formatTemperature(weather.temperature || weather.temp)}
        </div>
        <div className="text-xs text-gray-600 truncate max-w-24">
          {weather.city || 'Алматы'}
        </div>
      </div>
      
      {weather.description && (
        <div className="ml-2 text-xs text-gray-500 hidden sm:block max-w-20 truncate">
          {weather.description}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget; 