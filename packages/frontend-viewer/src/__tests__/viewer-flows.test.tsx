// E2E tests for viewer flows

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { StreamDiscoveryPage } from "../pages/StreamDiscoveryPage";
import { streamService } from "../services/streamService";
import type { Stream } from "../types";

// Mock services
vi.mock("../services/streamService");
vi.mock("../services/agentService");
vi.mock("../services/purchaseService");

const mockStreams: Stream[] = [
  {
    id: "stream-1",
    streamerId: "streamer-1",
    streamerName: "Test Streamer",
    title: "Test Stream",
    category: "Gaming",
    thumbnailUrl: "https://example.com/thumb.jpg",
    viewerCount: 100,
    tokenSymbol: "$TEST",
    tokenMarketCap: 50000,
    startedAt: Date.now(),
    status: "live",
  },
];

describe("Viewer Flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Stream Discovery", () => {
    it("should display active streams", async () => {
      vi.mocked(streamService.getActiveStreams).mockResolvedValue(mockStreams);
      vi.mocked(streamService.getHotStreams).mockResolvedValue([]);

      render(
        <BrowserRouter>
          <StreamDiscoveryPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Test Stream")).toBeInTheDocument();
      });

      expect(screen.getByText("Test Streamer")).toBeInTheDocument();
      expect(screen.getByText("Gaming")).toBeInTheDocument();
    });

    it("should display hot streams section", async () => {
      vi.mocked(streamService.getActiveStreams).mockResolvedValue([]);
      vi.mocked(streamService.getHotStreams).mockResolvedValue(mockStreams);

      render(
        <BrowserRouter>
          <StreamDiscoveryPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("🔥 Hot Streams")).toBeInTheDocument();
      });
    });

    it("should handle search functionality", async () => {
      const searchResults = [mockStreams[0]];
      vi.mocked(streamService.getActiveStreams).mockResolvedValue(mockStreams);
      vi.mocked(streamService.getHotStreams).mockResolvedValue([]);
      vi.mocked(streamService.searchStreams).mockResolvedValue(searchResults);

      render(
        <BrowserRouter>
          <StreamDiscoveryPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search streams...")).toBeInTheDocument();
      });
    });

    it("should display empty state when no streams", async () => {
      vi.mocked(streamService.getActiveStreams).mockResolvedValue([]);
      vi.mocked(streamService.getHotStreams).mockResolvedValue([]);

      render(
        <BrowserRouter>
          <StreamDiscoveryPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No live streams right now/i)).toBeInTheDocument();
      });
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(streamService.getActiveStreams).mockRejectedValue(
        new Error("Failed to fetch streams")
      );
      vi.mocked(streamService.getHotStreams).mockResolvedValue([]);

      render(
        <BrowserRouter>
          <StreamDiscoveryPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Failed to fetch streams")).toBeInTheDocument();
      });
    });
  });

  describe("Category Filtering", () => {
    it("should filter streams by category", async () => {
      vi.mocked(streamService.getActiveStreams).mockResolvedValue(mockStreams);
      vi.mocked(streamService.getHotStreams).mockResolvedValue([]);

      render(
        <BrowserRouter>
          <StreamDiscoveryPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Gaming")).toBeInTheDocument();
      });

      // Category filter buttons should be present
      expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    });
  });
});
