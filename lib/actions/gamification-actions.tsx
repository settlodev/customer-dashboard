"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse } from "@/types/types";
import { StaffXpTransaction } from "@/types/staff";
import { getCurrentLocation } from "./business/get-current-business";

// ---------------------------------------------------------------------------
// Staff gamification profile
// ---------------------------------------------------------------------------

export interface GamificationProfile {
  staffId: string;
  staffName: string;
  totalXp: number;
  currentLevel: number;
  levelName: string;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  leaderboardRank: number;
  ordersToday: number;
  recentTransactions: StaffXpTransaction[];
}

export const getStaffGamificationProfile = async (
  staffId: string,
): Promise<GamificationProfile | null> => {
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const params = location?.id ? `?locationId=${location.id}` : "";
    const data = await apiClient.get(`/api/v1/gamification/staff/${staffId}/profile${params}`);
    return parseStringify(data);
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Staff challenges
// ---------------------------------------------------------------------------

export interface ChallengeUpdate {
  challengeId: string;
  challengeName: string;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  completed: boolean;
  distanceMessage: string;
}

export const getStaffChallenges = async (
  staffId: string,
): Promise<ChallengeUpdate[]> => {
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const params = location?.id ? `?locationId=${location.id}` : "";
    const data = await apiClient.get(`/api/v1/gamification/staff/${staffId}/challenges${params}`);
    return parseStringify(data);
  } catch {
    return [];
  }
};

// ---------------------------------------------------------------------------
// XP history
// ---------------------------------------------------------------------------

export const getStaffXpHistory = async (
  staffId: string,
  page: number = 0,
  size: number = 20,
): Promise<ApiResponse<StaffXpTransaction>> => {
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const params = new URLSearchParams();
    if (location?.id) params.append("locationId", location.id);
    params.append("page", String(page));
    params.append("size", String(size));
    const data = await apiClient.get(`/api/v1/gamification/staff/${staffId}/xp-history?${params.toString()}`);
    return parseStringify(data);
  } catch (error) {
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  staffId: string;
  staffName: string;
  score: number;
  currentLevel: number;
  levelName: string;
  rank: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  period: string;
  metric: string;
}

export const getLeaderboard = async (
  period: "DAILY" | "WEEKLY" | "MONTHLY" = "WEEKLY",
  metric: "XP" | "ORDERS" | "REVENUE" | "AOV" = "XP",
  limit: number = 50,
): Promise<LeaderboardResponse | null> => {
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const params = new URLSearchParams();
    if (location?.id) params.append("locationId", location.id);
    params.append("period", period);
    params.append("metric", metric);
    params.append("limit", String(limit));
    const data = await apiClient.get(`/api/v1/gamification/leaderboard?${params.toString()}`);
    return parseStringify(data);
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Gamification settings
// ---------------------------------------------------------------------------

export interface GamificationSettings {
  enabled: boolean;
  [key: string]: unknown;
}

export const getGamificationSettings = async (): Promise<GamificationSettings | null> => {
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const params = location?.id ? `?locationId=${location.id}` : "";
    const data = await apiClient.get(`/api/v1/gamification/settings${params}`);
    return parseStringify(data);
  } catch {
    return null;
  }
};

export const updateGamificationSettings = async (
  settings: Partial<GamificationSettings>,
): Promise<{ responseType: string; message: string }> => {
  try {
    const apiClient = new ApiClient();
    const location = await getCurrentLocation();
    const params = location?.id ? `?locationId=${location.id}` : "";
    await apiClient.put(`/api/v1/gamification/settings${params}`, settings);
    return { responseType: "success", message: "Settings updated" };
  } catch (error) {
    return {
      responseType: "error",
      message: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
};
