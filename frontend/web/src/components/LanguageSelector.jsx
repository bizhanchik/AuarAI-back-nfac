import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronDownIcon, GlobeIcon } from 'lucide-react';

const LanguageSelector = ({ variant = 'light' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, switchLanguage, availableLanguages } = useLanguage();

  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = (langCode) => {
    switchLanguage(langCode);
    setIsOpen(false);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'dark':
        return {
          button: 'glass-dark text-white hover:bg-space-cadet/30',
          dropdown: 'glass-dark border-space-cadet/40',
          option: 'text-white hover:bg-space-cadet/30'
        };
      case 'primary':
        return {
          button: 'glass-primary text-primary-700 hover:bg-primary-300/20',
          dropdown: 'glass-primary border-primary-300/40',
          option: 'text-primary-700 hover:bg-primary-300/20'
        };
      default:
        return {
          button: 'glass-light text-neutral-800 hover:bg-neutral-100/50',
          dropdown: 'glass-light border-accent-200/60',
          option: 'text-neutral-800 hover:bg-accent-200/30'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="language-selector">
      <motion.button
        className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-150 ${styles.button}`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <GlobeIcon className="h-4 w-4" />
        <span className="font-medium text-sm">
          {currentLang?.flag} {currentLang?.name}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="h-4 w-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              className={`language-dropdown ${styles.dropdown}`}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {availableLanguages.map((language) => (
                <motion.div
                  key={language.code}
                  className={`language-option ${
                    language.code === currentLanguage ? 'active' : styles.option
                  }`}
                  onClick={() => handleLanguageChange(language.code)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="font-medium">{language.name}</span>
                  {language.code === currentLanguage && (
                    <motion.div
                      className="ml-auto w-2 h-2 bg-current rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector; 