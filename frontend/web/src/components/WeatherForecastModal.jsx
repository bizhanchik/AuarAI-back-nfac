import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  XIcon, 
  CalendarIcon, 
  CloudIcon, 
  SunIcon, 
  CloudRainIcon, 
  SnowflakeIcon,
  ThermometerSunIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
  ShirtIcon,
  CheckIcon,
  StarIcon,
  HeartIcon,
  BriefcaseIcon,
  CoffeeIcon,
  CarIcon,
  GlassesIcon,
  TrendingUpIcon,
  Package2Icon,
  FootprintsIcon,
  LayersIcon
} from 'lucide-react';
import { clothingAPI } from '../services/api';
import { useWeather } from '../contexts/WeatherContext';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';

const WeatherForecastModal = ({ isOpen, onClose, clothingItems = [] }) => {
  const { forecastData, fetchForecast, forecastLoading } = useWeather();
  const { t } = useLanguage();
  const [step, setStep] = useState(1); // 1: occasion selection, 2: loading/results
  const [selectedOccasions, setSelectedOccasions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [outfitData, setOutfitData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const OCCASION_OPTIONS = [
    { id: 'casual', icon: CoffeeIcon },
    { id: 'work', icon: BriefcaseIcon },
    { id: 'date', icon: HeartIcon },
    { id: 'business', icon: TrendingUpIcon },
    { id: 'sport', icon: CarIcon },
    { id: 'formal', icon: StarIcon },
    { id: 'party', icon: GlassesIcon },
    { id: 'travel', icon: ArrowRightIcon }
  ];

  useEffect(() => {
    if (isOpen && !forecastData) {
      fetchForecast(5);
    }
  }, [isOpen, forecastData, fetchForecast]);

  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setStep(1);
      setSelectedOccasions([]);
      setOutfitData(null);
      setSelectedDay(0);
    }
  }, [isOpen]);

  const handleOccasionToggle = (occasionId) => {
    setSelectedOccasions(prev => {
      if (prev.includes(occasionId)) {
        return prev.filter(id => id !== occasionId);
      } else if (prev.length < 2) {
        return [...prev, occasionId];
      } else {
        // Replace the first selected occasion if already 2 selected
        return [prev[1], occasionId];
      }
    });
  };

  const generateOutfits = async () => {
    if (selectedOccasions.length === 0) {
      toast.error(t('required'));
      return;
    }

    if (clothingItems.length === 0) {
      toast.error('No clothes in wardrobe. Add items to get recommendations.');
      return;
    }

    setLoading(true);
    setStep(2);

    try {
      // Generate outfits for each selected occasion
      const outfitPromises = selectedOccasions.map(occasion => 
        clothingAPI.getForecastOutfits(5, occasion)
      );

      const results = await Promise.all(outfitPromises);
      
      // Combine and process results to use only user's wardrobe
      const combinedData = {
        daily_outfits: [],
        user_items: clothingItems
      };

      // Process forecast data for 5 days
      if (forecastData?.daily_forecasts) {
        for (let dayIndex = 0; dayIndex < 5; dayIndex++) {
          const dayData = forecastData.daily_forecasts[dayIndex];
          const temperature = (dayData.temperature_min + dayData.temperature_max) / 2;
          
          // Create outfit recommendations using user's actual wardrobe
          const dayOutfit = createOutfitFromUserWardrobe(
            clothingItems, 
            selectedOccasions, 
            temperature, 
            dayData.condition,
            dayIndex
          );

          combinedData.daily_outfits.push({
            date: dayData.date,
            date_formatted: dayIndex === 0 ? t('today') : dayData.date_formatted,
            weather_summary: `${Math.round(temperature)}°C, ${dayData.description}`,
            occasions: selectedOccasions,
            outfit_theme: getOutfitTheme(selectedOccasions, temperature),
            recommendations: dayOutfit,
            weather_data: dayData
          });
        }
      }

      setOutfitData(combinedData);
      toast.success(t('forecastReady'));
    } catch (error) {
      console.error('Error generating outfits:', error);
      toast.error('Failed to create recommendations. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const createOutfitFromUserWardrobe = (items, occasions, temperature, condition, dayIndex) => {
    // Filter items based on occasions and weather
    const suitableItems = items.filter(item => {
      const itemOccasions = item.occasions || [];
      const itemWeather = item.weather_suitability || [];
      
      // Check if item is suitable for selected occasions
      const occasionMatch = occasions.some(occ => 
        itemOccasions.some(itemOcc => itemOcc.toLowerCase().includes(occ.toLowerCase()))
      );
      
      // Check weather suitability
      const weatherMatch = checkWeatherSuitability(itemWeather, temperature, condition);
      
      return occasionMatch || weatherMatch || itemOccasions.length === 0; // Include items without specified occasions
    });

    // Categorize items
    const tops = suitableItems.filter(item => 
      ['top', 'shirt', 'blouse', 't-shirt', 'sweater', 'hoodie'].some(type => 
        item.category?.toLowerCase().includes(type.toLowerCase())
      )
    );
    
    const bottoms = suitableItems.filter(item => 
      ['bottom', 'pants', 'jeans', 'skirt', 'shorts', 'dress'].some(type => 
        item.category?.toLowerCase().includes(type.toLowerCase())
      )
    );
    
    const shoes = suitableItems.filter(item => 
      ['shoe', 'boot', 'sneaker', 'heel', 'sandal'].some(type => 
        item.category?.toLowerCase().includes(type.toLowerCase())
      )
    );
    
    const outerwear = suitableItems.filter(item => 
      ['jacket', 'coat', 'blazer', 'cardigan'].some(type => 
        item.category?.toLowerCase().includes(type.toLowerCase())
      )
    );

    // Select items for the outfit (rotate based on day to provide variety)
    const selectedTop = tops[dayIndex % tops.length] || tops[0];
    const selectedBottom = bottoms[dayIndex % bottoms.length] || bottoms[0];
    const selectedShoes = shoes[dayIndex % shoes.length] || shoes[0];
    const selectedOuterwear = temperature < 15 ? (outerwear[dayIndex % outerwear.length] || outerwear[0]) : null;

    return {
      top: selectedTop ? {
        item: selectedTop.name,
        color: selectedTop.color,
        reason: `Perfect for ${occasions.map(occ => t(`occasions.${occ}`)).join(' and ')}`
      } : {
        item: t('clothingTypes.addTopToWardrobe'),
        color: t('anyColor'),
        reason: t('clothingTypes.recommendShirts')
      },
      bottom: selectedBottom ? {
        item: selectedBottom.name,
        color: selectedBottom.color,
        reason: 'Good match for selected occasion'
      } : {
        item: t('clothingTypes.addBottomToWardrobe'),
        color: t('anyColor'),
        reason: t('clothingTypes.recommendPants')
      },
      footwear: selectedShoes ? {
        item: selectedShoes.name,
        color: selectedShoes.color,
        reason: 'Suitable shoes for weather'
      } : {
        item: t('clothingTypes.addShoesToWardrobe'),
        color: t('anyColor'),
        reason: t('clothingTypes.recommendShoes')
      },
      outerwear: selectedOuterwear ? {
        item: selectedOuterwear.name,
        color: selectedOuterwear.color,
        reason: `Needed at ${Math.round(temperature)}°C temperature`
      } : temperature < 15 ? {
        item: t('clothingTypes.addOuterwearToWardrobe'),
        color: 'Dark tones',
        reason: t('clothingTypes.needJacket')
      } : null
    };
  };

  const checkWeatherSuitability = (itemWeather, temperature, condition) => {
    if (!itemWeather || itemWeather.length === 0) return true;
    
    const weather = itemWeather.map(w => w.toLowerCase());
    const conditionLower = condition.toLowerCase();
    
    // Temperature-based matching
    if (temperature < 5 && weather.some(w => w.includes('winter') || w.includes('cold'))) return true;
    if (temperature > 25 && weather.some(w => w.includes('summer') || w.includes('hot'))) return true;
    if (temperature >= 5 && temperature <= 25 && weather.some(w => w.includes('spring') || w.includes('autumn'))) return true;
    
    // Condition-based matching
    if (conditionLower.includes('rain') && weather.some(w => w.includes('rain'))) return true;
    if (conditionLower.includes('snow') && weather.some(w => w.includes('snow'))) return true;
    
    return false;
  };

  const getOutfitTheme = (occasions, temperature) => {
    const themes = {
      casual: t('outfitThemes.casualComfort'),
      work: t('outfitThemes.businessProfessional'),
      date: t('outfitThemes.romanticAttractive'),
      business: t('outfitThemes.strictBusiness'),
      sport: t('outfitThemes.activeSport'),
      formal: t('outfitThemes.elegantFormal'),
      party: t('outfitThemes.brightEvening'),
      travel: t('outfitThemes.practicalTravel')
    };

    const primaryOccasion = occasions[0];
    let baseTheme = themes[primaryOccasion] || t('outfitThemes.universal');
    
    if (temperature < 10) {
      baseTheme += ' ' + t('outfitThemes.withWarmth');
    } else if (temperature > 25) {
      baseTheme += ' ' + t('outfitThemes.forHotWeather');
    }
    
    if (occasions.length > 1) {
      baseTheme += ` (${occasions.length} ${t('outfitThemes.multipleOccasions')})`;
    }
    
    return baseTheme;
  };

  const getWeatherIcon = (condition, size = "h-6 w-6", isSelected = false) => {
    const style = isSelected ? { color: 'white' } : {};
    const colorClass = isSelected ? '' : condition?.toLowerCase().includes('rain') ? 'text-blue-600'
      : condition?.toLowerCase().includes('snow') ? 'text-blue-400'
      : condition?.toLowerCase().includes('cloud') ? 'text-gray-600'
      : 'text-yellow-500';
    
    if (condition?.toLowerCase().includes('rain')) {
      return <CloudRainIcon style={style} className={`${size} ${colorClass}`} />;
    } else if (condition?.toLowerCase().includes('snow')) {
      return <SnowflakeIcon style={style} className={`${size} ${colorClass}`} />;
    } else if (condition?.toLowerCase().includes('cloud')) {
      return <CloudIcon style={style} className={`${size} ${colorClass}`} />;
    } else {
      return <SunIcon style={style} className={`${size} ${colorClass}`} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-primary p-6 text-white relative overflow-hidden">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <CalendarIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-display font-black text-white">
                  {t('styleForecastTitle')}
                </h2>
                <p className="text-white/80 text-lg font-body">
                  {step === 1 ? t('selectOccasions') : t('personalRecommendations')}
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

          {/* Step indicator */}
          <div className="mt-6 flex items-center space-x-4 relative z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= 1 ? 'bg-white text-blue-600' : 'bg-white/20 text-white/60'
            }`}>
              {step > 1 ? <CheckIcon className="h-5 w-5" /> : '1'}
            </div>
            <div className={`h-1 w-16 rounded-full transition-all ${
              step >= 2 ? 'bg-white' : 'bg-white/30'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= 2 ? 'bg-white text-blue-600' : 'bg-white/20 text-white/60'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-200px)]">
          {step === 1 && (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-heading font-bold text-neutral-dark mb-2">
                  {t('whatOccasions')}
                </h3>
                <p className="text-neutral font-body">
                  {t('selectUp2Occasions')}
                </p>
                <div className="mt-4 bg-blue-50 rounded-2xl p-4 inline-block">
                  <p className="text-sm text-blue-800 font-medium">
                    {t('inYourWardrobe')} <span className="font-bold">{clothingItems.length} {t('itemsCount')}</span>
                  </p>
                </div>
              </div>

              {/* Occasion Selection Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {OCCASION_OPTIONS.map((occasion) => {
                  const isSelected = selectedOccasions.includes(occasion.id);
                  const isDisabled = !isSelected && selectedOccasions.length >= 2;
                  
                  return (
                    <button
                      key={occasion.id}
                      onClick={() => handleOccasionToggle(occasion.id)}
                      disabled={isDisabled}
                      className={`relative p-6 rounded-2xl border-2 transition-all hover:scale-105 ${
                        isSelected 
                          ? 'border-blue-500 shadow-md bg-blue-50' 
                          : isDisabled 
                            ? 'border-neutral-light opacity-50 cursor-not-allowed'
                            : 'border-neutral-light hover:border-blue-300 hover:shadow-sm bg-white'
                      }`}
                    >
                      <div className="w-12 h-12 bg-gradient-primary rounded-xl mx-auto mb-3 flex items-center justify-center">
                        <occasion.icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="font-semibold text-neutral-dark text-sm font-body">
                        {t(`occasions.${occasion.id}`)}
                      </p>
                      
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                          <CheckIcon className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected occasions preview */}
              {selectedOccasions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                  <h4 className="font-semibold text-neutral-dark mb-3 font-heading">
                    {t('selectedOccasions')} ({selectedOccasions.length}/2):
                  </h4>
                  <div className="flex space-x-3">
                    {selectedOccasions.map(occasionId => {
                      const occasion = OCCASION_OPTIONS.find(opt => opt.id === occasionId);
                      return (
                        <div key={occasionId} className="flex items-center space-x-2 bg-white rounded-full px-4 py-2 shadow-soft">
                          <occasion.icon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-neutral-dark">{t(`occasions.${occasionId}`)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col">
              {loading ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <motion.div 
                      className="w-16 h-16 mx-auto mb-6"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <SparklesIcon className="h-16 w-16 text-blue-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-neutral-dark mb-4 font-heading">
                      {t('creatingOutfits')}
                    </h3>
                    <p className="text-neutral font-body">
                      {t('analyzingWardrobe')}
                    </p>
                  </div>
                </div>
              ) : outfitData ? (
                <div className="flex-1 flex h-full max-h-[70vh]">
                  {/* Weather Forecast Sidebar */}
                  <div className="w-1/3 bg-white border-r border-neutral-200 p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-neutral-dark mb-4 flex items-center font-heading flex-shrink-0">
                      <CloudIcon className="h-6 w-6 mr-2 text-blue-600" />
                      {t('fiveDayForecast')}
                    </h3>
                    
                    <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                      {outfitData.daily_outfits.map((day, index) => (
                        <button
                          key={day.date}
                          onClick={() => setSelectedDay(index)}
                          style={selectedDay === index ? {
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: '2px solid #1d4ed8'
                          } : {}}
                          className={`w-full p-4 rounded-2xl text-left transition-colors duration-200 ${
                            selectedDay === index
                              ? 'shadow-md'
                              : 'bg-neutral-50 hover:bg-blue-50 border border-neutral-200 hover:border-blue-200 text-neutral-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span 
                              style={selectedDay === index ? { color: 'white' } : {}}
                              className="font-semibold text-sm font-body"
                            >
                              {day.date_formatted}
                            </span>
                            <div style={selectedDay === index ? { color: 'white' } : {}}>
                              {getWeatherIcon(day.weather_data.condition, "h-5 w-5", selectedDay === index)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <ThermometerSunIcon 
                                style={selectedDay === index ? { color: 'white' } : {}}
                                className="h-4 w-4 opacity-70"
                              />
                              <span 
                                style={selectedDay === index ? { color: 'white' } : {}}
                                className="text-sm font-medium"
                              >
                                {day.weather_data.temperature_min}°-{day.weather_data.temperature_max}°C
                              </span>
                            </div>
                          </div>
                          
                          <p 
                            style={selectedDay === index ? { color: 'white' } : {}}
                            className="text-xs opacity-70 mt-1 capitalize"
                          >
                            {day.weather_data.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Outfit Display */}
                  <div className="flex-1 p-6 overflow-y-auto bg-neutral-50">
                    {outfitData.daily_outfits[selectedDay] && (
                      <div key={selectedDay}>
                        {/* Day Header */}
                        <div className="mb-8 text-center">
                          <h3 className="text-3xl font-display font-bold text-neutral-dark mb-3 flex items-center justify-center">
                            <SparklesIcon className="h-8 w-8 mr-3 text-blue-600" />
                            {outfitData.daily_outfits[selectedDay].date_formatted}
                          </h3>
                          <p className="text-lg text-neutral-700 mb-3 font-body">
                            {outfitData.daily_outfits[selectedDay].weather_summary}
                          </p>
                          <div className="bg-white rounded-xl p-4 inline-block shadow-soft border border-blue-100">
                            <p className="text-blue-800 font-semibold font-body">
                              {outfitData.daily_outfits[selectedDay].outfit_theme}
                            </p>
                          </div>
                        </div>

                        {/* Outfit Items Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                          <OutfitItemCard
                            title={t('clothingTypes.top')}
                            item={outfitData.daily_outfits[selectedDay].recommendations.top}
                            gradient="bg-gradient-ocean"
                          />
                          
                          <OutfitItemCard
                            title={t('clothingTypes.bottom')}
                            item={outfitData.daily_outfits[selectedDay].recommendations.bottom}
                            gradient="bg-gradient-secondary"
                          />
                          
                          <OutfitItemCard
                            title={t('clothingTypes.footwear')}
                            item={outfitData.daily_outfits[selectedDay].recommendations.footwear}
                            gradient="bg-gradient-twilight"
                          />
                          
                          {outfitData.daily_outfits[selectedDay].recommendations.outerwear && (
                            <OutfitItemCard
                              title={t('clothingTypes.outerwear')}
                              item={outfitData.daily_outfits[selectedDay].recommendations.outerwear}
                              gradient="bg-gradient-mystical"
                            />
                          )}
                        </div>

                        {/* Selected Occasions */}
                        <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-soft">
                          <h4 className="text-lg font-semibold text-neutral-dark mb-4 flex items-center font-heading">
                            <StarIcon className="h-5 w-5 mr-2 text-blue-600" />
                            {t('occasionsFor')}
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {outfitData.daily_outfits[selectedDay].occasions.map(occasionId => {
                              const occasion = OCCASION_OPTIONS.find(opt => opt.id === occasionId);
                              return (
                                <div key={occasionId} className="flex items-center space-x-2 bg-blue-600 text-white rounded-full px-4 py-2 shadow-soft">
                                  <occasion.icon className="h-4 w-4" />
                                  <span className="text-sm font-medium">{t(`occasions.${occasionId}`)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Action buttons - Fixed at bottom */}
          <div className="border-t border-neutral-light p-6 bg-neutral-50">
            {step === 1 ? (
              <div className="flex justify-between items-center">
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-neutral hover:text-neutral-dark font-medium rounded-xl hover:bg-neutral-light transition-all font-body"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={generateOutfits}
                  disabled={selectedOccasions.length === 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <SparklesIcon className="h-5 w-5" />
                  <span>{t('createOutfits')}</span>
                  <ArrowRightIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              !loading && outfitData && (
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => {
                      setStep(1);
                      setOutfitData(null);
                    }}
                    className="flex items-center space-x-2 px-6 py-3 text-neutral hover:text-neutral-dark font-medium rounded-xl hover:bg-neutral-light transition-all font-body"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                    <span>{t('changeOccasions')}</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="btn-primary"
                  >
                    {t('done')}
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OutfitItemCard = ({ title, item, gradient }) => {
  const getIcon = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('top') || titleLower.includes('верх')) {
      return <ShirtIcon className="h-6 w-6 text-white" />;
    }
    if (titleLower.includes('bottom') || titleLower.includes('низ')) {
      return <Package2Icon className="h-6 w-6 text-white" />;
    }
    if (titleLower.includes('footwear') || titleLower.includes('обувь')) {
      return <FootprintsIcon className="h-6 w-6 text-white" />;
    }
    if (titleLower.includes('outerwear') || titleLower.includes('верхняя')) {
      return <LayersIcon className="h-6 w-6 text-white" />;
    }
    return <ShirtIcon className="h-6 w-6 text-white" />;
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-soft hover:shadow-medium transition-shadow duration-200 border border-neutral-100">
      <div className="flex items-center mb-4">
        <div className={`w-12 h-12 ${gradient} rounded-xl flex items-center justify-center mr-3 shadow-soft`}>
          {getIcon(title)}
        </div>
        <h5 className="text-lg font-bold text-neutral-dark font-heading">{title}</h5>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-lg font-semibold text-neutral-dark font-body">{item.item}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg inline-block">{item.color}</p>
        </div>
        <div>
          <p className="text-sm text-neutral-600 font-body">{item.reason}</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherForecastModal; 