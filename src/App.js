import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar"; // ✅ FIXED
import Footer from "./components/Footer"; // ✅ FIXED

import { AuthProvider } from "./contexts/AuthContext"; // ✅ FIXED
import { SocketProvider } from "./contexts/SocketContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { ThemeProvider } from "./contexts/ThemeContext";

import ProtectedRoute from "./components/ProtectedRoute"; // ✅ FIXED

import { Toaster } from "sonner";

import LandingPage from "./pages/LandingPage";
import ListingsPage from "./pages/ListingsPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import WishlistPage from "./pages/WishlistPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import UserProfilePage from "./pages/UserProfilePage";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerProfilePage from "./pages/OwnerProfilePage";
import AddListingPageNew from "./pages/AddListingPageNew";
import OwnerInboxPage from "./pages/OwnerInboxPage";
import CustomerBookingsPage from "./pages/CustomerBookingsPage";

function App() {
  return (
    <div className="App min-h-screen flex flex-col">
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <WishlistProvider>
              <SocketProvider>
                <Toaster position="top-right" richColors />

                <Navbar />

                <main className="flex-grow">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />

                    {/* Role Selection */}
                    <Route path="/select-role" element={<RoleSelectionPage />} />

                    {/* Profile */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <UserProfilePage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Protected */}
                    <Route
                      path="/listings"
                      element={
                        <ProtectedRoute>
                          <ListingsPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/listing/:id"
                      element={
                        <ProtectedRoute>
                          <ListingDetailPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/favorites"
                      element={
                        <ProtectedRoute>
                          <FavoritesPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/wishlist"
                      element={
                        <ProtectedRoute requireRole="CUSTOMER">
                          <WishlistPage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/my-bookings"
                      element={
                        <ProtectedRoute requireRole="CUSTOMER">
                          <CustomerBookingsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Owner */}
                    <Route
                      path="/owner/dashboard"
                      element={
                        <ProtectedRoute requireRole="OWNER">
                          <OwnerDashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/owner/profile"
                      element={
                        <ProtectedRoute requireRole="OWNER">
                          <OwnerProfilePage />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/owner/add-listing"
                      element={
                        <ProtectedRoute requireRole="OWNER">
                          <AddListingPageNew />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/owner/inbox"
                      element={
                        <ProtectedRoute requireRole="OWNER">
                          <OwnerInboxPage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </main>

                <Footer />
              </SocketProvider>
            </WishlistProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
