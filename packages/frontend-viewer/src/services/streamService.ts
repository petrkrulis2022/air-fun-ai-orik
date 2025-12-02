// Stream service for fetching stream data

import { apiService } from "./api";
import { API_ENDPOINTS } from "../config/api";
import type { Stream, StreamFilters } from "../types";

export const streamService = {
  async getActiveStreams(filters?: StreamFilters): Promise<Stream[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.minViewers) params.append("minViewers", filters.minViewers.toString());
    if (filters?.hasToken !== undefined) params.append("hasToken", filters.hasToken.toString());

    const query = params.toString();
    const endpoint = query
      ? `${API_ENDPOINTS.STREAMS_ACTIVE}?${query}`
      : API_ENDPOINTS.STREAMS_ACTIVE;

    return apiService.get<Stream[]>(endpoint);
  },

  async searchStreams(query: string): Promise<Stream[]> {
    return apiService.get<Stream[]>(
      `${API_ENDPOINTS.STREAMS_SEARCH}?q=${encodeURIComponent(query)}`
    );
  },

  async getHotStreams(limit: number = 10): Promise<Stream[]> {
    return apiService.get<Stream[]>(`${API_ENDPOINTS.STREAMS_HOT}?limit=${limit}`);
  },

  async getStreamStatus(streamId: string): Promise<Stream> {
    return apiService.get<Stream>(API_ENDPOINTS.STREAMS_STATUS(streamId));
  },
};
