import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// English translations (default)
const translations = {
  en: {
    // Navigation & Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    
    // Landing Page
    heroTitle: 'Your AI Stylist.',
    heroSubtitle: 'Smarter Outfits, Less Effort.',
    heroDescription: 'AuarAI helps you create stylish outfits tailored to your wardrobe, the weather, and your daily plans — in seconds.',
    tryFree: 'Try AuarAI Free',
    watchDemo: 'Watch Demo',
    
    // Features
    personalizedStyle: 'Personalized for your style',
    weatherAware: 'Weather & calendar-aware',
    ownWardrobe: 'Works with your own wardrobe',
    videoSupport: 'Amazon & video outfit check support',
    
    // How it works
    howItWorks: 'How It Works',
    howItWorksSubtitle: 'Three simple steps to effortless style',
    uploadWardrobe: 'Upload your wardrobe',
    uploadDescription: 'Take photos or import clothes from stores.',
    tellPlans: 'Tell us your plans & location',
    plansDescription: 'AuarAI checks the weather and your calendar.',
    getOutfits: 'Get daily outfit ideas — instantly',
    outfitsDescription: 'Dress with confidence, without overthinking.',
    
    // Social Proof
    outfitsGenerated: 'outfits generated',
    satisfaction: 'satisfaction from beta users',
    testimonial: 'AuarAI saved me 20 minutes every morning — and my outfits got compliments!',
    betaTester: 'Beta tester',
    
    // Demo Section
    seeInAction: 'See AuarAI in Action',
    experienceFuture: 'Experience the future of personal styling',
    outfitOfDay: 'Outfit of the Day',
    wardrobeOverview: 'Wardrobe Overview',
    aiRecommendations: 'AI Recommendations',
    weatherIntegration: 'Weather Integration',
    
    // CTA
    finalCtaTitle: "Don't waste another morning stressing your outfit.",
    finalCtaSubtitle: 'Try AuarAI and let your clothes work for you.',
    startStyling: 'Start Styling Now',
    
    // Dashboard
    myWardrobe: 'My Wardrobe',
    wardrobeDescription: 'Manage your clothing collection with artificial intelligence',
    items: 'items',
    allSynced: 'All synchronized',
    styleForecast: 'Style Forecast',
    aiAdvice: 'AI Advice',
    voiceAssistant: 'Voice Assistant',
    addClothing: 'Add Clothing',
    
    // Clothing Management
    addItem: 'Add Item',
    editItem: 'Edit Item',
    deleteItem: 'Delete Item',
    viewDetails: 'View Details',
    uploadImage: 'Upload Image',
    itemName: 'Item Name',
    category: 'Category',
    color: 'Color',
    brand: 'Brand',
    size: 'Size',
    condition: 'Condition',
    notes: 'Notes',
    
    // Categories
    categories: {
      tops: 'Tops',
      bottoms: 'Bottoms',
      dresses: 'Dresses',
      outerwear: 'Outerwear',
      shoes: 'Shoes',
      accessories: 'Accessories',
      underwear: 'Underwear'
    },
    
    // Weather
    todaysWeather: "Today's Weather",
    weatherFor: 'Weather for',
    temperature: 'Temperature',
    feelsLike: 'Feels like',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',
    fiveDayForecast: '5-day forecast',
    today: 'Today',
    
    // Messages
    itemAdded: 'Item successfully added!',
    itemUpdated: 'Item successfully updated!',
    itemDeleted: 'Item successfully deleted!',
    errorLoading: 'Error loading data',
    loggedOut: 'You have been logged out',
    
    // Error Messages
    fileTooLarge: 'File is too large. Maximum size: 5MB',
    pleaseSelectImage: 'Please select an image',
    unsupportedFormat: 'Only JPG, PNG and WebP formats are supported',
    serverConnectionError: 'Server connection problem. Check your internet connection.',
    fileTooBigForServer: 'File is too large for server. Try reducing the size.',
    unsupportedFileFormat: 'Unsupported file format.',
    corsError: 'CORS error. Contact administrator.',
    imageUploadError: 'Image upload or classification error',
    classificationResultError: 'Error getting classification result',
    addClothingError: 'Error adding clothing',
    updateClothingError: 'Error updating clothing',
    deleteClothingError: 'Error deleting clothing',
    
    // Success Messages
    photoReady: 'Photo ready for upload!',
    clothingAddedSuccess: 'Clothing successfully added to wardrobe!',
    clothingUpdatedSuccess: 'Clothing updated successfully!',
    clothingDeletedSuccess: 'Item deleted successfully!',
    aiAdviceReceived: 'AI advice received!',
    
    // Auth Messages
    welcomeUser: 'Welcome, {name}!',
    logoutSuccess: 'You have successfully logged out',
    logoutError: 'Error logging out',
    
    // V2V Assistant Messages
    connectedToAI: 'Connected to AI stylist!',
    connectionLost: 'Connection to AI stylist lost',
    connectionError: 'Error connecting to AI stylist. Check that backend is running on port 8000.',
    serviceUnavailable: 'Video chat service temporarily unavailable. Try again later.',
    failedToConnect: 'Failed to connect to AI stylist',
    cameraAccessError: 'Could not access camera',
    
    // AI Style Advice Messages
    selectOccasionAndWait: 'Select occasion and wait for weather to load',
    usingOfflineAdvice: 'Using offline advice - AI service problem',
    
    // Additional UI Messages
    whatsTheOccasion: "What's the occasion?",
    generatingAdvice: 'Generating advice...',
    getAIAdvice: 'Get AI Style Advice',
    personalStyleAdvice: 'Your Personal Style Advice',
    connecting: 'Connecting...',
    tryAgain: 'Try Again',
    serviceStatus: 'Service Status',
    solution: 'Solution',
    cameraOff: 'Camera Off',
    clickToTurnOn: 'Click to turn on',
    turnOffVideo: 'Turn Off Video',
    turnOnVideo: 'Turn On Video',
    compliments: 'Compliments',
    playing: 'Playing',
    getCompliments: 'Get real-time compliments',
    turnOnCamera: 'Turn on camera',
    analyze: 'will analyze your look and give personal compliments',
    saving: 'Saving',
    deleting: 'Deleting',
    description: 'Description',
    localConnectionError: 'Error connecting to AI stylist. Check that backend is running on port 8000.',
    languageChanged: 'Language changed to English',
    
    // Loading States
    loadingStyle: 'Loading your style...',
    preparingMagic: 'Preparing fashion magic',
    
    // Modal Actions
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    delete: 'Delete',
    edit: 'Edit',
    
    // Style Forecast Modal
    styleForecastTitle: 'Style Forecast',
    selectOccasions: 'Choose occasions for 5 days',
    personalRecommendations: 'Your personal recommendations',
    whatOccasions: 'What occasions are you planning for the next 5 days?',
    selectUp2Occasions: 'Select up to 2 main occasions. We will create outfits from your wardrobe.',
    inYourWardrobe: 'In your wardrobe:',
    itemsCount: 'items',
    selectedOccasions: 'Selected occasions',
    createOutfits: 'Create Outfits',
    creatingOutfits: 'Creating personal outfits...',
    analyzingWardrobe: 'Analyzing your wardrobe and weather forecast',
    forecastReady: 'Personal recommendations ready!',
    occasionsFor: 'Occasions for this day',
    addToWardrobe: 'Add to wardrobe',
    anyColor: 'Any color',
    changeOccasions: 'Change occasions',
    done: 'Done',
    
    // Occasions
    occasions: {
      casual: 'Casual',
      work: 'Work',
      date: 'Date',
      business: 'Business Meeting',
      sport: 'Sport',
      formal: 'Formal Event',
      party: 'Party',
      travel: 'Travel'
    },
    
    // Clothing Categories
    clothingTypes: {
      top: 'Top',
      bottom: 'Bottom',
      footwear: 'Footwear',
      outerwear: 'Outerwear',
      addTopToWardrobe: 'Add tops to wardrobe',
      addBottomToWardrobe: 'Add bottoms to wardrobe',
      addShoesToWardrobe: 'Add shoes to wardrobe',
      addOuterwearToWardrobe: 'Add outerwear to wardrobe',
      recommendShirts: 'We recommend adding shirts or blouses',
      recommendPants: 'We recommend adding pants or skirts',
      recommendShoes: 'We recommend adding different shoes',
      needJacket: 'Need a jacket in cool weather'
    },
    
    // Outfit Themes
    outfitThemes: {
      casualComfort: 'Comfortable casual style',
      businessProfessional: 'Professional business look',
      romanticAttractive: 'Romantic and attractive look',
      strictBusiness: 'Strict business style',
      activeSport: 'Active sporty look',
      elegantFormal: 'Elegant formal style',
      brightEvening: 'Bright evening look',
      practicalTravel: 'Practical travel style',
      universal: 'Universal style',
      withWarmth: 'with focus on warmth',
      forHotWeather: 'considering hot weather',
      multipleOccasions: 'occasions'
    },
    
    // Form Validation
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordMismatch: 'Passwords do not match',
    
    // Auth Pages
    welcomeBack: 'Welcome Back',
    loginDescription: 'Sign in to your fashion universe',
    createAccount: 'Create Account',
    registerDescription: 'Join the future of personal styling',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    username: 'Username',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    
    // Footer
    aboutUs: 'About Us',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    contact: 'Contact',
    allRightsReserved: 'All rights reserved',
  },
  
  ru: {
    // Navigation & Auth
    signIn: 'Войти',
    signUp: 'Регистрация',
    signOut: 'Выйти',
    login: 'Вход',
    register: 'Регистрация',
    logout: 'Выход',
    
    // Landing Page
    heroTitle: 'Ваш ИИ-стилист.',
    heroSubtitle: 'Умные образы, меньше усилий.',
    heroDescription: 'AuarAI поможет создать стильные образы, подходящие вашему гардеробу, погоде и планам — за секунды.',
    tryFree: 'Попробовать AuarAI бесплатно',
    watchDemo: 'Посмотреть демо',
    
    // Features
    personalizedStyle: 'Персонализировано под ваш стиль',
    weatherAware: 'Учет погоды и календаря',
    ownWardrobe: 'Работает с вашим гардеробом',
    videoSupport: 'Поддержка Amazon и видеопроверки образов',
    
    // How it works
    howItWorks: 'Как это работает',
    howItWorksSubtitle: 'Три простых шага к стилю без усилий',
    uploadWardrobe: 'Загрузите свой гардероб',
    uploadDescription: 'Сфотографируйте или импортируйте одежду из магазинов.',
    tellPlans: 'Расскажите о планах и местоположении',
    plansDescription: 'AuarAI проверит погоду и ваш календарь.',
    getOutfits: 'Получите идеи образов мгновенно',
    outfitsDescription: 'Одевайтесь уверенно, не переживая.',
    
    // Social Proof
    outfitsGenerated: 'образов создано',
    satisfaction: 'удовлетворенность бета-пользователей',
    testimonial: 'AuarAI экономит мне 20 минут каждое утро — и мои образы получают комплименты!',
    betaTester: 'Бета-тестер',
    
    // Demo Section
    seeInAction: 'Посмотрите AuarAI в действии',
    experienceFuture: 'Почувствуйте будущее персонального стилинга',
    outfitOfDay: 'Образ дня',
    wardrobeOverview: 'Обзор гардероба',
    aiRecommendations: 'ИИ рекомендации',
    weatherIntegration: 'Интеграция с погодой',
    
    // CTA
    finalCtaTitle: 'Не тратьте больше утра на переживания об одежде.',
    finalCtaSubtitle: 'Попробуйте AuarAI и позвольте одежде работать на вас.',
    startStyling: 'Начать стилинг',
    
    // Dashboard
    myWardrobe: 'Мой Гардероб',
    wardrobeDescription: 'Управляйте своей коллекцией одежды с помощью искусственного интеллекта',
    items: 'вещей',
    allSynced: 'Все синхронизировано',
    styleForecast: 'Прогноз стиля',
    aiAdvice: 'Совет ИИ',
    voiceAssistant: 'Голосовой помощник',
    addClothing: 'Добавить одежду',
    
    // Clothing Management
    addItem: 'Добавить вещь',
    editItem: 'Редактировать',
    deleteItem: 'Удалить',
    viewDetails: 'Подробности',
    uploadImage: 'Загрузить фото',
    itemName: 'Название вещи',
    category: 'Категория',
    color: 'Цвет',
    brand: 'Бренд',
    size: 'Размер',
    condition: 'Состояние',
    notes: 'Заметки',
    
    // Categories
    categories: {
      tops: 'Верх',
      bottoms: 'Низ',
      dresses: 'Платья',
      outerwear: 'Верхняя одежда',
      shoes: 'Обувь',
      accessories: 'Аксессуары',
      underwear: 'Белье'
    },
    
    // Weather
    todaysWeather: 'Сегодняшняя погода',
    weatherFor: 'Погода для',
    temperature: 'Температура',
    feelsLike: 'Ощущается как',
    humidity: 'Влажность',
    windSpeed: 'Скорость ветра',
    fiveDayForecast: '5-дневный прогноз',
    today: 'Сегодня',
    
    // Messages
    itemAdded: 'Одежда успешно добавлена!',
    itemUpdated: 'Вещь успешно обновлена!',
    itemDeleted: 'Вещь успешно удалена!',
    errorLoading: 'Ошибка загрузки данных',
    loggedOut: 'Вы вышли из системы',
    
    // Error Messages
    fileTooLarge: 'Файл слишком большой. Максимальный размер: 5MB',
    pleaseSelectImage: 'Пожалуйста, выберите изображение',
    unsupportedFormat: 'Поддерживаются только форматы JPG, PNG и WebP',
    serverConnectionError: 'Проблема с подключением к серверу. Проверьте соединение с интернетом.',
    fileTooBigForServer: 'Файл слишком большой для сервера. Попробуйте уменьшить размер.',
    unsupportedFileFormat: 'Неподдерживаемый формат файла.',
    corsError: 'Ошибка CORS. Обратитесь к администратору.',
    imageUploadError: 'Ошибка загрузки изображения или классификации',
    classificationResultError: 'Ошибка получения результата классификации',
    addClothingError: 'Ошибка добавления одежды',
    updateClothingError: 'Ошибка обновления одежды',
    deleteClothingError: 'Ошибка удаления одежды',
    
    // Success Messages
    photoReady: 'Изображение готово для загрузки!',
    clothingAddedSuccess: 'Одежда успешно добавлена в гардероб!',
    clothingUpdatedSuccess: 'Одежда обновлена успешно!',
    clothingDeletedSuccess: 'Вещь успешно удалена!',
    aiAdviceReceived: 'Совет ИИ получен!',
    
    // Auth Messages
    welcomeUser: 'Добро пожаловать, {name}!',
    logoutSuccess: 'Вы успешно вышли из системы',
    logoutError: 'Ошибка выхода',
    
    // V2V Assistant Messages
    connectedToAI: 'Подключено к ИИ-стилисту!',
    connectionLost: 'Соединение с ИИ-стилистом потеряно',
    connectionError: 'Ошибка подключения к ИИ-стилисту. Проверьте, что backend работает на порту 8000.',
    serviceUnavailable: 'Сервис видеочата временно недоступен. Попробуйте позже.',
    failedToConnect: 'Не удалось подключиться к ИИ-стилисту',
    cameraAccessError: 'Не удалось получить доступ к камере',
    
    // AI Style Advice Messages
    selectOccasionAndWait: 'Выберите повод и подождите загрузки погоды',
    usingOfflineAdvice: 'Использование offline-совета - проблема с ИИ-сервисом',
    
    // Additional UI Messages
    whatsTheOccasion: "Какой повод?",
    generatingAdvice: 'Генерируем совет...',
    getAIAdvice: 'Получить совет по стилю',
    personalStyleAdvice: 'Совет по вашему стилю',
    connecting: 'Подключаемся...',
    tryAgain: 'Попробовать еще раз',
    serviceStatus: 'Статус сервиса',
    solution: 'Решение',
    cameraOff: 'Камера выключена',
    clickToTurnOn: 'Нажмите для включения',
    turnOffVideo: 'Выключить видео',
    turnOnVideo: 'Включить видео',
    compliments: 'Комплименты',
    playing: 'Проигрывается',
    getCompliments: 'Получить реальные комплименты',
    turnOnCamera: 'Включить камеру',
    analyze: 'проанализирует ваш образ и даст персональные комплименты',
    saving: 'Сохраняем',
    deleting: 'Удаляем',
    description: 'Описание',
    localConnectionError: 'Ошибка подключения к ИИ-стилисту. Проверьте, что backend работает на порту 8000.',
    languageChanged: 'Язык изменен на русский',
    
    // Loading States
    loadingStyle: 'Загружаем ваш стиль...',
    preparingMagic: 'Подготавливаем магию моды',
    
    // Modal Actions
    save: 'Сохранить',
    cancel: 'Отмена',
    close: 'Закрыть',
    delete: 'Удалить',
    edit: 'Редактировать',
    
    // Style Forecast Modal
    styleForecastTitle: 'Прогноз стиля',
    selectOccasions: 'Выберите поводы для 5 дней',
    personalRecommendations: 'Ваши персональные рекомендации',
    whatOccasions: 'Какие поводы планируете на ближайшие 5 дней?',
    selectUp2Occasions: 'Выберите до 2 основных поводов. Мы создадим наряды из вашего гардероба.',
    inYourWardrobe: 'В вашем гардеробе:',
    itemsCount: 'вещей',
    selectedOccasions: 'Выбранные поводы',
    createOutfits: 'Создать наряды',
    creatingOutfits: 'Создаем персональные наряды...',
    analyzingWardrobe: 'Анализируем ваш гардероб и прогноз погоды',
    forecastReady: 'Персональные рекомендации готовы!',
    occasionsFor: 'Поводы для этого дня',
    addToWardrobe: 'Добавьте в гардероб',
    anyColor: 'Любой цвет',
    changeOccasions: 'Изменить поводы',
    done: 'Готово',
    
    // Occasions
    occasions: {
      casual: 'Повседневно',
      work: 'Работа',
      date: 'Свидание',
      business: 'Деловая встреча',
      sport: 'Спорт',
      formal: 'Торжество',
      party: 'Вечеринка',
      travel: 'Путешествие'
    },
    
    // Clothing Categories
    clothingTypes: {
      top: 'Верх',
      bottom: 'Низ',
      footwear: 'Обувь',
      outerwear: 'Верхняя одежда',
      addTopToWardrobe: 'Добавьте верх в гардероб',
      addBottomToWardrobe: 'Добавьте низ в гардероб',
      addShoesToWardrobe: 'Добавьте обувь в гардероб',
      addOuterwearToWardrobe: 'Добавьте верхнюю одежду',
      recommendShirts: 'Рекомендуем добавить рубашки или блузы',
      recommendPants: 'Рекомендуем добавить брюки или юбки',
      recommendShoes: 'Рекомендуем добавить разную обувь',
      needJacket: 'При прохладной погоде нужна куртка'
    },
    
    // Outfit Themes
    outfitThemes: {
      casualComfort: 'Комфортный повседневный стиль',
      businessProfessional: 'Деловой профессиональный образ',
      romanticAttractive: 'Романтичный и привлекательный look',
      strictBusiness: 'Строгий деловой стиль',
      activeSport: 'Активный спортивный образ',
      elegantFormal: 'Элегантный торжественный стиль',
      brightEvening: 'Яркий вечерний образ',
      practicalTravel: 'Практичный стиль для путешествий',
      universal: 'Универсальный стиль',
      withWarmth: 'с акцентом на тепло',
      forHotWeather: 'с учетом жаркой погоды',
      multipleOccasions: 'поводов'
    },
    
    // Form Validation
    required: 'Это поле обязательно',
    invalidEmail: 'Введите действительный email',
    passwordTooShort: 'Пароль должен содержать минимум 6 символов',
    passwordMismatch: 'Пароли не совпадают',
    
    // Auth Pages
    welcomeBack: 'С возвращением',
    loginDescription: 'Войдите в свою модную вселенную',
    createAccount: 'Создать аккаунт',
    registerDescription: 'Присоединяйтесь к будущему персонального стилинга',
    email: 'Email',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    username: 'Имя пользователя',
    forgotPassword: 'Забыли пароль?',
    noAccount: 'Нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?',
    
    // Footer
    aboutUs: 'О нас',
    privacy: 'Политика конфиденциальности',
    terms: 'Условия использования',
    contact: 'Контакты',
    allRightsReserved: 'Все права защищены',
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Temporarily disabled loading from localStorage - using English by default
  // useEffect(() => {
  //   const saved = localStorage.getItem('auarai-language');
  //   if (saved && translations[saved]) {
  //     setCurrentLanguage(saved);
  //   }
  // }, []);

  const switchLanguage = (lang) => {
    // Temporarily disabled - using English only
    // if (translations[lang]) {
    //   setCurrentLanguage(lang);
    //   localStorage.setItem('auarai-language', lang);
    // }
    console.log('Language switching temporarily disabled - using English only');
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        break;
      }
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      switchLanguage,
      t,
      availableLanguages: [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'ru', name: 'Русский', flag: '🇷🇺' }
      ]
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 