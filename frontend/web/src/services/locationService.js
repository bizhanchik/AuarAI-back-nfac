/**
 * IP-based Location Service using ipinfo.io API
 * Provides accurate location detection without requiring user permission
 */

const IPINFO_API_URL = 'https://ipinfo.io';
const DEFAULT_LOCATION = {
  city: 'Almaty',
  region: 'Almaty',
  country: 'KZ',
  countryName: 'Kazakhstan',
  lat: 43.2220,
  lon: 76.8512,
  timezone: 'Asia/Almaty'
};

class LocationService {
  constructor() {
    this.cachedLocation = null;
    this.cacheTimestamp = 0;
    // Cache location for 1 hour (3600000 ms)
    this.cacheExpiryTime = 60 * 60 * 1000;
  }

  /**
   * Get user's location based on IP address
   * @returns {Promise<Object>} Location data with city, region, country, coordinates
   */
  async getCurrentLocation() {
    try {
      // Return cached location if still valid
      if (this.isCacheValid()) {
        return this.cachedLocation;
      }
      
      // Fetch location from ipinfo.io
      const response = await fetch(`${IPINFO_API_URL}/json`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Parse coordinates from "lat,lng" format
      const [lat, lon] = (data.loc || '43.2220,76.8512').split(',').map(Number);
      
      const location = {
        city: data.city || DEFAULT_LOCATION.city,
        region: data.region || DEFAULT_LOCATION.region,
        country: data.country || DEFAULT_LOCATION.country,
        countryName: data.country ? this.getCountryName(data.country) : DEFAULT_LOCATION.countryName,
        lat: lat || DEFAULT_LOCATION.lat,
        lon: lon || DEFAULT_LOCATION.lon,
        timezone: data.timezone || DEFAULT_LOCATION.timezone,
        ip: data.ip,
        postal: data.postal,
        org: data.org
      };

      // Cache the result
      this.cachedLocation = location;
      this.cacheTimestamp = Date.now();

      return location;

    } catch (error) {
      console.warn('⚠️ IP geolocation failed, using default location:', error.message);
      
      // Return cached location if available, otherwise return default
      if (this.cachedLocation) {
        return this.cachedLocation;
      }
      
      return DEFAULT_LOCATION;
    }
  }

  /**
   * Get coordinates only (for weather API compatibility)
   * @returns {Promise<Object>} Coordinates object with lat, lon
   */
  async getCoordinates() {
    const location = await this.getCurrentLocation();
    return {
      lat: location.lat,
      lon: location.lon,
      accuracy: 1000 // IP-based accuracy is typically around 1km
    };
  }

  /**
   * Get location with formatted display name
   * @returns {Promise<Object>} Location with formatted display string
   */
  async getLocationWithDisplay() {
    const location = await this.getCurrentLocation();
    
    return {
      ...location,
      displayName: this.formatLocationDisplay(location),
      shortDisplay: `${location.city}, ${location.country}`
    };
  }

  /**
   * Force refresh location (bypass cache)
   * @returns {Promise<Object>} Fresh location data
   */
  async refreshLocation() {
    this.clearCache();
    return await this.getCurrentLocation();
  }

  /**
   * Check if cached location is still valid
   * @returns {boolean} True if cache is valid
   */
  isCacheValid() {
    if (!this.cachedLocation || !this.cacheTimestamp) {
      return false;
    }
    
    const age = Date.now() - this.cacheTimestamp;
    return age < this.cacheExpiryTime;
  }

  /**
   * Clear location cache
   */
  clearCache() {
    this.cachedLocation = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Format location for display
   * @param {Object} location Location object
   * @returns {string} Formatted location string
   */
  formatLocationDisplay(location) {
    const parts = [];
    
    if (location.city) parts.push(location.city);
    if (location.region && location.region !== location.city) {
      parts.push(location.region);
    }
    if (location.countryName) parts.push(location.countryName);
    
    return parts.join(', ');
  }

  /**
   * Get full country name from country code
   * @param {string} countryCode Two-letter country code
   * @returns {string} Full country name
   */
  getCountryName(countryCode) {
    const countryNames = {
      'KZ': 'Kazakhstan',
      'RU': 'Russia',
      'CN': 'China',
      'KG': 'Kyrgyzstan',
      'UZ': 'Uzbekistan',
      'TJ': 'Tajikistan',
      'TM': 'Turkmenistan',
      'US': 'United States',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'ES': 'Spain',
      'JP': 'Japan',
      'IN': 'India',
      'BR': 'Brazil',
      'CA': 'Canada',
      'AU': 'Australia',
      // Add more countries as needed
    };
    
    return countryNames[countryCode] || countryCode;
  }

  /**
   * Get timezone information
   * @returns {Promise<Object>} Timezone data
   */
  async getTimezone() {
    const location = await this.getCurrentLocation();
    return {
      timezone: location.timezone,
      offset: new Date().getTimezoneOffset(),
      localTime: new Date().toLocaleString('en-US', {
        timeZone: location.timezone
      })
    };
  }

  /**
   * Check if user is in a specific country
   * @param {string} countryCode Two-letter country code
   * @returns {Promise<boolean>} True if user is in the specified country
   */
  async isInCountry(countryCode) {
    const location = await this.getCurrentLocation();
    return location.country === countryCode;
  }

  /**
   * Get distance estimate between two points (very rough)
   * @param {number} lat1 First latitude
   * @param {number} lon1 First longitude  
   * @param {number} lat2 Second latitude
   * @param {number} lon2 Second longitude
   * @returns {number} Distance in kilometers (approximate)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Create singleton instance
const locationService = new LocationService();

// Convenience functions for direct use
export const getCurrentLocation = () => locationService.getCurrentLocation();
export const getCoordinates = () => locationService.getCoordinates();
export const getLocationWithDisplay = () => locationService.getLocationWithDisplay();
export const refreshLocation = () => locationService.refreshLocation();

export default locationService; 