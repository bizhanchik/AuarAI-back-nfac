import axios from 'axios';

// Создаем экземпляр axios с базовой конфигурацией
export const api = axios.create({
  // baseURL: 'http://localhost:8000/api', // Updated to include /api prefix
  baseURL: 'https://auarai.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // For Firebase auth, we'll handle token refresh in AuthContext
      console.warn('Authentication error:', error.response?.data?.detail || 'Unauthorized');
      
      // Don't automatically redirect to login for Firebase auth
      // The AuthContext will handle token refresh
    }
    return Promise.reject(error);
  }
);

// Geolocation utility
export const geolocationAPI = {
  getCurrentPosition: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMessage = 'Unknown geolocation error';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        options
      );
    });
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
      const position = await geolocationAPI.getCurrentPosition();
      return await weatherAPI.getWeatherByCoordinates(position.lat, position.lon);
    } catch (error) {
      // Fallback to Almaty weather if geolocation fails
      console.warn('Geolocation failed, falling back to Almaty weather:', error.message);
      return await weatherAPI.getAlmatyWeather();
    }
  },
  getUserLocationForecast: async (days = 5) => {
    try {
      const position = await geolocationAPI.getCurrentPosition();
      return await weatherAPI.getWeatherForecast(position.lat, position.lon, days);
    } catch (error) {
      // Fallback to Almaty coordinates if geolocation fails
      console.warn('Geolocation failed, using Almaty coordinates for forecast:', error.message);
      return await weatherAPI.getWeatherForecast(43.2220, 76.8512, days);
    }
  }
};

export const clothingAPI = {
  getUserItems: () => api.get('/items/'),
  classifyImage: (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    return api.post('/classifier/classify-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  classifyImageFromUrl: (requestData) => {
    return api.post('/classifier/classify-image', requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
  getClassificationResult: (taskId) => api.get(`/classifier/classification-result/${taskId}`),
  addClothingItem: (itemData) => api.post('/clothing/', itemData),
  updateClothingItem: (itemId, itemData) => api.put(`/clothing/${itemId}`, itemData),
  deleteClothingItem: (itemId) => api.delete(`/clothing/${itemId}`),
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-photo', formData, {
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
      const position = await geolocationAPI.getCurrentPosition();
      return api.post('/stylist/forecast-outfits', null, {
        params: {
          lat: position.lat,
          lon: position.lon,
          days,
          occasion
        }
      });
    } catch (error) {
      // Fallback to Almaty coordinates if geolocation fails
      console.warn('Geolocation failed, using Almaty coordinates for forecast outfits:', error.message);
      return api.post('/stylist/forecast-outfits', null, {
        params: {
          lat: 43.2220,
          lon: 76.8512,
          days,
          occasion
        }
      });
    }
  }
}; 