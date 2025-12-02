import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useStreamStore } from "../store/streamStore";
import { useWebRTC } from "../hooks/useWebRTC";
import { streamService } from "../services/streamService";
import type { StreamQuality } from "../types";

export default function StreamCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setCurrentStream } = useStreamStore();
  const {
    isInitialized,
    localStream,
    videoRef,
    error: webrtcError,
    initializeMedia,
    stopMedia,
  } = useWebRTC();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Gaming");
  const [quality, setQuality] = useState<StreamQuality>("720p");
  const [enableChat, setEnableChat] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  const handlePreview = async () => {
    try {
      await initializeMedia(quality);
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStartStream = async () => {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a stream title");
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      // Ensure media is initialized
      if (!isInitialized) {
        await initializeMedia(quality);
      }

      // Start stream on backend
      const response = await streamService.startStream(user.id, {
        title: title.trim(),
        category,
        quality,
        enableChat,
      });

      setCurrentStream(response.stream);

      // Navigate to streaming dashboard
      navigate(`/stream/${response.stream.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start stream");
      setIsStarting(false);
    }
  };

  const categories = [
    "Gaming",
    "Music",
    "Art",
    "Technology",
    "Education",
    "Entertainment",
    "Sports",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">Create Stream</h1>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Configuration Form */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Stream Configuration</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                    Stream Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="Enter stream title"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="quality" className="block text-sm font-medium text-gray-300 mb-2">
                    Video Quality
                  </label>
                  <select
                    id="quality"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as StreamQuality)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="720p">720p (HD)</option>
                    <option value="1080p">1080p (Full HD)</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    id="enableChat"
                    type="checkbox"
                    checked={enableChat}
                    onChange={(e) => setEnableChat(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="enableChat" className="ml-2 text-sm text-gray-300">
                    Enable chat
                  </label>
                </div>
              </div>

              {(error || webrtcError) && (
                <div className="mt-4 p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-200 text-sm">
                  {error || webrtcError}
                </div>
              )}

              <div className="mt-6 space-y-3">
                {!showPreview ? (
                  <button
                    onClick={handlePreview}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                  >
                    Preview Camera
                  </button>
                ) : (
                  <button
                    onClick={handleStartStream}
                    disabled={isStarting || !isInitialized}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
                  >
                    {isStarting ? "Starting Stream..." : "Start Stream"}
                  </button>
                )}
              </div>

              <p className="mt-4 text-sm text-gray-400">
                * A memecoin will be automatically created when you start streaming
              </p>
            </div>

            {/* Video Preview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Preview</h2>
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {showPreview && isInitialized ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <p>Click "Preview Camera" to see your video</p>
                    </div>
                  </div>
                )}
              </div>

              {showPreview && isInitialized && (
                <div className="mt-4 p-3 bg-green-900 bg-opacity-50 border border-green-500 rounded text-green-200 text-sm">
                  ✓ Camera and microphone ready
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
