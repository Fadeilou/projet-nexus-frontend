'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import MovieCard from '@/components/MovieCard';
import { Movie } from '@/types';

const MovieGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    padding: 1rem;
    gap: 1rem;
  }
`;

interface FavoriteMovie {
  id: number;
  movie_id: number;
  title: string;
  poster_path: string;
  release_date: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);

    if (!storedToken) {
      router.push('/login');
      return;
    }

    const fetchFavorites = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/favorites/', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        setFavorites(response.data);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };

    fetchFavorites();
  }, [router, token]); // Add token to dependency array

  const handleRemoveFromFavorites = async (id: number) => {
    if (!token) return;
    try {
      await axios.delete(`http://localhost:8000/api/favorites/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(favorites.filter((fav) => fav.id !== id));
      alert('Movie removed from favorites!');
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove movie from favorites.');
    }
  };

  const handleMovieClick = (movie: any) => {
    router.push(`/movie/${movie.id}`);
  };

  return (
    <div>
      <h1 style={{ textAlign: 'center', margin: '2rem 0', color: 'var(--text-light)' }}>My Favorites</h1>
      <MovieGrid>
        {favorites.map((movie) => (
          <MovieCard key={movie.id} movie={movie} isFavorite onRemoveFromFavorites={handleRemoveFromFavorites} onClick={handleMovieClick} />
        ))}
      </MovieGrid>
    </div>
  );
}
