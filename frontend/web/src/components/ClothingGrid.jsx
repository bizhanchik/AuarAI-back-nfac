import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EditIcon, 
  ExternalLinkIcon, 
  TagIcon, 
  CloudIcon, 
  HeartIcon,
  StarIcon,
  SparklesIcon,
  EyeIcon,
  ShirtIcon,
  ImageIcon,
  ZapIcon,
  TrendingUpIcon,
  CheckIcon,
  Trash2Icon,
  XIcon,
  CheckCircleIcon
} from 'lucide-react';
import { clothingAPI } from '../services/api';
import toast from 'react-hot-toast';

const ClothingItem = ({ 
  item, 
  onViewDetails, 
  onEditItem, 
  index, 
  isSelected, 
  onToggleSelect, 
  selectionMode 
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (selectionMode) {
      onToggleSelect(item.id);
    } else {
      onEditItem(item);
    }
  };

  const handleCardClick = () => {
    if (selectionMode) {
      onToggleSelect(item.id);
    } else {
      onViewDetails(item);
    }
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    onToggleSelect(item.id);
  };

  const Tag = ({ text, colorClass, icon: Icon }) => (
    <span 
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}
    >
      {Icon && <Icon className="h-2.5 w-2.5 mr-1 -ml-0.5" />}
      <span className="truncate">{text}</span>
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -2, 
        scale: 1.01,
        transition: { duration: 0.15, ease: "easeOut" } 
      }}
      whileTap={{ scale: 0.98 }}
      className={`group cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-75' : ''}`}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Selection Checkbox */}
        {(selectionMode || isSelected) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-3 left-3 z-10"
          >
            <button
              onClick={handleCheckboxClick}
              className={`w-6 h-6 rounded-full border-2 transition-all duration-150 ${
                isSelected 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'bg-white/90 border-gray-300 hover:border-blue-400'
              } backdrop-blur-sm shadow-lg hover:scale-110 flex items-center justify-center`}
            >
              {isSelected && <CheckIcon className="h-3 w-3" />}
            </button>
          </motion.div>
        )}

        {/* Premium Card Container */}
        <div className={`card-premium p-3 sm:p-4 md:p-6 overflow-hidden transition-all duration-150 flex flex-col h-[420px] sm:h-[480px] md:h-[520px] ${
          isSelected 
            ? 'shadow-xl border-2 border-blue-500/30 bg-blue-50/50' 
            : 'group-hover:shadow-xl'
        }`}>
          {/* Image Section */}
          <div className="relative h-[200px] sm:h-[240px] md:h-[280px] mb-3 sm:mb-4 md:mb-6 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0">
            {!imageError ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
                onError={handleImageError}
                onClick={handleImageClick}
              />
            ) : (
              <div 
                className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-400 transition-transform duration-150 hover:scale-105"
                onClick={handleImageClick}
              >
                <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mb-2 sm:mb-3" />
                <p className="text-xs sm:text-sm font-medium text-center px-2">Image not available</p>
              </div>
            )}
            
            {/* Floating Action Buttons - hide in selection mode */}
            {!selectionMode && (
              <div className={`absolute top-2 right-2 flex space-x-1 transition-opacity duration-150 ${isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0'} opacity-100 sm:opacity-0 group-hover:opacity-100`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(item);
                  }}
                  className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
                >
                  <EyeIcon className="h-3 w-3 text-blue-600" />
                </button>
                
                <button
                  onClick={handleImageClick}
                  className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
                >
                  <EditIcon className="h-3 w-3 text-purple-600" />
                </button>
              </div>
            )}

            {/* Category Badge */}
            {item.category && (
              <div className="absolute top-2 left-2">
                <div className="px-2 py-1 bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/20">
                  {item.category}
                </div>
              </div>
            )}

            {/* Selection overlay */}
            {isSelected && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-blue-500/20 backdrop-blur-[1px]"
              />
            )}
          </div>

          {/* Content Section */}
          <div className="flex flex-col flex-1 justify-between min-h-0">
            <div className="space-y-2">
              {/* Title and Brand */}
              <div>
                <h3 className={`text-sm sm:text-base md:text-lg font-black mb-1 transition-colors duration-150 line-clamp-2 leading-tight ${
                  isSelected 
                    ? 'text-blue-700' 
                    : 'text-slate-900 group-hover:text-purple-600'
                }`}>
                  {item.name}
                </h3>
                {item.brand && (
                  <p className="text-xs font-medium text-slate-500 flex items-center">
                    <SparklesIcon className="h-2.5 w-2.5 mr-1 text-purple-400 flex-shrink-0" />
                    <span className="truncate">{item.brand}</span>
                  </p>
                )}
              </div>

              {/* Tags Section */}
              <div className="flex flex-wrap gap-1">
                {(item.tags || []).slice(0, 2).map((tag) => (
                  <Tag 
                    key={tag}
                    text={tag} 
                    colorClass="bg-blue-100/80 text-blue-700 border border-blue-200/50" 
                    icon={TagIcon}
                  />
                ))}
                
                {(item.weather_suitability || []).slice(0, 1).map((weather) => (
                  <Tag 
                    key={weather}
                    text={weather} 
                    colorClass="bg-purple-100/80 text-purple-700 border border-purple-200/50" 
                    icon={CloudIcon}
                  />
                ))}
                
                {(item.tags?.length || 0) > 2 && (
                  <Tag 
                    text={`+${(item.tags.length || 0) - 2}`} 
                    colorClass="bg-slate-100/80 text-slate-600 border border-slate-200/50" 
                    icon={ZapIcon}
                  />
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <HeartIcon className="h-2.5 w-2.5 text-red-400" />
                  <span className="hidden sm:inline">Любимое</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <TrendingUpIcon className="h-2.5 w-2.5 text-green-400" />
                  <span className="hidden sm:inline">Популярно</span>
                </div>
              </div>
              
              <div className={`p-1 rounded-full transition-transform duration-150 ease-out hover:scale-105 ${
                isSelected 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}>
                <StarIcon className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BulkActionToolbar = ({ 
  selectedCount, 
  onSelectAll, 
  onDeselectAll, 
  onBulkDelete, 
  onCancel,
  totalItems 
}) => (
  <motion.div 
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <CheckCircleIcon className="h-6 w-6 text-blue-200" />
          <span className="font-semibold text-lg">
            {selectedCount} items selected
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onSelectAll}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
          >
            Select All ({totalItems})
          </button>
          
          <button
            onClick={onDeselectAll}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
          >
            Deselect All
          </button>
          
          <button
            onClick={onBulkDelete}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
          >
            <Trash2Icon className="h-4 w-4" />
            <span>Delete Selected</span>
          </button>
          
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

const EmptyState = ({ onAddClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="col-span-full flex flex-col items-center justify-center py-12 sm:py-20"
  >
    <div className="card-glass p-8 sm:p-12 text-center max-w-lg mx-auto">
      <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl mb-6 sm:mb-8">
        <ShirtIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
      </div>
      
      <h3 className="text-2xl sm:text-3xl font-black text-white mb-8 font-display">
        Create Your Stylish Wardrobe
      </h3>
      
      <button
        onClick={onAddClick}
        className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto inline-flex items-center justify-center"
      >
        <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
        Add Your First Item
      </button>
    </div>
  </motion.div>
);

const ClothingGrid = ({ items, onViewDetails, onEditItem, onAddClick, onItemsDeleted }) => {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!items || items.length === 0) {
    return <EmptyState onAddClick={onAddClick} />;
  }

  // Filter out any undefined or invalid items
  const validItems = items.filter(item => item && item.id);

  if (validItems.length === 0) {
    return <EmptyState onAddClick={onAddClick} />;
  }

  const handleToggleSelect = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    
    // Auto-enter selection mode when first item is selected
    if (newSelected.size > 0 && !selectionMode) {
      setSelectionMode(true);
    }
    
    // Auto-exit selection mode when no items are selected
    if (newSelected.size === 0) {
      setSelectionMode(false);
    }
  };

  const handleSelectAll = () => {
    const allIds = new Set(validItems.map(item => item.id));
    setSelectedItems(allIds);
    setSelectionMode(true);
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const handleCancelSelection = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    const selectedIds = Array.from(selectedItems);
    
    // Show confirmation
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} items? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await clothingAPI.bulkDeleteItems(selectedIds);
      const result = response.data || response;
      
      toast.success(result.message);
      
      // Notify parent component about deleted items
      if (onItemsDeleted) {
        onItemsDeleted(selectedIds);
      }
      
      // Reset selection state
      setSelectedItems(new Set());
      setSelectionMode(false);
      
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete items');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Bulk Action Toolbar */}
      <AnimatePresence>
        {selectionMode && selectedItems.size > 0 && (
          <BulkActionToolbar
            selectedCount={selectedItems.size}
            totalItems={validItems.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onBulkDelete={handleBulkDelete}
            onCancel={handleCancelSelection}
          />
        )}
      </AnimatePresence>

      {/* Grid Container */}
      <div className={`transition-all duration-300 ${selectionMode ? 'pt-20' : ''}`}>
        {/* Selection Mode Toggle */}
        {!selectionMode && validItems.length > 1 && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setSelectionMode(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg text-sm font-medium"
            >
              Select Items
            </button>
          </div>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {validItems.map((item, index) => (
            <ClothingItem 
              key={item.id} 
              item={item} 
              index={index}
              onViewDetails={onViewDetails}
              onEditItem={onEditItem}
              isSelected={selectedItems.has(item.id)}
              onToggleSelect={handleToggleSelect}
              selectionMode={selectionMode}
            />
          ))}
        </div>

        {/* Loading overlay during bulk delete */}
        {isDeleting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-gray-900">Deleting items...</p>
                <p className="text-sm text-gray-500 mt-2">Please wait while we delete your selected items</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default ClothingGrid; 