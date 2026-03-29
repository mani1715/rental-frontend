import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

// ✅ FIXED IMPORTS (NO @/)
import ListingCard from '../components/ListingCard';
import FilterPanel from '../components/FilterPanel';
import { Button } from '../components/ui/button';
import { SlidersHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { SkeletonList } from '../components/SkeletonLoader';

import BASE_URL from '../config/api.js';

const API_URL = BASE_URL;

export default function ListingsPage() {
  const [searchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({
    types: [],
    duration: 'all',
    mode: 'all',
    availability: 'all',
    minPrice: 0,
    maxPrice: 5000
  });

  useEffect(() => {
    fetchListings();
  }, [searchParams, filters]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const type = searchParams.get('type');
      const search = searchParams.get('search');

      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (search) params.append('location', search);
      if (filters.minPrice > 0) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice < 5000) params.append('maxPrice', filters.maxPrice);

      const response = await axios.get(`${API_URL}/api/listings?${params.toString()}`);

      if (response.data.success) {
        setListings(response.data.listings);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filters.types.length > 0 && !filters.types.includes(listing.type)) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          Available Properties
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className={`lg:w-80 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
            />
          </aside>

          <main className="flex-1">
            {loading ? (
              <SkeletonList count={6} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredListings.map(listing => (
                  <ListingCard key={listing.id || listing._id} listing={listing} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
