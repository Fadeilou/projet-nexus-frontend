'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Flame, 
  Star, 
  Calendar,
  Filter,
  RefreshCw,
  Award,
  Clock
} from 'lucide-react';
import { Movie, Genre } from '@/types';
import { useAuthStore, useAppStore } from '@/store';
import MovieCard from '@/components/MovieCard';
import apiService from '@/services/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const TrendingPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addToRecentlyViewed } = useAppStore();
  
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [personalizedRecs, setPersonalizedRecs] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTimeWindow, setActiveTimeWindow] = useState<'day' | 'week'>('week');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  useEffect(() => {
    loadTrendingData();
  }, [activeTimeWindow, selectedGenre]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPersonalizedRecommendations();
    }
  }, [isAuthenticated]);

  const loadTrendingData = async () => {
    try {
      setIsLoading(true);
      
      // Load trending movies
      const trending = await apiService.getTrendingMovies(activeTimeWindow);
      let filteredTrending = trending;
      
      if (selectedGenre) {
        filteredTrending = trending.filter(movie => 
          movie.genre_ids?.includes(selectedGenre)
        );
      }
      
      setTrendingMovies(filteredTrending);
      
      // Load popular and top-rated movies (simulated with search)
      const searchResults = await apiService.searchMovies({
        sort_by: 'popularity.desc',
        page: 1
      });
      setPopularMovies(searchResults.results.slice(0, 20));
      
      const topRatedResults = await apiService.searchMovies({
        sort_by: 'vote_average.desc',
        page: 1
      });
      setTopRatedMovies(topRatedResults.results.slice(0, 20));
      
      // Load genres
      const genreList = await apiService.getGenres();
      setGenres(genreList);
      
    } catch (error) {
      console.error('Failed to load trending data:', error);
      toast.error('Failed to load trending movies');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPersonalizedRecommendations = async () => {
    try {
      const recommendations = await apiService.getUserRecommendations('hybrid', 20);
      setPersonalizedRecs(recommendations.movies);
    } catch (error) {
      console.error('Failed to load personalized recommendations:', error);
    }
  };

  const handleMovieClick = (movie: Partial<Movie>) => {
    addToRecentlyViewed(movie as Movie);
    router.push(`/movie/${movie.id}`);
  };

  const handleRefresh = () => {
    loadTrendingData();
    if (isAuthenticated) {
      loadPersonalizedRecommendations();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-white">Loading trending movies...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center">
              <TrendingUp className="h-8 w-8 mr-3 text-blue-500" />
              Trending Movies
            </h1>
            <p className="text-gray-400">Discover what's hot in cinema right now</p>
          </div>
          
          <button
            onClick={handleRefresh}
            className="mt-4 lg:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-semibold">Filters</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Time Window */}
            <div>
              <label className="block text-sm font-medium mb-2">Time Period</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTimeWindow('day')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTimeWindow === 'day'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setActiveTimeWindow('week')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTimeWindow === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  This Week
                </button>
              </div>
            </div>

            {/* Genre Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Genre</label>
              <select
                value={selectedGenre || ''}
                onChange={(e) => setSelectedGenre(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Personalized Recommendations */}
        {isAuthenticated && personalizedRecs.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <Award className="h-6 w-6 mr-3 text-yellow-400" />
              <h2 className="text-2xl font-bold">Recommended for You</h2>
              <span className="ml-3 bg-blue-600 text-xs px-2 py-1 rounded-full">AI Powered</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {personalizedRecs.slice(0, 10).map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={handleMovieClick}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trending This Week/Day */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Flame className="h-6 w-6 mr-3 text-red-500" />
            <h2 className="text-2xl font-bold">
              Trending {activeTimeWindow === 'day' ? 'Today' : 'This Week'}
            </h2>
            {selectedGenre && (
              <span className="ml-3 bg-gray-700 text-sm px-3 py-1 rounded-full">
                {genres.find(g => g.id === selectedGenre)?.name}
              </span>
            )}
          </div>
          
          {trendingMovies.length > 0 ? (
            <>
              {/* Featured Trending Movie */}
              {trendingMovies[0] && (
                <div 
                  className="relative h-96 rounded-xl overflow-hidden mb-8 cursor-pointer group"
                  onClick={() => handleMovieClick(trendingMovies[0])}
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${apiService.getBackdropUrl(trendingMovies[0].backdrop_path, 'original')})`
                    }}
                  >
                    <div className="absolute inset-0 bg-black bg-opacity-50 group-hover:bg-opacity-40 transition-all" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  </div>
                  
                  <div className="absolute bottom-8 left-8 right-8">
                    <span className="inline-block bg-red-600 text-white text-sm px-3 py-1 rounded-full mb-4">
                      #1 Trending
                    </span>
                    <h3 className="text-4xl font-bold mb-2">{trendingMovies[0].title}</h3>
                    <p className="text-gray-300 mb-4 max-w-2xl line-clamp-2">
                      {trendingMovies[0].overview}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{trendingMovies[0].vote_average.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(trendingMovies[0].release_date).getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Other Trending Movies */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {trendingMovies.slice(1, 21).map((movie, index) => (
                  <div key={movie.id} className="relative">
                    <span className="absolute -top-2 -left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full z-10">
                      #{index + 2}
                    </span>
                    <MovieCard
                      movie={movie}
                      onClick={handleMovieClick}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No trending movies found for the selected criteria.</p>
            </div>
          )}
        </section>

        {/* Most Popular */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Star className="h-6 w-6 mr-3 text-yellow-400" />
            <h2 className="text-2xl font-bold">Most Popular</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {popularMovies.slice(0, 10).map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={handleMovieClick}
              />
            ))}
          </div>
        </section>

        {/* Top Rated */}
        <section className="mb-12">
          <div className="flex items-center mb-6">
            <Award className="h-6 w-6 mr-3 text-green-400" />
            <h2 className="text-2xl font-bold">Top Rated</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {topRatedMovies.slice(0, 10).map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={handleMovieClick}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TrendingPage;
