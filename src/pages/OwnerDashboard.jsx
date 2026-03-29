import React, { useState, useEffect } from 'react';
import BASE_URL from '../config/api.js';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Plus, Home, Star, Eye, MessageCircle, Trash2, Edit, Check, X, Mail, Phone } from 'lucide-react';

const API_URL = BASE_URL;

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  console.log("Token being sent:", token);
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListings: 0,
    totalReviews: 0,
    averageRating: 0,
    pendingBookings: 0
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);

      // Fetch owner's listings
      const listingsRes = await axios.get(`${API_URL}/api/listings`, { 
        params: { ownerId: user.id },
        headers: getAuthHeader()
      });
      if (listingsRes.data.success) {
        console.log('Owner listings fetched:', listingsRes.data.listings);
        setListings(listingsRes.data.listings);
        setStats(prev => ({ ...prev, totalListings: listingsRes.data.listings.length }));
      }

      // Fetch owner's bookings
      try {
        const bookingsRes = await axios.get(`${API_URL}/api/bookings/owner`, {
          headers: getAuthHeader()
        });
        if (bookingsRes.data.success) {
          setBookings(bookingsRes.data.bookings);
          const pending = bookingsRes.data.bookings.filter(b => b.status === 'pending').length;
          setStats(prev => ({ ...prev, pendingBookings: pending }));
        }
      } catch (error) {
        console.log('Error fetching bookings:', error);
      }

      // Fetch owner profile
      try {
        const profileRes = await axios.get(`${API_URL}/api/owner/profile`, {
          headers: getAuthHeader()
        });
        if (profileRes.data.success) {
          setProfile(profileRes.data.profile);
        }
      } catch (error) {
        // Profile doesn't exist yet
        console.log('No profile found');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const deleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await axios.delete(`${API_URL}/api/listings/${id}`, {
        headers: getAuthHeader()
      });
      setListings(listings.filter(l => (l.id || l._id) !== id));
    } catch (error) {
      alert('Failed to delete listing');
    }
  };

  const handleBookingStatus = async (bookingId, status) => {
    const statusText = status === 'approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${statusText} this booking request?`)) return;

    try {
      const response = await axios.put(
        `${API_URL}/api/bookings/${bookingId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data.success) {
        // Update the booking in the list
        setBookings(bookings.map(b => 
          b.id === bookingId ? { ...b, status } : b
        ));
        
        // Update pending count
        if (status !== 'pending') {
          setStats(prev => ({ 
            ...prev, 
            pendingBookings: Math.max(0, prev.pendingBookings - 1) 
          }));
        }
        
        alert(`Booking request ${statusText}ed successfully!`);
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert(`Failed to ${statusText} booking request`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Owner Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Welcome back, {user?.name}!</p>
        </div>

        {/* Profile Alert */}
        {!profile && (
          <div className="mb-6 bg-gradient-to-r from-secondary/10 to-accent/10 border border-secondary/20 rounded-xl p-4">
            <p className="text-foreground">
              ⚠️ Please complete your owner profile to start adding listings.
              <Link to="/owner/profile" className="ml-2 font-medium text-secondary underline">
                Complete Profile
              </Link>
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-xl">
                <Home className="h-6 w-6 text-secondary" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Total Listings</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalListings}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-xl">
                <Star className="h-6 w-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl">
                <Eye className="h-6 w-6 text-primary dark:text-secondary" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
                <MessageCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-foreground">{stats.pendingBookings}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            to="/owner/add-listing"
            className={`flex items-center justify-center px-6 py-4 bg-gradient-to-r from-secondary to-accent text-white rounded-xl hover:from-[#d16a50] hover:to-[#c49565] transition shadow-lg ${!profile ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
              }`}
          >
            <Plus className="mr-2" />
            Add New Listing
          </Link>
          <Link
            to="/owner/profile"
            className="flex items-center justify-center px-6 py-4 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition shadow-lg"
          >
            <Edit className="mr-2" />
            {profile ? 'Edit Profile' : 'Complete Profile'}
          </Link>
          <Link
            to="/owner/inbox"
            className="flex items-center justify-center px-6 py-4 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition shadow-lg"
          >
            <MessageCircle className="mr-2" />
            Messages
          </Link>
        </div>

        {/* Listings Table */}
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">Your Listings</h2>
          </div>

          {listings.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You haven't added any listings yet.</p>
              {profile && (
                <Link
                  to="/owner/add-listing"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-secondary to-accent text-white rounded-lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Listing
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {listings.map((listing) => (
                    <tr key={listing.id || listing._id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={listing.images?.[0] || '/placeholder.jpg'}
                              alt={listing.title}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">{listing.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-secondary/10 text-secondary capitalize">
                          {listing.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        ₹{listing.price?.toLocaleString('en-IN')}/mo
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {listing.addressText?.substring(0, 30)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/listing/${listing.id || listing._id}`}
                          className="text-secondary hover:text-secondary/80 mr-4"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => deleteListing(listing.id || listing._id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Booking Requests */}
        {bookings.length > 0 && (
          <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden mt-8">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Recent Booking Requests</h2>
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-semibold">
                {stats.pendingBookings} Pending
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{booking.customerName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {booking.customerEmail && (
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <a 
                                href={`mailto:${booking.customerEmail}`}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {booking.customerEmail}
                              </a>
                            </div>
                          )}
                          {booking.customerPhone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                              <a 
                                href={`tel:${booking.customerPhone}`}
                                className="text-xs text-green-600 dark:text-green-400 hover:underline"
                              >
                                {booking.customerPhone}
                              </a>
                            </div>
                          )}
                          {!booking.customerEmail && !booking.customerPhone && (
                            <span className="text-xs text-muted-foreground">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-foreground">{booking.propertyTitle}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {booking.message || 'No message'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          booking.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {booking.status === 'pending' && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleBookingStatus(booking.id, 'approved')}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Approve booking"
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleBookingStatus(booking.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Reject booking"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                        {booking.status !== 'pending' && (
                          <span className="text-muted-foreground text-xs">
                            {booking.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
