import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { WeatherProvider } from './contexts/WeatherContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import analytics from './services/analytics';
import './App.css';

// Component for tracking route changes
function RouteTracker() {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    // Track page visits
    const pageName = location.pathname;
    let pageTitle = '';

    switch (pageName) {
      case '/':
        pageTitle = 'Landing Page';
        break;
      case '/login':
        pageTitle = 'Login Page';
        break;
      case '/dashboard':
        pageTitle = 'Dashboard';
        break;
      default:
        pageTitle = `Page ${pageName}`;
    }

    analytics.trackPageView(pageTitle, pageTitle);
  }, [location, t]);

  return null;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Fashion Loading Animation */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-mystical opacity-20 animate-gradient"></div>
          <div className="absolute inset-0 animate-gradient bg-gradient-sunset opacity-30"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center space-y-8">
          <div className="fashion-loader"></div>
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-extra-bold text-neutral-900 font-display">
              Loading your style...
            </h2>
            <p className="text-neutral-600 text-xl font-body">
              Preparing fashion magic
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  // Track site visit on first load
  useEffect(() => {
    analytics.trackUserVisit();
    
    // Debug analytics after a short delay to ensure GA is loaded
    setTimeout(() => {
      analytics.debugAnalytics();
    }, 2000);
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <WeatherProvider>
          <Router>
            <AppContent />
          </Router>
        </WeatherProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-navigate to dashboard when user logs in
  useEffect(() => {
    if (user && location.pathname === '/login') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return (
    <>
      <RouteTracker />
      <div className="App min-h-screen">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--gradient-primary)',
              color: '#fff',
              fontFamily: 'Poppins, Inter, Montserrat, sans-serif',
              fontWeight: '600',
              borderRadius: '16px',
              border: '2px solid var(--primary-light)',
              boxShadow: 'var(--shadow-dramatic)',
            },
            success: {
              style: {
                background: 'var(--gradient-ocean)',
              },
            },
            error: {
              style: {
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              },
            },
          }}
        />
      </div>
    </>
  );
}

export default App;
