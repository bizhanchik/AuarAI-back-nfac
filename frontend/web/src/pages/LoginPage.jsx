import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  EyeIcon, 
  EyeOffIcon, 
  SparklesIcon, 
  UserIcon, 
  LockIcon,
  ArrowRightIcon,
  StarIcon,
  HeartIcon,
  ZapIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoToRegister = () => {
    navigate('/register');
  };

  const FloatingElement = ({ children, delay = 0, duration = 6 }) => (
    <motion.div
      animate={{ 
        y: [0, -20, 0],
        rotate: [0, 5, -5, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{ 
        duration, 
        repeat: Infinity, 
        delay,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Stunning Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingElement delay={0}>
          <div className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl"></div>
        </FloatingElement>
        <FloatingElement delay={1}>
          <div className="absolute top-40 right-32 w-8 h-8 bg-gradient-to-r from-pink-500/30 to-red-500/30 rounded-full blur-lg"></div>
        </FloatingElement>
        <FloatingElement delay={2}>
          <div className="absolute bottom-32 left-40 w-12 h-12 bg-gradient-to-r from-cyan-500/25 to-blue-500/25 rounded-full blur-lg"></div>
        </FloatingElement>
        <FloatingElement delay={0.5}>
          <div className="absolute top-60 right-20 w-20 h-20 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-2xl"></div>
        </FloatingElement>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="max-w-md w-full"
        >
          {/* Premium Card */}
          <div className="card-glass p-8 relative overflow-hidden">
            {/* Animated Border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-20 blur"></div>
            
            {/* Header */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <motion.div
                className="flex justify-center mb-6"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <SparklesIcon className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-30 animate-pulse"></div>
                </div>
              </motion.div>
              
              <motion.h1 
                className="text-4xl font-black text-white mb-3 font-display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Добро пожаловать
              </motion.h1>
              
              <motion.p 
                className="text-gray-300 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Войдите в мир персонального стиля
              </motion.p>
            </motion.div>

            {/* Form */}
            <motion.form 
              className="space-y-6" 
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {/* Username Field */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <label htmlFor="username" className="block text-sm font-semibold text-gray-300 mb-2">
                  Имя пользователя
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="input-glass pl-10 pr-4 py-3 text-white placeholder-gray-400"
                    placeholder="Введите имя пользователя"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="input-glass pl-10 pr-12 py-3 text-white placeholder-gray-400"
                    placeholder="Введите пароль"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary text-lg py-4 relative overflow-hidden group"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Вход в систему...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Войти в AuarAI</span>
                    <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
                
                {/* Button Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </motion.button>

              {/* Register Link */}
              <motion.div 
                className="text-center pt-4 border-t border-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <p className="text-gray-300 text-sm mb-3">
                  Нет аккаунта?
                </p>
                <Link 
                  to="/register" 
                  onClick={handleGoToRegister}
                  className="clickable-link auth-switch-button inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleGoToRegister();
                    }
                  }}
                >
                  Создать аккаунт
                </Link>
              </motion.div>
            </motion.form>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 opacity-30">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <StarIcon className="h-6 w-6 text-yellow-400" />
              </motion.div>
            </div>
            
            <div className="absolute bottom-4 left-4 opacity-30">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <HeartIcon className="h-5 w-5 text-pink-400" />
              </motion.div>
            </div>
            
            <div className="absolute top-1/2 left-4 opacity-20">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <ZapIcon className="h-4 w-4 text-blue-400" />
              </motion.div>
            </div>
          </div>

          {/* Bottom Link */}
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Link
              to="/"
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              ← Вернуться на главную
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage; 