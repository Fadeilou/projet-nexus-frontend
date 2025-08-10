
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  User, 
  Heart, 
  Star, 
  LogOut, 
  Menu, 
  X,
  Film,
  TrendingUp,
  Home,
  Settings
} from 'lucide-react';
import { useAuthStore, useAppStore } from '@/store';
import { Movie } from '@/types';
import apiService from '@/services/api';
import toast from 'react-hot-toast';

const Header: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { searchHistory, addToSearchHistory } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length > 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await apiService.searchMovies({ query, page: 1 });
          setSearchResults(response.results.slice(0, 8)); // Show max 8 results
          setShowSearchResults(true);
          setIsSearching(false);
        } catch (error) {
          setIsSearching(false);
          console.error('Search error:', error);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToSearchHistory(searchQuery.trim());
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const handleMovieSelect = (movie: Movie) => {
    setShowSearchResults(false);
    setSearchQuery('');
    router.push(`/movie/${movie.id}`);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push('/');
    toast.success('Déconnexion réussie');
  };

  const navItems = [
    { href: '/', label: 'Accueil', icon: Home },
    { href: '/trending', label: 'Tendances', icon: TrendingUp },
    { href: '/search', label: 'Recherche', icon: Search },
    ...(isAuthenticated ? [
      { href: '/favorites', label: 'Favoris', icon: Heart },
      { href: '/dashboard', label: 'Dashboard', icon: User },
    ] : []),
  ];

  return (
    <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Film className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              MovieNexus
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors duration-200"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-md mx-8" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher des films..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {showSearchResults && searchResults.length > 0 && (
                  <div
                    className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50"
                  >
                    {searchResults.map((movie) => (
                      <button
                        key={movie.id}
                        onClick={() => handleMovieSelect(movie)}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-700 transition-colors"
                      >
                        <img
                          src={apiService.getImageUrl(movie.poster_path, 'w92')}
                          alt={movie.title}
                          className="w-12 h-18 object-cover rounded"
                        />
                        <div className="flex-1 text-left">
                          <h3 className="font-medium text-white truncate">{movie.title}</h3>
                          <p className="text-sm text-gray-400">{movie.release_date?.split('-')[0]}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-400">{movie.vote_average.toFixed(1)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                    {searchQuery.length > 0 && (
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full p-3 text-blue-500 hover:bg-gray-700 transition-colors border-t border-gray-700"
                      >
                        Voir tous les résultats pour "{searchQuery}"
                      </button>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden md:block">{user?.username}</span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"
                    >
                      <div className="p-2">
                        <Link
                          href="/dashboard"
                          className="flex items-center space-x-2 w-full p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/favorites"
                          className="flex items-center space-x-2 w-full p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Heart className="h-4 w-4" />
                          <span>Favoris</span>
                        </Link>
                        <Link
                          href="/profile"
                          className="flex items-center space-x-2 w-full p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Profil</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Inscription
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden"
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <div
              className="md:hidden border-t border-gray-700 mt-4 pt-4 pb-4"
            >
              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher des films..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </form>

              {/* Mobile Navigation */}
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                
                {!isAuthenticated && (
                  <>
                    <Link
                      href="/login"
                      className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Connexion</span>
                    </Link>
                    <Link
                      href="/register"
                      className="flex items-center space-x-2 p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Inscription</span>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
