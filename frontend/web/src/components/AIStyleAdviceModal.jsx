import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, SparklesIcon, CloudIcon, CalendarIcon, LoaderIcon } from 'lucide-react';
import { weatherAPI, clothingAPI } from '../services/api';
import toast from 'react-hot-toast';

const AIStyleAdviceModal = ({ isOpen, onClose, userItems = [] }) => {
  const [weather, setWeather] = useState(null);
  const [occasion, setOccasion] = useState('');
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const occasions = [
    'Повседневные дела',
    'Работа/Офис',
    'Свидание',
    'Встреча с друзьями',
    'Деловая встреча',
    'Праздничное мероприятие',
    'Спорт/Фитнес',
    'Путешествие',
    'Дома/Отдых',
    'Шоппинг'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchWeather();
    }
  }, [isOpen]);

  const fetchWeather = async () => {
    setWeatherLoading(true);
    try {
      const response = await weatherAPI.getUserLocationWeather();
      setWeather(response.data);
    } catch (error) {
      console.error('Weather fetch error:', error);
      toast.error('Не удалось загрузить погоду');
    } finally {
      setWeatherLoading(false);
    }
  };

  const generateAdvice = async () => {
    if (!weather || !occasion) {
      toast.error('Выберите повод и дождитесь загрузки погоды');
      return;
    }

    setLoading(true);

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
    } catch (error) {
      console.error('AI advice error:', error);
      
      // Fallback to mock advice if API fails
      const mockAdvice = generateMockAdvice(weather, occasion, userItems);
      setAdvice(mockAdvice);
      toast.error('Используем оффлайн советы - проблема с AI сервисом');
    } finally {
      setLoading(false);
    }
  };

  const generateMockAdvice = (weatherData, selectedOccasion, items) => {
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
      case 'Работа/Офис':
        occasionTips = 'Для офиса выбирайте классический деловой стиль. Избегайте слишком ярких цветов.';
        break;
      case 'Свидание':
        occasionTips = 'Создайте романтичный образ! Подойдут элегантные детали и приятные фактуры.';
        break;
      case 'Встреча с друзьями':
        occasionTips = 'Casuall look будет идеален! Комфорт и стиль в равных пропорциях.';
        break;
      case 'Деловая встреча':
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
  };

  const resetModal = () => {
    setAdvice(null);
    setOccasion('');
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
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
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              ИИ Советы по Стилю
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Weather Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <CloudIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">
                Погода {weather?.city ? `в ${weather.city}` : ''}
              </h3>
            </div>
            {weatherLoading ? (
              <div className="flex items-center space-x-2">
                <LoaderIcon className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-blue-600">Загрузка...</span>
              </div>
            ) : weather ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Температура:</span>
                  <span className="ml-2 text-blue-900">{weather.temperature}°C</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Условия:</span>
                  <span className="ml-2 text-blue-900">{weather.condition}</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Влажность:</span>
                  <span className="ml-2 text-blue-900">{weather.humidity}%</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Ветер:</span>
                  <span className="ml-2 text-blue-900">{weather.wind_speed} км/ч</span>
                </div>
              </div>
            ) : (
              <p className="text-blue-600">Не удалось загрузить данные о погоде</p>
            )}
          </div>

          {/* Occasion Selection */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <CalendarIcon className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Повод</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {occasions.map((occ, index) => (
                <motion.button
                  key={occ}
                  onClick={() => setOccasion(occ)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    occasion === occ
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {occ}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            onClick={generateAdvice}
            disabled={!weather || !occasion || loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            whileHover={!loading && weather && occasion ? { scale: 1.02, y: -2 } : {}}
            whileTap={!loading && weather && occasion ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {loading ? (
              <>
                <LoaderIcon className="h-5 w-5 animate-spin" />
                <span>Генерируем совет...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-5 w-5" />
                <span>Получить совет ИИ</span>
              </>
            )}
          </motion.button>

          {/* AI Advice Results */}
          <AnimatePresence>
            {advice && (
              <motion.div 
                className="space-y-4 mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
              >
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <SparklesIcon className="h-6 w-6 text-purple-600" />
                <span>Рекомендации ИИ</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Основной совет:</h4>
                  <p className="text-gray-700">{advice.mainAdvice}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Для повода "{occasion}":</h4>
                  <p className="text-gray-700">{advice.occasionTips}</p>
                </div>

                {/* Complete Outfit Section */}
                {advice.outfit && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <span className="text-2xl mr-2">👔</span>
                      Полный образ:
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {advice.outfit.hat && (
                        <OutfitItemCard item={advice.outfit.hat} label="Головной убор" icon="🎩" />
                      )}
                      {advice.outfit.top && (
                        <OutfitItemCard item={advice.outfit.top} label="Верх" icon="👕" />
                      )}
                      {advice.outfit.bottom && (
                        <OutfitItemCard item={advice.outfit.bottom} label="Низ" icon="👖" />
                      )}
                      {advice.outfit.shoes && (
                        <OutfitItemCard item={advice.outfit.shoes} label="Обувь" icon="👟" />
                      )}
                    </div>
                    {advice.outfit.accessories && advice.outfit.accessories.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-lg">✨</span>
                          <span className="font-medium text-gray-800">Аксессуары:</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {advice.outfit.accessories.map((accessory, index) => (
                            <OutfitItemCard key={accessory.id || index} item={accessory} label="Аксессуар" icon="💍" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Все рекомендованные вещи:</h4>
                  <div className="flex flex-wrap gap-2">
                    {advice.recommendedItems.map((item, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {advice.availableItems && advice.availableItems.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Доступно в гардеробе ({advice.availableItems.length} вещей):</h4>
                    <div className="flex flex-wrap gap-1">
                      {advice.availableItems.slice(0, 10).map((item, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                          {item}
                        </span>
                      ))}
                      {advice.availableItems.length > 10 && (
                        <span className="px-2 py-1 bg-gray-200 rounded text-xs text-gray-700">
                          +{advice.availableItems.length - 10} еще
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Add OutfitItemCard component
const OutfitItemCard = ({ item, label, icon }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
      {/* Image */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
        {item.image_url && !imageError ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-lg">{icon}</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </span>
          {item.brand && (
            <span className="text-xs text-gray-400">{item.brand}</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        {item.color && (
          <p className="text-xs text-gray-500">{item.color}</p>
        )}
      </div>
    </div>
  );
};

export default AIStyleAdviceModal; 