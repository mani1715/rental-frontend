import axios from 'axios';
import BASE_URL from '../config/api.js';

const API_URL = `${BASE_URL}/api/wishlist`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const wishlistAPI = {
  // Get user's wishlist
  getWishlist: async () => {
    try {
      const response = await axios.get(API_URL, { headers: getAuthHeader() });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch wishlist:', error.response?.data || error.message);
      throw error;
    }
  },

  // Add to wishlist
  addToWishlist: async (listingId) => {
    try {
      const response = await axios.post(
        API_URL,
        { listingId: listingId },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to add to wishlist:', error.response?.data || error.message);
      throw error;
    }
  },

  // Remove from wishlist
  removeFromWishlist: async (listingId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/${listingId}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to remove from wishlist:', error.response?.data || error.message);
      throw error;
    }
  },

  // Check if property is in wishlist (client-side helper)
  isInWishlist: (wishlist, propertyId) => {
    if (!wishlist || !Array.isArray(wishlist)) {
      return false;
    }
    return wishlist.some(item => item.listingId === propertyId || item.listing?._id === propertyId);
  }
};
