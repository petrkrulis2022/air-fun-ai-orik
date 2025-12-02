import { api } from "../utils/api";
import { API_ENDPOINTS } from "../config/api";
import type { AuthSession, WalletType } from "../types";

export const authService = {
  async connectWallet(
    walletType: WalletType,
    signature: string,
    address: string
  ): Promise<AuthSession> {
    return api.post<AuthSession>(API_ENDPOINTS.AUTH_WALLET_CONNECT, {
      walletType,
      signature,
      address,
    });
  },

  async registerEmail(email: string, password: string, username: string): Promise<AuthSession> {
    return api.post<AuthSession>(API_ENDPOINTS.AUTH_EMAIL_REGISTER, {
      email,
      password,
      username,
    });
  },

  async loginEmail(email: string, password: string): Promise<AuthSession> {
    return api.post<AuthSession>(API_ENDPOINTS.AUTH_EMAIL_LOGIN, {
      email,
      password,
    });
  },

  async refreshToken(refreshToken: string): Promise<AuthSession> {
    return api.post<AuthSession>(API_ENDPOINTS.AUTH_REFRESH, {
      refreshToken,
    });
  },
};
