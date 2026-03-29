import { Link } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Maximize, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useWishlist } from '../contexts/WishlistContext';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = "https://rental-backend-production-3c03.up.railway.app";

export const ListingCard = ({ listing }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const listingId = listing._id || listing.id;
  const isWishlisted = isInWishlist(listingId);
  const isCustomer = user?.role === 'CUSTOMER';

  const status = listing.status || 'available';
  const isAvailable = status === 'available';

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isCustomer) return;

    try {
      await toggleWishlist(listingId);
    } catch (err) {
      console.error("Wishlist error:", err);
    }
  };

  const formatPrice = () => {
    const price = listing.price || listing.monthlyPrice || 0;
    const formattedPrice = price.toLocaleString('en-IN');
    const duration = listing.priceType === 'daily' ? 'day' : 'month';
    return `₹ ${formattedPrice} / ${duration}`;
  };

  const getTypeColor = () => {
    const map = {
      room: '#E07A5F',
      house: '#1a2744',
      lodge: '#D4A574',
      apartment: '#E07A5F',
      villa: '#1a2744',
      cottage: '#D4A574'
    };
    return map[listing.type] || '#E07A5F';
  };

  // ✅ PRODUCTION-GRADE IMAGE HANDLER
  const getImageUrl = (img) => {
    if (!img || typeof img !== 'string') {
      console.warn("⚠️ No valid image:", listing.title);
      return 'https://dummyimage.com/400x300/cccccc/666666&text=No+Image';
    }

    console.log("📸 Image value:", img);

    // ❌ HARD BLOCK BLOB URLS
    if (img.startsWith('blob:')) {
      console.warn("❌ Blob URL blocked:", img);
      return 'https://dummyimage.com/400x300/cccccc/666666&text=Upload+Error';
    }

    // ✅ Already valid URL
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }

    // ✅ Relative paths
    if (img.startsWith('/')) {
      return `${BACKEND_URL}${img}`;
    }

    // ✅ Just filename
    return `${BACKEND_URL}/uploads/${img}`;
  };

  const rawImage = listing.images?.[0] || listing.image;
  const propertyImage = getImageUrl(rawImage);

  const propertyLocation =
    listing.addressText ||
    listing.location ||
    "Location not specified";

  return (
    <Link to={`/listing/${listingId}`} data-testid={`listing-card-${listingId}`}>
      <Card className={`overflow-hidden hover:shadow-soft-lg transition-all duration-300 h-full group bg-card ${!isAvailable ? 'opacity-75' : ''}`}>

        {/* IMAGE */}
        <div className="relative">
          <img
            src={propertyImage}
            alt={listing.title || "Property"}
            className={`w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 ${!isAvailable ? 'grayscale-[30%]' : ''}`}
            onError={(e) => {
              e.target.src = 'https://dummyimage.com/400x300/cccccc/666666&text=No+Image';
            }}
          />

          {/* ❤️ Wishlist */}
          {isCustomer && (
            <button
              onClick={handleToggleWishlist}
              className="absolute top-3 right-3 bg-white dark:bg-gray-800 rounded-full p-2.5 shadow-soft hover:shadow-soft-md hover:scale-110 transition-all"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
                }`}
              />
            </button>
          )}

          {/* 🏷️ Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Badge
              className="font-semibold rounded-lg shadow-soft"
              style={{ backgroundColor: getTypeColor(), color: 'white' }}
            >
              {listing.type?.toUpperCase()}
            </Badge>

            <Badge
              className={`font-semibold rounded-lg shadow-soft flex items-center gap-1 ${
                isAvailable
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {isAvailable ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Available
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Rented
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* CONTENT */}
        <CardContent className="p-5">

          <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-secondary transition-colors">
            {listing.title || "Untitled Property"}
          </h3>

          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4 mr-1.5 text-secondary" />
            <span>{propertyLocation}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1.5" />
              <span>{listing.bedrooms || 1} bed</span>
            </div>
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1.5" />
              <span>{listing.bathrooms || 1} bath</span>
            </div>
            <div className="flex items-center">
              <Maximize className="h-4 w-4 mr-1.5" />
              <span>{listing.squareFeet || listing.size || 0} sqft</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-2xl font-bold text-secondary">
              {formatPrice()}
            </span>

            <Button
              size="sm"
              className={`font-semibold ${
                isAvailable
                  ? 'bg-gradient-to-r from-primary to-[#243b5e] text-white'
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
            >
              {isAvailable ? 'View Details' : 'View Info'}
            </Button>
          </div>

        </CardContent>
      </Card>
    </Link>
  );
};

export default ListingCard;
