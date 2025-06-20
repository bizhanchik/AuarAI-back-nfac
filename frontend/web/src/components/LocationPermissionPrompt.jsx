import { useState, useEffect } from 'react';
import { MapPinIcon, XIcon } from 'lucide-react';

const LocationPermissionPrompt = ({ onPermissionGranted, onPermissionDenied }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    // Check if location permission was already requested
    const locationPermissionAsked = localStorage.getItem('locationPermissionAsked');
    
    if (!locationPermissionAsked && navigator.geolocation) {
      setShowPrompt(true);
    }
  }, []);
  
  const handleRequestLocation = async () => {
    try {
      // Request location permission
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 300000
        });
      });
      
      localStorage.setItem('locationPermissionAsked', 'true');
      setShowPrompt(false);
      onPermissionGranted?.(position);
    } catch (error) {
      console.error('Location permission denied:', error);
      localStorage.setItem('locationPermissionAsked', 'true');
      setShowPrompt(false);
      onPermissionDenied?.(error);
    }
  };
  
  const handleSkip = () => {
    localStorage.setItem('locationPermissionAsked', 'true');
    setShowPrompt(false);
    onPermissionDenied?.();
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <MapPinIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            Разрешить доступ к местоположению?
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Мы покажем актуальную погоду для вашего города
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleRequestLocation}
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
            >
              Разрешить
            </button>
            <button
              onClick={handleSkip}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-200 transition-colors"
            >
              Пропустить
            </button>
          </div>
        </div>
        <button
          onClick={handleSkip}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default LocationPermissionPrompt; 