import { api } from "../utils/api";
import { API_ENDPOINTS } from "../config/api";
import type { Memecoin, BondingCurveState } from "../types";

export const tokenService = {
  async getToken(tokenId: string): Promise<Memecoin> {
    return api.get(API_ENDPOINTS.TOKENS_GET(tokenId));
  },

  async getTokenByStream(
    streamId: string
  ): Promise<{ memecoin: Memecoin; bondingCurveState: BondingCurveState }> {
    return api.get(API_ENDPOINTS.TOKENS_BY_STREAM(streamId));
  },
};
