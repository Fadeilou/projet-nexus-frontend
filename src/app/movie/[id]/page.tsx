'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Star, 
  Clock, 
  Calendar, 
  PlayCircle, 
  Heart, 
  Plus,
  ArrowLeft,
  Globe,
  Users,
  Award,
  TrendingUp
} from 'lucide-react';
import { Movie, Person, Video, Genre, CastMember, CrewMember, Videos, Reviews, MovieResponse, UserReview } from '@/types';
import { useAuthStore, useAppStore } from '@/store';
import MovieCard from '@/components/MovieCard';
import apiService from '@/services/api';
import toast from 'react-hot-toast';

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres?: Genre[];
  runtime: number;
  original_language: string;
  original_title: string;
  adult: boolean;
  popularity: number;
  video: boolean;
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos?: Videos;
  reviews?: Reviews;
  similar?: MovieResponse;
  recommendations?: MovieResponse;
  is_favorite?: boolean;
  user_rating?: number;
  our_avg_rating?: number;
  our_rating_count?: number;
  our_reviews?: UserReview[];
  budget: number;
  revenue: number;
  spoken_languages: Array<{
    iso_639_1: string;
    name: string;
  }>;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
  }>;
  tagline?: string;
}

const MovieDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const movieId = parseInt(params.id as string);
  
  const { isAuthenticated } = useAuthStore();
  const { favorites, addToFavorites, removeFromFavorites, addToWatchlist } = useAppStore();
  
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'videos' | 'similar'>('overview');
  
  const isFavorite = favorites.some(fav => fav.id === movieId);

  useEffect(() => {
    if (movieId) {
      loadMovieDetails();
    }
  }, [movieId]);

  const loadMovieDetails = async () => {
    try {
      setIsLoading(true);
      
      // Load basic movie details
      const movieDetails = await apiService.getMovieDetails(movieId);
      setMovie(movieDetails as MovieDetails);
      
      // Load AI-powered recommendations if user is authenticated
      if (isAuthenticated) {
        try {
          const recommendations = await apiService.getMovieRecommendations(movieId);
          setAiRecommendations(recommendations.recommendations);
        } catch (error) {
          console.error('Failed to load AI recommendations:', error);
        }
      }
      
    } catch (error) {
      console.error('Failed to load movie details:', error);
      toast.error('Failed to load movie details');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add to favorites');
      return;
    }

    try {
      if (isFavorite) {
        await apiService.removeFromFavorites(movieId);
        removeFromFavorites(movieId);
        toast.success('Removed from favorites');
      } else {
        const movieToAdd: Movie = {
          id: movie!.id,
          title: movie!.title,
          overview: movie!.overview,
          poster_path: movie!.poster_path,
          backdrop_path: movie!.backdrop_path,
          release_date: movie!.release_date,
          vote_average: movie!.vote_average,
          vote_count: movie!.vote_count,
          genre_ids: movie!.genres ? movie!.genres.map(g => g.id) : [],
          original_language: movie!.original_language,
          original_title: movie!.original_title,
          adult: movie!.adult,
          popularity: movie!.popularity,
          video: movie!.video,
        };
        await apiService.addToFavorites(movieToAdd);
        addToFavorites(movieToAdd);
        toast.success('Added to favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const handleWatchlistClick = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add to watchlist');
      return;
    }

    try {
        const movieToAdd: Movie = {
          id: movie!.id,
          title: movie!.title,
          overview: movie!.overview,
          poster_path: movie!.poster_path,
          backdrop_path: movie!.backdrop_path,
          release_date: movie!.release_date,
          vote_average: movie!.vote_average,
          vote_count: movie!.vote_count,
          genre_ids: movie!.genres ? movie!.genres.map(g => g.id) : [],
          original_language: movie!.original_language,
          original_title: movie!.original_title,
          adult: movie!.adult,
          popularity: movie!.popularity,
          video: movie!.video,
        };
      await apiService.addToWatchlist(movieToAdd);
      addToWatchlist(movieToAdd);
      toast.success('Added to watchlist');
    } catch (error) {
      toast.error('Failed to add to watchlist');
    }
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-white">Loading movie details...</span>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Movie not found</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const mainTrailer = movie.videos?.results?.find(video => 
    video.type === 'Trailer' && video.site === 'YouTube'
  );

  const director = movie.credits?.crew?.find((person: CrewMember) => person.job === 'Director');
  const mainCast = movie.credits?.cast?.slice(0, 10) || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative h-[80vh] overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${apiService.getBackdropUrl(movie.backdrop_path, 'original')})`
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        {/* Content */}
        <div className="relative z-10 h-full flex items-end">
          <div className="container mx-auto px-6 pb-20">
            <div className="flex flex-col lg:flex-row items-end gap-8">
              {/* Poster */}
              <div className="flex-shrink-0">
                <img
                  src={apiService.getPosterUrl(movie.poster_path, 'w500')}
                  alt={movie.title}
                  className="w-64 h-96 object-cover rounded-xl shadow-2xl"
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1 space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold">{movie.title}</h1>
                
                {movie.tagline && (
                  <p className="text-xl text-gray-300 italic">"{movie.tagline}"</p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-gray-400">({movie.vote_count} votes)</span>
                  </div>
                  
                  {movie.runtime > 0 && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatRuntime(movie.runtime)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>

                  {movie.spoken_languages && movie.spoken_languages.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Globe className="h-4 w-4" />
                      <span>{movie.spoken_languages[0].name}</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2">
                  {movie.genres?.map((genre) => (
                    <span
                      key={genre.id}
                      className="bg-gray-800 bg-opacity-80 px-3 py-1 rounded-full text-sm"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-4">
                  {mainTrailer && (
                    <a
                      href={`https://www.youtube.com/watch?v=${mainTrailer.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <PlayCircle className="h-5 w-5" />
                      <span>Watch Trailer</span>
                    </a>
                  )}

                  <button
                    onClick={handleFavoriteClick}
                    className={`px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors ${
                      isFavorite 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                    <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                  </button>

                  <button
                    onClick={handleWatchlistClick}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add to Watchlist</span>
                  </button>

                  {isAuthenticated && (
                    <button
                      onClick={() => router.push(`/review/${movie.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Star className="h-5 w-5" />
                      <span>Rate & Review</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-6 mb-8 border-b border-gray-800">
          {[
            { key: 'overview', label: 'Overview', icon: Users },
            { key: 'cast', label: 'Cast & Crew', icon: Users },
            { key: 'videos', label: 'Videos', icon: PlayCircle },
            { key: 'similar', label: 'Similar Movies', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Overview */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Overview</h2>
              <p className="text-gray-300 leading-relaxed text-lg">{movie.overview}</p>
            </div>

            {/* Director & Key Info */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Key Information</h3>
                <div className="space-y-3">
                  {director && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Director:</span>
                      <span>{director.name}</span>
                    </div>
                  )}
                  
                  {movie.budget > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Budget:</span>
                      <span>{formatCurrency(movie.budget)}</span>
                    </div>
                  )}
                  
                  {movie.revenue > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Revenue:</span>
                      <span>{formatCurrency(movie.revenue)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Production Companies */}
              {movie.production_companies && movie.production_companies.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Production Companies</h3>
                  <div className="space-y-2">
                    {movie.production_companies.slice(0, 5).map((company) => (
                      <div key={company.id} className="flex items-center space-x-3">
                        {company.logo_path && (
                          <img
                            src={apiService.getImageUrl(company.logo_path, 'w92')}
                            alt={company.name}
                            className="h-8 w-auto"
                          />
                        )}
                        <span>{company.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cast' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Cast & Crew</h2>
            
            {/* Main Cast */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {mainCast.map((person) => (
                <div
                  key={person.id}
                  className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => router.push(`/person/${person.id}`)}
                >
                  <img
                    src={apiService.getProfileUrl(person.profile_path, 'w185')}
                    alt={person.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-semibold truncate">{person.name}</h4>
                    <p className="text-sm text-gray-400 truncate">{person.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Videos</h2>
            
                        {movie.videos && movie.videos.results && movie.videos.results.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {movie.videos.results.slice(0, 6).map((video) => (
                  <div key={video.id} className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="aspect-video bg-gray-700 flex items-center justify-center">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-colors"
                      >
                        <PlayCircle className="h-8 w-8" />
                      </a>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold truncate">{video.name}</h4>
                      <p className="text-sm text-gray-400">{video.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No videos available</p>
            )}
          </div>
        )}

        {activeTab === 'similar' && (
          <div className="space-y-8">
            {/* AI-Powered Recommendations */}
            {aiRecommendations.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <Award className="h-6 w-6 text-yellow-400" />
                  <h2 className="text-2xl font-bold">AI Recommendations</h2>
                  <span className="bg-blue-600 text-xs px-2 py-1 rounded-full">Personalized</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {aiRecommendations.slice(0, 10).map((rec) => (
                    <MovieCard
                      key={rec.id}
                      movie={rec}
                      onClick={(movie) => router.push(`/movie/${movie.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Similar Movies */}
                        {movie.similar && movie.similar.results && movie.similar.results.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Similar Movies</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {movie.similar.results.slice(0, 10).map((similar) => (
                    <MovieCard
                      key={similar.id}
                      movie={similar}
                      onClick={(movie) => router.push(`/movie/${movie.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TMDb Recommendations */}
                        {movie.recommendations && movie.recommendations.results && movie.recommendations.results.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {movie.recommendations.results.slice(0, 10).map((rec) => (
                    <MovieCard
                      key={rec.id}
                      movie={rec}
                      onClick={(movie) => router.push(`/movie/${movie.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetailPage;