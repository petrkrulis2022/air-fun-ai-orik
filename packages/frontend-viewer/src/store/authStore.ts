// Auth store using Zustand

import { create } from "zustand";
import type { User, AuthSession } from "../types";
import { apiService } from "../services/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (session: AuthSession) => void;
  clearAuth: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setAuth: (session: AuthSession) => {
    apiService.setToken(session.accessToken);
    set({
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      isAuthenticated: true,
    });
  },

  clearAuth: () => {
    apiService.clearToken();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  updateUser: (user: User) => {
    set({ user });
  },
}));
