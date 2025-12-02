import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StreamDiscoveryPage } from "./pages/StreamDiscoveryPage";
import { StreamViewPage } from "./pages/StreamViewPage";
import { PortfolioPage } from "./pages/PortfolioPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StreamDiscoveryPage />} />
        <Route path="/stream/:streamId" element={<StreamViewPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
