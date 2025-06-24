import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from '../services/firebase';
import { api } from '../services/api';
import analytics from '../services/analytics';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh and set the Firebase ID token
  const refreshToken = async (firebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken(true); // Force refresh
      api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
      return idToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get Firebase ID token
          const idToken = await firebaseUser.getIdToken();
          
          // Set the token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
          
          // Set user data from Firebase
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
          });

          // 📊 Отслеживание успешной авторизации
          analytics.trackUserLogin('google');
          analytics.setUserProperties(firebaseUser.uid, {
            userType: 'free', // Можно обновить из бэкенда
            isPremium: false  // Можно обновить из бэкенда
          });
          
          // Optional: Sync user with backend
          try {
            await api.post('/auth/firebase-login', {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            });
          } catch (error) {
            console.error('Error syncing with backend:', error);
            // Don't block login if backend sync fails
          }
          
        } catch (error) {
          console.error('Error getting ID token:', error);
          toast.error('Authentication error');
          setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    // Setup axios interceptor for automatic token refresh
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        // If we have a current user, ensure the token is fresh
        if (auth.currentUser) {
          try {
            const idToken = await auth.currentUser.getIdToken();
            config.headers['Authorization'] = `Bearer ${idToken}`;
          } catch (error) {
            console.error('Error getting fresh token:', error);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry && auth.currentUser) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            const newToken = await refreshToken(auth.currentUser);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            
            // Retry the original request
            return api(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Force logout if token refresh fails
            await signOutUser();
            toast.error('Session expired. Please sign in again.');
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Cleanup function
    return () => {
      unsubscribe();
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      
      toast.success(`Добро пожаловать, ${result.user.displayName || result.user.email}!`);
      
      return { success: true };
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      let errorMessage = 'Ошибка входа через Google';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Вход отменен пользователем';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Всплывающее окно заблокировано браузером';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Проблема с сетевым соединением';
      }
      
      toast.error(errorMessage);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      toast.success('Вы успешно вышли из системы');
    } catch (error) {
      console.error('Sign-out error:', error);
      toast.error('Ошибка при выходе из системы');
    }
  };

  const value = {
    user,
    loading,
    loginWithGoogle,
    logout,
    refreshToken,
    // Keep these for backward compatibility (they will be removed later)
    login: loginWithGoogle,
    register: loginWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 