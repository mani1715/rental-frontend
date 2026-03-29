import axios from 'axios';
import BASE_URL from '../config/api.js';

const API_URL = `${BASE_URL}/api/reviews`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const reviewService = {
  // Get all reviews for a property
  getReviews: async (propertyId) => {
    try {
      const response = await axios.get(`${API_URL}/${propertyId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch reviews:', error.response?.data || error.message);
      throw error;
    }
  },

  // Create a new review
  createReview: async (propertyId, reviewData) => {
    try {
      const response = await axios.post(
        `${API_URL}/${propertyId}`,
        reviewData,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create review:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update a review
  updateReview: async (reviewId, reviewData) => {
    try {
      const response = await axios.put(
        `${API_URL}/${reviewId}`,
        reviewData,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update review:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/${reviewId}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to delete review:', error.response?.data || error.message);
      throw error;
    }
  }
};
