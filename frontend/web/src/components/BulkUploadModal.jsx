import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XIcon, 
  UploadIcon, 
  CheckIcon, 
  LoaderIcon,
  ImageIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShirtIcon
} from 'lucide-react';
import { clothingAPI } from '../services/api';
import toast from 'react-hot-toast';

// Image compression utility
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
};

const BulkUploadModal = ({ isOpen, onClose, onItemsAdded, onStartRealTimeUpload }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  const resetModal = () => {
    setSelectedFiles([]);
    setIsDragging(false);
    setIsProcessing(false);
    setProcessingStep('');
  };

  const validateFiles = (files) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10;

    if (files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return false;
    }

    for (let file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Unsupported format. Use JPG, PNG, or WebP`);
        return false;
      }
      
      if (file.size > maxSize) {
        toast.error(`${file.name}: File too large. Maximum 10MB allowed`);
        return false;
      }
    }

    return true;
  };

  const handleFileSelect = useCallback(async (files) => {
    const fileArray = Array.from(files);
    
    if (!validateFiles(fileArray)) return;
    
    // Start processing immediately
    await processAndUploadImages(fileArray);
  }, []);

  const processAndUploadImages = async (fileArray) => {
    setIsProcessing(true);
    setProcessingStep('Optimizing images...');
    
    try {
      // Compress images silently
      const compressedFiles = [];
      const filePreviewData = [];
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        // Store preview data for skeletons
        filePreviewData.push({
          id: `upload-${Date.now()}-${i}`,
          name: file.name,
          preview: URL.createObjectURL(file),
          status: 'processing'
        });
        
        try {
          const compressedBlob = await compressImage(file, 1200, 1200, 0.8);
          const compressedFile = new File([compressedBlob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          compressedFiles.push(compressedFile);
          console.log(`📦 Compressed ${file.name}: ${(file.size/1024/1024).toFixed(1)}MB → ${(compressedFile.size/1024/1024).toFixed(1)}MB`);
        } catch (error) {
          console.error(`Failed to compress ${file.name}:`, error);
          compressedFiles.push(file); // Use original if compression fails
        }
      }

      // Upload and start processing
      setProcessingStep('Starting upload...');
      const response = await clothingAPI.bulkUpload(compressedFiles);
      const result = response.data || response;
      
      console.log('🚀 Starting real-time upload experience');
      
      // Immediately start real-time upload experience
      if (onStartRealTimeUpload) {
        onStartRealTimeUpload({
          batchId: result.batch_id,
          totalFiles: result.total_files,
          previewData: filePreviewData
        });
      }
      
      // Close modal and navigate to dashboard
      setIsProcessing(false);
      onClose();
      
    } catch (error) {
      console.error('Upload failed:', error);
      setIsProcessing(false);
      toast.error('Upload failed. Please try again.');
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
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
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShirtIcon className="h-6 w-6 text-blue-600" />
            Bulk Upload Images
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Processing State */}
          {isProcessing && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
                  <LoaderIcon className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Processing Your Images
                </h3>
                <p className="text-gray-600 text-lg">
                  {processingStep}
                </p>
                <p className="text-sm text-gray-500 mt-3">
                  Your items will appear in your wardrobe shortly
                </p>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!isProcessing && selectedFiles.length === 0 && (
            <motion.div 
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-150 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Drop up to 10 images here
                  </h3>
                  <p className="text-gray-500 mt-1">
                    or click to browse files
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Supports JPG, PNG, WebP • Max 10MB per file
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Choose Files
                </button>
              </div>
            </motion.div>
          )}


        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default BulkUploadModal; 