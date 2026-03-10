import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Cpu, Briefcase, Landmark, FlaskConical, BarChart3, Settings, Search } from 'lucide-react';

const Sidebar = ({ activeCategory, setActiveCategory, onDeepDive, onGlobalSearch, theme }) => {
  const isTerminal = theme === 'terminal';
  const categories = [
    { id: 'dashboard', name: 'Command Center', icon: <LayoutDashboard size={20} /> },
    { id: 'early_signals', name: 'Early Signals', icon: <Cpu size={20} /> },
    { id: 'tech', name: 'Technology & AI', icon: <Cpu size={20} /> },
    { id: 'business', name: 'Markets & Biz', icon: <Briefcase size={20} /> },
    { id: 'politics', name: 'Policy & Gov', icon: <Landmark size={20} /> },
    { id: 'research', name: 'Deep Research', icon: <FlaskConical size={20} /> },
  ];

  const [marketData, setMarketData] = useState([]);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/market');
        if (res.ok) {
          const data = await res.json();
          setMarketData(data);
        }
      } catch (err) {
        console.error("Failed to fetch market data");
      }
    };
    fetchMarket();
    const interval = setInterval(fetchMarket, 60000 * 5); // Refresh every 5 mins
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`w-64 h-screen fixed left-0 top-0 backdrop-blur-3xl border-r flex flex-col pt-8 pb-6 px-4 z-50 transition-colors duration-500 ${isTerminal ? 'bg-black border-white/10' : 'bg-white/60 border-border/50 shadow-sm'}`}>
      
      {/* Logo Area */}
      <div className="flex items-center space-x-3 mb-10 px-2 cursor-pointer pb-2">
        <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-xl shadow-sm bg-gradient-to-br from-primary to-accent text-white">
            <span className="text-xl font-bold font-sans">Q</span>
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-lg font-bold tracking-tight text-textMain leading-tight">QAI Desktop</span>
          <span className="text-[11px] text-textMuted font-medium">Intelligence</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 mt-4">
        <p className="text-[11px] font-semibold text-textMuted tracking-wide uppercase mb-3 px-3">Data Ecosystem</p>
        
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? (isTerminal ? 'bg-primary text-black font-black' : 'bg-primary/10 text-primary font-semibold') 
                  : (isTerminal ? 'text-white/60 hover:bg-white/10 hover:text-white' : 'text-textMuted hover:bg-black/5 hover:text-textMain')
              }`}
            >
              <span className={`${isActive ? 'text-primary' : 'text-textMuted'} transition-colors`}>
                {category.icon}
              </span>
              <span className="text-sm tracking-tight">{category.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Market Trends Widget */}
      <div className="mb-8 pt-6 px-1">
         <div className="flex justify-between items-center mb-4 px-2">
            <p className="text-[11px] font-semibold text-textMuted tracking-wide uppercase">Markets</p>
            <button 
                onClick={() => onGlobalSearch && onGlobalSearch()} 
                className="flex items-center space-x-1 text-[10px] bg-white border border-border/60 hover:border-border text-textMain px-2.5 py-1 rounded-full shadow-sm transition-all hover:shadow-md font-medium"
            >
                <Search size={10} />
                <span>Global Search</span>
            </button>
         </div>
         <div className="space-y-3 px-2">
            {marketData.length === 0 ? (
               <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"></div>
                  <span className="text-[11px] text-textMuted font-medium">Loading telemetry...</span>
               </div>
            ) : (
                marketData.map((stock) => (
                  <div key={stock.symbol} className={`flex justify-between items-center text-xs font-medium ${isTerminal ? 'font-terminal' : ''}`}>
                     <span 
                         className={`${isTerminal ? 'text-white' : 'text-textMain'} cursor-pointer hover:text-primary transition-colors`}
                         onClick={() => onDeepDive && onDeepDive(stock.symbol)}
                     >
                         {stock.symbol}
                     </span>
                     <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${stock.change_pct >= 0 ? (isTerminal ? 'text-success' : 'bg-green-100 text-green-700') : (isTerminal ? 'text-error' : 'bg-red-100 text-red-700')}`}>
                         {isTerminal && (stock.change_pct >= 0 ? '+' : '')}{stock.change_pct.toFixed(2)}%
                     </span>
                  </div>
                ))
            )}
         </div>
      </div>

      {/* Bottom Actions */}
      <div className="space-y-1 mt-auto text-sm pt-4">
        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-textMuted hover:bg-black/5 hover:text-textMain transition-all">
          <BarChart3 size={18} />
          <span className="font-medium tracking-tight">Source Ledger</span>
        </button>
        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-textMuted hover:bg-black/5 hover:text-textMain transition-all">
          <Settings size={18} />
          <span className="font-medium tracking-tight">Preferences</span>
        </button>
      </div>

    </div>
  );
};

export default Sidebar;
