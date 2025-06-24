// Google Analytics Service
class AnalyticsService {
  constructor() {
    this.isEnabled = typeof window !== 'undefined' && window.gtag;
    this.measurementId = 'G-EH59M60G1Z';
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
    if (!this.isEnabled) return;

    window.gtag('event', 'login', {
      method: method,
      event_category: 'Authentication',
      event_label: 'User Login',
      value: 1
    });

    console.log(`📊 Аналитика: Пользователь авторизовался через ${method}`);
  }

  // Отслеживание добавления одежды
  trackClothingAdded(category = 'unknown') {
    if (!this.isEnabled) return;

    window.gtag('event', 'clothing_added', {
      event_category: 'Wardrobe Management',
      event_label: 'Add Clothing Item',
      clothing_category: category,
      value: 1
    });

    console.log(`📊 Аналитика: Добавлена одежда категории ${category}`);
  }

  // Отслеживание V2V диалога с ИИ
  trackV2VDialogue(duration = null) {
    if (!this.isEnabled) return;

    const eventData = {
      event_category: 'AI Interaction',
      event_label: 'V2V Dialogue',
      value: 1
    };

    if (duration) {
      eventData.custom_duration = duration;
    }

    window.gtag('event', 'v2v_dialogue', eventData);

    console.log('📊 Аналитика: V2V диалог с ИИ');
  }

  // Отслеживание запроса совета от ИИ
  trackAIAdviceRequest(adviceType = 'general') {
    if (!this.isEnabled) return;

    window.gtag('event', 'ai_advice_request', {
      event_category: 'AI Interaction',
      event_label: 'AI Style Advice',
      advice_type: adviceType,
      value: 1
    });

    console.log(`📊 Аналитика: Запрос совета от ИИ - ${adviceType}`);
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
        if (window.gtag) {
          window.gtag('event', event.name, {
            event_category: event.category,
            event_label: event.label,
            timestamp: Date.now()
          });
          console.log(`✅ Test event ${index + 1} sent:`, event.name);
        }
      }, index * 1000); // Send events 1 second apart
    });
    
    console.log('🧪 Test events scheduled. Check Google Analytics in 2-3 minutes.');
    console.log('🔗 Go to: https://analytics.google.com/');
    console.log('📊 Look in: Realtime > Events');
  }

  // Comprehensive analytics debugging
  debugAnalytics() {
    console.log('🔍 === ANALYTICS DEBUGGING ===');
    console.log('1. gtag function exists:', typeof window.gtag);
    console.log('2. dataLayer exists:', !!window.dataLayer);
    console.log('3. dataLayer length:', window.dataLayer ? window.dataLayer.length : 0);
    console.log('4. dataLayer contents:', window.dataLayer ? window.dataLayer.slice(-5) : 'None');
    
    // Check if GA script loaded
    const gaScript = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    console.log('5. GA script loaded:', !!gaScript);
    console.log('6. GA script src:', gaScript ? gaScript.src : 'Not found');
    
    // Check measurement ID
    console.log('7. Measurement ID:', this.measurementId);
    
    // Test network requests
    console.log('8. Testing manual gtag call...');
    if (window.gtag) {
      window.gtag('event', 'debug_test', {
        event_category: 'Debug',
        event_label: 'Manual Debug Test',
        custom_parameter: 'debug_' + Date.now()
      });
      console.log('✅ Manual gtag event sent');
    } else {
      console.error('❌ gtag function not available');
    }
    
    // Check for ad blockers or privacy extensions
    console.log('9. Check browser developer tools Network tab for:');
    console.log('   - Requests to googletagmanager.com');
    console.log('   - Requests to google-analytics.com');
    console.log('   - Any blocked requests (red entries)');
  }
}

// Создаем и экспортируем единственный экземпляр
const analytics = new AnalyticsService();

export default analytics; 