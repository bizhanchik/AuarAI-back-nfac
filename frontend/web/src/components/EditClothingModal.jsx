import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, SaveIcon, TrashIcon, ShirtIcon, LoaderIcon } from 'lucide-react';
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
    </div>
  );
};

const EditClothingModal = ({ isOpen, onClose, item, onItemUpdated, onItemDeleted }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    gender: '',
    color: '',
    size: '',
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
  
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        brand: item.brand || '',
        category: item.category || '',
        gender: item.gender || '',
        color: item.color || '',
        size: item.size || '',
        material: item.material || '',
        description: item.description || '',
        image_url: item.image_url || '',
        store_name: item.store_name || 'User Upload',
        store_url: item.store_url || '',
        product_url: item.product_url || '',
        price: item.price || 0.0,
        tags: item.tags || [],
        occasions: item.occasions || [],
        weather_suitability: item.weather_suitability || []
      });
    }
  }, [item]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await clothingAPI.updateClothingItem(item.id, formData);
      
      const updatedItem = {
        ...item,
        ...formData,
        updated_at: new Date().toISOString()
      };
      
      onItemUpdated(updatedItem);
      toast.success(t('clothingUpdatedSuccess'));
      onClose();
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error(t('updateClothingError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setDeleteLoading(true);

    try {
      await clothingAPI.deleteClothingItem(item.id);
      
      onItemDeleted(item.id);
      toast.success(t('clothingDeletedSuccess'));
      onClose();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(t('deleteClothingError'));
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <ShirtIcon className="h-6 w-6 text-blue-600" />
            <span>{t('editItem')}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Image */}
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full flex items-center justify-center bg-gray-200" style={{ display: 'none' }}>
                      <div className="text-gray-400 text-center">
                        <ShirtIcon className="h-16 w-16 mx-auto mb-2" />
                        <p>Изображение недоступно</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('itemName')} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('brand')}
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('category')}
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Выберите категорию</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Гендер
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Выберите гендер</option>
                      {GENDERS.map(gender => (
                        <option key={gender} value={gender}>{gender}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('color')}
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('size')}
                    </label>
                    <input
                      type="text"
                      name="size"
                      value={formData.size}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Цена (₸)
                    </label>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('description')}
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Описание одежды..."
                  />
                </div>

                {/* Tags */}
                <TagsInput
                  label="Теги"
                  tags={formData.tags}
                  onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                  placeholder="Добавьте тег и нажмите Enter"
                  colorClass="bg-blue-100 text-blue-800"
                />

                {/* Occasions */}
                <TagsInput
                  label="Поводы"
                  tags={formData.occasions}
                  onTagsChange={(occasions) => setFormData(prev => ({ ...prev, occasions }))}
                  placeholder="Добавьте повод и нажмите Enter"
                  colorClass="bg-purple-100 text-purple-800"
                />

                {/* Weather Suitability */}
                <TagsInput
                  label="Погодные условия"
                  tags={formData.weather_suitability}
                  onTagsChange={(weather_suitability) => setFormData(prev => ({ ...prev, weather_suitability }))}
                  placeholder="Добавьте погодное условие и нажмите Enter"
                  colorClass="bg-green-100 text-green-800"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="flex items-center px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteLoading ? (
                <>
                  <LoaderIcon className="h-5 w-5 animate-spin mr-2" />
                  {t('deleting')}...
                </>
              ) : (
                <>
                  <TrashIcon className="h-5 w-5 mr-2" />
                  {t('delete')}
                </>
              )}
            </button>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoaderIcon className="h-5 w-5 animate-spin mr-2" />
                    {t('saving')}...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-5 w-5 mr-2" />
                    {t('save')}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditClothingModal; 