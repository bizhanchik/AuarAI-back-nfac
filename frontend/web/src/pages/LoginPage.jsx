import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import analytics from '../services/analytics';
import { 
  SparklesIcon,
  ShieldCheckIcon,
  HeartIcon,
  ZapIcon,
  StarIcon,
  TrendingUpIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    // 🔥 ОТСЛЕЖИВАНИЕ LOGIN - СРАЗУ ПРИ НАЖАТИИ НА КНОПКУ
    console.log('🔥 User clicked Google Sign In button - tracking login event');
    analytics.trackUserLogin('google');
    
    try {
      setLoading(true);
      const result = await loginWithGoogle();
      // Navigation will be handled automatically by the auth state change
      // The onAuthStateChanged listener will detect the user and navigate
      console.log('Google sign in successful:', result);
      
      // Дополнительное отслеживание успешного входа
      setTimeout(() => {
        analytics.trackUserEngagement('successful_login', {
          method: 'google',
          user_id: result.user?.uid,
          user_email: result.user?.email
        });
      }, 1000);
      
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Ошибка входа. Попробуйте еще раз.');
      
      // Отслеживание неудачного входа
      analytics.trackCustomEvent('login_failed', 'Authentication', 'Google Login Failed', 1, {
        error_code: error.code,
        error_message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Static Background Elements - PERFORMANCE: Removed infinite animations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-primary opacity-20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-secondary opacity-25 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-ocean opacity-15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-28 h-28 bg-gradient-sunset opacity-20 rounded-full blur-2xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-40 nav-glass">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <motion.button
              onClick={() => navigate('/')}
              className="flex items-center space-x-3 hover-lift"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-14 h-14 logo-white-bg rounded-3xl flex items-center justify-center shadow-bold">
                <img 
                  src="/img/logo.png" 
                  alt="AuarAI Logo" 
                  className="h-9 w-9 object-contain"
                />
              </div>
              <span className="text-4xl font-extra-bold text-neutral-900 font-display">AuarAI</span>
            </motion.button>
            
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={() => navigate('/')}
                className="nav-button text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Home
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Welcome Section */}
          <motion.div
            className="text-center mb-12"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="mb-8"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-glow-primary mx-auto">
                  <SparklesIcon className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -inset-4 bg-gradient-primary rounded-3xl blur opacity-30"></div>
              </div>
            </motion.div>
            
            <h1 className="text-6xl font-ultra-bold text-neutral-900 mb-6 font-display leading-tight">
              {t('welcomeBack')}
            </h1>
            <p className="text-2xl text-neutral-700 font-subheading font-semibold">
              {t('loginDescription')}
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div
            className="card-premium p-12 shadow-dramatic"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Google Sign In Button */}
            <motion.button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full btn-google text-xl py-6 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group mb-8"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <motion.div
                    className="w-6 h-6 border-3 border-gray-300 border-t-gray-900 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="font-bold">Вход...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-4">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-xl font-bold">Sign in with Google</span>
                </div>
              )}
              
              {/* Button animation overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </motion.button>

            {/* Features Preview */}
            <div className="pt-8 border-t-2 border-accent-200">
              <h3 className="text-2xl font-bold text-neutral-800 mb-6 font-heading text-center">
                What awaits you inside:
              </h3>
              <div className="space-y-4">
                <FeatureItem 
                  icon={SparklesIcon}
                  text="AI-powered outfit recommendations"
                  color="bg-gradient-primary"
                />
                <FeatureItem 
                  icon={ShieldCheckIcon}
                  text="Weather-aware styling"
                  color="bg-gradient-secondary"
                />
                <FeatureItem 
                  icon={HeartIcon}
                  text="Personalized wardrobe management"
                  color="bg-gradient-ocean"
                />
                <FeatureItem 
                  icon={ZapIcon}
                  text="Voice assistant for fashion advice"
                  color="bg-gradient-sunset"
                />
              </div>
            </div>
          </motion.div>

          {/* Back to Home Link */}
          <motion.div
            className="text-center mt-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link
              to="/"
              className="text-primary-600 hover:text-primary-700 font-semibold transition-colors text-lg font-heading"
            >
              ← Back to home
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Feature Item Component
const FeatureItem = ({ icon: Icon, text, color }) => (
  <motion.div
    className="flex items-center space-x-4 text-neutral-700 group"
    whileHover={{ x: 10 }}
    transition={{ duration: 0.2 }}
  >
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-medium group-hover:shadow-bold transition-all duration-300`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <span className="font-body text-lg font-medium group-hover:text-neutral-900 transition-colors">{text}</span>
  </motion.div>
);

export default LoginPage; 