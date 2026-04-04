import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "./storage";

interface UserProfile {
  name: string;
  handle: string;
  avatar: string | null;
}

interface GameStats {
  wins: number;
  totalScore: number;
  maxCombo: number;
  gamesPlayed: number;
}

interface GameState {
  profile: UserProfile;
  stats: GameStats;

  // Actions
  updateProfile: (profile: Partial<UserProfile>) => void;
  addWin: (score: number, combo: number) => void;
  addLoss: (score: number) => void;
  resetStats: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      profile: {
        name: "User Name",
        handle: "@suhaib_dev",
        avatar: null,
      },
      stats: {
        wins: 0,
        totalScore: 0,
        maxCombo: 0,
        gamesPlayed: 0,
      },

      updateProfile: (newProfile) =>
        set((state) => ({
          profile: { ...state.profile, ...newProfile },
        })),

      addWin: (score, combo) =>
        set((state) => ({
          stats: {
            ...state.stats,
            wins: state.stats.wins + 1,
            gamesPlayed: state.stats.gamesPlayed + 1,
            totalScore: state.stats.totalScore + score,
            maxCombo: Math.max(state.stats.maxCombo, combo),
          },
        })),

      addLoss: (score) =>
        set((state) => ({
          stats: {
            ...state.stats,
            gamesPlayed: state.stats.gamesPlayed + 1,
            totalScore: state.stats.totalScore + score,
          },
        })),

      resetStats: () =>
        set({
          stats: {
            wins: 0,
            totalScore: 0,
            maxCombo: 0,
            gamesPlayed: 0,
          },
        }),
    }),
    {
      name: "cubgame-store",
      storage: createJSONStorage(() => storage),
    },
  ),
);
