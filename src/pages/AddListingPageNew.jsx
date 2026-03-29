import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, DollarSign, Home, Image as ImageIcon, Sparkles, Navigation, Search, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import BASE_URL from '../config/api.js';

const API_URL = BASE_URL;

const AddListingPageNew = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'room',
    price: '',
    squareFeet: '',
    facilities: [],
    addressText: '',
    latitude: null,
    longitude: null,
    description: '',
    bedrooms: '1',
    bathrooms: '1',
    images: []
  });

  const propertyTypes = ['room', 'house', 'lodge', 'pg', 'hostel', 'apartment', 'villa', 'cottage', 'farmhouse', 'studio'];
  const availableFacilities = [
    'WiFi', 'Parking', 'Kitchen', 'AC', 'Heating', 'Furnished',
    'Pet-Friendly', 'Garden', 'Balcony', 'Fireplace', 'Pool', 'Gym',
    'Laundry', 'Security', 'Elevator', 'TV', 'Washing Machine', 'Refrigerator',
    'Microwave', 'Water Supply', 'Power Backup', 'CCTV'
  ];

  // Initialize map when modal opens
  useEffect(() => {
    if (showMapModal && mapRef.current && !mapInstanceRef.current) {
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initializeMap();
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    }
  }, [showMapModal]);

  const initializeMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultLat = selectedLocation?.lat || 20.5937;
    const defaultLng = selectedLocation?.lng || 78.9629;

    const map = window.L.map(mapRef.current).setView([defaultLat, defaultLng], 5);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Add click handler
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      await handleMapClick(lat, lng, map);
    });

    mapInstanceRef.current = map;

    // Add existing marker if location is selected
    if (selectedLocation) {
      addMarker(selectedLocation.lat, selectedLocation.lng, map);
    }
  };

  const addMarker = (lat, lng, map) => {
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }
    markerRef.current = window.L.marker([lat, lng]).addTo(map);
    map.setView([lat, lng], 15);
  };

  const handleMapClick = async (lat, lng, map) => {
    addMarker(lat, lng, map);

    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();

      setSelectedLocation({
        lat,
        lng,
        address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    } catch (error) {
      setSelectedLocation({
        lat,
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    }
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setSelectedLocation({
      lat,
      lng,
      address: result.display_name
    });

    if (mapInstanceRef.current) {
      addMarker(lat, lng, mapInstanceRef.current);
    }

    setSearchResults([]);
    setSearchQuery('');
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Reverse geocode
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();

          setSelectedLocation({
            lat,
            lng,
            address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          });

          if (mapInstanceRef.current) {
            addMarker(lat, lng, mapInstanceRef.current);
          }
        } catch (error) {
          setSelectedLocation({
            lat,
            lng,
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          });
        }
      },
      (error) => {
        alert('Unable to get your location. Please allow location access or select manually on the map.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      setFormData(prev => ({
        ...prev,
        addressText: selectedLocation.address,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng
      }));
    }
    setShowMapModal(false);
  };

  const handleCloseMapModal = () => {
    setShowMapModal(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFacilityToggle = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleImageInput = (e) => {
    const urls = e.target.value.split('\n').filter(url => url.trim());
    setFormData(prev => ({ ...prev, images: urls }));
  };

  // Helper function to get full image URL
  const getFullImageUrl = (url) => {
    if (!url) return 'https://dummyimage.com/150x150/cccccc/666666&text=No+Image';
    // If it's already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's a relative path, prepend the API URL
    if (url.startsWith('/')) {
      return `${API_URL}${url}`;
    }
    // Otherwise, assume it's a path that needs the full URL
    return `${API_URL}/${url}`;
  };

  const uploadFiles = async (files) => {
    if (files.length === 0) return;
    setUploadingImages(true);

    console.log("=== Starting Image Upload ===");
    console.log("Files to upload:", files.length);

    try {
      const uploadedUrls = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          console.log("Skipping non-image file:", file.name);
          continue;
        }

        console.log("Uploading file:", file.name, "Size:", file.size);

        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        console.log("Token present:", !!token);

        const response = await axios.post(`${API_URL}/api/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });

        console.log("Upload response:", response.data);

        if (response.data.success) {
          const imageUrl = response.data.url || response.data.image || response.data.imageUrl;
          console.log("Image URL received:", imageUrl);
          
          // Get the full URL
          const fullUrl = getFullImageUrl(imageUrl);
          console.log("Full Image URL:", fullUrl);
          
          uploadedUrls.push(fullUrl);
        } else {
          console.error("Upload failed:", response.data.message);
        }
      }

      console.log("All uploaded URLs:", uploadedUrls);

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls]
        }));
        console.log("Images added to form data");
      }
    } catch (error) {
      console.error('=== Upload Error ===');
      console.error('Error details:', error.response?.data || error.message);
      alert('Failed to upload some images. Please try again.');
    } finally {
      setUploadingImages(false);
      console.log("=== Upload Complete ===");
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files));
    }
  }, [token]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleGenerateDescription = async () => {
    if (aiLoading) return;

    // Check if required fields are filled
    if (!formData.title || !formData.type || !formData.addressText || !formData.price) {
      alert('Please fill in Title, Type, Location, and Price before generating description.');
      return;
    }

    // Validate token before sending request
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login again to use AI description generation.');
      return;
    }

    console.log("=== AI Description Generation ===");
    console.log("API URL:", `${API_URL}/api/ai/generate-description`);
    console.log("Token present:", !!token);

    setAiLoading(true);
    
    try {
      const requestData = {
        title: formData.title,
        type: formData.type,
        location: formData.addressText,
        price: formData.price,
        facilities: formData.facilities.join(', ') || 'Basic amenities'
      };
      
      console.log("Request data:", JSON.stringify(requestData, null, 2));
      
      const response = await axios.post(
        `${API_URL}/api/ai/generate-description`,
        requestData,
        { 
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log("AI Response Status:", response.status);
      console.log("AI Response Data:", JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          description: response.data.description
        }));
        console.log("Description generated successfully!");
      } else {
        const errorMsg = response.data.message || 'Failed to generate description';
        console.error("AI returned error:", errorMsg);
        alert(errorMsg);
      }
    } catch (err) {
      console.error("=== AI Error ===");
      console.error("Error Status:", err.response?.status);
      console.error("Error Data:", err.response?.data);
      console.error("Error Message:", err.message);
      
      // Handle specific error codes with user-friendly messages
      let userMessage = '';
      const statusCode = err.response?.status;
      
      if (statusCode === 503) {
        userMessage = 'AI service is temporarily unavailable. Please try again in a few moments.';
      } else if (statusCode === 502) {
        userMessage = 'AI service is currently down. Please try again later.';
      } else if (statusCode === 504) {
        userMessage = 'AI request timed out. Please try again.';
      } else if (statusCode === 500) {
        userMessage = 'Server error occurred. Please try again later.';
      } else if (statusCode === 401) {
        userMessage = 'Session expired. Please login again.';
      } else if (statusCode === 404) {
        userMessage = 'AI service endpoint not found. Please contact support.';
      } else if (err.code === 'ECONNABORTED') {
        userMessage = 'Request timed out. Please check your connection and try again.';
      } else if (!navigator.onLine) {
        userMessage = 'No internet connection. Please check your network.';
      } else {
        userMessage = err.response?.data?.message || 
                     err.response?.data?.detail || 
                     'AI service failed. Please try again.';
      }
      
      alert(userMessage);
    } finally {
      setAiLoading(false);
      console.log("=== AI Request Complete ===");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.title || !formData.addressText || !formData.price || !formData.squareFeet) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      let googleMapsLink = '';
      if (formData.latitude && formData.longitude) {
        googleMapsLink = `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`;
      }

      const listingData = {
        title: formData.title,
        type: formData.type,
        price: Number(formData.price),
        squareFeet: Number(formData.squareFeet),
        facilities: formData.facilities,
        addressText: formData.addressText,
        latitude: formData.latitude,
        longitude: formData.longitude,
        googleMapsLink,
        description: formData.description,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        images: formData.images,
        status: 'available'
      };

      const response = await axios.post(`${API_URL}/api/listings`, listingData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        console.log('Listing created:', response.data);
        alert('Listing created successfully!');
        navigate('/owner/dashboard');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      setError(error.response?.data?.message || error.response?.data?.detail || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8" data-testid="add-listing-title">Add New Listing</h1>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800" data-testid="listing-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8" data-testid="add-listing-form">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Home className="mr-2 h-5 w-5" />
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                    Property Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    data-testid="listing-title-input"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Beautiful 2BHK apartment in downtown"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                      Property Type *
                    </label>
                    <select
                      id="type"
                      name="type"
                      required
                      data-testid="listing-type-select"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {propertyTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                      Monthly Rent (Rs) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      required
                      data-testid="listing-price-input"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12000"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="squareFeet" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                      Size (sq ft) *
                    </label>
                    <input
                      type="number"
                      id="squareFeet"
                      name="squareFeet"
                      required
                      data-testid="listing-sqft-input"
                      value={formData.squareFeet}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="800"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      id="bedrooms"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      id="bathrooms"
                      name="bathrooms"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    data-testid="listing-description-textarea"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your property..."
                  />
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={aiLoading || !formData.title || !formData.addressText || !formData.price}
                    data-testid="ai-generate-btn"
                    className="mt-2 inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-md hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {aiLoading ? 'Generating...' : 'Generate Description with AI'}
                  </button>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Property Location
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                    Address *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="addressText"
                      required
                      data-testid="listing-address-input"
                      value={formData.addressText}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter address or select from map"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMapModal(true)}
                      data-testid="open-map-btn"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Select on Map
                    </button>
                  </div>
                </div>

                {formData.latitude && formData.longitude && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Location Selected
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Facilities */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Facilities & Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableFacilities.map(facility => (
                  <label
                    key={facility}
                    className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:bg-slate-950"
                  >
                    <input
                      type="checkbox"
                      checked={formData.facilities.includes(facility)}
                      onChange={() => handleFacilityToggle(facility)}
                      className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 border-gray-300 dark:border-slate-700 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-slate-200">{facility}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ImageIcon className="mr-2 h-5 w-5" />
                Property Images
              </h2>

              <div
                className={`w-full p-8 border-2 border-dashed rounded-lg mb-4 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-slate-700 hover:border-blue-400'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <ImageIcon className="w-12 h-12 text-gray-400 dark:text-slate-500" />
                  <p className="text-gray-600 dark:text-slate-300 font-medium">Drag & drop your property photos here</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">or click to browse</p>

                  <label className="mt-4 cursor-pointer inline-flex items-center px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <span>Browse Files</span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleFileInput}
                      disabled={uploadingImages}
                    />
                  </label>
                </div>
                {uploadingImages && (
                  <p className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">Uploading images...</p>
                )}
              </div>

              {/* Preview Uploaded Images */}
              {formData.images.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Uploaded Images ({formData.images.length})</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.images.map((url, index) => {
                      const displayUrl = getFullImageUrl(url);
                      console.log(`Image ${index + 1} URL:`, displayUrl);
                      return (
                        <div key={index} className="relative group rounded-md overflow-hidden bg-gray-100 aspect-square">
                          <img
                            src={displayUrl}
                            alt={`Uploaded preview ${index + 1}`}
                            className="w-full h-full object-cover"
                            onLoad={() => console.log(`Image ${index + 1} loaded successfully`)}
                            onError={(e) => { 
                              console.error(`Image ${index + 1} failed to load:`, displayUrl);
                              e.target.src = 'https://dummyimage.com/150x150/cccccc/666666&text=Load+Error'; 
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="images" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                  Or manual Image URLs (one per line)
                </label>
                <textarea
                  id="images"
                  data-testid="listing-images-textarea"
                  value={formData.images.join('\n')}
                  onChange={handleImageInput}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-md bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image1.jpg"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex space-x-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                data-testid="create-listing-btn"
                className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Listing...' : 'Create Listing'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/owner/dashboard')}
                className="px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-50 dark:bg-slate-9500 bg-opacity-75" onClick={handleCloseMapModal}></div>

            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-900 shadow-xl rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Property Location</h3>
                <button onClick={handleCloseMapModal} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                      placeholder="Search for a location..."
                      data-testid="map-search-input"
                      className="w-full px-4 py-2 pl-10 rounded-md bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-slate-500" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchLocation}
                    disabled={searching}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    data-testid="current-location-btn"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Current Location
                  </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:bg-slate-950 border-b border-gray-100 last:border-b-0"
                      >
                        <p className="text-sm text-gray-900 dark:text-white truncate">{result.display_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Map Container */}
              <div
                ref={mapRef}
                className="w-full h-96 rounded-lg border border-gray-300 dark:border-slate-700"
                data-testid="map-container"
              ></div>

              {/* Selected Location */}
              {selectedLocation && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm font-medium text-blue-800 mb-1">Selected Location:</p>
                  <p className="text-sm text-blue-700">{selectedLocation.address}</p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseMapModal}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:bg-slate-950"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  disabled={!selectedLocation}
                  data-testid="confirm-location-btn"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddListingPageNew;
