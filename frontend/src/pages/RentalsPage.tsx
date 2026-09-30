import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { listings } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import OpenStreetMap from '../components/Map/OpenStreetMap';
import { Home, Car, Store, MapPin, Bed, Bath, Maximize, Loader2 } from 'lucide-react';

export default function Rentals() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchRadius, setSearchRadius] = useState<number>(5);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([9.081999, 8.675277]); // Nigeria center
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  const onSearchChange = (v: string) => {
    setSearch(v);
    window.clearTimeout((onSearchChange as any)._t);
    (onSearchChange as any)._t = window.setTimeout(() => setDebounced(v.trim()), 400);
  };

  const rentalsQuery = useQuery({
    queryKey: ['rentals', debounced, selectedType],
    queryFn: () => {
      const base = {
        vertical: 'rental' as const,
        category: selectedType === 'all' ? undefined : selectedType,
        page_size: 50,
      };
      return debounced ? listings.search(debounced, base) : listings.browse(base);
    },
  });
  const rentals = rentalsQuery.data?.items ?? [];

  const locateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(location);
          setMapCenter(location);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  React.useEffect(() => {
    locateMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'house': return <Home className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      case 'shop': return <Store className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  const filtered = rentals.filter(rental => {
    const attrs = (rental.attributes ?? {}) as any;
    const lat = Number(attrs.latitude);
    const lng = Number(attrs.longitude);
    if (!userLocation || !Number.isFinite(lat) || !Number.isFinite(lng)) return true;
    return calculateDistance(userLocation[0], userLocation[1], lat, lng) <= searchRadius;
  });

  const mapMarkers = filtered.map(rental => {
    const attrs = (rental.attributes ?? {}) as any;
    return {
      position: [Number(attrs.latitude) || 9.081999, Number(attrs.longitude) || 8.675277] as [number, number],
      title: rental.title,
      description: rental.price_display ?? '',
      icon: undefined
    };
  });

  return (
    <div className="container-custom py-8">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
        <h1 className="text-3xl font-bold">Rentals</h1>
        <Link to={user ? '/rentals/new' : '/login'} className="btn-primary px-5 py-2.5 rounded-xl text-sm">
          List Your Property
        </Link>
      </div>

      <div className="relative max-w-xl mb-6">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search rentals by title or location..."
          className="input-field pl-10"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {['all', 'house', 'shop', 'car', 'land'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-6 py-2 rounded-full font-semibold transition whitespace-nowrap ${
              selectedType === type
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}s
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map Section */}
        <div className="order-2 lg:order-1">
          <div className="bg-white rounded-2xl shadow-md p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Location Filter</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm">Radius:</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm font-semibold">{searchRadius}km</span>
              </div>
            </div>
            <OpenStreetMap
              center={mapCenter}
              zoom={12}
              markers={mapMarkers}
              radius={searchRadius * 1000}
              height="500px"
            />
          </div>
        </div>

        {/* Listings Section */}
        <div className="order-1 lg:order-2">
          {rentalsQuery.isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-xl h-32 animate-pulse"></div>
              ))}
            </div>
          ) : rentalsQuery.isError ? (
            <div className="card p-8 text-center">
              <p className="text-gray-600">Could not load rentals. Please try again.</p>
              <Button variant="outline" onClick={() => rentalsQuery.refetch()} className="mt-3">Retry</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((rental) => {
                const attrs = (rental.attributes ?? {}) as any;
                return (
                  <Link to={`/rental/${rental.pid}`} key={rental.pid} className="card block">
                    <div className="flex gap-4 p-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                          src={(attrs.cover_image as string) || '/placeholder-rental.jpg'}
                          alt={rental.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getIcon(rental.category ?? '')}
                              <span className="text-xs text-gray-500 capitalize">{rental.category ?? 'rental'}</span>
                            </div>
                            <h3 className="font-semibold text-lg">{rental.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <MapPin className="w-4 h-4" />
                              <span>{rental.location || 'Nigeria'}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-primary font-bold">{rental.price_display ?? ''}</p>
                            <p className="text-xs text-gray-500">/month</p>
                          </div>
                        </div>

                        <div className="flex gap-4 mt-3 text-sm text-gray-600">
                          {rental.category === 'house' && (
                            <>
                              <span className="flex items-center gap-1">
                                <Bed className="w-4 h-4" /> {attrs.bedrooms || 0} beds
                              </span>
                              <span className="flex items-center gap-1">
                                <Bath className="w-4 h-4" /> {attrs.bathrooms || 0} baths
                              </span>
                              <span className="flex items-center gap-1">
                                <Maximize className="w-4 h-4" /> {attrs.sqft || 0} sqft
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {filtered.length === 0 && (
                <div className="card p-8 text-center">
                  <p className="text-gray-600">No rentals found. Try a different search or category.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
