import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useWeather } from '../contexts/WeatherContext';
import { useNavigate } from 'react-router-dom';
import { clothingAPI } from '../services/api';
import WeatherWidget from '../components/WeatherWidget';
import ClothingGrid from '../components/ClothingGrid';

import BulkUploadModal from '../components/BulkUploadModal';
import V2VAssistantModal from '../components/V2VAssistantModal';
import AIStyleAdviceModal from '../components/AIStyleAdviceModal';
import ClothingDetailsModal from '../components/ClothingDetailsModal';
import EditClothingModal from '../components/EditClothingModal';
import LocationPermissionPrompt from '../components/LocationPermissionPrompt';
import WeatherForecastModal from '../components/WeatherForecastModal';
import LanguageSelector from '../components/LanguageSelector';
import { 
  UploadIcon,
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
  CloudIcon,
  MenuIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { currentWeather: weather } = useWeather();
  const navigate = useNavigate();
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
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



  const handleBulkItemsAdded = (newItems) => {
    console.log('📦 Bulk upload items received:', newItems);
    
    if (newItems && newItems.length > 0) {
      console.log(`✅ Adding ${newItems.length} items to list`);
      setClothingItems(prev => {
        const updated = [...newItems, ...prev];
        console.log('📋 Updated items list:', updated.length);
        return updated;
      });
      
      // Refresh the full list to get complete data
      setTimeout(() => {
        fetchData();
      }, 1000);
    } else {
      // Handle empty array (fallback refresh case)
      console.log('🔄 Refreshing wardrobe due to empty items array');
      fetchData();
    }
    
    setIsBulkUploadModalOpen(false);
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

  const handleItemsDeleted = (deletedItemIds) => {
    console.log('🗑️ Items deleted:', deletedItemIds);
    setClothingItems(prev => 
      prev.filter(item => item && item.id && !deletedItemIds.includes(item.id))
    );
    toast.success(`Successfully deleted ${deletedItemIds.length} items`);
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
        <div className="relative z-10 flex flex-col items-center space-y-6 sm:space-y-8 px-4">
          <div className="fashion-loader"></div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 font-display">
              {t('loadingStyle')}
            </h2>
            <p className="text-neutral-700 text-lg sm:text-xl font-body">
              {t('preparingMagic')}
            </p>
          </div>

          {/* Loading indicators */}
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 sm:w-3 sm:h-3 bg-primary-500 rounded-full"
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
      
      {/* Responsive Header */}
      <header className="relative z-40 glass-light border-b border-accent-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 sm:space-x-3 group hover-lift"
              >
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 logo-white-bg rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-bold">
                    <img 
                      src="/img/logo.png" 
                      alt="AuarAI Logo" 
                      className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9 object-contain"
                    />
                  </div>
                </div>
                <div className="hidden xs:block">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-900 font-display tracking-tight">
                    AuarAI
                  </h1>
                  <p className="text-xs text-primary-600 font-medium font-body hidden sm:block">AI Fashion Studio</p>
                </div>
              </button>
            </div>
            
            {/* User Section with Weather */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Weather Widget - Left of User */}
              <motion.div 
                className="max-w-xs"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <WeatherWidget />
              </motion.div>
              
              <div className="hidden md:flex items-center space-x-3 px-3 sm:px-4 py-2 card-glass rounded-xl sm:rounded-2xl">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
                  <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <span className="text-sm sm:text-base text-neutral-800 font-medium font-body truncate max-w-24 sm:max-w-none">
                  {user?.username}
                </span>
              </div>
              
              <motion.button
                onClick={handleLogout}
                className="p-2 sm:p-3 bg-red-500/20 hover:bg-red-500/30 text-red-600 hover:text-red-700 rounded-lg sm:rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all duration-150"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={t('logout')}
              >
                <LogOutIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">

        {/* Hero Section */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8 sm:mb-12">
            <motion.h2 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-neutral-900 mb-4 sm:mb-6 font-display leading-tight"
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
              className="text-lg sm:text-xl text-neutral-700 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed font-body px-4 sm:px-0"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('wardrobeDescription')}
            </motion.p>

            {clothingItems.length > 0 && (
              <motion.div 
                className="flex justify-center items-center text-sm"
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
              </motion.div>
            )}
          </div>
          
          {/* Responsive Action Buttons */}
          <motion.div 
            className="space-y-6"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {/* Main Bulk Upload Button */}
            <div className="max-w-2xl mx-auto">
              <motion.button
                onClick={() => setIsBulkUploadModalOpen(true)}
                className="group relative overflow-hidden w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0 }}
              >
                <div className="px-8 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white font-bold rounded-2xl shadow-2xl transition-transform duration-150 ease-out">
                  <div className="flex items-center justify-center space-x-4 relative z-10">
                    <UploadIcon className="h-8 w-8 flex-shrink-0" />
                    <div className="text-center">
                      <div className="text-xl lg:text-2xl font-heading leading-tight">
                        Bulk Upload Images
                      </div>
                      <div className="text-sm lg:text-base text-blue-100 mt-1">
                        Drop up to 10 clothing images at once ✨
                      </div>
                    </div>
                    <Sparkles className="h-8 w-8 text-yellow-300 flex-shrink-0 animate-pulse" />
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Secondary Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
              <ActionButton
                onClick={() => setIsForecastModalOpen(true)}
                icon={CalendarIcon}
                label={t('styleForecast')}
                accent={StarIcon}
                gradient="bg-gradient-ocean"
                delay={0.1}
              />
              
              <ActionButton
                onClick={() => setIsAIAdviceModalOpen(true)}
                icon={BrainIcon}
                label={t('aiAdvice')}
                accent={ZapIcon}
                gradient="bg-gradient-secondary"
                delay={0.2}
              />
              
              <ActionButton
                onClick={() => setIsV2VModalOpen(true)}
                icon={Video}
                label={t('voiceAssistant')}
                accent={HeartIcon}
                gradient="bg-gradient-ocean"
                delay={0.3}
              />
            </div>
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
            onAddClick={() => setIsBulkUploadModalOpen(true)}
            onItemsDeleted={handleItemsDeleted}
          />
        </motion.div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isBulkUploadModalOpen && (
          <BulkUploadModal
            isOpen={isBulkUploadModalOpen}
            onClose={() => setIsBulkUploadModalOpen(false)}
            onItemsAdded={handleBulkItemsAdded}
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

// Responsive Action Button Component
const ActionButton = ({ onClick, icon: Icon, label, accent: AccentIcon, gradient, delay }) => (
  <motion.button
    onClick={onClick}
    className="group relative overflow-hidden w-full"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, delay }}
  >
    <div className={`px-6 sm:px-8 lg:px-10 py-3 sm:py-4 ${gradient} text-white font-bold rounded-xl sm:rounded-2xl shadow-bold transition-transform duration-150 ease-out h-[60px] sm:h-[68px]`}>
      <div className="flex items-center justify-center space-x-2 sm:space-x-3 relative z-10 h-full">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
        <span className="text-sm sm:text-base lg:text-lg font-heading text-center leading-tight whitespace-nowrap">
          {label}
        </span>
        <AccentIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300 flex-shrink-0" />
      </div>
    </div>
  </motion.button>
);

export default Dashboard; 