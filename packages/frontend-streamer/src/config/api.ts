// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_WALLET_CONNECT: "/auth/wallet/connect",
  AUTH_EMAIL_REGISTER: "/auth/email/register",
  AUTH_EMAIL_LOGIN: "/auth/email/login",
  AUTH_REFRESH: "/auth/refresh",
  AUTH_WALLET_LINK: "/auth/wallet/link",
  AUTH_WALLETS_BALANCES: "/auth/wallets/balances",

  // Streams
  STREAMS_START: "/streams/start",
  STREAMS_END: (id: string) => `/streams/${id}/end`,
  STREAMS_ACTIVE: "/streams/active",
  STREAMS_SEARCH: "/streams/search",
  STREAMS_HOT: "/streams/hot",
  STREAMS_STATUS: (id: string) => `/streams/${id}/status`,

  // Tokens
  TOKENS_GET: (id: string) => `/tokens/${id}`,
  TOKENS_BY_STREAM: (streamId: string) => `/tokens/stream/${streamId}`,
  TOKENS_UPDATE_METADATA: (id: string) => `/tokens/${id}/metadata`,
  TOKENS_GRADUATE: (id: string) => `/tokens/${id}/graduate`,
  TOKENS_ELIGIBILITY: (id: string) => `/tokens/${id}/eligibility`,

  // Agents
  AGENTS_TEMPLATES: "/agents/templates",
  AGENTS_TEMPLATE: (id: string) => `/agents/templates/${id}`,
  AGENTS_DEPLOY: "/agents/deploy",
  AGENTS_UPDATE_POSITION: (id: string) => `/agents/${id}/position`,
  AGENTS_REMOVE: (id: string) => `/agents/${id}`,
  AGENTS_CLICK: (id: string) => `/agents/${id}/click`,
  AGENTS_STATS: (id: string) => `/agents/${id}/stats`,

  // Analytics
  ANALYTICS_STREAMER: (id: string) => `/analytics/streamer/${id}`,
  ANALYTICS_STREAM: (id: string) => `/analytics/streams/${id}`,
  ANALYTICS_TOKEN: (id: string) => `/analytics/tokens/${id}`,
};
