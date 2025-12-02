// Purchase service for token buying

import { apiService } from "./api";
import { API_ENDPOINTS } from "../config/api";
import type { PriceQuote, Purchase } from "../types";

export const purchaseService = {
  async getPriceQuote(tokenId: string, amount: number): Promise<PriceQuote> {
    return apiService.post<PriceQuote>(API_ENDPOINTS.PURCHASE_QUOTE, {
      tokenId,
      amount,
    });
  },

  async executePurchase(
    tokenId: string,
    buyerId: string,
    amount: number,
    maxSlippage: number,
    chain: "hedera" | "base"
  ): Promise<Purchase> {
    return apiService.post<Purchase>(API_ENDPOINTS.PURCHASE_EXECUTE, {
      tokenId,
      buyerId,
      amount,
      maxSlippage,
      chain,
    });
  },

  async getUserPurchaseHistory(userId: string): Promise<Purchase[]> {
    return apiService.get<Purchase[]>(API_ENDPOINTS.PURCHASE_USER_HISTORY(userId));
  },
};
