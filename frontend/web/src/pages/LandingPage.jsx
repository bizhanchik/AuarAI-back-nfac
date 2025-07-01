import { motion, useInView } from 'framer-motion';
import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import analytics from '../services/analytics';
import { 
  SparklesIcon, 
  CloudIcon, 
  CalendarIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  CameraIcon,
  ShirtIcon,
  SunIcon,
  HeartIcon,
  TrendingUpIcon,
  ZapIcon,
  EyeIcon
} from 'lucide-react';

const LandingPage = React.memo(() => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleNavigation = useCallback((path) => {
    // Отслеживаем переход к авторизации
    if (path === '/login') {
      console.log('🔥 User clicked login button from landing page');
      analytics.trackUserEngagement('login_intent', {
        source: 'landing_page',
        button_type: 'navigation'
      });
    }
    navigate(path);
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Static Optimized Background Elements - PERFORMANCE: Removed infinite animations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-4 sm:left-10 lg:left-20 w-48 h-48 sm:w-72 sm:h-72 lg:w-96 lg:h-96 bg-gradient-primary opacity-20 sm:opacity-30 rounded-full blur-2xl sm:blur-3xl" />
        <div className="absolute top-1/2 right-4 sm:right-10 lg:right-20 w-40 h-40 sm:w-60 sm:h-60 lg:w-80 lg:h-80 bg-gradient-secondary opacity-15 sm:opacity-25 rounded-full blur-2xl sm:blur-3xl" />
        <div className="absolute bottom-20 left-1/4 sm:left-1/3 w-36 h-36 sm:w-56 sm:h-56 lg:w-72 lg:h-72 bg-gradient-ocean opacity-10 sm:opacity-20 rounded-full blur-xl sm:blur-3xl" />
        <div className="absolute top-10 right-1/4 sm:right-1/3 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-gradient-sunset opacity-15 sm:opacity-25 rounded-full blur-xl sm:blur-2xl" />
      </div>

      <Navigation navigate={handleNavigation} />
      <HeroSection navigate={handleNavigation} />
      <WhySection />
      <HowItWorksSection />
      {/* <SocialProofSection /> */}
      {/* <DemoSection /> */}
      <FinalCTASection navigate={handleNavigation} />
      <Footer />
    </div>
  );
});

const Navigation = ({ navigate }) => {
  const { t } = useLanguage();
  
  const handleLoginClick = () => {
    console.log('🔥 User clicked Sign In from navigation');
    analytics.trackUserEngagement('login_intent', {
      source: 'navigation',
      button_type: 'sign_in'
    });
    navigate('/login');
  };
  
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 w-full z-50 nav-glass"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 logo-white-bg rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-bold">
              <img 
                src="/img/logo.png" 
                alt="AuarAI Logo" 
                className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9 object-contain"
              />
            </div>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-calora text-neutral-900">AuarAI</span>
          </motion.div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoginClick}
              className="btn-ghost text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
            >
              {t('signIn')}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

