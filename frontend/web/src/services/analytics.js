// Google Analytics Service
class AnalyticsService {
  constructor() {
    this.isEnabled = typeof window !== 'undefined' && window.gtag;
    this.measurementId = 'G-EH59M60G1Z';
  }

  // Safe event tracking with retry mechanism
  safeTrackEvent(eventName, eventData, retryCount = 0) {
    const maxRetries = 3;
    
    if (!this.isEnabled || typeof window === 'undefined' || !window.gtag) {
      console.warn(`❌ Analytics not ready for event: ${eventName}`);
      
      // Retry after delay if analytics not ready
      if (retryCount < maxRetries) {
        setTimeout(() => {
          this.safeTrackEvent(eventName, eventData, retryCount + 1);
        }, 1000 * (retryCount + 1));
      }
      return;
    }

    try {
      // Add unique timestamp and random ID to prevent deduplication
      const enrichedData = {
        ...eventData,
        event_timestamp: Date.now(),
        event_id: Math.random().toString(36).substr(2, 9),
        session_id: this.getSessionId()
      };

      window.gtag('event', eventName, enrichedData);
      console.log(`✅ Analytics event sent: ${eventName}`, enrichedData);
      
      // Also log to dataLayer for debugging
      console.log('📊 Current dataLayer length:', window.dataLayer ? window.dataLayer.length : 'N/A');
      
    } catch (error) {
      console.error(`❌ Failed to send analytics event: ${eventName}`, error);
    }
  }

  // Get or create session ID
  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  // Инициализация аналитики
  init() {
    if (!this.isEnabled) {
      console.warn('Google Analytics не доступен');
      return;
    }

    // Настройка пользовательских свойств
    window.gtag('config', this.measurementId, {
      custom_map: {
        user_type: 'custom_user_type',
        user_premium: 'custom_user_premium'
      }
    });

    console.log('Google Analytics инициализирован');
  }

  // Отслеживание посещения страницы
  trackPageView(pageName, pageTitle = null) {
    if (!this.isEnabled) {
      console.warn('gtag не доступен для trackPageView');
      return;
    }

    window.gtag('event', 'page_view', {
      page_title: pageTitle || pageName,
      page_location: window.location.href,
      page_name: pageName
    });

    // Debug: проверяем что gtag существует
    console.log('gtag function exists:', typeof window.gtag);
    console.log('dataLayer exists:', window.dataLayer ? window.dataLayer.length : 'No dataLayer');
    console.log(`📊 Аналитика: Посещение страницы - ${pageName}`);
  }

  // Отслеживание входа пользователя на сайт
  trackUserVisit() {
    if (!this.isEnabled) return;

    window.gtag('event', 'user_visit', {
      event_category: 'User Engagement',
      event_label: 'Site Visit',
      value: 1
    });

    console.log('📊 Аналитика: Пользователь зашел на сайт');
  }

  // Отслеживание авторизации
  trackUserLogin(method = 'google') {
    const eventData = {
      method: method,
      event_category: 'Authentication',
      event_label: 'User Login',
      value: 1
    };

    this.safeTrackEvent('login', eventData);
    console.log(`📊 Аналитика: Пользователь авторизовался через ${method}`);
  }

  // Отслеживание добавления одежды
  trackClothingAdded(category = 'unknown') {
    const eventData = {
      event_category: 'Wardrobe Management',
      event_label: 'Add Clothing Item',
      clothing_category: category,
      value: 1
    };

    this.safeTrackEvent('clothing_added', eventData);
    console.log(`📊 Аналитика: Добавлена одежда категории ${category}`);
  }

  // Отслеживание V2V диалога с ИИ
  trackV2VDialogue(duration = null) {
    const eventData = {
      event_category: 'AI Interaction',
      event_label: 'V2V Dialogue',
      value: 1
    };

    if (duration) {
      eventData.custom_duration = duration;
    }

    this.safeTrackEvent('v2v_dialogue', eventData);
    console.log('📊 Аналитика: V2V диалог с ИИ');
  }

  // Отслеживание запроса совета от ИИ
  trackAIAdviceRequest(adviceType = 'general') {
    const eventData = {
      event_category: 'AI Interaction',
      event_label: 'AI Style Advice',
      advice_type: adviceType,
      value: 1
    };

    this.safeTrackEvent('ai_advice_request', eventData);
    console.log(`📊 Аналитика: Запрос совета от ИИ - ${adviceType}`);
  }

  // Отслеживание начала сессии
  trackSessionStart() {
    if (!this.isEnabled) return;

    window.gtag('event', 'session_start', {
      event_category: 'User Engagement',
      event_label: 'Session Start',
      value: 1
    });

    console.log('📊 Аналитика: Начало сессии');
  }

