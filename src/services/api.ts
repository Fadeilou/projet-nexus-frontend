import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  Movie,
  MovieResponse,
  Genre,
  Person,
  User,
  UserProfile,
  FavoriteMovie,
  UserRating,
  UserReview,
  UserDashboard,
  SearchFilters,
  LoginCredentials,
  RegisterCredentials,
  AuthTokens,
  RecommendationResponse,
  MovieRecommendationResponse,
  ApiError
} from '@/types';

class ApiService {
  private api: AxiosInstance;
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            const token = this.getToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.api(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  private setTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
    }
  }

  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await this.api.post('/token/', credentials);
      const tokens = response.data;
      this.setTokens(tokens);

      // Get user profile
      const userResponse = await this.api.get('/profile/');
      const user = userResponse.data.user;

      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      }

      return { user, tokens };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async register(credentials: RegisterCredentials): Promise<User> {
    try {
      const response = await this.api.post('/register/', credentials);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async refreshToken(): Promise<AuthTokens> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.api.post('/token/refresh/', {
        refresh: refreshToken,
      });

      const tokens = response.data;
      this.setTokens(tokens);
      return tokens;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  logout(): void {
    this.clearTokens();
  }

  // User Profile Methods
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await this.api.get('/profile/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await this.api.patch('/profile/', profile);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getUserDashboard(): Promise<UserDashboard> {
    try {
      const response = await this.api.get('/dashboard/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Movie Methods
  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week'): Promise<Movie[]> {
    try {
      const response = await this.api.get(`/movies/trending/?time_window=${timeWindow}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getMovieDetails(movieId: number): Promise<Movie> {
    try {
      const response = await this.api.get(`/movies/${movieId}/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async searchMovies(filters: SearchFilters): Promise<MovieResponse> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });

      const response = await this.api.get(`/movies/search/?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getGenres(): Promise<Genre[]> {
    try {
      const response = await this.api.get('/movies/genres/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getMovieRecommendations(movieId: number, limit: number = 10): Promise<MovieRecommendationResponse> {
    try {
      const response = await this.api.get(`/movies/${movieId}/recommendations/?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Person (Actor/Director) Methods
  async getPersonDetails(personId: number): Promise<Person> {
    try {
      const response = await this.api.get(`/actors/${personId}/`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Favorites Methods
  async getFavorites(): Promise<FavoriteMovie[]> {
    try {
      const response = await this.api.get('/favorites/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async addToFavorites(movie: Movie): Promise<FavoriteMovie> {
    try {
      const favoriteData = {
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
      };
      const response = await this.api.post('/favorites/', favoriteData);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async removeFromFavorites(favoriteId: number): Promise<void> {
    try {
      await this.api.delete(`/favorites/${favoriteId}/`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Ratings Methods
  async getUserRatings(): Promise<UserRating[]> {
    try {
      const response = await this.api.get('/ratings/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async rateMovie(movieId: number, rating: number): Promise<UserRating> {
    try {
      const response = await this.api.post('/ratings/', {
        movie_id: movieId,
        rating: rating,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Reviews Methods
  async getMovieReviews(movieId: number): Promise<UserReview[]> {
    try {
      const response = await this.api.get(`/reviews/?movie_id=${movieId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getUserReviews(): Promise<UserReview[]> {
    try {
      const response = await this.api.get('/reviews/');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async addReview(movieId: number, reviewText: string, isSpoiler: boolean = false): Promise<UserReview> {
    try {
      const response = await this.api.post('/reviews/', {
        movie_id: movieId,
        review_text: reviewText,
        is_spoiler: isSpoiler,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Recommendations Methods
  async getUserRecommendations(
    type: 'hybrid' | 'collaborative' | 'content' | 'trending' = 'hybrid',
    limit: number = 20
  ): Promise<RecommendationResponse> {
    try {
      const response = await this.api.get(`/recommendations/?type=${type}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Utility Methods
  getImageUrl(path: string | null, size: string = 'w500'): string {
    if (!path) return '/placeholder-movie.jpg';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  getPosterUrl(posterPath: string | null, size: 'w200' | 'w500' | 'w780' | 'original' = 'w500'): string {
    if (!posterPath) {
      return '/placeholder-movie.jpg';
    }
    return `https://image.tmdb.org/t/p/${size}${posterPath}`;
  }

  getBackdropUrl(path: string | null, size: string = 'w1280'): string {
    if (!path) return '/placeholder-backdrop.jpg';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }

  getProfileUrl(profilePath: string | null, size: 'w185' | 'w632' | 'original' = 'w185'): string {
    if (!profilePath) {
      return '/placeholder-person.jpg';
    }
    return `https://image.tmdb.org/t/p/${size}${profilePath}`;
  }

  getYouTubeUrl(key: string): string {
    return `https://www.youtube.com/watch?v=${key}`;
  }

  getYouTubeThumbnail(key: string): string {
    return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
  }

  formatRuntime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  // Watchlist methods
  async addToWatchlist(movie: Movie): Promise<void> {
    try {
      await this.api.post('/watchlist/', {
        movie_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeFromWatchlist(movieId: number): Promise<void> {
    try {
      await this.api.delete(`/watchlist/${movieId}/`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getWatchlist(): Promise<FavoriteMovie[]> {
    try {
      const response = await this.api.get('/watchlist/');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      return {
        error: error.response.data?.error || error.response.data?.message || 'An error occurred',
        status: error.response.status,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        error: 'Network error. Please check your connection.',
        status: 0,
      };
    } else {
      // Something else happened
      return {
        error: error.message || 'An unexpected error occurred',
        status: 0,
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;
