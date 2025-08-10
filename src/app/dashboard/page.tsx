'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Heart, 
  Star, 
  Clock, 
  TrendingUp, 
  Eye,
  Calendar,
  BarChart3,
  Film,
  Users
} from 'lucide-react';
import { Movie, UserDashboard, UserReview } from '@/types';
import { useAuthStore, useAppStore } from '@/store';
import MovieCard from '@/components/MovieCard';
import apiService from '@/services/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { favorites } = useAppStore();
  const [dashboard, setDashboard] = useState<UserDashboard | null>(null);
  const [recentReviews, setRecentReviews] = useState<UserReview[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Load dashboard stats
        const dashboardData = await apiService.getUserDashboard();
        setDashboard(dashboardData);

        // Load personalized recommendations
        const recommendations = await apiService.getUserRecommendations();
        setRecommendedMovies(recommendations.movies.slice(0, 12));

        // Load recent reviews (placeholder for now)
        // setRecentReviews(await apiService.getUserReviews());

      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [isAuthenticated, router]);

  const handleMovieClick = (movie: Movie) => {
    router.push(`/movie/${movie.id}`);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-500 bg-opacity-20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        <div className="text-gray-400 text-sm mb-1">{title}</div>
        {subtitle && <div className="text-gray-500 text-xs">{subtitle}</div>}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span>Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-400">
            Here's your personalized movie experience
          </p>
        </div>

        {/* Stats Grid */}
        {dashboard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Heart}
              title="Favorite Movies"
              value={dashboard.statistics.favorites_count}
              subtitle="Movies you love"
              color="red"
            />
            <StatCard
              icon={Star}
              title="Average Rating"
              value={dashboard.statistics.avg_rating_given ? dashboard.statistics.avg_rating_given.toFixed(1) : 'N/A'}
              subtitle="Your rating average"
              color="yellow"
            />
            <StatCard
              icon={Eye}
              title="Movies Watched"
              value={dashboard.statistics.ratings_count}
              subtitle="Movies you've rated"
              color="green"
            />
            <StatCard
              icon={Calendar}
              title="This Month"
              value={0}
              subtitle="Recent activity"
              color="purple"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => router.push('/search')}
            className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition-colors flex flex-col items-center space-y-2"
          >
            <Film className="w-6 h-6" />
            <span className="text-sm font-medium">Discover Movies</span>
          </button>
          <button
            onClick={() => router.push('/trending')}
            className="bg-green-600 hover:bg-green-700 p-4 rounded-lg transition-colors flex flex-col items-center space-y-2"
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-sm font-medium">Trending Now</span>
          </button>
          <button
            onClick={() => router.push('/favorites')}
            className="bg-red-600 hover:bg-red-700 p-4 rounded-lg transition-colors flex flex-col items-center space-y-2"
          >
            <Heart className="w-6 h-6" />
            <span className="text-sm font-medium">My Favorites</span>
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition-colors flex flex-col items-center space-y-2"
          >
            <User className="w-6 h-6" />
            <span className="text-sm font-medium">Profile</span>
          </button>
        </div>

        {/* AI Recommendations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-blue-400" />
              AI Recommendations for You
            </h2>
            <button
              onClick={() => router.push('/search')}
              className="text-blue-400 hover:text-blue-300 flex items-center text-sm"
            >
              View all
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          {recommendedMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={handleMovieClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800 rounded-lg">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                Rate some movies to get personalized recommendations!
              </p>
            </div>
          )}
        </div>

        {/* Recent Favorites */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <Heart className="w-6 h-6 mr-2 text-red-400" />
              Recent Favorites
            </h2>
            <button
              onClick={() => router.push('/favorites')}
              className="text-blue-400 hover:text-blue-300 flex items-center text-sm"
            >
              View all
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          {favorites.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {favorites.slice(0, 6).map((fav) => {
                const movie: Movie = {
                  id: fav.movie_id,
                  title: fav.title,
                  poster_path: fav.poster_path,
                  release_date: fav.release_date,
                  overview: '',
                  vote_average: 0,
                  vote_count: 0,
                  genre_ids: [],
                  backdrop_path: null,
                  adult: false,
                  original_language: '',
                  original_title: fav.title,
                  popularity: 0,
                  video: false
                };
                return (
                  <MovieCard
                    key={fav.id}
                    movie={movie}
                    onClick={handleMovieClick}
                    isFavorite={true}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-800 rounded-lg">
              <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                Start adding movies to your favorites!
              </p>
            </div>
          )}
        </div>

        {/* Activity Summary */}
        {dashboard && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-400" />
              Your Movie Journey
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {dashboard.favorites_count}
                </div>
                <div className="text-gray-400">Movies Added to Favorites</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {dashboard.total_ratings}
                </div>
                <div className="text-gray-400">Movies Rated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {dashboard.monthly_activity}
                </div>
                <div className="text-gray-400">Activity This Month</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