  // Отслеживание первого визита
  trackFirstVisit() {
    if (!this.isEnabled) return;

    window.gtag('event', 'first_visit', {
      event_category: 'User Engagement',
      event_label: 'First Visit',
      value: 1
    });

    console.log('📊 Аналитика: Первый визит');
  }

  // Отслеживание пользовательской активности
  trackUserEngagement(engagementType = 'general', details = {}) {
    const eventData = {
      event_category: 'User Engagement',
      event_label: engagementType,
      engagement_type: engagementType,
      ...details,
      value: 1
    };

    this.safeTrackEvent('user_engagement', eventData);
    console.log(`📊 Аналитика: Пользовательская активность - ${engagementType}`);
  }

  // Отслеживание пользовательских событий
  trackCustomEvent(eventName, category, label = null, value = null, customParameters = {}) {
    if (!this.isEnabled) return;

    const eventData = {
      event_category: category,
      ...customParameters
    };

    if (label) eventData.event_label = label;
    if (value) eventData.value = value;

    window.gtag('event', eventName, eventData);

    console.log(`📊 Аналитика: Пользовательское событие - ${eventName}`);
  }

  // Установка свойств пользователя
  setUserProperties(userId, properties = {}) {
    if (!this.isEnabled) return;

    window.gtag('config', this.measurementId, {
      user_id: userId,
      custom_map: {
        user_type: properties.userType || 'free',
        user_premium: properties.isPremium || false,
        ...properties
      }
    });

    console.log(`📊 Аналитика: Свойства пользователя установлены для ${userId}`);
  }

  // Отслеживание ошибок
  trackError(errorMessage, errorCategory = 'JavaScript Error') {
    if (!this.isEnabled) return;

    window.gtag('event', 'exception', {
      description: errorMessage,
      fatal: false,
      event_category: errorCategory
    });

    console.log(`📊 Аналитика: Ошибка - ${errorMessage}`);
  }

  // Отслеживание конверсий
  trackConversion(conversionType, value = null) {
    if (!this.isEnabled) return;

    const eventData = {
      event_category: 'Conversion',
      event_label: conversionType
    };

    if (value) eventData.value = value;

    window.gtag('event', 'conversion', eventData);

    console.log(`📊 Аналитика: Конверсия - ${conversionType}`);
  }

  // Test function to send all main events for verification
  testAllEvents() {
    console.log('🧪 === TESTING ALL ANALYTICS EVENTS ===');
    
    const testEvents = [
      () => this.trackUserLogin('google'),
      () => this.trackUserLogin('email'), 
      () => this.trackUserEngagement('test_engagement'),
      () => this.trackUserEngagement('login_intent', { source: 'test', button_type: 'test_button' }),
      () => this.trackAIAdviceRequest('test_occasion'),
      () => this.trackV2VDialogue(30),
      () => this.trackClothingAdded('test_category'),
      () => this.trackPageView('test_page'),
      () => this.trackUserVisit(),
      () => this.trackSessionStart(),
      () => this.trackFirstVisit()
    ];
    
    testEvents.forEach((eventFunc, index) => {
      setTimeout(() => {
        try {
          eventFunc();
          console.log(`✅ Test event ${index + 1} sent`);
        } catch (error) {
          console.error(`❌ Test event ${index + 1} failed:`, error);
        }
      }, index * 1500); // Send events 1.5 seconds apart
    });
    
    console.log('🧪 All test events scheduled. Check Google Analytics in 2-3 minutes.');
    console.log('🔗 Go to: https://analytics.google.com/');
    console.log('📊 Look in: Realtime > Events');
    console.log('');
    console.log('🎯 Expected events in Google Analytics:');
    console.log('  1. login (method: google)');
    console.log('  2. login (method: email)');
    console.log('  3. user_engagement (test_engagement)');
    console.log('  4. user_engagement (login_intent)');
    console.log('  5. ai_advice_request');
    console.log('  6. v2v_dialogue');
    console.log('  7. clothing_added');
    console.log('  8. page_view');
    console.log('  9. user_visit');
    console.log('  10. session_start');
    console.log('  11. first_visit');
  }

  // Test function to send multiple events for verification
  testAnalytics() {
    console.log('🧪 === TESTING ANALYTICS ===');
    
    // Send multiple test events
    const testEvents = [
      { name: 'test_event_1', category: 'Test', label: 'Manual Test 1' },
      { name: 'test_event_2', category: 'Test', label: 'Manual Test 2' },
      { name: 'test_event_3', category: 'Test', label: 'Manual Test 3' }
    ];
    
    testEvents.forEach((event, index) => {
      setTimeout(() => {
        this.safeTrackEvent(event.name, {
          event_category: event.category,
          event_label: event.label,
          timestamp: Date.now()
        });
      }, index * 1000); // Send events 1 second apart
    });
    
    console.log('🧪 Test events scheduled. Check Google Analytics in 2-3 minutes.');
    console.log('🔗 Go to: https://analytics.google.com/');
    console.log('📊 Look in: Realtime > Events');
  }

