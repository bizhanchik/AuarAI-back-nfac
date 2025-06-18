import { useState, useRef } from 'react';
import { XIcon, UploadIcon, CheckIcon, LoaderIcon } from 'lucide-react';
import { clothingAPI } from '../services/api';
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
  const [step, setStep] = useState(1); // 1: upload, 2: classify, 3: edit
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [classificationResult, setClassificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    color: '',
    material: '',
    description: '',
    image_url: '',
    store_name: 'User Upload',
    store_url: '',
    product_url: '',
    price: 0.0,
    tags: [],
    occasions: [],
    weather_suitability: []
  });

  const fileInputRef = useRef(null);

  const resetModal = () => {
    setStep(1);
    setSelectedFile(null);
    setPreviewUrl(null);
    setClassificationResult(null);
    setLoading(false);
    setTaskId(null);
    setFormData({
      name: '',
      brand: '',
      category: '',
      color: '',
      material: '',
      description: '',
      image_url: '',
      store_name: 'User Upload',
      store_url: '',
      product_url: '',
      price: 0.0,
      tags: [],
      occasions: [],
      weather_suitability: []
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Файл слишком большой. Максимальный размер: 10MB');
        return;
      }
      
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleClassify = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setStep(2);

    try {
      const response = await clothingAPI.classifyImage([selectedFile]);
      const taskIds = response.data.task_ids;
      
      if (taskIds && taskIds.length > 0) {
        setTaskId(taskIds[0]);
        pollClassificationResult(taskIds[0]);
      } else if (response.data.error) {
        toast.error(response.data.error);
        setStep(1);
        setLoading(false);
      }
    } catch (error) {
      console.error('Classification error:', error);
      toast.error('Ошибка классификации изображения');
      setStep(1);
      setLoading(false);
    }
  };

  const pollClassificationResult = async (taskId) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await clothingAPI.getClassificationResult(taskId);
        const { status, result } = response.data;

        if (status === 'completed' && result) {
          setClassificationResult(result);
          
          // Pre-fill form with classification results
          setFormData(prev => ({
            ...prev,
            name: result.name || `${result.category || 'Одежда'}`,
            brand: result.brand || '',
            category: result.category || '',
            color: result.color || '',
            material: result.material || '',
            description: result.description || '',
            image_url: previewUrl,
            store_name: 'User Upload',
            store_url: '',
            product_url: previewUrl,
            price: result.price || 0.0,
            tags: result.tags || [],
            occasions: result.occasions || [],
            weather_suitability: result.weather_suitability || []
          }));
          
          setStep(3);
          setLoading(false);
        } else if (status === 'pending' || status === 'PROGRESS') {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000);
          } else {
            throw new Error('Timeout waiting for classification');
          }
        } else {
          throw new Error(`Classification failed with status: ${status}`);
        }
      } catch (error) {
        console.error('Polling error:', error);
        toast.error('Ошибка получения результата классификации');
        setStep(1);
        setLoading(false);
      }
    };

    poll();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await clothingAPI.addClothingItem(formData);
      onClothingAdded(response.data);
      handleClose();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Ошибка добавления одежды');
    } finally {
      setLoading(false);
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
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="p-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-full max-h-64 mx-auto rounded-lg"
                  />
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Выбрать другое фото
                    </button>
                    <button
                      onClick={handleClassify}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Классифицировать
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      Загрузите фото одежды
                    </p>
                    <p className="text-gray-600">
                      Поддерживаются JPG, PNG до 10MB
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Выбрать файл
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Step 2: Classification */}
        {step === 2 && (
          <div className="p-6 text-center">
            <div className="space-y-4">
              <LoaderIcon className="h-12 w-12 text-blue-600 mx-auto animate-spin" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Анализируем ваше изображение...
                </p>
                <p className="text-gray-600">
                  Это может занять несколько секунд
                </p>
              </div>
              {previewUrl && (
                <img
                  src={previewUrl}
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
                  {previewUrl && (
                    <div className="space-y-4">
                      <img
                        src={previewUrl}
                        alt="Item"
                        className="w-full rounded-xl border border-gray-200 shadow-sm"
                      />
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <span className="text-sm text-blue-800">
                          AI определило категорию: <strong>{formData.category || '...'}</strong>
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
                onClick={handleClose}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddClothingModal; 