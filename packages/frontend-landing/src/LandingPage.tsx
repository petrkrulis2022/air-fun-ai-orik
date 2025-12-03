export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-darkBg via-darkCard to-darkBg text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-neonBlue/10 via-neonPurple/10 to-neonGreen/10 animate-pulse-glow"></div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Logo/Title */}
          <div className="mb-8">
            <h1 className="text-7xl md:text-9xl font-bold gradient-text mb-4 animate-float">
              air.fun
            </h1>
            <p className="text-neonBlue text-sm md:text-base tracking-widest uppercase">
              🚀 Welcome to the Future of Streaming
            </p>
          </div>

          {/* Main Headline */}
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Stream Reality. <span className="text-neonPurple">Bid on Dreams.</span>
            <br />
            <span className="text-neonGreen">Own the Future.</span>
          </h2>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-4xl mx-auto">
            Experience the world's first AR livestreaming platform powered by AI agents and
            blockchain technology.
          </p>
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
            Stream in immersive augmented reality on Meta Quest 3. Place 3D agents with your hands.
            Watch others bid in real-time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-16">
            <a
              href="http://localhost:5191"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-8 py-4 bg-gradient-to-r from-neonBlue to-neonPurple rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 neon-glow hover:neon-glow-purple min-w-[280px]"
            >
              <span className="flex items-center justify-center gap-2">🎥 Launch Streamer App</span>
              <p className="text-sm font-normal text-gray-200 mt-1">Start streaming in AR</p>
            </a>

            <a
              href="http://localhost:5192"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative px-8 py-4 bg-gradient-to-r from-neonPurple to-neonGreen rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 neon-glow-purple hover:neon-glow-green min-w-[280px]"
            >
              <span className="flex items-center justify-center gap-2">👀 Launch Viewer App</span>
              <p className="text-sm font-normal text-gray-200 mt-1">Watch and bid on streams</p>
            </a>
          </div>

          {/* Live Indicator */}
          <div className="flex items-center justify-center gap-2 text-neonPink animate-pulse">
            <div className="w-3 h-3 bg-neonPink rounded-full"></div>
            <span className="text-sm font-semibold">LIVE NOW</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            ⚡ Powered by <span className="gradient-text">Cutting-Edge Technology</span>
          </h2>
          <p className="text-center text-gray-400 mb-16 text-lg">
            The future of livestreaming is here
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass rounded-2xl p-8 hover:neon-glow transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">🥽</div>
              <h3 className="text-2xl font-bold mb-3 text-neonBlue">Immersive AR Streaming</h3>
              <p className="text-gray-300">
                Stream and watch in passthrough AR on Quest 3. Use hand tracking to interact
                naturally.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass rounded-2xl p-8 hover:neon-glow-purple transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold mb-3 text-neonPurple">3D AI Agents</h3>
              <p className="text-gray-300">
                Place interactive cyber head agents in your space. Viewers bid for agent
                interactions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass rounded-2xl p-8 hover:neon-glow-green transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-2xl font-bold mb-3 text-neonGreen">Live Auctions</h3>
              <p className="text-gray-300">
                Real-time bidding system with USDC payments. Powered by Thirdweb multi-chain
                support.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass rounded-2xl p-8 hover:neon-glow transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">🔗</div>
              <h3 className="text-2xl font-bold mb-3 text-neonBlue">Multi-Chain Support</h3>
              <p className="text-gray-300">
                Built on Ethereum Sepolia, Base Sepolia, and Hedera Testnet for maximum flexibility.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass rounded-2xl p-8 hover:neon-glow-purple transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">📡</div>
              <h3 className="text-2xl font-bold mb-3 text-neonPurple">WebRTC Streaming</h3>
              <p className="text-gray-300">
                Low-latency peer-to-peer streaming with Supabase signaling and multi-viewer support.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass rounded-2xl p-8 hover:neon-glow-green transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4">🎮</div>
              <h3 className="text-2xl font-bold mb-3 text-neonGreen">Hand Tracking</h3>
              <p className="text-gray-300">
                Natural interaction with Quest 3 hand tracking. Place and control agents with
                gestures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-darkCard to-darkBg">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            📍 How <span className="gradient-text">air.fun</span> Works
          </h2>
          <p className="text-center text-gray-400 mb-16 text-lg">Get started in 6 simple steps</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { num: "1️⃣", title: "Connect Your Wallet", desc: "Link your wallet via Thirdweb" },
              { num: "2️⃣", title: "Put On Quest 3", desc: "Enable passthrough AR mode" },
              { num: "3️⃣", title: "Place AI Agents", desc: "Use hand tracking to position agents" },
              { num: "4️⃣", title: "Start Streaming", desc: "Go live with WebRTC streaming" },
              {
                num: "5️⃣",
                title: "Viewers Join & Bid",
                desc: "Watch in AR and bid on agent interactions",
              },
              { num: "6️⃣", title: "Earn USDC", desc: "Receive payments from winning bids" },
            ].map((step, idx) => (
              <div
                key={idx}
                className="glass rounded-xl p-6 text-center hover:scale-105 transition-transform"
              >
                <div className="text-4xl mb-3">{step.num}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-neonBlue/20 via-neonPurple/20 to-neonGreen/20"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            🎬 Ready to <span className="gradient-text">Start?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12">Join the AR streaming revolution today</p>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <a
              href="http://localhost:5191"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 bg-gradient-to-r from-neonBlue to-neonPurple rounded-xl font-bold text-xl transition-all duration-300 hover:scale-110 neon-glow min-w-[300px]"
            >
              🎥 Launch Streamer App
              <p className="text-sm font-normal mt-1">Start broadcasting in augmented reality</p>
            </a>

            <a
              href="http://localhost:5192"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 bg-gradient-to-r from-neonPurple to-neonGreen rounded-xl font-bold text-xl transition-all duration-300 hover:scale-110 neon-glow-green min-w-[300px]"
            >
              👀 Launch Viewer App
              <p className="text-sm font-normal mt-1">Explore live AR streams and bid on agents</p>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400 mb-4">Built for Meta Horizon Start Competition</p>
          <div className="flex justify-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-neonBlue transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-neonPurple transition-colors">
              Documentation
            </a>
            <a href="#" className="hover:text-neonGreen transition-colors">
              Contact
            </a>
          </div>
          <p className="text-gray-600 mt-6 text-sm">
            © 2024 air.fun - Stream Reality. Bid on Dreams. Own the Future.
          </p>
        </div>
      </footer>
    </div>
  );
}
