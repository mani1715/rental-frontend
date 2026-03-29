import axios from 'axios';
import BASE_URL from '../config/api.js';

const API_URL = `${BASE_URL}/api/bookings`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  console.log("Token being sent:", token);
  if (!token) {
    console.warn("No token found in localStorage");
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

export const bookingService = {
  // Create booking request
  createBooking: async (propertyId, bookingData) => {
    try {
      const response = await axios.post(
        `${API_URL}/${propertyId}`,
        bookingData,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Booking creation failed:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get customer bookings
  getCustomerBookings: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/customer`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch customer bookings:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get owner bookings
  getOwnerBookings: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/owner`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch owner bookings:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update booking status
  updateBookingStatus: async (bookingId, status) => {
    try {
      const response = await axios.put(
        `${API_URL}/${bookingId}/status`,
        { status },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update booking status:', error.response?.data || error.message);
      throw error;
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/${bookingId}`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to cancel booking:', error.response?.data || error.message);
      throw error;
    }
  }
};
