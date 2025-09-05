import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Generator from './components/Generator';
import Gallery from './components/Gallery';
import Ranking from './components/Ranking';
import History from './components/History';

function App() {
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const handleLogoClick = useCallback(() => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    if (newCount >= 4) {
      setShowHistory(true);
      setLogoClickCount(0); // Reset after opening
    }
  }, [logoClickCount]);

  return (
    <div className="min-h-screen bg-brand-dark font-sans">
      <Header onLogoClick={handleLogoClick} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Generator />} />
          <Route path="/galeria" element={<Gallery />} />
          <Route path="/clasificacion" element={<Ranking />} />
        </Routes>
      </main>
      {showHistory && <History onClose={() => setShowHistory(false)} />}
    </div>
  );
}

export default App;