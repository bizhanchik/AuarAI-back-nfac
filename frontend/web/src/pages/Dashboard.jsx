import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { weatherAPI, clothingAPI } from '../services/api';
import WeatherWidget from '../components/WeatherWidget';
import ClothingGrid from '../components/ClothingGrid';
import AddClothingModal from '../components/AddClothingModal';
import V2VAssistantModal from '../components/V2VAssistantModal';
import AIStyleAdviceModal from '../components/AIStyleAdviceModal';
import ClothingDetailsModal from '../components/ClothingDetailsModal';
import EditClothingModal from '../components/EditClothingModal';
import LocationPermissionPrompt from '../components/LocationPermissionPrompt';
import WeatherForecastModal from '../components/WeatherForecastModal';
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
  UserIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [weather, setWeather] = useState(null);
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
      
      const [weatherResponse, clothingResponse] = await Promise.all([
        weatherAPI.getUserLocationWeather().catch(() => null),
        clothingAPI.getUserItems().catch(() => ({ data: [] }))
      ]);

      if (weatherResponse) {
        setWeather(weatherResponse.data);
      }
      
      setClothingItems(clothingResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Вы вышли из системы');
  };

  const handleClothingAdded = (newItem) => {
    setClothingItems(prev => [newItem, ...prev]);
    setIsAddModalOpen(false);
    toast.success('Одежда успешно добавлена!');
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
      prev.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleItemDeleted = (itemId) => {
    setClothingItems(prev => prev.filter(item => item.id !== itemId));
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleEditFromDetails = (item) => {
    setIsDetailsModalOpen(false);
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>
          </div>
        </div>
        
        {/* Loading Animation */}
        <div className="relative z-10 flex flex-col items-center space-y-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-1 animate-spin">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white font-display">
              Загружаем ваш стиль...
            </h2>
            <p className="text-gray-300 text-lg">
              Подготавливаем магию моды
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Stunning Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/50 to-blue-900/30">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
      </div>

      <LocationPermissionPrompt 
        onPermissionGranted={() => fetchData()}
        onPermissionDenied={() => console.log('Location permission denied, using fallback weather')}
      />
      
      {/* Premium Header */}
      <header className="relative z-40 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-3 group transition-transform duration-200 hover:scale-105"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl transition-shadow duration-300 group-hover:shadow-purple-500/25">
                    <img 
                      src="/img/logo.png" 
                      alt="AuarAI Logo" 
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white font-display tracking-tight">
                    AuarAI
                  </h1>
                  <p className="text-xs text-purple-300 font-medium">AI Fashion Studio</p>
                </div>
              </button>
            </div>
            
            {/* Center - Weather Widget */}
            <div>
              <WeatherWidget weather={weather} />
            </div>
            
            {/* User Section */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-medium">{user?.username}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-2xl border border-red-500/30 hover:border-red-500/50 transition-all duration-300 hover:scale-105"
                title="Выход"
              >
                <LogOutIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-6xl lg:text-7xl font-black text-white mb-6 font-display">
              Мой{' '}
              <span className="text-gradient-primary">
                Гардероб
              </span>
            </h2>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Управляйте своей коллекцией одежды с помощью искусственного интеллекта
            </p>

            {clothingItems.length > 0 && (
              <div className="flex justify-center items-center space-x-8 text-sm">
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-300 font-medium">
                    {clothingItems.length} {clothingItems.length === 1 ? 'вещь' : 'вещей'}
                  </span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 font-medium">Все синхронизировано</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-6">
            <button
              onClick={() => setIsForecastModalOpen(true)}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-6 w-6" />
                <span className="text-lg">Прогноз стиля</span>
                <StarIcon className="h-5 w-5 text-yellow-300" />
              </div>
            </button>
            
            <button
              onClick={() => setIsAIAdviceModalOpen(true)}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <BrainIcon className="h-6 w-6" />
                <span className="text-lg">Совет ИИ</span>
                <ZapIcon className="h-5 w-5 text-yellow-300" />
              </div>
            </button>
            
            <button
              onClick={() => setIsV2VModalOpen(true)}
              className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <Video className="h-6 w-6" />
                <span className="text-lg">Голосовой помощник</span>
                <HeartIcon className="h-5 w-5 text-red-300" />
              </div>
            </button>
            
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <PlusIcon className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />
                <span className="text-lg">Добавить одежду</span>
                <ShirtIcon className="h-5 w-5 text-white" />
              </div>
            </button>
          </div>
        </div>

        {/* Clothing Grid */}
        <div>
          <ClothingGrid
            items={clothingItems}
            onViewDetails={handleViewDetails}
            onEditItem={handleEditItem}
            onAddClick={() => setIsAddModalOpen(true)}
          />
        </div>
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

export default Dashboard; 