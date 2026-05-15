// src/lib/types.ts
export interface AppResult {
  trackId: number;
  trackName: string;
  description?: string;
  releaseNotes?: string;
  currentVersionReleaseDate?: string;
  averageUserRating: number;
  userRatingCount: number;
  releaseDate: string;
  artworkUrl100: string;
  artworkUrl512?: string;
  primaryGenreName: string;
  genres: string[];
  sellerName: string;
  sellerUrl?: string;
  artistId?: number;
  price: number;
  formattedPrice: string;
  currency: string;
  screenshotUrls: string[];
  trackViewUrl: string;
  minimumOsVersion?: string;
  languageCodesISO2A?: string[];
  fileSizeBytes?: string;
  version?: string;
}

export interface KeywordScores {
  opportunity: number;
  difficulty: number;
  popularity: number;
}

export interface SearchResponse {
  results: AppResult[];
  scores: KeywordScores;
  relatedTerms: string[];
  query: string;
  country: string;
  total: number;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  storeName: string;
}
