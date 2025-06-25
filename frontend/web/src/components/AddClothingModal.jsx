import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XIcon, 
  CameraIcon, 
  UploadIcon, 
  CheckIcon, 
  SparklesIcon,
  ShirtIcon,
  TagIcon,
  PaletteIcon,
  StarIcon,
  LoaderIcon
} from 'lucide-react';
import { clothingAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'T-shirt', 'Jeans', 'Dress', 'Jacket', 'Sweater', 'Pants', 'Skirt', 'Blouse',
  'Coat', 'Shorts', 'Hoodie', 'Shirt', 'Sneakers', 'Boots', 'Sandals', 'Heels'
];

const GENDERS = ['Male', 'Female', 'Unisex'];

// TagsInput Component
const TagsInput = ({ label, tags, onTagsChange, placeholder, colorClass }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove) => {
    onTagsChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="border border-gray-300 rounded-xl p-3 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass} transition-all hover:shadow-sm`}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-2 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full border-0 outline-none text-sm placeholder-gray-400"
        />
      </div>
      
      {tags.length === 0 && (
        <p className="text-xs text-gray-500">
          {label} из классификации появятся здесь автоматически
        </p>
      )}
    </div>
  );
};

const AddClothingModal = ({ isOpen, onClose, onClothingAdded }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Classification, 3: Form
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationData, setClassificationData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const { t } = useLanguage();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    color: '',
    brand: '',
    size: '',
    condition: 'excellent',
    notes: '',
    tags: [],
    weather_suitability: [],
    occasions: []
  });

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  const resetModal = () => {
    setStep(1);
    setSelectedFile(null);
    setPreview('');
    setIsDragging(false);
    setIsUploading(false);
    setIsClassifying(false);
    setClassificationData(null);
    setIsSubmitting(false);
    setFormData({
      name: '',
      category: '',
      color: '',
      brand: '',
      size: '',
      condition: 'excellent',
      notes: '',
      tags: [],
      weather_suitability: [],
      occasions: []
    });
  };

  const validateFile = (file) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error(t('fileTooLarge'));
      return false;
    }
    
    if (!file) {
      toast.error(t('pleaseSelectImage'));
      return false;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t('unsupportedFormat'));
      return false;
    }
    
    return true;
  };

  const handleFileSelect = useCallback((file) => {
    if (!validateFile(file)) return;
    
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      toast.success(t('photoReady'));
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const classifyImage = async () => {
    if (!selectedFile) return;

    setIsClassifying(true);
    setStep(2);

    try {
      const result = await clothingAPI.classifyImage(selectedFile);
      setClassificationData(result);
      
      // Pre-fill form with classification data
      setFormData(prev => ({
        ...prev,
        name: result.predicted_name || '',
        category: result.predicted_category || '',
        color: result.predicted_color || '',
        brand: result.predicted_brand || '',
        tags: result.predicted_tags || [],
        weather_suitability: result.weather_suitability || [],
        occasions: result.occasions || []
      }));
      
      setStep(3);
    } catch (error) {
      console.error('Classification error:', error);
      
      if (error.code === 'NETWORK_ERROR') {
        toast.error(t('serverConnectionError'));
      } else if (error.response?.status === 413) {
        toast.error(t('fileTooBigForServer'));
      } else if (error.response?.status === 415) {
        toast.error(t('unsupportedFileFormat'));
      } else if (error.message?.includes('CORS')) {
        toast.error(t('corsError'));
      } else {
        toast.error(t('imageUploadError'));
      }
      
      setStep(1);
    } finally {
      setIsClassifying(false);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return null;

    setIsUploading(true);
    try {
      const result = await clothingAPI.uploadImage(selectedFile);
      return result.image_url;
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.code === 'NETWORK_ERROR') {
        toast.error(t('serverConnectionError'));
      } else if (error.response?.status === 413) {
        toast.error(t('fileTooBigForServer'));
      } else if (error.response?.status === 415) {
        toast.error(t('unsupportedFileFormat'));
      } else if (error.message?.includes('CORS')) {
        toast.error(t('corsError'));
      } else {
        toast.error(t('imageUploadError'));
      }
      
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const getClassificationResult = async (taskId) => {
    if (!taskId) return null;

    const maxAttempts = 10;
    const delay = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await clothingAPI.getClassificationResult(taskId);
        
        if (result.status === 'completed') {
          return result.result;
        } else if (result.status === 'failed') {
          throw new Error('Classification failed');
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }
    
    throw new Error('Classification timeout');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !formData.name.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image first
      const imageUrl = await uploadImage();
      
      // Prepare clothing data
      const clothingData = {
        ...formData,
        image_url: imageUrl,
        classification_data: classificationData
      };

      // Add clothing item
      await clothingAPI.addClothingItem(clothingData);
      
      toast.success(t('clothingAddedSuccess'));
      onClothingAdded();
      onClose();
    } catch (error) {
      console.error('Error adding clothing:', error);
      toast.error(t('addClothingError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 1 && 'Загрузить изображение'}
            {step === 2 && 'Классификация...'}
            {step === 3 && 'Редактировать данные'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <motion.div 
            className="p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-150 relative ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              animate={{ 
                scale: isDragging ? 1.02 : 1,
                borderColor: isDragging ? '#3B82F6' : '#D1D5DB'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.div 
                    key="preview"
                    className="space-y-4"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-w-full max-h-64 mx-auto rounded-xl shadow-lg"
                      />
                      <motion.div 
                        className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </motion.div>
                      {selectedFile && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center space-x-4 flex-wrap gap-2">
                      <motion.button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Выбрать другое фото
                      </motion.button>
                      <motion.button
                        onClick={classifyImage}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ✨ Классифицировать
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="upload"
                    className="space-y-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {isDragging ? (
                      <motion.div 
                        key="dragging"
                        className="space-y-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div 
                          className="w-20 h-20 bg-blue-200 rounded-full mx-auto flex items-center justify-center"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          <UploadIcon className="h-10 w-10 text-blue-600" />
                        </motion.div>
                        <div>
                          <p className="text-xl font-semibold text-blue-700">
                            Отпустите файл для загрузки
                          </p>
                          <p className="text-blue-600">
                            Мы обработаем ваше фото автоматически
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="not-dragging"
                        className="space-y-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div 
                          className="relative"
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <UploadIcon className="h-16 w-16 text-gray-400 mx-auto" />
                          <motion.div 
                            className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <span className="text-white text-xs font-bold">+</span>
                          </motion.div>
                        </motion.div>
                        <div>
                          <p className="text-xl font-semibold text-gray-900">
                            Перетащите фото или нажмите для выбора
                          </p>
                          <p className="text-gray-600 mt-2">
                            Поддерживаются JPG, PNG, WebP до 5MB
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            📱 Просто перетащите файл сюда!
                          </p>
                        </div>
                        <motion.button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          📂 Выбрать файл
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {/* Drag overlay */}
              <AnimatePresence>
                {isDragging && !preview && (
                  <motion.div 
                    className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-2xl border-2 border-blue-500 border-dashed flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center">
                      <motion.div
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <UploadIcon className="h-12 w-12 text-blue-600 mx-auto" />
                      </motion.div>
                      <p className="text-blue-700 font-semibold mt-2">Отпустите для загрузки</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            
            {/* Upload Tips */}
            <motion.div 
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <p className="text-xs text-gray-500">
                💡 Совет: Для лучшего результата используйте четкие фото на однотонном фоне. Файл не более 5MB.
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Classification */}
        {step === 2 && (
          <div className="p-6 text-center">
            <div className="space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              >
                <LoaderIcon className="h-12 w-12 text-blue-600 mx-auto" />
              </motion.div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Анализируем ваше изображение...
                </p>
                <p className="text-gray-600">
                  Это может занять несколько секунд
                </p>
              </div>
              {preview && (
                <img
                  src={preview}
                  alt="Analyzing"
                  className="max-w-48 max-h-48 mx-auto rounded-lg"
                />
              )}
            </div>
          </div>
        )}

        {/* Step 3: Edit Form */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Image */}
                <div className="md:col-span-1">
                  {(formData.image_url || preview) && (
                    <div className="space-y-4">
                      <img
                        src={formData.image_url || preview}
                        alt="Item"
                        className="w-full rounded-xl border border-gray-200 shadow-sm"
                      />
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <span className="text-sm text-blue-800">
                          {classificationData ? (
                            <>AI определило категорию: <strong>{formData.category || '...'}</strong></>
                          ) : (
                            <>Изображение загружено. Заполните данные вручную.</>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Form */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Например: Вельветовый блейзер"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Цвет
                      </label>
                      <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Оливково-зеленый"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Материал
                      </label>
                      <input
                        type="text"
                        name="material"
                        value={formData.material}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Вельвет"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание
                    </label>
                    <textarea
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Опишите особенности одежды..."
                    />
                  </div>

                  <TagsInput
                    label="Теги"
                    tags={formData.tags}
                    onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                    placeholder="Добавьте теги..."
                    colorClass="bg-blue-100 text-blue-800"
                  />

                  <TagsInput
                    label="Подходящие случаи"
                    tags={formData.occasions}
                    onTagsChange={(occasions) => setFormData(prev => ({ ...prev, occasions }))}
                    placeholder="Работа, вечеринка, прогулка..."
                    colorClass="bg-green-100 text-green-800"
                  />

                  <TagsInput
                    label="Подходящая погода"
                    tags={formData.weather_suitability}
                    onTagsChange={(weather_suitability) => setFormData(prev => ({ ...prev, weather_suitability }))}
                    placeholder="Лето, зима, дождь..."
                    colorClass="bg-purple-100 text-purple-800"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 p-6 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddClothingModal; 