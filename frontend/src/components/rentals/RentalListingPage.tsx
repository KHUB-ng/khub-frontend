import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listings, toNairaString } from '@/api'
import type { ListingResponse } from '@/api'
import {
  Home, Building2, Store, Warehouse, Car,
  Wrench, Calendar, MapPin, SlidersHorizontal,
  Grid, List, Filter, ChevronDown, Loader2, Bed, Bath, Maximize
} from 'lucide-react'

const propertyTypes = [
  { value: 'house', label: 'Houses', icon: Home },
  { value: 'apartment', label: 'Apartments', icon: Building2 },
  { value: 'shop', label: 'Shops', icon: Store },
  { value: 'office', label: 'Offices', icon: Building2 },
  { value: 'warehouse', label: 'Warehouses', icon: Warehouse },
  { value: 'land', label: 'Land', icon: MapPin },
  { value: 'car', label: 'Cars', icon: Car },
  { value: 'equipment', label: 'Equipment', icon: Wrench },
  { value: 'hall', label: 'Halls', icon: Calendar },
]

export const RentalListingPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    minArea: '',
    sortBy: 'newest'
  })
  const [page, setPage] = useState(1)
  const [debouncedLoc, setDebouncedLoc] = useState('')

  const onLocation = (v: string) => {
    setFilters((f) => ({ ...f, location: v }))
    setPage(1)
    window.clearTimeout((onLocation as any)._t)
    ;(onLocation as any)._t = window.setTimeout(() => setDebouncedLoc(v.trim()), 400)
  }

  const rentalsQuery = useQuery({
    queryKey: ['rental-browse', selectedType, debouncedLoc, filters.minPrice, filters.maxPrice, filters.sortBy, page],
    queryFn: () =>
      listings.browse({
        vertical: 'rental',
        category: selectedType === 'all' ? undefined : selectedType,
        location: debouncedLoc || undefined,
        min_price: toNairaString(filters.minPrice) ?? undefined,
        max_price: toNairaString(filters.maxPrice) ?? undefined,
        sort:
          filters.sortBy === 'price_low'
            ? 'price_asc'
            : filters.sortBy === 'price_high'
              ? 'price_desc'
              : 'newest',
        page,
        page_size: 20,
      }),
  })
  const items = rentalsQuery.data?.items ?? []
  const rentals = items.filter((r) => {
    const attrs = (r.attributes ?? {}) as any
    if (filters.bedrooms && Number(attrs.bedrooms || 0) < Number(filters.bedrooms)) return false
    if (filters.bathrooms && Number(attrs.bathrooms || 0) < Number(filters.bathrooms)) return false
    if (filters.minArea && Number(attrs.sqft || 0) < Number(filters.minArea)) return false
    return true
  })
  const totalPages = rentalsQuery.data?.total_pages ?? 1

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Your Perfect Space</h1>
        <p className="text-gray-600">Discover thousands of properties for rent across Nigeria</p>
      </div>

      {/* Property Type Tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => { setSelectedType('all'); setPage(1) }}
            className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
              selectedType === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Home className="w-4 h-4" />
            All Properties
          </button>
          {propertyTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => { setSelectedType(type.value); setPage(1) }}
              className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
                selectedType === type.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by city, state, or landmark..."
            value={filters.location}
            onChange={(e) => onLocation(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border rounded-md flex items-center gap-2 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className="w-4 h-4" />
          </button>

          <div className="border rounded-md overflow-hidden flex">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'hover:bg-gray-50'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Min price (₦)</label>
              <input
                type="text" inputMode="decimal" value={filters.minPrice}
                onChange={(e) => { setFilters({ ...filters, minPrice: e.target.value }); setPage(1) }}
                placeholder="e.g. 50000"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max price (₦)</label>
              <input
                type="text" inputMode="decimal" value={filters.maxPrice}
                onChange={(e) => { setFilters({ ...filters, maxPrice: e.target.value }); setPage(1) }}
                placeholder="e.g. 500000"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort by</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="newest">Newest</option>
                <option value="price_low">Price: low to high</option>
                <option value="price_high">Price: high to low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min bedrooms</label>
              <input
                type="number" min={0} value={filters.bedrooms}
                onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                placeholder="Any"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min bathrooms</label>
              <input
                type="number" min={0} value={filters.bathrooms}
                onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                placeholder="Any"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min area (sqft)</label>
              <input
                type="number" min={0} value={filters.minArea}
                onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
                placeholder="Any"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => { setFilters({ minPrice: '', maxPrice: '', location: '', bedrooms: '', bathrooms: '', minArea: '', sortBy: 'newest' }); setDebouncedLoc(''); setPage(1) }}
            className="mt-4 text-sm text-primary-500 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-600">{rentals.length} properties found</p>
      </div>

      {/* Content Display */}
      {rentalsQuery.isLoading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : rentalsQuery.isError ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Could not load rentals.</p>
          <button onClick={() => rentalsQuery.refetch()} className="mt-3 text-sm text-primary-500 hover:underline">Retry</button>
        </div>
      ) : rentals.length === 0 ? (
        <div className="text-center py-12">
          <Home className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No properties found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {rentals.map((rental) => (
              <RentalCard key={rental.pid} rental={rental} viewMode={viewMode} />
            ))}
          </div>

          <div className="flex justify-center items-center gap-3 py-8">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function RentalCard({ rental, viewMode }: { rental: ListingResponse; viewMode: 'grid' | 'list' }) {
  const attrs = (rental.attributes ?? {}) as any
  return (
    <Link
      to={`/rental/${rental.pid}`}
      className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden ${viewMode === 'list' ? 'flex gap-4' : ''}`}
    >
      <div className={viewMode === 'list' ? 'w-48 h-40 shrink-0 bg-gray-100' : 'h-48 bg-gray-100'}>
        <img
          src={(attrs.cover_image as string) || '/placeholder-rental.jpg'}
          alt={rental.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4 flex-1">
        <span className="text-xs text-gray-500 capitalize">{rental.category ?? 'rental'}</span>
        <h3 className="font-semibold mt-0.5 truncate">{rental.title}</h3>
        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5" /> {rental.location || 'Nigeria'}
        </p>
        <p className="text-primary-600 font-bold mt-2">{rental.price_display ?? ''}</p>
        {rental.category === 'house' && (
          <div className="flex gap-3 mt-2 text-xs text-gray-600">
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {attrs.bedrooms ?? 0} beds</span>
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {attrs.bathrooms ?? 0} baths</span>
            <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {attrs.sqft ?? 0} sqft</span>
          </div>
        )}
      </div>
    </Link>
  )
}

