import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useWeather } from '../contexts/WeatherContext';
import { useNavigate } from 'react-router-dom';
import { clothingAPI } from '../services/api';
import WeatherWidget from '../components/WeatherWidget';
import ClothingGrid from '../components/ClothingGrid';
import AddClothingModal from '../components/AddClothingModal';
import V2VAssistantModal from '../components/V2VAssistantModal';
import AIStyleAdviceModal from '../components/AIStyleAdviceModal';
import ClothingDetailsModal from '../components/ClothingDetailsModal';
import EditClothingModal from '../components/EditClothingModal';
import LocationPermissionPrompt from '../components/LocationPermissionPrompt';
import WeatherForecastModal from '../components/WeatherForecastModal';
import LanguageSelector from '../components/LanguageSelector';
import { 
  PlusIcon, 
  LogOutIcon, 
  Video, 
  Sparkles, 
  BrainIcon, 
  CalendarIcon,
  ShirtIcon,
  StarIcon,
  TrendingUpIcon,
  ZapIcon,
  HeartIcon,
  EyeIcon,
  SettingsIcon,
  UserIcon,
  HomeIcon,
  GridIcon,
  PaletteIcon,
  CloudIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { currentWeather: weather } = useWeather();
  const navigate = useNavigate();
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isV2VModalOpen, setIsV2VModalOpen] = useState(false);
  const [isAIAdviceModalOpen, setIsAIAdviceModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isForecastModalOpen, setIsForecastModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const clothingResponse = await clothingAPI.getUserItems().catch(() => ({ data: [] }));
      const items = clothingResponse.data || [];
      // Filter out any invalid items
      const validItems = items.filter(item => item && item.id);
      setClothingItems(validItems);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success(t('loggedOut'));
  };

  const handleClothingAdded = (newItem) => {
    if (newItem && newItem.id) {
      setClothingItems(prev => [newItem, ...prev]);
    }
    setIsAddModalOpen(false);
    toast.success(t('itemAdded'));
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleItemUpdated = (updatedItem) => {
    setClothingItems(prev => 
      prev.filter(item => item && item.id).map(item => item.id === updatedItem.id ? updatedItem : item)
    );
    setIsEditModalOpen(false);
    setSelectedItem(null);
    toast.success(t('itemUpdated'));
  };

  const handleItemDeleted = (itemId) => {
    setClothingItems(prev => prev.filter(item => item && item.id && item.id !== itemId));
    setIsEditModalOpen(false);
    setSelectedItem(null);
    toast.success(t('itemDeleted'));
  };

  const handleEditFromDetails = (item) => {
    setIsDetailsModalOpen(false);
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dawn relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-mystical opacity-20 animate-gradient"></div>
          <div className="absolute inset-0 bg-gradient-sunset opacity-30 animate-breath"></div>
        </div>
        
        {/* Loading Animation */}
        <div className="relative z-10 flex flex-col items-center space-y-8">
          <div className="fashion-loader"></div>
          
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold text-neutral-900 font-display">
              {t('loadingStyle')}
            </h2>
            <p className="text-neutral-700 text-xl font-body">
              {t('preparingMagic')}
            </p>
          </div>

          {/* Loading indicators */}
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-primary-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dawn relative overflow-hidden">
      {/* Stunning Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-mystical opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-sunset opacity-10 animate-gradient"></div>
        <div className="absolute inset-0 bg-gradient-accent opacity-30"></div>
      </div>

      <LocationPermissionPrompt 
        onPermissionGranted={() => fetchData()}
        onPermissionDenied={() => console.log('Location permission denied, using fallback weather')}
      />
      
      {/* Premium Header */}
      <header className="relative z-40 glass-light border-b border-accent-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-3 group hover-lift"
              >
                <div className="relative">
                  <div className="w-14 h-14 logo-white-bg rounded-3xl flex items-center justify-center shadow-bold">
                    <img 
                      src="/img/logo.png" 
                      alt="AuarAI Logo" 
                      className="h-9 w-9 object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-black text-neutral-900 font-display tracking-tight">
                    AuarAI
                  </h1>
                  <p className="text-xs text-primary-600 font-medium font-body">AI Fashion Studio</p>
                </div>
              </button>
            </div>
            
            {/* Center - Empty space */}
            <div className="flex-1 flex justify-center">
            </div>
            
            {/* User Section */}
            <div className="flex items-center space-x-4">
              <LanguageSelector variant="light" />
              
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 card-glass rounded-2xl">
                <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-neutral-800 font-medium font-body">{user?.username}</span>
              </div>
              
              <motion.button
                onClick={handleLogout}
                className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-600 hover:text-red-700 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all duration-150"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={t('logout')}
              >
                <LogOutIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Weather Widget - Top Right Corner */}
        <motion.div 
          className="absolute top-4 right-4 z-20"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <WeatherWidget />
        </motion.div>
        {/* Hero Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <motion.h2 
              className="text-6xl lg:text-7xl font-black text-neutral-900 mb-6 font-display"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              {t('myWardrobe').split(' ')[0]}{' '}
              <span className="text-gradient-primary">
                {t('myWardrobe').split(' ')[1]}
              </span>
            </motion.h2>
            
            <motion.p 
              className="text-xl text-neutral-700 mb-8 max-w-2xl mx-auto leading-relaxed font-body"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('wardrobeDescription')}
            </motion.p>

            {clothingItems.length > 0 && (
              <motion.div 
                className="flex justify-center items-center space-x-8 text-sm"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="flex items-center space-x-2 px-4 py-2 glass-primary rounded-full">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
                  <span className="text-primary-700 font-medium font-body">
                    {clothingItems.length} {t('items')}
                  </span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 glass-light rounded-full border border-green-400/30">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium font-body">{t('allSynced')}</span>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Action Buttons */}
          <motion.div 
            className="flex flex-wrap justify-center gap-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <ActionButton
              onClick={() => setIsForecastModalOpen(true)}
              icon={CalendarIcon}
              label={t('styleForecast')}
              accent={StarIcon}
              gradient="bg-gradient-ocean"
              delay={0}
            />
            
            <ActionButton
              onClick={() => setIsAIAdviceModalOpen(true)}
              icon={BrainIcon}
              label={t('aiAdvice')}
              accent={ZapIcon}
              gradient="bg-gradient-secondary"
              delay={0.1}
            />
            
            <ActionButton
              onClick={() => setIsV2VModalOpen(true)}
              icon={Video}
              label={t('voiceAssistant')}
              accent={HeartIcon}
              gradient="bg-gradient-ocean"
              delay={0.2}
            />
            
            <ActionButton
              onClick={() => setIsAddModalOpen(true)}
              icon={PlusIcon}
              label={t('addClothing')}
              accent={ShirtIcon}
              gradient="bg-gradient-twilight"
              delay={0.3}
            />
          </motion.div>
        </div>

        {/* Clothing Grid */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <ClothingGrid
            items={clothingItems}
            onViewDetails={handleViewDetails}
            onEditItem={handleEditItem}
            onAddClick={() => setIsAddModalOpen(true)}
          />
        </motion.div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddClothingModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onClothingAdded={handleClothingAdded}
          />
        )}
        
        {isV2VModalOpen && (
          <V2VAssistantModal
            isOpen={isV2VModalOpen}
            onClose={() => setIsV2VModalOpen(false)}
          />
        )}
        
        {isAIAdviceModalOpen && (
          <AIStyleAdviceModal
            isOpen={isAIAdviceModalOpen}
            onClose={() => setIsAIAdviceModalOpen(false)}
            clothingItems={clothingItems}
            weather={weather}
          />
        )}
        
        {isForecastModalOpen && (
          <WeatherForecastModal
            isOpen={isForecastModalOpen}
            onClose={() => setIsForecastModalOpen(false)}
            clothingItems={clothingItems}
          />
        )}
        
        {isDetailsModalOpen && selectedItem && (
          <ClothingDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            item={selectedItem}
            onEdit={handleEditFromDetails}
          />
        )}
        
        {isEditModalOpen && selectedItem && (
          <EditClothingModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            item={selectedItem}
            onItemUpdated={handleItemUpdated}
            onItemDeleted={handleItemDeleted}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Action Button Component
const ActionButton = ({ onClick, icon: Icon, label, accent: AccentIcon, gradient, delay }) => (
  <motion.button
    onClick={onClick}
    className="group relative overflow-hidden"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, delay }}
  >
    <div className={`px-8 py-4 ${gradient} text-white font-bold rounded-2xl shadow-bold transition-transform duration-150 ease-out`}>
      <div className="flex items-center space-x-3 relative z-10">
        <Icon className="h-6 w-6" />
        <span className="text-lg font-heading">{label}</span>
        <AccentIcon className="h-5 w-5 text-yellow-300" />
      </div>
    </div>
  </motion.button>
);

export default Dashboard; 