import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XIcon, 
  SparklesIcon, 
  CloudIcon, 
  CalendarIcon, 
  BrainIcon,
  ThermometerIcon,
  WindIcon,
  DropletIcon,
  ShirtIcon,
  Package2Icon,
  FootprintsIcon,
  CrownIcon,
  GlassesIcon,
  StarIcon,
  HeartIcon,
  BriefcaseIcon,
  CoffeeIcon,
  CarIcon,
  TrendingUpIcon,
  ArrowRightIcon,
  RefreshCwIcon
} from 'lucide-react';
import { clothingAPI } from '../services/api';
import { useWeather } from '../contexts/WeatherContext';
import { useLanguage } from '../contexts/LanguageContext';
import analytics from '../services/analytics';
import toast from 'react-hot-toast';

const AIStyleAdviceModal = ({ isOpen, onClose, userItems = [] }) => {
  const { currentWeather: weather, loading: weatherLoading, fetchCurrentWeather } = useWeather();
  const { t } = useLanguage();
  const [occasion, setOccasion] = useState('');
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Memoize occasions to prevent re-creation on each render
  const occasions = useMemo(() => [
    { id: 'casual', label: t('occasions.casual'), icon: CoffeeIcon },
    { id: 'work', label: t('occasions.work'), icon: BriefcaseIcon },
    { id: 'date', label: t('occasions.date'), icon: HeartIcon },
    { id: 'business', label: t('occasions.business'), icon: TrendingUpIcon },
    { id: 'party', label: t('occasions.party'), icon: GlassesIcon },
    { id: 'sport', label: t('occasions.sport'), icon: CarIcon },
    { id: 'travel', label: t('occasions.travel'), icon: ArrowRightIcon },
    { id: 'formal', label: t('occasions.formal'), icon: CrownIcon }
  ], [t]);

  useEffect(() => {
    if (isOpen && !weather) {
      fetchCurrentWeather();
    }
  }, [isOpen, weather, fetchCurrentWeather]);

  // Function to create outfit from user's wardrobe
  const createOutfitFromWardrobe = useCallback((items, weatherData, selectedOccasion) => {
    if (!items || items.length === 0) return null;

    // Filter user items by category
    const tops = items.filter(item => 
      item.category?.toLowerCase().includes('top') || 
      item.category?.toLowerCase().includes('shirt') ||
      item.category?.toLowerCase().includes('blouse') ||
      item.category?.toLowerCase().includes('t-shirt') ||
      item.category?.toLowerCase().includes('polo')
    );
    const bottoms = items.filter(item => 
      item.category?.toLowerCase().includes('bottom') || 
      item.category?.toLowerCase().includes('pants') ||
      item.category?.toLowerCase().includes('jeans') ||
      item.category?.toLowerCase().includes('skirt') ||
      item.category?.toLowerCase().includes('shorts')
    );
    const shoes = items.filter(item => 
      item.category?.toLowerCase().includes('shoe') ||
      item.category?.toLowerCase().includes('boot') ||
      item.category?.toLowerCase().includes('sneaker') ||
      item.category?.toLowerCase().includes('sandal')
    );
    const outerwear = items.filter(item => 
      item.category?.toLowerCase().includes('jacket') ||
      item.category?.toLowerCase().includes('coat') ||
      item.category?.toLowerCase().includes('outerwear') ||
      item.category?.toLowerCase().includes('hoodie')
    );

    // Select items based on weather and occasion
    const outfit = {};

    // Select top
    if (tops.length > 0) {
      if (selectedOccasion === 'business' || selectedOccasion === 'work') {
        // Prefer formal tops
        outfit.top = tops.find(item => 
          item.name?.toLowerCase().includes('shirt') ||
          item.name?.toLowerCase().includes('blouse')
        ) || tops[0];
      } else if (selectedOccasion === 'sport') {
        // Prefer sporty tops
        outfit.top = tops.find(item => 
          item.name?.toLowerCase().includes('polo') ||
          item.name?.toLowerCase().includes('t-shirt')
        ) || tops[0];
      } else {
        outfit.top = tops[0];
      }
    }

    // Select bottom
    if (bottoms.length > 0) {
      if (selectedOccasion === 'business' || selectedOccasion === 'work') {
        // Prefer formal bottoms
        outfit.bottom = bottoms.find(item => 
          item.name?.toLowerCase().includes('pants') ||
          item.name?.toLowerCase().includes('trousers')
        ) || bottoms[0];
      } else if (selectedOccasion === 'sport') {
        // Prefer sporty bottoms
        outfit.bottom = bottoms.find(item => 
          item.name?.toLowerCase().includes('shorts')
        ) || bottoms[0];
      } else {
        outfit.bottom = bottoms[0];
      }
    }

    // Select shoes
    if (shoes.length > 0) {
      if (selectedOccasion === 'business' || selectedOccasion === 'work') {
        // Prefer formal shoes
        outfit.shoes = shoes.find(item => 
          !item.name?.toLowerCase().includes('sneaker') &&
          !item.name?.toLowerCase().includes('sandal')
        ) || shoes[0];
      } else if (selectedOccasion === 'sport') {
        // Prefer sneakers
        outfit.shoes = shoes.find(item => 
          item.name?.toLowerCase().includes('sneaker')
        ) || shoes[0];
      } else {
        outfit.shoes = shoes[0];
      }
    }

    // Add outerwear if cold weather
    if (weatherData.temperature < 15 && outerwear.length > 0) {
      outfit.outerwear = outerwear[0];
    }

    return Object.keys(outfit).length > 0 ? outfit : null;
  }, []);

  const generateAdvice = useCallback(async () => {
    if (!weather || !occasion) {
      toast.error(t('selectOccasionAndWait'));
      return;
    }

    setLoading(true);
    setIsGenerating(true);

    // 📊 Отслеживание запроса совета от ИИ
    analytics.trackAIAdviceRequest(occasion);

    try {
      const weatherDescription = `${weather.temperature}°C, ${weather.condition}`;
      const response = await clothingAPI.getStyleAdvice(occasion, weatherDescription, 'casual');
      
      // Create outfit from user's wardrobe if API doesn't provide one
      let outfit = response.data?.outfit;
      if (!outfit) {
        outfit = createOutfitFromWardrobe(userItems, weather, occasion);
      }

      const realAdvice = {
        mainAdvice: response.data?.message || response.message || 'AI advice received successfully!',
        occasionTips: `Рекомендации для "${occasion}": ${response.data?.outfit?.styling_tips || 'Style tips for your occasion'}`,
        outfit: outfit,
        availableItems: response.data?.available_items,
        weatherInfo: {
          temperature: weather.temperature,
          condition: weather.condition,
          humidity: weather.humidity
        }
      };
      
      setAdvice(realAdvice);
      toast.success(t('aiAdviceReceived'));
    } catch (error) {
      console.error('AI advice error:', error);
      
      // Fallback to mock advice if API fails
      const mockAdvice = generateMockAdvice(weather, occasion, userItems);
      // Add outfit to mock advice
      mockAdvice.outfit = createOutfitFromWardrobe(userItems, weather, occasion);
      setAdvice(mockAdvice);
      toast.error(t('usingOfflineAdvice'));
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  }, [weather, occasion, userItems, t, createOutfitFromWardrobe]);

  const generateMockAdvice = useCallback((weatherData, selectedOccasion, items) => {
    const temp = weatherData.temperature;

    let baseAdvice = '';
    let colorPalette = [];

    // Weather-based recommendations
    if (temp < 0) {
      baseAdvice = 'На улице очень холодно! Рекомендую теплую зимнюю одежду из вашего гардероба.';
      colorPalette = ['Темно-синий', 'Черный', 'Серый', 'Бордовый'];
    } else if (temp < 10) {
      baseAdvice = 'Прохладная погода требует многослойности. Используйте вещи из вашего гардероба для создания слоев.';
      colorPalette = ['Серый', 'Бежевый', 'Темно-зеленый', 'Коричневый'];
    } else if (temp < 20) {
      baseAdvice = 'Комфортная температура! Выберите удобные вещи из вашего гардероба.';
      colorPalette = ['Белый', 'Светло-серый', 'Пастельные тона'];
    } else {
      baseAdvice = 'Теплая погода! Выберите легкие и дышащие вещи из вашего гардероба.';
      colorPalette = ['Белый', 'Светлые тона', 'Яркие цвета'];
    }

    // Occasion-based adjustments
    let occasionTips = '';
    switch (selectedOccasion) {
      case 'work':
        occasionTips = 'Для офиса выбирайте классический деловой стиль из вашего гардероба. Избегайте слишком ярких цветов.';
        break;
      case 'date':
        occasionTips = 'Создайте романтичный образ! Выберите элегантные вещи из вашего гардероба.';
        break;
      case 'casual':
        occasionTips = 'Casual look будет идеален! Комфорт и стиль в равных пропорциях.';
        break;
      case 'business':
        occasionTips = 'Профессиональный вид обязателен. Выберите строгие вещи из вашего гардероба.';
        break;
      default:
        occasionTips = 'Выберите то, в чем вы чувствуете себя уверенно из вашего гардероба!';
    }

    return {
      mainAdvice: baseAdvice,
      occasionTips,
      colorPalette,
      weatherInfo: {
        temperature: temp,
        condition: weatherData.condition,
        humidity: weatherData.humidity
      }
    };
  }, []);

  const resetModal = useCallback(() => {
    setAdvice(null);
    setOccasion('');
    setLoading(false);
    setIsGenerating(false);
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  const handleOccasionSelect = useCallback((occasionId) => {
    setOccasion(occasionId);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <SparklesIcon className="h-6 w-6" />
              <span>{t('aiAdvice')}</span>
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-white/70 hover:text-white transition-colors"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Weather Info */}
            {weather && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2">{t('todaysWeather')}</h3>
                <div className="flex items-center space-x-4 text-blue-800">
                  <span className="text-2xl">{weather.temperature}°C</span>
                  <span className="capitalize">{weather.condition}</span>
                  <span>{t('feelsLike')} {weather.feels_like}°C</span>
                </div>
              </div>
            )}

            {/* Occasion Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('whatsTheOccasion')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {occasions.map((occasionItem) => {
                  const IconComponent = occasionItem.icon;
                  return (
                    <button
                      key={occasionItem.id}
                      onClick={() => handleOccasionSelect(occasionItem.id)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        occasion === occasionItem.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="text-2xl mb-1">
                        <IconComponent className="h-6 w-6 mx-auto" />
                      </div>
                      <div className="text-sm font-medium">{occasionItem.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateAdvice}
              disabled={!occasion || weatherLoading || isGenerating}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCwIcon className="h-5 w-5 animate-spin" />
                  <span>{t('generatingAdvice')}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <SparklesIcon className="h-5 w-5" />
                  <span>{t('getAIAdvice')}</span>
                </div>
              )}
            </button>

            {/* AI Advice Results */}
            {advice && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Main Advice */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center space-x-2">
                    <SparklesIcon className="h-5 w-5" />
                    <span>{t('personalStyleAdvice')}</span>
                  </h3>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {advice.mainAdvice}
                  </div>
                </div>

                {/* Occasion Tips */}
                {advice.occasionTips && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Occasion Tips</h4>
                    <div className="text-blue-800 text-sm">
                      {advice.occasionTips}
                    </div>
                  </div>
                )}



                {/* Color Palette */}
                {advice.colorPalette && advice.colorPalette.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">Recommended Colors</h4>
                    <div className="flex flex-wrap gap-2">
                      {advice.colorPalette.map((color, index) => (
                        <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outfit Items (if available from API) */}
                {advice.outfit && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-900 mb-3">Recommended Outfit</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {advice.outfit.top && (
                        <OutfitItemCard 
                          item={advice.outfit.top} 
                          label="Top" 
                          icon={ShirtIcon}
                        />
                      )}
                      {advice.outfit.bottom && (
                        <OutfitItemCard 
                          item={advice.outfit.bottom} 
                          label="Bottom" 
                          icon={Package2Icon}
                        />
                      )}
                      {advice.outfit.shoes && (
                        <OutfitItemCard 
                          item={advice.outfit.shoes} 
                          label="Shoes" 
                          icon={FootprintsIcon}
                        />
                      )}
                      {advice.outfit.outerwear && (
                        <OutfitItemCard 
                          item={advice.outfit.outerwear} 
                          label="Outerwear" 
                          icon={CrownIcon}
                        />
                      )}
                    </div>
                    
                    {/* Accessories */}
                    {advice.outfit.accessories && advice.outfit.accessories.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-purple-800 mb-2">Accessories</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {advice.outfit.accessories.map((accessory, index) => (
                            <OutfitItemCard 
                              key={index}
                              item={accessory} 
                              label="Accessory" 
                              icon={GlassesIcon}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Weather Info */}
                {advice.weatherInfo && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Weather Considerations</h4>
                    <div className="text-gray-700 text-sm">
                      Temperature: {advice.weatherInfo.temperature}°C | 
                      Condition: {advice.weatherInfo.condition}
                      {advice.weatherInfo.humidity && ` | Humidity: ${advice.weatherInfo.humidity}%`}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Optimized OutfitItemCard component
const OutfitItemCard = ({ item, label, icon: IconComponent }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  return (
    <div className="flex flex-col space-y-2 p-3 bg-white bg-opacity-60 rounded-xl border border-purple-200">
      {/* Image */}
      <div className="w-full h-20 rounded-lg overflow-hidden bg-gray-100">
        {item.image_url && !imageError ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <IconComponent className="h-8 w-8" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="space-y-1">
        <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">
          {label}
        </span>
        <p className="text-sm font-semibold text-purple-900 truncate">
          {item.name}
        </p>
        <div className="flex flex-col space-y-1">
          {item.color && (
            <p className="text-xs text-purple-700">
              Color: {item.color}
            </p>
          )}
          {item.brand && (
            <p className="text-xs text-purple-600">
              {item.brand}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIStyleAdviceModal; 