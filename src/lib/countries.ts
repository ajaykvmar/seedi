// src/lib/countries.ts
import { Country } from "./types";

export const COUNTRIES: Country[] = [
  { code: "us", name: "United States", flag: "🇺🇸", storeName: "US" },
  { code: "gb", name: "United Kingdom", flag: "🇬🇧", storeName: "UK" },
  { code: "ca", name: "Canada", flag: "🇨🇦", storeName: "Canada" },
  { code: "au", name: "Australia", flag: "🇦🇺", storeName: "Australia" },
  { code: "in", name: "India", flag: "🇮🇳", storeName: "India" },
  { code: "de", name: "Germany", flag: "🇩🇪", storeName: "Germany" },
  { code: "fr", name: "France", flag: "🇫🇷", storeName: "France" },
  { code: "jp", name: "Japan", flag: "🇯🇵", storeName: "Japan" },
  { code: "cn", name: "China", flag: "🇨🇳", storeName: "China" },
  { code: "kr", name: "South Korea", flag: "🇰🇷", storeName: "South Korea" },
  { code: "br", name: "Brazil", flag: "🇧🇷", storeName: "Brazil" },
  { code: "ru", name: "Russia", flag: "🇷🇺", storeName: "Russia" },
];

export const DEFAULT_COUNTRY = "us";
