import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import NewsDigest from './components/NewsDigest';
import IntelligenceFeed from './components/IntelligenceFeed';
import DeepDiveModal from './components/DeepDiveModal';
import MarketChartModal from './components/MarketChartModal';
import MarketTicker from './components/MarketTicker';
import { LayoutGrid, Cpu, TrendingUp, Search, Zap } from 'lucide-react';

function App() {
  const [activeCategory, setActiveCategory] = useState('dashboard');
  const [timeframe, setTimeframe] = useState('week'); 
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deepDiveEntity, setDeepDiveEntity] = useState(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Fetch data from FastAPI backend
  React.useEffect(() => {
    let eventSource;

    const fetchInsights = async () => {
      setLoading(true);
      try {
        let url;
        if (activeCategory === 'dashboard') {
          url = `http://localhost:8000/api/insights?timeframe=${timeframe}`;
        } else if (activeCategory === 'early_signals') {
          url = `http://localhost:8000/api/insights?is_mainstream=false&timeframe=${timeframe}`;
        } else {
          url = `http://localhost:8000/api/insights?category=${activeCategory}&timeframe=${timeframe}`;
        }
          
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setInsights(data);
        } else {
          console.error("Failed to fetch insights");
        }
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();

    return () => {
        // SSE is now handled inside IntelligenceFeed for better encapsulation
    };
  }, [activeCategory, timeframe]);

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white relative font-sans antialiased overflow-x-hidden">
      {/* PHASE 2: Mesh Gradient & Film Grain */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0a0f24] rounded-full blur-[120px] opacity-50" />
         <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] bg-[#120822] rounded-full blur-[120px] opacity-40" />
         <div className="absolute bottom-[-10%] left-[30%] w-[40%] h-[40%] bg-[#0f0a1a] rounded-full blur-[120px] opacity-30" />
      </div>

      {/* Film Grain Noise */}
      <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.15] mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />

      <MarketTicker />
      
      <div className="relative z-10">
        {/* Main Content Area */}
        <main className="w-full px-6 py-12 md:px-12 md:py-20 flex flex-col items-center">
          <div className="w-full max-w-[1600px]">
          
          {/* Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-px bg-primary" />
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Intelligence Portal</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
                 {activeCategory === 'dashboard' ? 'Command Center' : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
              </h1>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="flex p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                    {['day', 'week', 'month'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${timeframe === t ? 'bg-white text-black shadow-2xl scale-100' : 'text-white/40 hover:text-white scale-95'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        {loading ? 'Syncing Base' : `${insights.length} Linked Signals`}
                    </span>
                </div>
            </div>
          </div>

          {/* News Digest View */}
          <motion.div 
            layout
            className="w-full mt-2"
          >
            {!loading && (
              activeCategory === 'dashboard' || activeCategory === 'early_signals' ? (
                <IntelligenceFeed 
                  category={activeCategory} 
                  timeframe={timeframe} 
                  onDeepDive={setDeepDiveEntity} 
                />
              ) : (
                <NewsDigest insights={insights} onDeepDive={setDeepDiveEntity} />
              )
            )}
          </motion.div>

        </div>
      </main>
      </div>

      {/* PHASE 3: Floating Command Dock */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 p-2 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
           {[
             { id: 'dashboard', label: 'Terminal', icon: LayoutGrid },
             { id: 'early_signals', label: 'Signals', icon: Zap },
             { id: 'technology', label: 'Systems', icon: Cpu },
             { id: 'finance', label: 'Markets', icon: TrendingUp },
           ].map((nav) => (
             <button
               key={nav.id}
               onClick={() => setActiveCategory(nav.id)}
               className={`group relative flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-500 
                          ${activeCategory === nav.id ? 'bg-white text-black scale-100' : 'text-white/40 hover:text-white/80 hover:bg-white/5 scale-95'}`}
             >
               <nav.icon size={18} className={`${activeCategory === nav.id ? 'text-black' : 'text-inherit'} transition-colors group-hover:scale-110 duration-300`} />
               <span className="text-[10px] font-black uppercase tracking-widest">{nav.label}</span>
               {activeCategory === nav.id && (
                 <motion.div layoutId="dock-glow" className="absolute inset-0 bg-white/20 blur-xl rounded-full -z-10" />
               )}
             </button>
           ))}
           
           <div className="w-px h-6 bg-white/10 mx-2" />
           
           <button 
             onClick={() => setShowGlobalSearch(true)}
             className="p-3 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all"
           >
             <Search size={18} />
           </button>
        </div>
      </nav>

      {/* Modal Overlays */}
      <AnimatePresence>
         {deepDiveEntity && (
             <DeepDiveModal entity={deepDiveEntity} onClose={() => setDeepDiveEntity(null)} />
         )}
         {showGlobalSearch && (
             <MarketChartModal onClose={() => setShowGlobalSearch(false)} initialSymbol="NVDA" />
         )}
      </AnimatePresence>
    </div>
  );
}

export default App;
