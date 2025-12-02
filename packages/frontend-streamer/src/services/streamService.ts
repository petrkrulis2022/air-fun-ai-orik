import { api } from "../utils/api";
import { API_ENDPOINTS } from "../config/api";
import type { StreamRecord, StreamConfig, StreamSummary, TransportOptions } from "../types";

export const streamService = {
  async startStream(
    streamerId: string,
    config: StreamConfig
  ): Promise<{ stream: StreamRecord; transportOptions: TransportOptions }> {
    return api.post(API_ENDPOINTS.STREAMS_START, {
      streamerId,
      config,
    });
  },

  async endStream(streamId: string): Promise<{ summary: StreamSummary }> {
    return api.post(API_ENDPOINTS.STREAMS_END(streamId));
  },

  async getStreamStatus(streamId: string): Promise<StreamRecord> {
    return api.get(API_ENDPOINTS.STREAMS_STATUS(streamId));
  },

  async getActiveStreams(): Promise<StreamRecord[]> {
    return api.get(API_ENDPOINTS.STREAMS_ACTIVE);
  },
};
