import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { useLanguage } from './LanguageContext';
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
  const [previousUser, setPreviousUser] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Track login only when user goes from null to authenticated
      if (!previousUser && user) {
        // Add a small delay to ensure analytics is ready
        setTimeout(() => {
          console.log('🔥 Tracking login event for user:', user.email);
          const loginMethod = user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email';
          analytics.trackUserLogin(loginMethod);
        }, 1000);
      }
      
      setPreviousUser(user);
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [previousUser]);

  const register = async (email, password, username) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with the username
      if (username) {
        await updateProfile(result.user, {
          displayName: username
        });
        // Update local user state
        setUser({
          ...result.user,
          displayName: username
        });
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userName = result.user.displayName || result.user.email;
      
      toast.success(t('welcomeUser').replace('{name}', userName));
      return result;
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: undefined // Allow any domain
      });
      
      const result = await signInWithPopup(auth, provider);
      const userName = result.user.displayName || result.user.email;
      
      // Show success message in Russian
      toast.success(`Добро пожаловать, ${userName}! 🎉`);
      
      return result;
    } catch (error) {
      setLoading(false);
      console.error('Google login error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Окно авторизации было закрыто');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Всплывающее окно заблокировано браузером');
      } else if (error.code === 'auth/cancelled-popup-request') {
        toast.error('Запрос авторизации отменен');
      } else {
        toast.error('Ошибка входа через Google. Попробуйте еще раз.');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success(t('logoutSuccess'));
    } catch (error) {
      toast.error(t('logoutError'));
      throw error;
    }
  };

  const value = {
    user,
    register,
    login,
    loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 