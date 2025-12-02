import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../store/authStore";
import type { AuthSession, User } from "../types";

describe("Authentication Flow", () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  it("should set authentication state when user logs in", () => {
    const mockUser: User = {
      id: "user-1",
      role: "streamer",
      username: "teststreamer",
      email: "test@example.com",
      createdAt: Date.now(),
    };

    const mockSession: AuthSession = {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      user: mockUser,
      expiresAt: Date.now() + 3600000,
    };

    const { setAuth } = useAuthStore.getState();
    setAuth(mockSession);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe("mock-access-token");
    expect(state.refreshToken).toBe("mock-refresh-token");
  });

  it("should clear authentication state when user logs out", () => {
    const mockUser: User = {
      id: "user-1",
      role: "streamer",
      username: "teststreamer",
      createdAt: Date.now(),
    };

    const mockSession: AuthSession = {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      user: mockUser,
      expiresAt: Date.now() + 3600000,
    };

    const { setAuth, clearAuth } = useAuthStore.getState();
    setAuth(mockSession);
    clearAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it("should update user data", () => {
    const mockUser: User = {
      id: "user-1",
      role: "streamer",
      username: "teststreamer",
      createdAt: Date.now(),
      totalEarnings: 0,
    };

    const mockSession: AuthSession = {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      user: mockUser,
      expiresAt: Date.now() + 3600000,
    };

    const { setAuth, updateUser } = useAuthStore.getState();
    setAuth(mockSession);
    updateUser({ totalEarnings: 100 });

    const state = useAuthStore.getState();
    expect(state.user?.totalEarnings).toBe(100);
  });
});
