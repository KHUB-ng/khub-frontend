import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { listings, orders, wallet, ApiError } from '@/api'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar, MapPin, Users, Shield, Check, AlertCircle, Loader2 } from 'lucide-react'

function apiMsg(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.description || fallback
  return err instanceof Error ? err.message : fallback
}

export const RentalBooking: React.FC = () => {
  const { slug } = useParams()
  const pid = slug ?? ''
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [confirming, setConfirming] = useState(false)

  const rentalQuery = useQuery({
    queryKey: ['listing', pid],
    queryFn: () => listings.get(pid),
    enabled: !!pid,
  })
  const rental = rentalQuery.data?.listing
  const images = rentalQuery.data?.images ?? []
  const attrs = (rental?.attributes ?? {}) as Record<string, any>

  const balanceQuery = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: wallet.get,
    enabled: !!user && confirming,
  })

  const bookMutation = useMutation({
    mutationFn: () => orders.create(pid),
    onSuccess: () => {
      toast.success('Rental booked — payment held in escrow. Arrange dates and keys via chat.')
      setConfirming(false)
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
      navigate('/dashboard')
    },
    onError: (err) => toast.error(apiMsg(err, 'Booking failed.')),
  })

  const handleBooking = () => {
    if (!user) {
      toast.error('Please login to book')
      navigate('/login')
      return
    }
    setConfirming(true)
  }

  if (rentalQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (rentalQuery.isError || !rental) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Rental Not Found</h2>
        <p className="text-gray-500">This rental doesn't exist or has been removed.</p>
      </div>
    )
  }

  const features: string[] = Array.isArray(attrs.features) ? attrs.features : []
  const maxGuests = attrs.max_guests ?? '2'

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rental Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative h-96">
              <img
                src={images[0] || '/placeholder.jpg'}
                alt={rental.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6">
              <h1 className="text-2xl font-bold mb-2">{rental.title}</h1>
              <div className="flex items-center gap-4 text-gray-600 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {rental.location || 'Nigeria'}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {maxGuests} guests
                </div>
              </div>

              {rental.description && (
                <div className="prose max-w-none">
                  <p>{rental.description}</p>
                </div>
              )}

              {/* Amenities */}
              {features.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {features.map((feature: string) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
            <div className="mb-4">
              <span className="text-2xl font-bold">{rental.price_display ?? ''}</span>
              <span className="text-gray-600"> / {(attrs.price_period as string) || 'month'}</span>
            </div>

            {/* Date Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Check-in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border rounded-md p-2"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Check-out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || new Date().toISOString().split('T')[0]}
                className="w-full border rounded-md p-2"
              />
            </div>

            <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Exact dates are confirmed with the owner via chat after booking.
            </p>

            {/* Guests */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Guests</label>
              <select
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className="w-full border rounded-md p-2"
              >
                {[1,2,3,4,5,6].map(num => (
                  <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4 mb-4 text-sm text-gray-600">
              <p>Booking debits your wallet into escrow immediately. Dates, keys and handover are arranged with the owner via chat.</p>
            </div>

            <button
              onClick={handleBooking}
              disabled={bookMutation.isPending}
              className="w-full bg-primary-500 text-white py-3 rounded-md hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {bookMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
                  Processing...
                </>
              ) : (
                'Request to Book'
              )}
            </button>

            <div className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" />
              Payment is held securely in escrow
            </div>
          </div>
        </div>
      </div>

      {/* Confirm modal: show balance first, creation IS payment */}
      {confirming && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-semibold">Confirm booking</h2>
            <div className="mt-4 text-sm bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Rental price</span>
                <span className="font-semibold">{rental.price_display ?? ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wallet balance</span>
                <span className="font-semibold">
                  {balanceQuery.isLoading ? '…' : (balanceQuery.data?.balance_display ?? '—')}
                </span>
              </div>
              {(checkIn || checkOut) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Preferred dates</span>
                  <span className="font-semibold">{[checkIn, checkOut].filter(Boolean).join(' → ') || '—'}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Confirming creates the order and moves the amount into escrow. A short wallet balance will reject the booking.
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirming(false)} className="flex-1 px-4 py-2 border rounded-md text-sm">Cancel</button>
              <button
                onClick={() => bookMutation.mutate()}
                disabled={bookMutation.isPending}
                className="flex-1 bg-primary-500 text-white py-2 rounded-md text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bookMutation.isPending ? (<><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>) : 'Confirm & Pay from Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
