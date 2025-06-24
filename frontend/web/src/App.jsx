import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import analytics from './services/analytics';
import './App.css';

// Компонент для отслеживания изменения маршрутов
function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Отслеживание посещения страниц
    const pageName = location.pathname;
    let pageTitle = '';

    switch (pageName) {
      case '/':
        pageTitle = 'Главная страница';
        break;
      case '/login':
        pageTitle = 'Страница входа';
        break;
      case '/register':
        pageTitle = 'Страница регистрации';
        break;
      case '/dashboard':
        pageTitle = 'Личный кабинет';
        break;
      default:
        pageTitle = `Страница ${pageName}`;
    }

    analytics.trackPageView(pageTitle, pageTitle);
  }, [location]);

  return null;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  // Отслеживание посещения сайта при первой загрузке
  useEffect(() => {
    analytics.trackUserVisit();
    
    // Debug analytics after a short delay to ensure GA is loaded
    setTimeout(() => {
      analytics.debugAnalytics();
    }, 2000);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <RouteTracker />
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
