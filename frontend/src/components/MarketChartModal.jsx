import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Globe } from 'lucide-react';

const MarketChartModal = ({ onClose, initialSymbol = 'AAPL' }) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [searchInput, setSearchInput] = useState(initialSymbol);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;
    
    let active = true;
    const fetchMarketData = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await fetch(`http://localhost:8000/api/market/${symbol}`);
        if (res.ok && active) {
          const json = await res.json();
          if (json.error) {
              setError(json.error);
          } else {
              setData(json);
              setSearchInput(json.symbol);
          }
        } else if (active) {
            setError("Failed to reach financial servers.");
        }
      } catch (err) {
        if (active) setError("Network error fetching telemetry.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchMarketData();
    return () => { active = false; };
  }, [symbol]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.trim().toUpperCase());
    }
  };

  // Generate Native SVG Graph
  const renderChart = () => {
      if (!data || !data.historical || data.historical.length === 0) return null;
      
      const history = data.historical;
      const prices = history.map(d => d.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // Buffer the domain slightly so lines don't clip the SVG border
      const buffer = (maxPrice - minPrice) * 0.1;
      const renderMin = minPrice - buffer;
      const renderMax = maxPrice + buffer;
      const range = renderMax - renderMin || 1;
      
      const width = 800;
      const height = 300;
      const padding = 0; // Handled by SVG viewbox
      
      // SVG Polyline Path Generation
      const points = history.map((d, i) => {
          const x = padding + (i / (history.length - 1)) * (width - padding * 2);
          const y = height - padding - ((d.price - renderMin) / range) * (height - padding * 2);
          return `${x},${y}`;
      }).join(' ');

      // Determine Trend Color
      const isPositive = history[history.length - 1].price >= history[0].price;
      const strokeColor = isPositive ? '#22c55e' : '#ef4444'; // Tech Green or Alert Red
      const gradientId = isPositive ? 'gradGreen' : 'gradRed';

      // SVG fill path for aesthetics
      const fillPoints = `${width},${height} 0,${height} ${points}`;

      return (
          <div className="relative w-full overflow-hidden border border-neutral-800 bg-surface mt-8 rounded shadow-inner">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 block">
                <defs>
                  <linearGradient id="gradGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gradRed" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={fillPoints} fill={`url(#${gradientId})`} />
                <polyline 
                    fill="none" 
                    stroke={strokeColor} 
                    strokeWidth="3" 
                    strokeLinejoin="round"
                    points={points} 
                />
              </svg>
              
              {/* Crosshair High/Low Overlays */}
              <div className="absolute top-4 left-4 text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-1 bg-background border border-neutral-800 text-textMain shadow-md">
                  1Y PEAK: <span className="text-green-500">${maxPrice.toFixed(2)}</span>
              </div>
              <div className="absolute bottom-4 left-4 text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-1 bg-background border border-neutral-800 text-textMain shadow-md">
                  1Y FLOOR: <span className="text-red-500">${minPrice.toFixed(2)}</span>
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-surface border border-neutral-800 w-full max-w-4xl overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.9)]"
      >
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-background">
          <form onSubmit={handleSearch} className="flex items-center space-x-3 text-textMain font-mono text-sm w-3/4">
            <Globe size={18} className="text-textMain animate-pulse" />
            <div className="w-px h-6 bg-neutral-800"></div>
            <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ENTER ANY GLOBAL TICKER (e.g. MSFT, IBM, COIN)..."
                className="bg-transparent border-none outline-none flex-1 uppercase tracking-widest font-black text-textMain placeholder-neutral-600 focus:placeholder-transparent"
                autoFocus
            />
            <button type="submit" className="hidden">SEARCH</button>
          </form>
          <button onClick={onClose} className="text-textMuted hover:text-white transition-colors bg-surfaceHighlight p-1 border border-neutral-800">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 font-mono min-h-[450px] relative">
          <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-surface z-10">
                   <div className="w-12 h-12 border-4 border border-neutral-800 border-t-textMain rounded-full animate-spin"></div>
                   <span className="text-xs uppercase font-bold tracking-widest animate-pulse text-textMuted">Rerouting satellites to {symbol}...</span>
                </motion.div>
              ) : error ? (
                <motion.div key="error" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-surface z-10">
                    <div className="text-red-500 font-black text-xl tracking-widest uppercase bg-background px-6 py-4 border border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.2)]">
                        [!] {error}
                    </div>
                </motion.div>
              ) : data ? (
                <motion.div key="data" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-6">
                   <div className="flex justify-between items-start border-l-4 border-textMain pl-4">
                       <div>
                           <h2 className="text-5xl font-black tracking-tighter text-textMain drop-shadow-md">{data.symbol}</h2>
                           <p className="text-sm text-textMuted uppercase tracking-widest mt-2 bg-background inline-block px-2 py-0.5 border border-neutral-800">{data.name}</p>
                       </div>
                       <div className="text-right">
                           <div className="flex items-center space-x-2 text-4xl font-mono text-textMain tabular-nums">
                              <span className="text-textMuted text-xl">$</span> 
                              <span>{data.current_price.toFixed(2)}</span>
                           </div>
                           <div className="text-xs text-textMuted uppercase tracking-widest mt-3 flex flex-col items-end">
                               <span className="bg-surfaceHighlight px-2 border border-border">MARKET CAP</span>
                               <span className="font-bold text-textMain mt-1">{data.market_cap !== 'N/A' ? `$${(data.market_cap / 1e9).toFixed(2)}B USD` : 'UNKNOWN CLASSIFICATION'}</span>
                           </div>
                       </div>
                   </div>
                   
                   {/* Inject the custom SVG Data Graph */}
                   {renderChart()}
                   
                   <div className="text-[10px] text-textMuted uppercase tracking-widest border-t border-neutral-800 pt-4 flex justify-between">
                     <span className="flex items-center"><Search size={10} className="mr-2"/> LIVE GLOBAL CRAWLER ACTIVE</span>
                     <span>YFINANCE DATA ROUTING</span>
                   </div>
                </motion.div>
              ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default MarketChartModal;
