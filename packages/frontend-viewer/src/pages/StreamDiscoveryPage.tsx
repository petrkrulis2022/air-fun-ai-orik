// Stream discovery page with search, filters, and hot streams

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Stream } from "../types";
import { streamService } from "../services/streamService";
import { SearchBar } from "../components/SearchBar";
import { CategoryFilter } from "../components/CategoryFilter";
import { StreamGrid } from "../components/StreamGrid";

const CATEGORIES = ["Gaming", "Music", "Art", "Tech", "Just Chatting", "Crypto"];

export function StreamDiscoveryPage() {
  const navigate = useNavigate();
  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [hotStreams, setHotStreams] = useState<Stream[]>([]);
  const [filteredStreams, setFilteredStreams] = useState<Stream[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch active streams
  const fetchActiveStreams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const streams = await streamService.getActiveStreams({
        category: selectedCategory || undefined,
      });
      setActiveStreams(streams);
      setFilteredStreams(streams);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch streams");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Fetch hot streams
  const fetchHotStreams = useCallback(async () => {
    try {
      const streams = await streamService.getHotStreams(6);
      setHotStreams(streams);
    } catch (err) {
      console.error("Failed to fetch hot streams:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchActiveStreams();
    fetchHotStreams();
  }, [fetchActiveStreams, fetchHotStreams]);

  // Handle search
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);

      if (!query.trim()) {
        setFilteredStreams(activeStreams);
        return;
      }

      try {
        const results = await streamService.searchStreams(query);
        setFilteredStreams(results);
      } catch (err) {
        console.error("Search failed:", err);
        // Fallback to client-side filtering
        const filtered = activeStreams.filter(
          (stream) =>
            stream.title.toLowerCase().includes(query.toLowerCase()) ||
            stream.streamerName.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredStreams(filtered);
      }
    },
    [activeStreams]
  );

  // Handle category change
  const handleCategoryChange = useCallback((category: string | null) => {
    setSelectedCategory(category);
    setSearchQuery("");
  }, []);

  // Handle stream click
  const handleStreamClick = useCallback(
    (stream: Stream) => {
      navigate(`/stream/${stream.id}`);
    },
    [navigate]
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-purple-400">air.fun</h1>
            <button
              onClick={() => navigate("/portfolio")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              My Portfolio
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hot Streams Section */}
        {hotStreams.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">🔥 Hot Streams</h2>
            <StreamGrid
              streams={hotStreams}
              onStreamClick={handleStreamClick}
              emptyMessage="No hot streams right now"
            />
          </section>
        )}

        {/* Search and Filters */}
        <section className="mb-8">
          <div className="mb-4">
            <SearchBar onSearch={handleSearch} placeholder="Search streams..." />
          </div>
          <CategoryFilter
            categories={CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        </section>

        {/* All Streams */}
        <section>
          <h2 className="text-2xl font-bold mb-4">
            {selectedCategory ? `${selectedCategory} Streams` : "All Live Streams"}
          </h2>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              <p className="text-gray-400 mt-4">Loading streams...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-4 mb-4">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchActiveStreams}
                className="mt-2 text-sm text-purple-400 hover:text-purple-300"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <StreamGrid
              streams={filteredStreams}
              onStreamClick={handleStreamClick}
              emptyMessage={
                searchQuery
                  ? `No streams found for "${searchQuery}"`
                  : selectedCategory
                    ? `No ${selectedCategory} streams live right now`
                    : "No live streams right now"
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
