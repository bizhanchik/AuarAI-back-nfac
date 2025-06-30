import axios from 'axios';
import { auth } from './firebase';
import locationService from './locationService.js';

// Создаем экземпляр axios с базовой конфигурацией
export const api = axios.create({
  // baseURL: 'http://localhost:8000/api', // Updated to include /api prefix
  baseURL: 'https://auarai.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена авторизации
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication error:', error.response?.data?.detail || 'Authorization header missing');
      
      // Try to refresh the token and retry the request
      const user = auth.currentUser;
      if (user) {
        try {
          const token = await user.getIdToken(true); // Force refresh
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api.request(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Redirect to login if token refresh fails
          window.location.href = '/login';
        }
      } else {
        // No user, redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Location utility (IP-based - no GPS permission required)
export const locationAPI = {
  getCurrentPosition: async () => {
    const coordinates = await locationService.getCoordinates();
    return coordinates;
  },
  
  getCurrentLocation: async () => {
    const location = await locationService.getCurrentLocation();
    return location;
  },
  
  getLocationWithDisplay: async () => {
    const location = await locationService.getLocationWithDisplay();
    return location;
  },
  
  refreshLocation: async () => {
    const location = await locationService.refreshLocation();
    return location;
  }
};

// API функции
export const weatherAPI = {
  getAlmatyWeather: () => api.get('/weather/almaty'),
  getWeatherByCoordinates: (lat, lon) => api.get('/weather/coordinates', {
    params: { lat, lon }
  }),
  getWeatherForecast: (lat, lon, days = 5) => api.get('/weather/forecast', {
    params: { lat, lon, days }
  }),
  getUserLocationWeather: async () => {
    try {
      const position = await locationAPI.getCurrentPosition();
      console.log('🌍 Getting weather for IP location:', position);
      return await weatherAPI.getWeatherByCoordinates(position.lat, position.lon);
    } catch (error) {
      // Fallback to Almaty weather if IP location fails
      console.warn('⚠️ IP location failed, falling back to Almaty weather:', error.message);
      return await weatherAPI.getAlmatyWeather();
    }
  },
  getUserLocationForecast: async (days = 5) => {
    try {
      const position = await locationAPI.getCurrentPosition();
      console.log('🌍 Getting forecast for IP location:', position);
      return await weatherAPI.getWeatherForecast(position.lat, position.lon, days);
    } catch (error) {
      // Fallback to Almaty coordinates if IP location fails
      console.warn('⚠️ IP location failed, using Almaty coordinates for forecast:', error.message);
      return await weatherAPI.getWeatherForecast(43.2220, 76.8512, days);
    }
  }
};

// Location API (backend-based fallback)
export const backendLocationAPI = {
  detectLocation: () => api.get('/location/detect'),
  getLocationInfo: () => api.get('/location/info'),
  getLocationForIP: (ip) => api.get(`/location/ip/${ip}`)
};

export const clothingAPI = {
  getUserItems: () => api.get('/items/'),
    classifyImage: async (files) => {
    if (!files) {
      return Promise.reject(new Error('No files provided for classification'));
    }
    
    try {
      // Prepare files for upload
      const formData = new FormData();
      
      if (Array.isArray(files)) {
        if (files.length === 0) {
          return Promise.reject(new Error('No files provided for classification'));
        }
        files.forEach(file => {
          formData.append('files', file);
        });
      } else {
        formData.append('files', files);
      }
      
      // Use the direct file classification endpoint
      const classificationResponse = await api.post('/classifier/classify-image-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return classificationResponse;
      
    } catch (error) {
      console.error('Classification process error:', error);
      throw error;
    }
  },
  classifyImageFromUrl: (requestData) => {
    return api.post('/classifier/classify-image', requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
  getClassificationResult: (taskId) => api.get(`/classifier/classification-result/${taskId}`),
  addClothingItem: async (itemData) => {
    console.log('🚀 Отправка данных на сервер:', itemData);
    try {
      const response = await api.post('/clothing/', itemData);
      console.log('✅ Ответ от сервера:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Ошибка при создании элемента:', error);
      throw error;
    }
  },
  updateClothingItem: (itemId, itemData) => api.put(`/clothing/${itemId}`, itemData),
  deleteClothingItem: (itemId) => api.delete(`/clothing/${itemId}`),
  uploadImage: (file) => {
    if (!file) {
      return Promise.reject(new Error('No file provided for upload'));
    }
    
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadPhoto: (file) => {
    if (!file) {
      return Promise.reject(new Error('No file provided for upload'));
    }
    
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadAndClassify: (file) => {
    if (!file) {
      return Promise.reject(new Error('No file provided for upload and classification'));
    }
    
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-and-classify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getStyleAdvice: (occasion, weather, stylePreference = 'casual') => 
    api.post('/stylist/suggest-outfit', null, { 
      params: { 
        occasion, 
        weather, 
        style_preference: stylePreference 
      } 
    }),
  getForecastOutfits: async (days = 5, occasion = 'casual') => {
    try {
      const position = await locationAPI.getCurrentPosition();
      console.log('🌍 Getting outfit forecast for IP location:', position);
      return api.post('/stylist/forecast-outfits', null, {
        params: {
          lat: position.lat,
          lon: position.lon,
          days,
          occasion
        }
      });
    } catch (error) {
      // Fallback to Almaty coordinates if IP location fails
      console.warn('⚠️ IP location failed, using Almaty coordinates for forecast outfits:', error.message);
      return api.post('/stylist/forecast-outfits', null, {
        params: {
          lat: 43.2220,
          lon: 76.8512,
          days,
          occasion
        }
      });
    }
  },
  
  // Bulk upload methods
  bulkUpload: (files) => {
    if (!files || files.length === 0) {
      return Promise.reject(new Error('No files provided for bulk upload'));
    }
    
    if (files.length > 10) {
      return Promise.reject(new Error('Maximum 10 files allowed per batch'));
    }
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    return api.post('/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getBulkUploadStatus: (batchId) => {
    if (!batchId) {
      return Promise.reject(new Error('Batch ID is required'));
    }
    
    return api.get(`/bulk-status/${batchId}`);
  }
}; 