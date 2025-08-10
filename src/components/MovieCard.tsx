'use client';

import React, { useState } from 'react';
import { Heart, Plus, Play, Star, Calendar } from 'lucide-react';
import { Movie } from '@/types';
import { useAuthStore, useAppStore } from '@/store';
import apiService from '@/services/api';
import toast from 'react-hot-toast';

interface MovieCardProps {
  movie: Partial<Movie> & { id: number; title: string; poster_path: string | null };
  onClick: (movie: Partial<Movie>) => void;
  isFavorite?: boolean;
  onRemoveFromFavorites?: (movieId: number) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, isFavorite: isFavoriteProp, onRemoveFromFavorites: onRemoveFromFavoritesProp }) => {
  const { isAuthenticated } = useAuthStore();
  const { favorites, addToFavorites, removeFromFavorites, addToWatchlist } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const isFavorite = isFavoriteProp !== undefined ? isFavoriteProp : favorites.some(fav => fav.id === movie.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour ajouter aux favoris');
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        if (onRemoveFromFavoritesProp) {
          onRemoveFromFavoritesProp(movie.id);
        } else {
          await apiService.removeFromFavorites(movie.id);
          removeFromFavorites(movie.id);
        }
        toast.success('Retiré des favoris');
      } else {
        const fullMovie = await apiService.getMovieDetails(movie.id);
        await apiService.addToFavorites(fullMovie);
        addToFavorites(fullMovie);
        toast.success('Ajouté aux favoris');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des favoris');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour ajouter à la watchlist');
      return;
    }

    try {
      const fullMovie = await apiService.getMovieDetails(movie.id);
      await apiService.addToWatchlist(fullMovie);
      addToWatchlist(fullMovie);
      toast.success('Ajouté à la watchlist');
    } catch (error) {
      toast.error("Erreur lors de l'ajout à la watchlist");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear().toString();
  };

  return (
    <div
      className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:scale-105"
      onClick={() => onClick(movie)}
    >
      {/* Movie Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={apiService.getPosterUrl(movie.poster_path)}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Overlay with controls */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
          <div className="flex space-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
            {/* Play Button */}
            <button
              className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-full hover:bg-opacity-30 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onClick(movie);
              }}
            >
              <Play className="h-6 w-6 text-white" />
            </button>

            {/* Favorite Button */}
            <button
              className={`p-3 backdrop-blur-sm rounded-full transition-all ${
                isFavorite 
                  ? 'bg-red-500 bg-opacity-80 hover:bg-opacity-100' 
                  : 'bg-white bg-opacity-20 hover:bg-opacity-30'
              }`}
              onClick={handleFavoriteClick}
              disabled={isLoading}
            >
              <Heart className={`h-6 w-6 ${isFavorite ? 'text-white fill-current' : 'text-white'}`} />
            </button>

            {/* Watchlist Button */}
            <button
              className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-full hover:bg-opacity-30 transition-all"
              onClick={handleWatchlistClick}
            >
              <Plus className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Rating Badge */}
        {movie.vote_average && movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-white text-xs font-medium">
              {movie.vote_average.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Movie Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {movie.title}
        </h3>
        
        <div className="flex items-center justify-between text-gray-400 text-xs">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{movie.release_date && formatDate(movie.release_date)}</span>
          </div>
          
          {movie.genre_ids && movie.genre_ids.length > 0 && (
            <div className="flex space-x-1">
              {movie.genre_ids.slice(0, 2).map((genreId) => (
                <span
                  key={genreId}
                  className="px-2 py-1 bg-gray-700 rounded text-xs"
                >
                  {genreId}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