  // Enhanced analytics debugging with network checking
  debugAnalytics() {
    console.log('🔍 === ENHANCED ANALYTICS DEBUGGING ===');
    console.log('1. gtag function exists:', typeof window.gtag);
    console.log('2. dataLayer exists:', !!window.dataLayer);
    console.log('3. dataLayer length:', window.dataLayer ? window.dataLayer.length : 0);
    console.log('4. dataLayer last 10 entries:', window.dataLayer ? window.dataLayer.slice(-10) : 'None');
    
    // Check if GA script loaded
    const gaScript = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    console.log('5. GA script loaded:', !!gaScript);
    console.log('6. GA script src:', gaScript ? gaScript.src : 'Not found');
    
    // Check measurement ID
    console.log('7. Measurement ID:', this.measurementId);
    console.log('8. Session ID:', this.getSessionId());
    
    // Check for ad blockers
    this.checkAdBlocker();
    
    // Test network requests
    console.log('10. Testing manual gtag call with unique data...');
    if (window.gtag) {
      const testData = {
        event_category: 'Debug',
        event_label: 'Enhanced Debug Test',
        custom_parameter: 'debug_' + Date.now(),
        event_timestamp: Date.now(),
        event_id: Math.random().toString(36).substr(2, 9)
      };
      window.gtag('event', 'debug_test_enhanced', testData);
      console.log('✅ Enhanced manual gtag event sent:', testData);
    } else {
      console.error('❌ gtag function not available');
    }
    
    // Monitor network requests
    this.monitorNetworkRequests();
  }

  // Check for ad blockers
  checkAdBlocker() {
    console.log('9. Checking for ad blockers...');
    
    // Try to fetch GA collect endpoint
    fetch('https://www.google-analytics.com/collect?v=1&tid=UA-XXXXX-Y&cid=123&t=pageview&dp=%2F')
      .then(() => console.log('✅ GA collect endpoint accessible'))
      .catch(() => console.log('❌ GA collect endpoint blocked (likely ad blocker)'));
      
    // Try to fetch gtag endpoint  
    fetch('https://www.googletagmanager.com/gtag/js?id=G-EH59M60G1Z')
      .then(() => console.log('✅ GTM script endpoint accessible'))
      .catch(() => console.log('❌ GTM script endpoint blocked (likely ad blocker)'));
  }

  // Monitor network requests to GA
  monitorNetworkRequests() {
    console.log('11. Monitoring network requests...');
    console.log('   Open Network tab in DevTools and look for:');
    console.log('   - https://www.googletagmanager.com/gtag/js');
    console.log('   - https://www.google-analytics.com/g/collect');
    console.log('   - Any 403/blocked requests (red entries)');
    
    // Override fetch to monitor GA requests
    if (!window._gaFetchMonitored) {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && (url.includes('google-analytics.com') || url.includes('googletagmanager.com'))) {
          console.log('🌐 GA Network Request:', url);
        }
        return originalFetch.apply(this, arguments);
      };
      window._gaFetchMonitored = true;
    }
  }

  // Force send login event with maximum uniqueness
  forceTestLogin() {
    console.log('🔥 === FORCING TEST LOGIN EVENT ===');
    
    const uniqueLoginData = {
      method: 'google',
      event_category: 'Authentication',
      event_label: 'FORCED_TEST_LOGIN',
      value: 1,
      // Maximum uniqueness parameters
      event_timestamp: Date.now(),
      event_id: 'login_' + Math.random().toString(36).substr(2, 9),
      session_id: this.getSessionId(),
      user_id: 'test_user_' + Date.now(),
      // Additional GA4 recommended parameters
      engagement_time_msec: 1000,
      debug_mode: true
    };

    console.log('📤 Sending FORCED login event:', uniqueLoginData);
    
    // Send via safeTrackEvent
    this.safeTrackEvent('login', uniqueLoginData);
    
    // Also send directly via gtag as backup
    if (window.gtag) {
      setTimeout(() => {
        window.gtag('event', 'login_backup', uniqueLoginData);
        console.log('📤 Backup login event sent');
      }, 1000);
    }
    
    // Send a third variant with different event name
    setTimeout(() => {
      window.gtag('event', 'user_login_test', uniqueLoginData);
      console.log('📤 Alternative login event sent');
    }, 2000);
    
    console.log('✅ Three login variants sent. Check GA4 Realtime Events in 30 seconds');
    console.log('🔗 Go to: https://analytics.google.com/analytics/web/#/p494440858/realtime/overview');
  }
}

// Создаем и экспортируем единственный экземпляр
const analytics = new AnalyticsService();

export default analytics; 