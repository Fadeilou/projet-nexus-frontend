'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Star, Send, Heart, Calendar, Clock, Users } from 'lucide-react';
import { Movie, UserRating, UserReview } from '@/types';
import { useAuthStore } from '@/store';
import apiService from '@/services/api';
import toast from 'react-hot-toast';

export default function ReviewPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [existingRating, setExistingRating] = useState<UserRating | null>(null);
  const [existingReview, setExistingReview] = useState<UserReview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const loadMovieData = async () => {
      try {
        setIsLoading(true);
        const movieId = parseInt(id as string);
        
        // Load movie details
        const movieData = await apiService.getMovieDetails(movieId);
        setMovie(movieData);

        // Check for existing rating and review
        // Note: These would need to be implemented in the backend
        try {
          // const rating = await apiService.getUserRating(movieId);
          // setExistingRating(rating);
          // setUserRating(rating.rating);
        } catch (error) {
          // No existing rating
        }

        try {
          // const review = await apiService.getUserReview(movieId);
          // setExistingReview(review);
          // setReviewText(review.review);
        } catch (error) {
          // No existing review
        }
      } catch (error) {
        console.error('Error loading movie data:', error);
        toast.error('Failed to load movie data');
      } finally {
        setIsLoading(false);
      }
    };

    loadMovieData();
  }, [id, isAuthenticated, router]);

  const handleRatingSubmit = async () => {
    if (!movie || userRating === 0) return;

    try {
      setIsSubmitting(true);
      
      const ratingData = {
        movie_id: movie.id,
        rating: userRating
      };

      await apiService.submitRating(ratingData);
      toast.success('Rating submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error(error.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!movie || !reviewText.trim()) return;

    try {
      setIsSubmitting(true);
      
      const reviewData = {
        movie_id: movie.id,
        review: reviewText.trim()
      };

      await apiService.submitReview(reviewData);
      toast.success('Review submitted successfully!');
      setReviewText('');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, interactive = true }: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    interactive?: boolean;
  }) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && onRatingChange?.(star)}
            className={`p-1 ${interactive ? 'hover:scale-110 transition-transform' : ''}`}
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hoverRating || rating)
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-400'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span>Loading movie...</span>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p>Movie not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        {movie.backdrop_path && (
          <img
            src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <div className="flex items-end space-x-6">
              {movie.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                  alt={movie.title}
                  className="w-32 h-48 object-cover rounded-lg shadow-lg"
                />
              )}
              <div>
                <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
                <div className="flex items-center space-x-4 text-gray-300">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                  {movie.runtime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{movie.runtime} min</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{movie.vote_average.toFixed(1)}/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rating Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Star className="w-6 h-6 mr-2 text-yellow-400" />
              Rate This Movie
            </h2>
            
            <div className="text-center mb-6">
              <p className="text-gray-400 mb-4">How would you rate this movie?</p>
              <StarRating
                rating={userRating}
                onRatingChange={setUserRating}
              />
              <p className="mt-2 text-lg font-semibold">
                {userRating > 0 ? `${userRating}/5 stars` : 'No rating'}
              </p>
            </div>

            {existingRating && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400">Your previous rating:</p>
                <div className="flex items-center space-x-2">
                  <StarRating rating={existingRating.rating} interactive={false} />
                  <span className="text-gray-300">
                    {new Date(existingRating.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleRatingSubmit}
              disabled={userRating === 0 || isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
            >
              {isSubmitting ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
            </button>
          </div>

          {/* Review Section */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Users className="w-6 h-6 mr-2 text-green-400" />
              Write a Review
            </h2>
            
            <div className="mb-4">
              <label htmlFor="review" className="block text-sm font-medium text-gray-300 mb-2">
                Share your thoughts about this movie
              </label>
              <textarea
                id="review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What did you think about this movie? Share your insights, favorite scenes, or overall impression..."
              />
              <p className="text-xs text-gray-400 mt-1">
                {reviewText.length}/500 characters
              </p>
            </div>

            {existingReview && (
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">Your previous review:</p>
                <p className="text-gray-300 text-sm italic">"{existingReview.review}"</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(existingReview.created_at).toLocaleDateString()}
                </p>
              </div>
            )}

            <button
              onClick={handleReviewSubmit}
              disabled={!reviewText.trim() || isSubmitting}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}</span>
            </button>
          </div>
        </div>

        {/* Movie Overview */}
        {movie.overview && (
          <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Overview</h3>
            <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={() => router.push(`/movie/${movie.id}`)}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Back to Movie Details
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Discover More Movies
          </button>
        </div>
      </div>
    </div>
  );
}
