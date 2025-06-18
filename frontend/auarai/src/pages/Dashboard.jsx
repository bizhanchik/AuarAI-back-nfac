import { useState, useEffect } from 'react';
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
import { PlusIcon, LogOutIcon, Video, Sparkles, BrainIcon } from 'lucide-react';
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
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Параллельно загружаем погоду и одежду
      const [weatherResponse, clothingResponse] = await Promise.all([
        weatherAPI.getAlmatyWeather().catch(() => null),
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 hover:opacity-80 transition-all group"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  AuarAi
                </h1>
              </button>
            </div>
            
            <div className="flex items-center space-x-6">
              <WeatherWidget weather={weather} />
              
              <div className="flex items-center space-x-2">
                <span className="text-gray-600 hidden sm:inline">
                  {user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  title="Выход"
                >
                  <LogOutIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
              Мой гардероб
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Управляйте своей коллекцией одежды с помощью ИИ
            </p>
            {clothingItems.length > 0 && (
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  {clothingItems.length} {clothingItems.length === 1 ? 'вещь' : 'вещей'}
                </span>
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Все загружено
                </span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => setIsAIAdviceModalOpen(true)}
              className="flex items-center px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <BrainIcon className="h-5 w-5 mr-2" />
              Совет ИИ
            </button>
            
            <button
              onClick={() => setIsV2VModalOpen(true)}
              className="flex items-center px-5 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Video className="h-5 w-5 mr-2" />
              V2V Стилист
            </button>
            
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Добавить одежду
            </button>
          </div>
        </div>

        {/* Clothing Grid or Empty State */}
        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
             {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
             ))}
           </div>
        ) : clothingItems.length > 0 ? (
          <ClothingGrid 
            items={clothingItems} 
            onRefresh={fetchData}
            onViewDetails={handleViewDetails}
            onEditItem={handleEditItem}
          />
        ) : (
          <div className="text-center py-20">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-12 max-w-lg mx-auto">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"></div>
                <div className="relative w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Начните свой стильный путь
              </h3>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Добавьте свою первую вещь и позвольте ИИ создать для вас персональный гардероб
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Добавить первую вещь
                </button>
                <p className="text-sm text-gray-500">
                  Загрузите фото одежды и ИИ автоматически определит все характеристики
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Clothing Modal */}
      <AddClothingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClothingAdded={handleClothingAdded}
      />

      {/* V2V Assistant Modal */}
      <V2VAssistantModal
        isOpen={isV2VModalOpen}
        onClose={() => setIsV2VModalOpen(false)}
      />

      {/* AI Style Advice Modal */}
      <AIStyleAdviceModal
        isOpen={isAIAdviceModalOpen}
        onClose={() => setIsAIAdviceModalOpen(false)}
        userItems={clothingItems}
      />

      {/* Clothing Details Modal */}
      <ClothingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        item={selectedItem}
        onEdit={handleEditFromDetails}
      />

      {/* Edit Clothing Modal */}
      <EditClothingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={selectedItem}
        onItemUpdated={handleItemUpdated}
        onItemDeleted={handleItemDeleted}
      />
    </div>
  );
};

export default Dashboard; 