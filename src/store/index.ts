import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
  Movie,
  FavoriteMovie,
} from '@/types';
import apiService from '@/services/api';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true });
          const { user, tokens } = await apiService.login(credentials);
          set({ user, tokens, isAuthenticated: true, isLoading: false });
          toast.success(`Bienvenue ${user.username}!`);
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.error || 'Erreur de connexion');
          throw error;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        try {
          set({ isLoading: true });
          await apiService.register(credentials);
          set({ isLoading: false });
          toast.success('Compte créé avec succès! Vous pouvez maintenant vous connecter.');
        } catch (error: any) {
          set({ isLoading: false });
          toast.error(error.error || 'Erreur lors de la création du compte');
          throw error;
        }
      },

      logout: () => {
        apiService.logout();
        set({ user: null, tokens: null, isAuthenticated: false });
        toast.success('Déconnexion réussie');
      },

      refreshToken: async () => {
        try {
          const tokens = await apiService.refreshToken();
          set({ tokens });
        } catch (error) {
          get().logout();
        }
      },

      checkAuth: () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ 
              user, 
              tokens: { access: token, refresh: localStorage.getItem('refresh_token') || '' },
              isAuthenticated: true 
            });
          } catch (error) {
            get().logout();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface AppState {
  favorites: FavoriteMovie[];
  watchlist: Movie[];
  recentlyViewed: Movie[];
  searchHistory: string[];
  isLoading: boolean;
  
  // Favorites
  loadFavorites: () => Promise<void>;
  addToFavorites: (movie: Movie) => Promise<void>;
  removeFromFavorites: (movieId: number) => Promise<void>;
  isFavorite: (movieId: number) => boolean;
  
  // Watchlist
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (movieId: number) => void;
  isInWatchlist: (movieId: number) => boolean;
  
  // Recently Viewed
  addToRecentlyViewed: (movie: Movie) => void;
  clearRecentlyViewed: () => void;
  
  // Search History
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  
  // Utility
  clearAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      favorites: [],
      watchlist: [],
      recentlyViewed: [],
      searchHistory: [],
      isLoading: false,

      loadFavorites: async () => {
        try {
          set({ isLoading: true });
          const favorites = await apiService.getFavorites();
          set({ favorites, isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          console.error('Erreur lors du chargement des favoris:', error);
        }
      },

      addToFavorites: async (movie: Movie) => {
        try {
          const favorite = await apiService.addToFavorites(movie);
          set((state) => ({
            favorites: [...state.favorites, favorite],
          }));
          toast.success('Film ajouté aux favoris!');
        } catch (error: any) {
          toast.error(error.error || 'Erreur lors de l\'ajout aux favoris');
          throw error;
        }
      },

      removeFromFavorites: async (movieId: number) => {
        try {
          const currentFavorites = get().favorites;
          const favorite = currentFavorites.find(f => f.movie_id === movieId);
          
          if (favorite) {
            await apiService.removeFromFavorites(favorite.id);
            set((state) => ({
              favorites: state.favorites.filter(f => f.movie_id !== movieId),
            }));
            toast.success('Film retiré des favoris!');
          }
        } catch (error: any) {
          toast.error(error.error || 'Erreur lors de la suppression des favoris');
          throw error;
        }
      },

      isFavorite: (movieId: number) => {
        return get().favorites.some(f => f.movie_id === movieId);
      },

      addToWatchlist: (movie: Movie) => {
        set((state) => {
          const isAlreadyInWatchlist = state.watchlist.some(m => m.id === movie.id);
          if (isAlreadyInWatchlist) {
            toast('Ce film est déjà dans votre liste à regarder');
            return state;
          }
          toast.success('Film ajouté à votre liste à regarder!');
          return {
            watchlist: [...state.watchlist, movie],
          };
        });
      },

      removeFromWatchlist: (movieId: number) => {
        set((state) => ({
          watchlist: state.watchlist.filter(m => m.id !== movieId),
        }));
        toast.success('Film retiré de votre liste à regarder!');
      },

      isInWatchlist: (movieId: number) => {
        return get().watchlist.some(m => m.id === movieId);
      },

      addToRecentlyViewed: (movie: Movie) => {
        set((state) => {
          const filtered = state.recentlyViewed.filter(m => m.id !== movie.id);
          return {
            recentlyViewed: [movie, ...filtered].slice(0, 50), // Keep last 50 movies
          };
        });
      },

      clearRecentlyViewed: () => {
        set({ recentlyViewed: [] });
        toast.success('Historique des films consultés effacé');
      },

      addToSearchHistory: (query: string) => {
        if (query.trim()) {
          set((state) => {
            const filtered = state.searchHistory.filter(q => q !== query);
            return {
              searchHistory: [query, ...filtered].slice(0, 20), // Keep last 20 searches
            };
          });
        }
      },

      clearSearchHistory: () => {
        set({ searchHistory: [] });
        toast.success('Historique de recherche effacé');
      },

      clearAll: () => {
        set({
          favorites: [],
          watchlist: [],
          recentlyViewed: [],
          searchHistory: [],
        });
        toast.success('Toutes les données locales ont été effacées');
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        watchlist: state.watchlist,
        recentlyViewed: state.recentlyViewed,
        searchHistory: state.searchHistory,
      }),
    }
  )
);

// Movie Store for movie-specific state
interface MovieState {
  selectedMovie: Movie | null;
  movieRecommendations: Movie[];
  isLoading: boolean;
  setSelectedMovie: (movie: Movie | null) => void;
  loadMovieRecommendations: (movieId: number) => Promise<void>;
}

export const useMovieStore = create<MovieState>((set) => ({
  selectedMovie: null,
  movieRecommendations: [],
  isLoading: false,

  setSelectedMovie: (movie: Movie | null) => {
    set({ selectedMovie: movie });
  },

  loadMovieRecommendations: async (movieId: number) => {
    try {
      set({ isLoading: true });
      const response = await apiService.getMovieRecommendations(movieId);
      set({ movieRecommendations: response.recommendations, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Erreur lors du chargement des recommandations:', error);
    }
  },
}));
