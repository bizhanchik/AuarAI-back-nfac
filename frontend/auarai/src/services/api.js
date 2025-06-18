import axios from 'axios';

// Создаем экземпляр axios с базовой конфигурацией
export const api = axios.create({
  baseURL: 'http://auarai.com', // Адрес вашего FastAPI бэкенда
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Если токен недействителен, удаляем его
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API функции
export const weatherAPI = {
  getAlmatyWeather: () => api.get('/weather/almaty'),
};

export const clothingAPI = {
  getUserItems: () => api.get('/items/'),
  classifyImage: (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return api.post('/ai/classify-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getClassificationResult: (taskId) => api.get(`/ai/classification-result/${taskId}`),
  addClothingItem: (itemData) => api.post('/clothing/', itemData),
}; 