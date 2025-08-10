// Movie Types
export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  genres?: Genre[];
  runtime?: number;
  original_language: string;
  original_title: string;
  adult: boolean;
  popularity: number;
  video: boolean;
  credits?: Credits;
  videos?: Videos;
  reviews?: Reviews;
  similar?: MovieResponse;
  recommendations?: MovieResponse;
  is_favorite?: boolean;
  user_rating?: number;
  our_avg_rating?: number;
  our_rating_count?: number;
  our_reviews?: UserReview[];
}

export interface MovieResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

// Genre Types
export interface Genre {
  id: number;
  name: string;
}

// Cast and Crew Types
export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  gender: number;
  known_for_department: string;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
  gender: number;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

// Video Types
export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface Videos {
  results: Video[];
}

// Review Types
export interface Review {
  id: string;
  author: string;
  author_details: {
    name: string;
    username: string;
    avatar_path: string | null;
    rating: number | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
  url: string;
}

export interface Reviews {
  page: number;
  results: Review[];
  total_pages: number;
  total_results: number;
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface UserProfile {
  user: User;
  preferred_genres: number[];
  favorite_actors: number[];
  preferred_languages: string[];
  created_at: string;
  updated_at: string;
}

export interface UserRating {
  id: number;
  user: string;
  movie_id: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface UserReview {
  id: number;
  user: string;
  movie_id: number;
  review_text: string;
  is_spoiler: boolean;
  created_at: string;
  updated_at: string;
}

export interface FavoriteMovie {
  id: number;
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  added_at: string;
}

// Person (Actor/Director) Types
export interface Person {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  gender: number;
  popularity: number;
  movie_credits?: {
    cast: MovieCredit[];
    crew: MovieCredit[];
  };
  images?: {
    profiles: Image[];
  };
}

export interface MovieCredit {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  character?: string;
  job?: string;
  vote_average: number;
}

export interface Image {
  file_path: string;
  width: number;
  height: number;
  aspect_ratio: number;
  vote_average: number;
  vote_count: number;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  genre?: string;
  year?: string;
  language?: string;
  min_rating?: string;
  max_rating?: string;
  min_runtime?: string;
  max_runtime?: string;
  min_revenue?: string;
  max_revenue?: string;
  certification?: string;
  with_cast?: string;
  with_crew?: string;
  with_companies?: string;
  with_keywords?: string;
  sort_by?: string;
  page?: number;
}

export interface AdvancedFilters {
  genres: number[];
  years: number[];
  languages: string[];
  ratingRange: [number, number];
  runtimeRange: [number, number];
  sortBy: string;
}

// Dashboard Types
export interface UserDashboard {
  statistics: {
    favorites_count: number;
    ratings_count: number;
    reviews_count: number;
    avg_rating_given: number | null;
  };
  recent_activities: {
    favorites: FavoriteMovie[];
    ratings: UserRating[];
  };
  recommendations: Movie[];
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  error: string;
  status: number;
}

// Recommendation Types
export interface RecommendationResponse {
  type: string;
  movies: Movie[];
  count: number;
}

export interface MovieRecommendationResponse {
  based_on_movie: number;
  recommendations: Movie[];
  count: number;
}

// Auth Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// Store Types
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export interface AppState {
  favorites: FavoriteMovie[];
  watchlist: Movie[];
  recentlyViewed: Movie[];
  searchHistory: string[];
  addToFavorites: (movie: Movie) => void;
  removeFromFavorites: (movieId: number) => void;
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (movieId: number) => void;
  addToRecentlyViewed: (movie: Movie) => void;
  addToSearchHistory: (query: string) => void;
}

// Component Props Types
export interface MovieCardProps {
  movie: Movie;
  showFavoriteButton?: boolean;
  showRating?: boolean;
  onClick?: (movie: Movie) => void;
}

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export interface FilterPanelProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  genres: Genre[];
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface RatingComponentProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
