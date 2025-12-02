// API configuration

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

export const API_ENDPOINTS = {
  // Auth
  AUTH_WALLET_CONNECT: "/auth/wallet/connect",
  AUTH_EMAIL_REGISTER: "/auth/email/register",
  AUTH_EMAIL_LOGIN: "/auth/email/login",
  AUTH_REFRESH: "/auth/refresh",
  AUTH_LOGOUT: "/auth/logout",

  // Streams
  STREAMS_ACTIVE: "/streams/active",
  STREAMS_SEARCH: "/streams/search",
  STREAMS_HOT: "/streams/hot",
  STREAMS_STATUS: (id: string) => `/streams/${id}/status`,
  STREAMS_RTP_CAPABILITIES: (id: string) => `/streams/${id}/rtp-capabilities`,
  STREAMS_TRANSPORT_CONSUMER: (id: string) => `/streams/${id}/transport/consumer`,
  STREAMS_TRANSPORT_CONNECT: (transportId: string) => `/streams/transport/${transportId}/connect`,
  STREAMS_TRANSPORT_CONSUME: (streamId: string, transportId: string) =>
    `/streams/${streamId}/transport/${transportId}/consume`,

  // Tokens
  TOKEN_BY_ID: (id: string) => `/tokens/${id}`,
  TOKEN_BY_STREAM: (streamId: string) => `/tokens/stream/${streamId}`,

  // Purchases
  PURCHASE_QUOTE: "/purchases/quote",
  PURCHASE_EXECUTE: "/purchases/execute",
  PURCHASE_BY_ID: (id: string) => `/purchases/${id}`,
  PURCHASE_USER_HISTORY: (userId: string) => `/purchases/user/${userId}`,

  // Agents
  AGENT_TEMPLATES: "/agents/templates",
  AGENT_STREAM: (streamId: string) => `/agents/stream/${streamId}`,
  AGENT_CLICK: (id: string) => `/agents/${id}/click`,
};
