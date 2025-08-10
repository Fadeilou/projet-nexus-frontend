
'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Star, 
  Clock, 
  Calendar,
  PlayCircle,
  ChevronRight,
  Film,
  Sparkles
} from 'lucide-react';
import { Movie, Genre } from '@/types';
import { useAuthStore, useAppStore } from '@/store';
import MovieCard from '@/components/MovieCard';
import apiService from '@/services/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const HomePage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const { loadFavorites, addToRecentlyViewed } = useAppStore();
  
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [personalizedRecs, setPersonalizedRecs] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load trending movies
        const trending = await apiService.getTrendingMovies();
        setTrendingMovies(trending);
        
        // Set featured movie (first trending movie with backdrop)
        const movieWithBackdrop = trending.find(movie => movie.backdrop_path);
        if (movieWithBackdrop) {
          const detailedMovie = await apiService.getMovieDetails(movieWithBackdrop.id);
          setFeaturedMovie(detailedMovie);
        }
        
        // Load genres
        const genresList = await apiService.getGenres();
        setGenres(genresList);
        
        // Load personalized recommendations if authenticated
        if (isAuthenticated) {
          try {
            const recommendations = await apiService.getUserRecommendations('hybrid', 12);
            setPersonalizedRecs(recommendations.movies);
          } catch (error) {
            console.log('No personalized recommendations available');
          }
        }
        
      } catch (error: any) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const handleMovieClick = (movie: Partial<Movie>) => {
    addToRecentlyViewed(movie as Movie);
    router.push(`/movie/${movie.id}`);
  };

  const handleGenreClick = (genreId: number) => {
    router.push(`/search?genre=${genreId}`);
  };

  const handleViewAll = (category: string) => {
    switch (category) {
      case 'trending':
        router.push('/trending');
        break;
      case 'recommendations':
        router.push('/recommendations');
        break;
      default:
        router.push('/search');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-white">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">{/* Hero Section */}
      {featuredMovie && (
        <section className="relative h-[70vh] overflow-hidden animate-fade-in">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${apiService.getBackdropUrl(featuredMovie.backdrop_path)})`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
            <div className="max-w-2xl animate-slide-in">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
                <span className="text-yellow-500 font-medium">Film Tendance</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {featuredMovie.title}
              </h1>
              
              <div className="flex items-center space-x-6 mb-6 text-gray-300">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span>{featuredMovie.vote_average.toFixed(1)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{featuredMovie.release_date?.split('-')[0]}</span>
                </div>
                {featuredMovie.runtime && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{apiService.formatRuntime(featuredMovie.runtime)}</span>
                  </div>
                )}
              </div>
              
              <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-xl">
                {featuredMovie.overview}
              </p>
              
              <div className="flex items-center space-x-4">
                <button
                  className="flex items-center space-x-2 bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors hover:scale-105"
                  onClick={() => handleMovieClick(featuredMovie)}
                >
                  <PlayCircle className="h-5 w-5" />
                  <span>Voir les détails</span>
                </button>
                
                <button
                  className="flex items-center space-x-2 bg-gray-800 bg-opacity-50 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors border border-gray-600 hover:scale-105"
                  onClick={() => router.push('/search')}
                >
                  <Film className="h-5 w-5" />
                  <span>Explorer plus</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Personalized Recommendations (if authenticated) */}
        {isAuthenticated && personalizedRecs.length > 0 && (
          <div className="mb-16 animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-6 w-6 text-purple-500" />
                <h2 className="text-3xl font-bold">Recommandé pour vous</h2>
              </div>
              <button
                onClick={() => handleViewAll('recommendations')}
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Voir tout</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {personalizedRecs.slice(0, 12).map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={handleMovieClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Trending Movies */}
        <div className="mb-16 animate-slide-up">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-yellow-500" />
              <h2 className="text-3xl font-bold">Films Tendance</h2>
            </div>
            <button
              onClick={() => handleViewAll('trending')}
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>Voir tout</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {trendingMovies.slice(0, 18).map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={handleMovieClick}
              />
            ))}
          </div>
        </div>

        {/* Genres */}
        <div className="mb-16 animate-slide-up">
          <div className="flex items-center space-x-3 mb-8">
            <Film className="h-6 w-6 text-blue-500" />
            <h2 className="text-3xl font-bold">Explorer par genre</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {genres.map((genre) => (
              <button
                key={genre.id}
                className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 border border-gray-700 hover:border-transparent hover:scale-105"
                onClick={() => handleGenreClick(genre.id)}
              >
                <span className="font-medium text-center block">{genre.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Welcome Section for non-authenticated users */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center animate-slide-up">
            <h2 className="text-3xl font-bold mb-4">Rejoignez MovieNexus</h2>
            <p className="text-lg mb-6 text-blue-100">
              Créez votre compte pour accéder à des recommandations personnalisées, 
              sauvegarder vos films favoris et bien plus encore !
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors hover:scale-105"
                onClick={() => router.push('/register')}
              >
                S'inscrire
              </button>
              <button
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors hover:scale-105"
                onClick={() => router.push('/login')}
              >
                Se connecter
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;


