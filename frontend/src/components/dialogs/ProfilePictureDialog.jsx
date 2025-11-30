import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';

const ProfilePictureDialog = ({ open, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('profile_picture', selectedFile);

      const response = await axios.post(
        `${API_URL}/api/driver/profile-picture`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        toast.success('Profile picture updated successfully!');
        onSuccess && onSuccess();
        handleClose();
      }
    } catch (error) {
      console.error('Error uploading picture:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload profile picture';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>
      
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Update Profile Picture</h2>
              <button onClick={handleClose} className="text-white hover:text-gray-200">
                <X size={28} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Preview */}
            <div className="flex justify-center">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-40 h-40 rounded-full object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                  <User size={64} />
                </div>
              )}
            </div>

            {/* File Input */}
            <div>
              <label className="block w-full">
                <div className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-gray-700 font-semibold">
                    {selectedFile ? selectedFile.name : 'Click to select photo'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={uploading}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
              >
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePictureDialog;

