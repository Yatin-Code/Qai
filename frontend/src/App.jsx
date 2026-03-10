import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import NewsDigest from './components/NewsDigest';
import DeepDiveModal from './components/DeepDiveModal';
import MarketChartModal from './components/MarketChartModal';
import MarketTicker from './components/MarketTicker';

function App() {
  const [activeCategory, setActiveCategory] = useState('dashboard');
  const [timeframe, setTimeframe] = useState('week'); // 'day', 'week', 'month'
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deepDiveEntity, setDeepDiveEntity] = useState(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [theme, setTheme] = useState('newsroom'); // 'newsroom' or 'terminal'

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

    // Set up Server-Sent Events (SSE) for Real-Time UI updates
    if (activeCategory === 'dashboard') {
        eventSource = new EventSource('http://localhost:8000/api/stream');
        eventSource.onmessage = (event) => {
            const newInsight = JSON.parse(event.data);
            setInsights((prev) => {
                // Prevent duplicates if already in state
                if (prev.some(item => item.id === newInsight.id)) return prev;
                return [newInsight, ...prev];
            });
        };
        eventSource.onerror = () => {
             console.error("SSE Connection Lost. Attempting reconnect...");
             eventSource.close();
        }
    }

    return () => {
        if (eventSource) eventSource.close();
    };
  }, [activeCategory, timeframe]);

  return (
    <div className={`flex flex-col min-h-screen bg-background text-textMain relative font-sans antialiased transition-colors duration-500 ${theme === 'terminal' ? 'theme-terminal' : ''}`}>
      {/* Live Market Ticker */}
      <MarketTicker theme={theme} />
      
      <div className="flex flex-1 relative">
        {/* Sidebar Navigation */}
        <Sidebar 
            activeCategory={activeCategory} 
            setActiveCategory={setActiveCategory} 
            onDeepDive={setDeepDiveEntity} 
            onGlobalSearch={() => setShowGlobalSearch(true)}
            theme={theme}
        />

        {/* Main Content Area */}
        <main className="flex-1 ml-64 p-8 relative z-10 w-full">
          <div className="max-w-7xl mx-auto">
          


          {/* Digest Header & Time Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-2xl font-black tracking-tight text-textMain">Your Digest</h3>
            </div>
            
            <div className="flex items-center space-x-4">
                {/* Time Filters */}
                <div className="flex p-1 bg-black/5 rounded-xl border border-black/5 overflow-hidden">
                    {['day', 'week', 'month'].map(t => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${timeframe === t ? 'bg-white shadow-sm text-textMain scale-100' : 'text-textMuted hover:text-textMain scale-95 hover:scale-100'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => setTheme(theme === 'newsroom' ? 'terminal' : 'newsroom')}
                        className={`p-2 rounded-xl border transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${theme === 'terminal' ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(255,149,0,0.4)]' : 'bg-white/50 text-textMuted border-white/50 hover:bg-white'}`}
                    >
                        {theme === 'newsroom' ? 'Go Terminal' : 'Back to Newsroom'}
                    </button>
                    <span className="text-xs text-textMuted font-medium bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-border/30 hidden md:block">
                        {loading ? 'Syncing...' : `${insights.length} Items`}
                    </span>
                </div>
            </div>
          </div>

          {/* Status Messages */}
          {loading && (
            <div className="w-full py-20 flex justify-center">
              <div className="flex items-center space-x-3 text-textMuted">
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="font-medium text-sm">Synchronizing data...</span>
              </div>
            </div>
          )}

          {!loading && insights.length === 0 && (
             <div className="w-full py-20 flex justify-center">
              <div className="text-textMuted bg-white/50 px-6 py-4 rounded-2xl shadow-sm border border-border/30 font-medium text-sm">
                No signals detected. Pipeline idle.
              </div>
           </div>
          )}

          {/* News Digest View */}
          <motion.div 
            layout
            className="w-full mt-2"
          >
            {!loading && <NewsDigest insights={insights} onDeepDive={setDeepDiveEntity} theme={theme} />}
          </motion.div>

        </div>
      </main>
      </div>

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
