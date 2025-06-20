import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XIcon, 
  CalendarIcon, 
  CloudIcon, 
  SunIcon, 
  CloudRainIcon, 
  SnowflakeIcon,
  ThermometerSunIcon,
  DropletIcon,
  WindIcon,
  SparklesIcon,
  ShirtIcon,
  LoaderIcon
} from 'lucide-react';
import { clothingAPI } from '../services/api';
import toast from 'react-hot-toast';

const WeatherForecastModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState(null);
  const [outfitData, setOutfitData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [occasion, setOccasion] = useState('casual');

  useEffect(() => {
    if (isOpen) {
      fetchForecastData();
    }
  }, [isOpen]);

  const fetchForecastData = async () => {
    setLoading(true);
    try {
      const response = await clothingAPI.getForecastOutfits(5, occasion);
      setForecastData(response.data.forecast_data);
      setOutfitData(response.data.outfit_recommendations);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      toast.error('Не удалось загрузить прогноз погоды');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition, size = "h-6 w-6") => {
    const iconClass = size;
    
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

  const getTemperatureColor = (temp) => {
    if (temp < 0) return 'text-blue-600';
    if (temp < 10) return 'text-blue-500';
    if (temp < 20) return 'text-green-500';
    if (temp < 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const occasionOptions = [
    'casual', 'work', 'date', 'business', 'sport', 'formal'
  ];

  const handleOccasionChange = (newOccasion) => {
    setOccasion(newOccasion);
    fetchForecastData();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
                  <CalendarIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">
                    Прогноз и стиль
                  </h2>
                  <p className="text-white/80 text-lg">
                    {forecastData?.city ? `${forecastData.city}, ${forecastData.country}` : 'Загрузка...'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Occasion Selector */}
            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                {occasionOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOccasionChange(opt)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      occasion === opt
                        ? 'bg-white text-blue-600 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <LoaderIcon className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-lg text-gray-600">Генерируем персональные рекомендации...</p>
              </div>
            </div>
          ) : (
            <div className="flex h-[calc(90vh-200px)]">
              {/* Weather Forecast Sidebar */}
              <div className="w-1/3 bg-gray-50 p-6 overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <CloudIcon className="h-6 w-6 mr-2 text-blue-600" />
                  5-дневный прогноз
                </h3>
                
                <div className="space-y-3">
                  {forecastData?.daily_forecasts?.map((day, index) => (
                    <motion.button
                      key={day.date}
                      onClick={() => setSelectedDay(index)}
                      className={`w-full p-4 rounded-2xl text-left transition-all ${
                        selectedDay === index
                          ? 'bg-blue-600 text-white shadow-lg scale-[1.02]'
                          : 'bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200'
                      }`}
                      whileHover={{ scale: selectedDay === index ? 1.02 : 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">
                          {index === 0 ? 'Сегодня' : day.date_formatted?.split(',')[0]}
                        </span>
                        {getWeatherIcon(day.condition, "h-5 w-5")}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ThermometerSunIcon className="h-4 w-4 opacity-70" />
                          <span className="text-sm font-medium">
                            {day.temperature_min}°-{day.temperature_max}°C
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-xs opacity-70 mt-1 capitalize">
                        {day.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Outfit Recommendations */}
              <div className="flex-1 p-6 overflow-y-auto">
                {outfitData?.daily_outfits?.[selectedDay] && (
                  <motion.div
                    key={selectedDay}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                        <SparklesIcon className="h-7 w-7 mr-2 text-purple-600" />
                        {selectedDay === 0 ? 'Сегодня' : outfitData.daily_outfits[selectedDay].date_formatted}
                      </h3>
                      <p className="text-lg text-gray-600 mb-1">
                        {outfitData.daily_outfits[selectedDay].weather_summary}
                      </p>
                      <p className="text-purple-600 font-medium">
                        {outfitData.daily_outfits[selectedDay].outfit_theme}
                      </p>
                    </div>

                    {/* Outfit Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Top */}
                      <OutfitItemCard
                        title="Верх"
                        item={outfitData.daily_outfits[selectedDay].recommendations.top}
                        gradient="from-pink-500 to-rose-500"
                      />
                      
                      {/* Bottom */}
                      <OutfitItemCard
                        title="Низ"
                        item={outfitData.daily_outfits[selectedDay].recommendations.bottom}
                        gradient="from-blue-500 to-cyan-500"
                      />
                      
                      {/* Footwear */}
                      <OutfitItemCard
                        title="Обувь"
                        item={outfitData.daily_outfits[selectedDay].recommendations.footwear}
                        gradient="from-green-500 to-emerald-500"
                      />
                      
                      {/* Outerwear */}
                      {outfitData.daily_outfits[selectedDay].recommendations.outerwear?.item && (
                        <OutfitItemCard
                          title="Верхняя одежда"
                          item={outfitData.daily_outfits[selectedDay].recommendations.outerwear}
                          gradient="from-purple-500 to-violet-500"
                        />
                      )}
                    </div>

                    {/* Accessories */}
                    {outfitData.daily_outfits[selectedDay].recommendations.accessories?.length > 0 && (
                      <div className="mb-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Аксессуары</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {outfitData.daily_outfits[selectedDay].recommendations.accessories.map((accessory, idx) => (
                            <div key={idx} className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                              <p className="font-medium text-gray-900">{accessory.item}</p>
                              <p className="text-sm text-gray-600 mt-1">{accessory.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Color Palette */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Цветовая палитра</h4>
                      <div className="flex space-x-3">
                        {outfitData.daily_outfits[selectedDay].color_palette?.map((color, idx) => (
                          <div key={idx} className="text-center">
                            <div 
                              className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
                              style={{ backgroundColor: color.toLowerCase() }}
                            />
                            <p className="text-xs text-gray-600 mt-1">{color}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Styling Tips */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <SparklesIcon className="h-5 w-5 mr-2 text-purple-600" />
                        Советы стилиста
                      </h4>
                      <p className="text-gray-700">{outfitData.daily_outfits[selectedDay].styling_tips}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const OutfitItemCard = ({ title, item, gradient }) => {
  return (
    <motion.div 
      className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex items-center mb-3">
        <div className={`w-10 h-10 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mr-3`}>
          <ShirtIcon className="h-5 w-5 text-white" />
        </div>
        <h5 className="font-semibold text-gray-900">{title}</h5>
      </div>
      
      <div className="space-y-2">
        <p className="font-medium text-gray-900">{item.item}</p>
        <p className="text-sm text-purple-600 font-medium">{item.color}</p>
        <p className="text-sm text-gray-600">{item.reason}</p>
      </div>
    </motion.div>
  );
};

export default WeatherForecastModal; 