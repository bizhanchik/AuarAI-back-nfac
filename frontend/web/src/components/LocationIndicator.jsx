import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPinIcon, RefreshCwIcon, CheckIcon, GlobeIcon } from 'lucide-react';
import { locationAPI } from '../services/api';

const LocationIndicator = ({ onLocationUpdate }) => {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    const loadInitialLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const locationData = await locationAPI.getLocationWithDisplay();
        
        if (mounted) {
          setLocation(locationData);
          
          // Only notify parent once on initial load
          if (onLocationUpdate) {
            onLocationUpdate(locationData);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to load location:', err);
          setError('Unable to detect location');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialLocation();
    
    return () => {
      mounted = false;
    };
  }, []); // Only run once on mount

  const handleRefreshLocation = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const refreshedLocation = await locationAPI.refreshLocation();
      setLocation(refreshedLocation);
      
      // Notify parent component
      if (onLocationUpdate) {
        onLocationUpdate(refreshedLocation);
      }
    } catch (err) {
      console.error('Failed to refresh location:', err);
      setError('Failed to refresh location');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/50 p-3 max-w-sm"
      >
        <div className="flex items-center space-x-3">
          <div className="animate-spin">
            <GlobeIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              Detecting location...
            </div>
            <div className="text-xs text-gray-500">
              Using IP geolocation
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error && !location) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-50 rounded-lg border border-red-200 p-3 max-w-sm"
      >
        <div className="flex items-center space-x-3">
          <MapPinIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-red-900">
              Location Error
            </div>
            <div className="text-xs text-red-700">
              {error}
            </div>
          </div>
          <button
            onClick={handleRefreshLocation}
            disabled={isRefreshing}
            className="text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            <RefreshCwIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/50 p-3 max-w-sm"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <MapPinIcon className="h-5 w-5 text-green-600" />
              <CheckIcon className="h-3 w-3 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {location?.shortDisplay || 'Location Detected'}
              </div>
              <div className="text-xs text-gray-500">
                Automatic IP detection
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleDetails}
              className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1 rounded hover:bg-gray-100"
            >
              {showDetails ? 'Less' : 'More'}
            </button>
            <button
              onClick={handleRefreshLocation}
              disabled={isRefreshing}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
              title="Refresh location"
            >
              <RefreshCwIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showDetails && location && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-gray-200 space-y-1">
                <div className="text-xs text-gray-600 flex justify-between">
                  <span>Full Location:</span>
                  <span className="font-medium">{location.displayName}</span>
                </div>
                <div className="text-xs text-gray-600 flex justify-between">
                  <span>Coordinates:</span>
                  <span className="font-mono">{location.lat?.toFixed(4)}, {location.lon?.toFixed(4)}</span>
                </div>
                {location.timezone && (
                  <div className="text-xs text-gray-600 flex justify-between">
                    <span>Timezone:</span>
                    <span className="font-medium">{location.timezone}</span>
                  </div>
                )}
                {location.ip && (
                  <div className="text-xs text-gray-600 flex justify-between">
                    <span>IP Address:</span>
                    <span className="font-mono">{location.ip}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
            ⚠️ {error}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LocationIndicator; 