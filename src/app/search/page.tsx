'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  Star,
  Clock,
  Globe,
  Users,
  Sliders,
  RefreshCw,
  Film
} from 'lucide-react';
import { Movie, Genre, SearchFilters, MovieResponse } from '@/types';
import { useAuthStore, useAppStore } from '@/store';
import MovieCard from '@/components/MovieCard';
import apiService from '@/services/api';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

// Simple debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'popularity.asc', label: 'Least Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'vote_average.asc', label: 'Lowest Rated' },
  { value: 'release_date.desc', label: 'Newest First' },
  { value: 'release_date.asc', label: 'Oldest First' },
];

const SearchPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToRecentlyViewed } = useAppStore();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    genre: searchParams.get('genre') || '',
    year: searchParams.get('year') || '',
    sort_by: searchParams.get('sort_by') || 'popularity.desc',
    page: 1,
    language: '',
    min_rating: '',
    max_rating: '',
    min_runtime: '',
    max_runtime: '',
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchFilters: SearchFilters) => {
      performSearch(searchFilters);
    }, 500),
    []
  );

  useEffect(() => {
    loadGenres();
  }, []);

  useEffect(() => {
    if (searchQuery || Object.values(filters).some(v => v && v !== 'popularity.desc')) {
      const newFilters = { ...filters, query: searchQuery, page: 1 };
      setFilters(newFilters);
      debouncedSearch(newFilters);
    }
  }, [searchQuery]);

  const loadGenres = async () => {
    try {
      const genreList = await apiService.getGenres();
      setGenres(genreList);
    } catch (error) {
      console.error('Failed to load genres:', error);
    }
  };

  const performSearch = async (searchFilters: SearchFilters) => {
    try {
      setIsLoading(true);
      
      const response: MovieResponse = await apiService.searchMovies(searchFilters);
      setMovies(response.results);
      setTotalResults(response.total_results);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
      
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
      setMovies([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    setCurrentPage(1);
    performSearch(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: searchQuery,
      sort_by: 'popularity.desc',
      page: 1,
      genre: '',
      year: '',
      language: '',
      min_rating: '',
      max_rating: '',
      min_runtime: '',
      max_runtime: '',
    };
    setFilters(clearedFilters);
    performSearch(clearedFilters);
  };

  const handleMovieClick = (movie: Partial<Movie>) => {
    addToRecentlyViewed(movie as Movie);
    router.push(`/movie/${movie.id}`);
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => 
    value && value !== '' && key !== 'query' && key !== 'page' && key !== 'sort_by'
  ).length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center">
            <Search className="h-8 w-8 mr-3 text-blue-500" />
            Advanced Search
          </h1>
          <p className="text-gray-400">Find the perfect movie with our comprehensive search</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for movies, actors, directors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Toggle & Sort */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Filter className="h-5 w-5" />
            <span>Advanced Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-xs px-2 py-1 rounded-full ml-2">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="flex items-center space-x-4">
            <select
              value={filters.sort_by}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center">
                <Sliders className="h-5 w-5 mr-2" />
                Advanced Filters
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Genre */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Film className="h-4 w-4 mr-1" />
                  Genre
                </label>
                <select
                  value={filters.genre}
                  onChange={(e) => handleFilterChange('genre', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Genres</option>
                  {genres.map(genre => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Release Year
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2023"
                  min="1900"
                  max={new Date().getFullYear() + 2}
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  Language
                </label>
                <select
                  value={filters.language}
                  onChange={(e) => handleFilterChange('language', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Languages</option>
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Range */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  Rating Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.min_rating}
                    onChange={(e) => handleFilterChange('min_rating', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.max_rating}
                    onChange={(e) => handleFilterChange('max_rating', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Runtime Range */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Runtime (minutes)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    min="0"
                    value={filters.min_runtime}
                    onChange={(e) => handleFilterChange('min_runtime', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    min="0"
                    value={filters.max_runtime}
                    onChange={(e) => handleFilterChange('max_runtime', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Header */}
        {(movies.length > 0 || isLoading) && (
          <div className="flex justify-between items-center mb-6">
            <div>
              {totalResults > 0 && (
                <p className="text-gray-400">
                  Showing {movies.length} of {totalResults.toLocaleString()} results
                  {searchQuery && (
                    <span> for "{searchQuery}"</span>
                  )}
                </p>
              )}
            </div>
            
            {isLoading && (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-400">Searching...</span>
              </div>
            )}
          </div>
        )}

        {/* Results Grid */}
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={handleMovieClick}
              />
            ))}
          </div>
        ) : !isLoading && searchQuery ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-gray-400 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={clearFilters}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Clear All Filters
            </button>
          </div>
        ) : !isLoading ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Start your search</h3>
            <p className="text-gray-400">
              Enter a movie title, actor name, or use our advanced filters to find what you're looking for
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const SearchPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
};

export default SearchPage;