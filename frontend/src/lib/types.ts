/**
 * Shared TypeScript interfaces for CrowdFlow AI.
 * Used across all frontend components to eliminate `any` types.
 */

export type CrowdLevel = "High" | "Medium" | "Low";
export type CrowdTrend = "up" | "down" | "stable";

export interface WaitTimeEntry {
  time: number;
  level: CrowdLevel;
  trend: CrowdTrend;
}

export interface StadiumCoords {
  lat: number;
  lng: number;
}

export interface StadiumData {
  name: string;
  active_event: string | null;
  user_location: string;
  coords?: StadiumCoords;
  wait_times: Record<string, WaitTimeEntry>;
}

export interface StadiumListItem {
  id: string;
  name: string;
  city: string;
}

export interface NearestStadiumResponse {
  stadium_id: string;
  name: string;
  distance_km: number;
}

export interface AIResponse {
  response?: string;
  error?: string;
}

export interface ChatMessage {
  role: "system" | "user";
  text: string;
}
