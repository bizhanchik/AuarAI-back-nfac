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

const BulkUploadModal = ({ isOpen, onClose, onItemsAdded }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [batchId, setBatchId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [statusPollingInterval, setStatusPollingInterval] = useState(null);
  const [pollingStartTime, setPollingStartTime] = useState(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [showForceClose, setShowForceClose] = useState(false);
  const [lastStatusHash, setLastStatusHash] = useState(null);
  const [unchangedStatusCount, setUnchangedStatusCount] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  useEffect(() => {
    // Cleanup polling interval on unmount or when modal closes
    return () => {
      if (statusPollingInterval) {
        console.log('🧹 Cleaning up polling interval on unmount');
        clearInterval(statusPollingInterval);
        setStatusPollingInterval(null);
      }
    };
  }, [statusPollingInterval]);

  // Additional cleanup when modal closes
  useEffect(() => {
    if (!isOpen && statusPollingInterval) {
      console.log('🧹 Cleaning up polling interval on modal close');
      clearInterval(statusPollingInterval);
      setStatusPollingInterval(null);
    }
  }, [isOpen, statusPollingInterval]);

  const resetModal = () => {
    setSelectedFiles([]);
    setIsDragging(false);
    setIsUploading(false);
    setBatchId(null);
    setUploadStatus(null);
    setPollingStartTime(null);
    setPollingCount(0);
    setShowForceClose(false);
    setLastStatusHash(null);
    setUnchangedStatusCount(0);
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval);
      setStatusPollingInterval(null);
    }
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

  const handleFileSelect = useCallback((files) => {
    const fileArray = Array.from(files);
    
    if (!validateFiles(fileArray)) return;
    
    // Create preview objects
    const fileObjects = fileArray.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1), // MB
      preview: URL.createObjectURL(file),
      status: 'ready'
    }));

    setSelectedFiles(fileObjects);
    toast.success(`${fileArray.length} images ready for upload`);
  }, []);

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

  const pollUploadStatus = async (batchId) => {
    try {
      const currentTime = Date.now();
      const timeSinceStart = pollingStartTime ? (currentTime - pollingStartTime) / 1000 : 0;
      setPollingCount(prev => prev + 1);
      
      console.log(`🔄 Polling status for batch: ${batchId} (attempt ${pollingCount + 1}, ${timeSinceStart.toFixed(1)}s elapsed)`);
      
      const response = await clothingAPI.getBulkUploadStatus(batchId);
      const status = response.data || response;
      
      console.log('📊 Status response:', status);
      setUploadStatus(status);
      
      // Check if status has changed
      const currentStatusHash = JSON.stringify({
        processed: status.processed,
        success: status.success,
        failed: status.failed,
        status: status.status
      });
      
      if (currentStatusHash === lastStatusHash) {
        setUnchangedStatusCount(prev => prev + 1);
      } else {
        setUnchangedStatusCount(0);
        setLastStatusHash(currentStatusHash);
      }
      
      // Show force close button after 30 seconds, 15 polling attempts, or 8 unchanged status checks
      if (timeSinceStart > 30 || pollingCount > 15 || unchangedStatusCount > 8) {
        setShowForceClose(true);
      }
      
      // Multiple completion detection strategies
      const isCompleted = status.status === 'completed';
      const isFailed = status.status === 'failed';
      const allItemsProcessed = status.processed >= status.total && status.total > 0;
      const mostItemsProcessed = status.processed >= (status.total - 1) && status.total > 0; // Allow for 1 missing
      const hasSuccessfulResults = status.results && status.results.length > 0 && status.success > 0;
      const statusStuck = unchangedStatusCount > 10 && status.success > 0; // Status hasn't changed for too long but we have successes
      
      // Consider processing complete if any of these conditions are met
      const shouldComplete = isCompleted || isFailed || allItemsProcessed || 
                           (mostItemsProcessed && hasSuccessfulResults) || statusStuck;
      
      if (shouldComplete) {
        console.log('✅ Processing completed, stopping polling');
        console.log('✅ Completion reasons:', { isCompleted, isFailed, allItemsProcessed, mostItemsProcessed, hasSuccessfulResults, statusStuck, unchangedStatusCount });
        
        // Clear interval immediately
        if (statusPollingInterval) {
          clearInterval(statusPollingInterval);
          setStatusPollingInterval(null);
        }
        
        setIsUploading(false);
        
        if (isCompleted || (status.success > 0 && !isFailed)) {
          console.log(`🎉 Successfully processed ${status.success} out of ${status.total} images`);
          toast.success(`Successfully processed ${status.success} out of ${status.total} images`);
          
          if (status.failed > 0) {
            toast.error(`${status.failed} images failed to process`);
          }
          
          // Always trigger refresh - either with items or force refresh
          if (onItemsAdded) {
            if (status.results && status.results.length > 0) {
              console.log('📋 Processing results:', status.results);
              
              const newItems = status.results
                .filter(result => result.status === 'success' && result.clothing_item_id)
                .map(result => ({
                  id: result.clothing_item_id,
                  name: result.filename || 'Unknown Item',
                  image_url: result.image_url
                }));
              
              console.log('👕 New items to add:', newItems);
              
              if (newItems.length > 0) {
                onItemsAdded(newItems);
              } else {
                // Force refresh if no items in results but we know processing happened
                onItemsAdded([]);
              }
            } else {
              // Force refresh if no results but we detected completion
              console.log('🔄 Force refreshing due to completion without results');
              onItemsAdded([]);
            }
          }
          
          // Auto-close after showing results for a moment
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          console.error('❌ Batch processing failed:', status.error);
          toast.error(`Batch processing failed: ${status.error || 'Unknown error'}`);
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      } else {
        console.log(`⏳ Still processing: ${status.processed}/${status.total} (${status.success} success, ${status.failed} failed)`);
      }
    } catch (error) {
      console.error('❌ Error polling status:', error);
      toast.error('Failed to get upload status');
      
      // Stop polling on error to prevent getting stuck
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
        setStatusPollingInterval(null);
      }
      setIsUploading(false);
      
      // Force refresh and close on error after some processing time
      if (onItemsAdded) {
        onItemsAdded([]);
      }
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const startUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files first');
      return;
    }

    setIsUploading(true);

    try {
      const files = selectedFiles.map(f => f.file);
      const response = await clothingAPI.bulkUpload(files);
      const result = response.data || response;
      
      setBatchId(result.batch_id);
      setUploadStatus({
        status: 'processing',
        total: result.total_files,
        processed: 0,
        success: 0,
        failed: 0,
        results: [],
        errors: []
      });
      
      toast.success(`Started processing ${result.total_files} images`);
      
      // Set polling start time
      setPollingStartTime(Date.now());
      setPollingCount(0);
      setShowForceClose(false);
      setLastStatusHash(null);
      setUnchangedStatusCount(0);
      
      // Start polling for status updates
      const interval = setInterval(() => {
        pollUploadStatus(result.batch_id);
      }, 2000); // Poll every 2 seconds
      
      setStatusPollingInterval(interval);
      
      // Initial status check
      setTimeout(() => pollUploadStatus(result.batch_id), 1000);
      
      // Safety timeout to prevent infinite polling (2 minutes max)
      setTimeout(() => {
        if (statusPollingInterval) {
          console.log('⚠️ Safety timeout reached, stopping polling and forcing completion');
          clearInterval(statusPollingInterval);
          setStatusPollingInterval(null);
          setIsUploading(false);
          
          // Force refresh and close
          if (onItemsAdded) {
            onItemsAdded([]);
          }
          toast.success('Processing timeout reached. Check your wardrobe for uploaded items.');
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      }, 120000); // 2 minutes
      
    } catch (error) {
      console.error('Bulk upload error:', error);
      setIsUploading(false);
      
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Invalid request');
      } else if (error.response?.status === 413) {
        toast.error('Files too large');
      } else {
        toast.error('Upload failed. Please try again.');
      }
    }
  };

  const getProgressPercentage = () => {
    if (!uploadStatus || uploadStatus.total === 0) return 0;
    return Math.round((uploadStatus.processed / uploadStatus.total) * 100);
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
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Upload Area */}
          {!isUploading && selectedFiles.length === 0 && (
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

          {/* Selected Files */}
          {selectedFiles.length > 0 && !isUploading && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Selected Images ({selectedFiles.length}/10)</h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 text-sm hover:text-blue-700"
                >
                  Add More
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedFiles.map((fileObj) => (
                  <motion.div 
                    key={fileObj.id}
                    className="relative bg-gray-50 rounded-lg overflow-hidden"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <img
                      src={fileObj.preview}
                      alt={fileObj.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {fileObj.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {fileObj.size} MB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={startUpload}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <UploadIcon className="h-5 w-5" />
                  Upload & Process All Images
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && uploadStatus && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <LoaderIcon className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Processing Images...
                </h3>
                <p className="text-gray-500">
                  {uploadStatus.processed} of {uploadStatus.total} images processed
                </p>
                
                {/* Show close button if all items seem processed OR force close needed */}
                {((uploadStatus.processed >= uploadStatus.total && uploadStatus.total > 0) || showForceClose) && (
                  <div className="mt-4">
                    {uploadStatus.processed >= uploadStatus.total ? (
                      <p className="text-sm text-green-600 mb-2">
                        ✅ All images appear to be processed!
                      </p>
                    ) : showForceClose ? (
                      <div className="text-center mb-2">
                        <p className="text-sm text-orange-600 mb-1">
                          ⚠️ Processing is taking longer than expected
                        </p>
                        <p className="text-xs text-gray-500">
                          Items may have been processed but the status is not updating
                        </p>
                      </div>
                    ) : null}
                    <button
                      onClick={() => {
                        if (statusPollingInterval) {
                          clearInterval(statusPollingInterval);
                          setStatusPollingInterval(null);
                        }
                        setIsUploading(false);
                        
                        // Trigger refresh and close
                        if (onItemsAdded) {
                          // Force a refresh by passing empty array (will trigger fetchData)
                          onItemsAdded([]);
                        }
                        onClose();
                        toast.success('Processing complete! Check your wardrobe.');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {uploadStatus.processed >= uploadStatus.total ? 
                        'Close & Refresh Wardrobe' : 
                        'Force Close & Check Wardrobe'
                      }
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              
              <div className="text-center text-sm text-gray-600">
                {getProgressPercentage()}% Complete
              </div>

              {/* Results Summary */}
              {uploadStatus.processed > 0 && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-green-50 rounded-lg p-3">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <div className="text-lg font-semibold text-green-900">{uploadStatus.success}</div>
                    <div className="text-sm text-green-700">Success</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <XCircleIcon className="h-6 w-6 text-red-600 mx-auto mb-1" />
                    <div className="text-lg font-semibold text-red-900">{uploadStatus.failed}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <ClockIcon className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-lg font-semibold text-blue-900">
                      {uploadStatus.total - uploadStatus.processed}
                    </div>
                    <div className="text-sm text-blue-700">Pending</div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {uploadStatus.errors && uploadStatus.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-red-900 mb-2">Errors:</h4>
                  <div className="space-y-1">
                    {uploadStatus.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-700">
                        <span className="font-medium">{error.filename}:</span> {error.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
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