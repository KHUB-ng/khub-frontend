import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, ShoppingBag, Briefcase, Home, User, Bike, Truck, ShoppingCart, MessageCircle, Wallet, Bell, Gift, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

// Public surfaces first, then the signed-in app surfaces. Every backend
// route group is reachable from here or from the dashboard.
const publicItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/shop', label: 'Marketplace', icon: ShoppingBag },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/rentals', label: 'Rentals', icon: Home },
  { path: '/rides', label: 'Rides', icon: Bike },
  { path: '/logistics', label: 'Logistics', icon: Truck },
]

const accountItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/referrals', label: 'Referrals', icon: Gift },
  { path: '/driver', label: 'Drive', icon: Bike },
  { path: '/agent', label: 'Deliver', icon: Truck },
]

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const navItems = [...publicItems, ...(user ? accountItems : [])]

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary-500">
              KHUB
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-5">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className="text-gray-700 hover:text-primary-500 text-sm">
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/profile" className="text-gray-700 hover:text-primary-500 text-sm">
                  {user.full_name || user.email}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    void signOut().then(() => navigate('/login'))
                  }}
                  className="px-4 py-2 text-primary-500 border border-primary-500 rounded-md hover:bg-primary-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-primary-500 border border-primary-500 rounded-md hover:bg-primary-50">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn('md:hidden', isOpen ? 'block' : 'hidden')}>
        <div className="px-2 pt-2 pb-3 space-y-1 max-h-[70vh] overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/profile" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  void signOut().then(() => navigate('/login'))
                }}
                className="block w-full text-left px-3 py-2 text-primary-500 hover:bg-gray-100 rounded-md"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block px-3 py-2 text-primary-500 hover:bg-gray-100 rounded-md">
                Login
              </Link>
              <Link to="/register" className="block px-3 py-2 bg-primary-500 text-white rounded-md">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
