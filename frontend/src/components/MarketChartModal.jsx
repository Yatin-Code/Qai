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
          <div className="relative w-full overflow-hidden border border-white/10 bg-black/40 mt-8 rounded-2xl shadow-inner backdrop-blur-md">
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
              <div className="absolute top-4 left-4 text-[9px] font-black tracking-widest uppercase px-3 py-1 bg-white/5 border border-white/10 text-white/60 rounded-lg backdrop-blur-md">
                  1Y PEAK: <span className="text-green-400 font-bold">${maxPrice.toFixed(2)}</span>
              </div>
              <div className="absolute bottom-4 left-4 text-[9px] font-black tracking-widest uppercase px-3 py-1 bg-white/5 border border-white/10 text-white/60 rounded-lg backdrop-blur-md">
                  1Y FLOOR: <span className="text-red-400 font-bold">${minPrice.toFixed(2)}</span>
              </div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0a0a0a] border border-white/10 w-full max-w-4xl overflow-hidden relative shadow-[0_40px_80px_rgba(0,0,0,0.8)] rounded-3xl text-white"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <form onSubmit={handleSearch} className="flex items-center space-x-3 text-white font-mono text-sm w-3/4">
            <Globe size={18} className="text-primary animate-pulse" />
            <div className="w-px h-6 bg-white/10"></div>
            <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="ENTER ANY GLOBAL TICKER (e.g. MSFT, IBM, COIN)..."
                className="bg-transparent border-none outline-none flex-1 uppercase tracking-widest font-black text-white placeholder-white/20 focus:placeholder-transparent text-sm"
                autoFocus
            />
            <button type="submit" className="hidden">SEARCH</button>
          </form>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-all bg-white/5 p-2 rounded-full border border-white/10">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 font-mono min-h-[450px] relative">
          <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-[#0a0a0a] z-10">
                   <div className="w-12 h-12 border-4 border-white/10 border-t-primary rounded-full animate-spin"></div>
                   <span className="text-[10px] uppercase font-black tracking-widest animate-pulse text-white/40">Rerouting satellites to {symbol}...</span>
                </motion.div>
              ) : error ? (
                <motion.div key="error" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-[#0a0a0a] z-10">
                    <div className="text-red-500 font-black text-xl tracking-widest uppercase bg-white/5 px-8 py-6 border border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] rounded-2xl">
                        [!] {error}
                    </div>
                </motion.div>
              ) : data ? (
                <motion.div key="data" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-10">
                   <div className="flex justify-between items-start border-l-4 border-primary pl-6">
                       <div>
                           <h2 className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl">{data.symbol}</h2>
                           <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mt-3 bg-white/5 inline-block px-3 py-1 rounded-md border border-white/10">{data.name}</p>
                       </div>
                       <div className="text-right">
                           <div className="flex items-center space-x-2 text-5xl font-black text-white tabular-nums tracking-tighter">
                              <span className="text-white/20 text-2xl font-light">$</span> 
                              <span>{data.current_price.toFixed(2)}</span>
                           </div>
                           <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-4 flex flex-col items-end gap-2">
                               <span className="bg-white/5 px-2 py-1 rounded border border-white/10">Market Capitalization</span>
                               <span className="text-white mt-1 text-base">{data.market_cap !== 'N/A' ? `$${(data.market_cap / 1e9).toFixed(2)}B` : 'Unclassified'}</span>
                           </div>
                       </div>
                   </div>
                   
                   {/* Inject the custom SVG Data Graph */}
                   {renderChart()}
                   
                   <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] border-t border-white/5 pt-8 flex justify-between">
                     <span className="flex items-center gap-2"><Search size={12}/> Live Intelligence Loop Active</span>
                     <span>Financial Telemtry v4.2</span>
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
