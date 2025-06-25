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
    { id: 'friends', label: t('occasions.casual'), icon: StarIcon },
    { id: 'business', label: t('occasions.business'), icon: TrendingUpIcon },
    { id: 'party', label: t('occasions.party'), icon: GlassesIcon },
    { id: 'sport', label: t('occasions.sport'), icon: CarIcon },
    { id: 'travel', label: t('occasions.travel'), icon: ArrowRightIcon },
    { id: 'home', label: t('occasions.casual'), icon: CoffeeIcon },
    { id: 'shopping', label: t('occasions.casual'), icon: Package2Icon }
  ], [t]);

  useEffect(() => {
    if (isOpen && !weather) {
      fetchCurrentWeather();
    }
  }, [isOpen, weather, fetchCurrentWeather]);

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
      
      const realAdvice = {
        mainAdvice: response.data.message,
        occasionTips: `Рекомендации для "${occasion}": ${response.data.outfit.styling_tips}`,
        recommendedItems: [
          response.data.outfit.top?.name,
          response.data.outfit.bottom?.name,
          response.data.outfit.shoes?.name,
          ...(response.data.outfit.accessories?.map(acc => acc.name) || [])
        ].filter(Boolean),
        outfit: response.data.outfit,
        availableItems: response.data.available_items,
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
      setAdvice(mockAdvice);
      toast.error(t('usingOfflineAdvice'));
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  }, [weather, occasion, userItems, t]);

  const generateMockAdvice = useCallback((weatherData, selectedOccasion, items) => {
    const temp = weatherData.temperature;
    const condition = weatherData.condition?.toLowerCase() || '';
    
    let baseAdvice = '';
    let clothingItems = [];
    let colorPalette = [];
    let accessories = [];

    // Weather-based recommendations
    if (temp < 0) {
      baseAdvice = 'На улице очень холодно! Рекомендую теплую зимнюю одежду.';
      clothingItems = ['Теплое пальто или пуховик', 'Свитер или кардиган', 'Теплые брюки', 'Зимние ботинки'];
      accessories = ['Шарф', 'Шапка', 'Перчатки'];
      colorPalette = ['Темно-синий', 'Черный', 'Серый', 'Бордовый'];
    } else if (temp < 10) {
      baseAdvice = 'Прохладная погода требует многослойности.';
      clothingItems = ['Легкая куртка', 'Свитер', 'Джинсы или брюки', 'Закрытая обувь'];
      accessories = ['Легкий шарф'];
      colorPalette = ['Серый', 'Бежевый', 'Темно-зеленый', 'Коричневый'];
    } else if (temp < 20) {
      baseAdvice = 'Комфортная температура для средних слоев одежды.';
      clothingItems = ['Легкий кардиган', 'Рубашка или блуза', 'Брюки или юбка', 'Кроссовки или туфли'];
      colorPalette = ['Белый', 'Светло-серый', 'Пастельные тона'];
    } else {
      baseAdvice = 'Теплая погода! Можно носить легкую одежду.';
      clothingItems = ['Футболка или топ', 'Легкие брюки или шорты', 'Сандалии или кроссовки'];
      colorPalette = ['Белый', 'Светлые тона', 'Яркие цвета'];
    }

    // Occasion-based adjustments
    let occasionTips = '';
    switch (selectedOccasion) {
      case 'work':
        occasionTips = 'Для офиса выбирайте классический деловой стиль. Избегайте слишком ярких цветов.';
        break;
      case 'date':
        occasionTips = 'Создайте романтичный образ! Подойдут элегантные детали и приятные фактуры.';
        break;
      case 'friends':
        occasionTips = 'Casual look будет идеален! Комфорт и стиль в равных пропорциях.';
        break;
      case 'business':
        occasionTips = 'Профессиональный вид обязателен. Классические цвета и строгие линии.';
        break;
      default:
        occasionTips = 'Выберите то, в чем вы чувствуете себя уверенно!';
    }

    return {
      mainAdvice: baseAdvice,
      occasionTips,
      recommendedItems: clothingItems,
      colorPalette,
      accessories,
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
                className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center space-x-2">
                  <SparklesIcon className="h-5 w-5" />
                  <span>{t('personalStyleAdvice')}</span>
                </h3>
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {advice.mainAdvice}
                </div>
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
    <div className="flex items-center space-x-4 p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl border border-white border-opacity-20">
      {/* Image */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-white bg-opacity-20">
        {item.image_url && !imageError ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <IconComponent className="h-6 w-6" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-white text-opacity-70 uppercase tracking-wider font-body">
            {label}
          </span>
          {item.brand && (
            <span className="text-xs text-white text-opacity-60 font-body">{item.brand}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-white truncate font-heading">{item.name}</p>
        {item.color && (
          <p className="text-xs text-white text-opacity-80 font-body">{item.color}</p>
        )}
      </div>
    </div>
  );
};

export default AIStyleAdviceModal; 