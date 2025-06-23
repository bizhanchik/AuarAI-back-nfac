import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
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
  ZapIcon,
  CheckCircleIcon,
  ShieldCheckIcon
} from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);

    try {
      await register(formData.username, formData.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
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

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    if (password.length < 6) return { strength: 25, text: 'Слабый', color: 'bg-red-500' };
    if (password.length < 8) return { strength: 50, text: 'Средний', color: 'bg-yellow-500' };
    if (password.length < 12) return { strength: 75, text: 'Хороший', color: 'bg-blue-500' };
    return { strength: 100, text: 'Отличный', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

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
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-red-500/20"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingElement delay={0}>
          <div className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl"></div>
        </FloatingElement>
        <FloatingElement delay={1}>
          <div className="absolute top-40 right-32 w-8 h-8 bg-gradient-to-r from-pink-500/30 to-red-500/30 rounded-full blur-lg"></div>
        </FloatingElement>
        <FloatingElement delay={2}>
          <div className="absolute bottom-32 left-40 w-12 h-12 bg-gradient-to-r from-red-500/25 to-orange-500/25 rounded-full blur-lg"></div>
        </FloatingElement>
        <FloatingElement delay={0.5}>
          <div className="absolute top-60 right-20 w-20 h-20 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-2xl"></div>
        </FloatingElement>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          className="max-w-md w-full"
        >
          {/* Premium Card */}
          <div className="card-glass p-8 relative overflow-hidden">
            {/* Animated Border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl opacity-20 blur"></div>
            
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
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <ShieldCheckIcon className="h-8 w-8 text-white animate-pulse" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl blur opacity-30 animate-pulse"></div>
                </div>
              </motion.div>
              
              <motion.h1 
                className="text-4xl font-black text-white mb-3 font-display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Создать аккаунт
              </motion.h1>
              
              <motion.p 
                className="text-gray-300 text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Присоединяйтесь к революции стиля
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
                  {formData.username.length > 0 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    </div>
                  )}
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
                    placeholder="Введите пароль (минимум 6 символов)"
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
                
                {/* Password Strength Indicator */}
                {formData.password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Надежность пароля</span>
                      <span className={`font-semibold ${
                        passwordStrength.strength >= 75 ? 'text-green-400' :
                        passwordStrength.strength >= 50 ? 'text-blue-400' :
                        passwordStrength.strength >= 25 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${passwordStrength.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength.strength}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Confirm Password Field */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300 mb-2">
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="input-glass pl-10 pr-12 py-3 text-white placeholder-gray-400"
                    placeholder="Повторите пароль"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-300 transition-colors" />
                    )}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {formData.confirmPassword.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center text-xs"
                  >
                    {formData.password === formData.confirmPassword ? (
                      <div className="flex items-center text-green-400">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Пароли совпадают
                      </div>
                    ) : (
                      <div className="flex items-center text-red-400">
                        <ZapIcon className="h-4 w-4 mr-1" />
                        Пароли не совпадают
                      </div>
                    )}
                  </motion.div>
                )}
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
                transition={{ delay: 0.9, duration: 0.5 }}
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Создание аккаунта...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    <span>Создать аккаунт</span>
                    <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
                
                {/* Button Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </motion.button>

              {/* Login Link */}
              <motion.div 
                className="text-center pt-4 border-t border-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <p className="text-gray-300 text-sm mb-3">
                  Уже есть аккаунт?
                </p>
                <Link 
                  to="/login" 
                  onClick={handleGoToLogin}
                  className="clickable-link auth-switch-button inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleGoToLogin();
                    }
                  }}
                >
                  Войти
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
                <ZapIcon className="h-4 w-4 text-purple-400" />
              </motion.div>
            </div>
          </div>

          {/* Bottom Link */}
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5 }}
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

export default RegisterPage; 