const HeroSection = ({ navigate }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const { t } = useLanguage();

  const handleTryFreeClick = () => {
    console.log('🔥 User clicked Try Free button');
    analytics.trackUserEngagement('login_intent', {
      source: 'hero_section',
      button_type: 'try_free'
    });
    navigate('/login');
  };

  return (
    <section ref={ref} className="relative pt-20 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 xl:gap-24 items-center">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-ultra-bold text-neutral-900 mb-4 sm:mb-6 leading-tight font-display"
              initial={{ y: 50, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('heroTitle')}{' '}
              <span className="text-gradient-primary">
                {t('heroSubtitle')}
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-neutral-700 mb-8 sm:mb-10 leading-relaxed font-subheading font-medium"
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {t('heroDescription')}
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 sm:gap-6"
              initial={{ y: 30, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "var(--shadow-glow-primary)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleTryFreeClick}
                className="btn-primary text-base sm:text-lg lg:text-xl py-4 sm:py-5 px-8 sm:px-10 shadow-glow-primary w-full sm:w-auto"
              >
                {t('tryFree')}
                <ArrowRightIcon className="inline-block ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-ghost text-base sm:text-lg lg:text-xl py-4 sm:py-5 px-8 sm:px-10 w-full sm:w-auto"
              >
                {t('watchDemo')}
              </motion.button>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={isInView ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="order-1 lg:order-2 flex justify-center lg:justify-end"
          >
            <PhoneMockup />
          </motion.div>
        </div>
      </div>
      
      <FloatingElements />
    </section>
  );
};

const PhoneMockup = () => {
  return (
    <motion.div 
      className="relative mx-auto hover-lift"
      whileHover={{ y: -15 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative w-64 sm:w-80 md:w-96 lg:w-[400px] xl:w-[450px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-dramatic">
        <motion.img
          src="/img/woman-landing.jpeg"
          alt="Fashion styling with AuarAI"
          className="w-full h-auto object-cover"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
    </motion.div>
  );
};

const FloatingElements = React.memo(() => {
  const elementCount = 8;
  
  return (
    <div className="hidden md:block">
      {[...Array(elementCount)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-primary-400 rounded-full opacity-50 sm:opacity-70`}
          style={{
            left: `${10 + i * 12}%`,
            top: `${25 + i * 10}%`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.7
          }}
        />
      ))}
    </div>
  );
});

const WhySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const { t } = useLanguage();

  const features = [
    { icon: SparklesIcon, text: t('personalizedStyle') },
    { icon: CloudIcon, text: t('weatherAware') },
    { icon: ShirtIcon, text: t('ownWardrobe') },
    { icon: CameraIcon, text: t('videoSupport') }
  ];

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 relative glass-light">
      <div className="max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-ultra-bold text-neutral-900 mb-6 sm:mb-8 font-display leading-tight">
            Tired of wasting time picking what to wear?
          </h2>
          <p className="text-2xl sm:text-3xl text-primary-600 mb-4 sm:mb-6 font-elegant">Let AuarAI do the work.</p>
          <p className="text-lg sm:text-xl lg:text-2xl text-neutral-700 mb-12 sm:mb-16 max-w-4xl mx-auto font-subheading">
            Whether you're dressing for work, a date, or a walk — it builds perfect looks from your existing clothes.
          </p>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
          initial={{ y: 50, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ 
                y: -4,
                scale: 1.02,
                transition: { duration: 0.15, ease: "easeOut" }
              }}
              whileTap={{ scale: 0.98 }}
              className="card-premium p-6 sm:p-8"
              initial={{ y: 50, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-primary rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-glow-primary">
                <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <p className="text-neutral-800 font-bold font-heading text-base sm:text-lg">{feature.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const HowItWorksSection = React.memo(() => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const { t } = useLanguage();

  const steps = [
    {
      icon: ShirtIcon,
      title: t('uploadWardrobe'),
      description: t('uploadDescription'),
      color: "bg-gradient-primary"
    },
    {
      icon: CloudIcon,
      title: t('tellPlans'),
      description: t('plansDescription'),
      color: "bg-gradient-secondary"
    },
    {
      icon: SparklesIcon,
      title: t('getOutfits'),
      description: t('outfitsDescription'),
      color: "bg-gradient-ocean"
    }
  ];

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 glass-primary">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-ultra-bold text-neutral-900 mb-6 sm:mb-8 font-display">
            {t('howItWorks')}
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-neutral-700 font-subheading">{t('howItWorksSubtitle')}</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {steps.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
});

const StepCard = React.memo(({ step, index, isInView }) => {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.15,
        ease: "easeOut"
      }}
      className="relative hover-lift"
    >
      <div className="card-premium p-6 sm:p-8 lg:p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-sunset opacity-10 rounded-full blur-xl"></div>
        
        <div className={`w-20 h-20 sm:w-24 sm:h-24 ${step.color} rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-glow-primary`}>
          <step.icon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
        </div>
        
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-medium">
          <span className="text-white font-ultra-bold font-heading text-sm sm:text-lg">{index + 1}</span>
        </div>
        
        <h3 className="text-2xl sm:text-3xl font-extra-bold text-neutral-900 mb-4 sm:mb-6 font-heading">{step.title}</h3>
        <p className="text-neutral-700 text-lg sm:text-xl font-subheading">{step.description}</p>
      </div>
    </motion.div>
  );
});

const SocialProofSection = React.memo(() => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const { t } = useLanguage();

  const stats = [
    { number: "5,000+", label: t('outfitsGenerated') },
    { number: "Amazon", label: "& Google Calendar integrated" },
    { number: "100%", label: t('satisfaction') }
  ];

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <div className="card-elegant p-8 sm:p-12 max-w-5xl mx-auto">
            <div className="flex justify-center mb-4 sm:mb-6">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 fill-current" />
              ))}
            </div>
            <blockquote className="text-2xl sm:text-3xl text-neutral-900 font-bold mb-6 sm:mb-8 font-elegant">
              "{t('testimonial')}"
            </blockquote>
            <cite className="text-neutral-700 text-lg sm:text-xl font-subheading">— Maria S., {t('betaTester')}</cite>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
});

const StatCard = React.memo(({ stat, index, isInView }) => {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ 
        delay: 0.2 + index * 0.1, 
        duration: 0.5,
        ease: "easeOut"
      }}
      className="text-center card-glass p-6 sm:p-8 hover-elegant"
    >
      <div className="text-4xl sm:text-5xl font-ultra-bold text-primary-600 mb-3 sm:mb-4 font-display">{stat.number}</div>
      <div className="text-neutral-700 font-subheading text-base sm:text-lg">{stat.label}</div>
    </motion.div>
  );
});

const DemoSection = React.memo(() => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const { t } = useLanguage();

  const screens = [
    { title: t('outfitOfDay'), color: "bg-gradient-primary" },
    { title: t('wardrobeOverview'), color: "bg-gradient-secondary" },
    { title: t('aiRecommendations'), color: "bg-gradient-ocean" },
    { title: t('weatherIntegration'), color: "bg-gradient-sunset" }
  ];

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 glass-light">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-ultra-bold text-neutral-900 mb-6 sm:mb-8 font-display">
            {t('seeInAction')}
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-neutral-700 font-subheading">{t('experienceFuture')}</p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {screens.map((screen, index) => (
            <DemoCard key={screen.title} screen={screen} index={index} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
});

const DemoCard = React.memo(({ screen, index, isInView }) => {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      className="group cursor-pointer hover-lift"
    >
      <div className="card-premium p-6 sm:p-8">
        <div className={`w-full h-40 sm:h-48 lg:h-56 ${screen.color} rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 relative overflow-hidden shadow-medium`}>
          <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-all duration-200"></div>
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
            <div className="glass-light p-3 sm:p-4 rounded-xl">
              <div className="h-2 sm:h-3 bg-primary-400/60 rounded mb-2 sm:mb-3"></div>
              <div className="h-2 sm:h-3 bg-primary-400/60 rounded w-2/3"></div>
            </div>
          </div>
        </div>
        <h3 className="text-neutral-900 font-bold text-center font-heading text-base sm:text-lg">{screen.title}</h3>
      </div>
    </motion.div>
  );
});

const FinalCTASection = ({ navigate }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const { t } = useLanguage();

  const handleStartStylingClick = () => {
    console.log('🔥 User clicked Start Styling button');
    analytics.trackUserEngagement('login_intent', {
      source: 'final_cta',
      button_type: 'start_styling'
    });
    navigate('/login');
  };

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="card-elegant p-8 sm:p-12 lg:p-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-ultra-bold text-neutral-900 mb-6 sm:mb-8 font-display">
            {t('finalCtaTitle')}
          </h2>
          <p className="text-xl sm:text-2xl lg:text-3xl text-neutral-700 mb-8 sm:mb-12 font-subheading">
            {t('finalCtaSubtitle')}
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "var(--shadow-glow-primary)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartStylingClick}
            className="btn-primary text-lg sm:text-xl lg:text-2xl px-10 sm:px-12 lg:px-16 py-5 sm:py-6 w-full sm:w-auto"
          >
            {t('startStyling')}
            <ArrowRightIcon className="inline-block ml-3 sm:ml-4 h-6 w-6 sm:h-7 sm:w-7" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="py-12 sm:py-16 px-4 sm:px-6 glass-dark">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-8 sm:mb-12">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 logo-white-bg rounded-xl sm:rounded-2xl flex items-center justify-center">
                <img 
                  src="/img/logo.png" 
                  alt="AuarAI Logo" 
                  className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                />
              </div>
              <span className="text-2xl sm:text-3xl font-ultra-bold font-display text-white">AuarAI</span>
            </div>
            <p className="text-gray-300 font-subheading text-base sm:text-lg">Your AI-powered fashion stylist</p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 sm:mb-6 font-heading text-lg sm:text-xl text-white">Company</h4>
            <ul className="space-y-2 sm:space-y-3 font-body">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-base sm:text-lg">{t('aboutUs')}</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-base sm:text-lg">{t('contact')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 sm:mb-6 font-heading text-lg sm:text-xl text-white">Legal</h4>
            <ul className="space-y-2 sm:space-y-3 font-body">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-base sm:text-lg">{t('privacy')}</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors text-base sm:text-lg">{t('terms')}</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 sm:mb-6 font-heading text-lg sm:text-xl text-white">Connect</h4>
            <div className="flex space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center hover-lift cursor-pointer">
                <HeartIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-secondary rounded-xl sm:rounded-2xl flex items-center justify-center hover-lift cursor-pointer">
                <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t-2 border-gray-600 pt-8 sm:pt-10 text-center">
          <p className="text-gray-300 font-subheading text-base sm:text-lg">
            © 2025 AuarAI. {t('allRightsReserved')}.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingPage; 