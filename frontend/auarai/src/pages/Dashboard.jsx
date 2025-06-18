import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { weatherAPI, clothingAPI } from '../services/api';
import WeatherWidget from '../components/WeatherWidget';
import ClothingGrid from '../components/ClothingGrid';
import AddClothingModal from '../components/AddClothingModal';
import { PlusIcon, LogOutIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [weather, setWeather] = useState(null);
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                AuraAI
              </h1>
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
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Мой гардероб
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Управляйте своей коллекцией одежды с помощью ИИ
            </p>
          </div>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Добавить одежду
          </button>
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
          />
        ) : (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-sm p-12 max-w-lg mx-auto">
              <div className="text-gray-400 mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Ваш гардероб пока пуст
              </h3>
              <p className="text-gray-600 mb-6">
                Начните с добавления первой вещи, чтобы увидеть магию ИИ
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Добавить первую вещь
              </button>
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
    </div>
  );
};

export default Dashboard; 