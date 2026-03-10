import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, PlayCircle, Zap, Loader2, Info, X, ArrowUpRight } from 'lucide-react';

const IntelligenceFeed = ({ category = 'dashboard', timeframe = 'week', onDeepDive }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const observer = useRef();
  const limit = 20;

  // 1. Initial Load & Infinite Scroll Appending
  const fetchEntries = useCallback(async (isInitial = false) => {
    if (loading || (!hasMore && !isInitial)) return;
    
    setLoading(true);
    const currentOffset = isInitial ? 0 : offset;
    
    try {
      let url = `http://localhost:8000/api/insights?limit=${limit}&offset=${currentOffset}&timeframe=${timeframe}`;
      if (category !== 'dashboard') {
          if (category === 'early_signals') url += `&is_mainstream=false`;
          else url += `&category=${category}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.length < limit) setHasMore(false);
      
      setInsights(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const filteredNew = data.filter(item => !existingIds.has(item.id));
        return isInitial ? data : [...prev, ...filteredNew];
      });
      
      setOffset(prev => isInitial ? data.length : prev + data.length);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [offset, loading, hasMore, category, timeframe]);

  // 2. Observer for Infinite Scroll
  const lastElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchEntries();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchEntries]);

  // 3. Effect: Initial Load
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setInsights([]);
    fetchEntries(true);
  }, [category, timeframe]);

  // 4. SSE Stream for Live Prepending
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8000/api/stream');
    
    eventSource.onmessage = (event) => {
      const newInsight = JSON.parse(event.data);
      setInsights(prev => {
        if (prev.some(item => item.id === newInsight.id)) return prev;
        return [newInsight, ...prev];
      });
      setOffset(prev => prev + 1);
    };

    eventSource.onerror = () => {
      console.error("SSE Connection Error. Attempting reconnect...");
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="w-full h-full pb-20">
      <AnimatePresence>
          {selectedItem && (
              <ReaderModal 
                  item={selectedItem} 
                  onClose={() => setSelectedItem(null)} 
              />
          )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid-flow-dense gap-6">
        <AnimatePresence mode="popLayout">
          {insights.map((item, index) => (
             <EditorialItem 
              key={item.id} 
              item={item} 
              index={index} 
              onDeepDive={onDeepDive} 
              onOpenReader={setSelectedItem}
              ref={index === insights.length - 1 ? lastElementRef : null}
             />
          ))}
        </AnimatePresence>
      </div>
      
      {loading && (
        <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-primary/40" size={32} />
        </div>
      )}
      
      {!hasMore && insights.length > 0 && (
        <div className="text-center py-20">
           <span className="text-[10px] font-black uppercase tracking-[0.5em] text-textMuted opacity-30">
              End of Intelligence Archive
           </span>
        </div>
      )}
    </div>
  );
};

const EditorialItem = React.forwardRef(({ item, index, onDeepDive, onOpenReader }, ref) => {
   const isHero = item.signal_strength >= 80;
   const youtubeId = (url => {
      if (!url) return null;
      const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
      return (match && match[2].length === 11) ? match[2] : null;
   })(item.url);

   const getRelativeTime = (timestamp) => {
        if (!timestamp) return 'Now';
        const date = new Date(timestamp.includes('Z') ? timestamp : timestamp + 'Z'); 
        const now = new Date();
        const diffMins = Math.floor((now - date) / 60000);
        if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
   };

   return (
     <motion.div 
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: (index % 4) * 0.1 }}
        className={`relative group overflow-hidden rounded-[2rem] bg-black/5 flex flex-col cursor-pointer ${isHero ? 'md:col-span-2 md:row-span-2 aspect-[4/5] md:aspect-auto' : 'aspect-[4/5]'}`}
        onClick={() => onOpenReader(item)}
     >
        {/* Cinematic Imagery */}
        <div className="absolute inset-0">
            {item.image_url ? (
                <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-110"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                    <span className="text-white/10 font-bold uppercase tracking-widest text-xs">{item.category}</span>
                </div>
            )}
            {/* Dark gradient for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
        </div>

        {/* Top Indicators */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
            <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">{item.sourceName || 'Report'}</span>
                 </div>
                 <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest ml-1">{getRelativeTime(item.created_at)}</span>
            </div>
            
            {/* Minimalist Glowing Sentiment */}
            {item.sentiment && (
                <div className="group/sent relative">
                    <div className={`px-3 py-1 rounded-full backdrop-blur-md border border-white/20 transition-all ${
                        item.sentiment.toUpperCase() === 'BULLISH' ? 'bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 
                        item.sentiment.toUpperCase() === 'BEARISH' ? 'bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]' :
                        'bg-white/10 shadow-none'
                    }`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                            item.sentiment.toUpperCase() === 'BULLISH' ? 'text-green-400' : 
                            item.sentiment.toUpperCase() === 'BEARISH' ? 'text-red-400' : 'text-white'
                        }`}>
                            {item.sentiment}
                        </span>
                    </div>

                    {/* reasoning tooltip */}
                    {item.sentiment_reasoning && (
                        <div className="absolute top-full right-0 mt-2 w-56 p-4 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl opacity-0 invisible group-hover/sent:opacity-100 group-hover/sent:visible transition-all duration-300 z-50 pointer-events-none border border-white/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Info size={12} className="text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-textMain/40">AI Logic</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-textMain/80 font-medium italic">
                                "{item.sentiment_reasoning}"
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Frosted Glass Content Panel */}
        <div className="mt-auto px-6 pb-8 z-10 transform transition-transform duration-700 group-hover:-translate-y-2">
            <div className={`p-6 md:p-8 rounded-[2rem] bg-white/10 backdrop-blur-2xl border border-white/10 shadow-2xl ${isHero ? 'md:max-w-[90%]' : ''}`}>
                <div className="flex flex-col gap-4">
                    <h2 className={`${isHero ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-xl md:text-2xl'} font-black tracking-tighter text-white leading-[1.15] mb-1 drop-shadow-sm line-clamp-3`}>
                        {item.title}
                    </h2>
                    
                    <p className={`text-white/80 leading-relaxed font-medium ${isHero ? 'text-sm md:text-base line-clamp-3' : 'text-xs md:text-sm line-clamp-2'}`}>
                        {item.summary}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                         <div className="flex gap-2">
                            {item.entities && item.entities.slice(0, 2).map(entity => (
                                <span key={entity} className="text-[9px] font-black text-white/40 uppercase tracking-widest">#{entity}</span>
                            ))}
                         </div>
                         <div className="flex items-center gap-2">
                            {youtubeId && <PlayCircle size={16} className="text-white/40" />}
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-widest transition-transform hover:scale-105 active:scale-95">
                                Read
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Hero Signal Badge */}
        {isHero && (
            <div className="absolute bottom-6 right-6 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <Zap size={20} fill="currentColor" />
                </div>
                <div className="mt-2 text-[10px] font-black text-white uppercase tracking-tighter">
                   Signal {item.signal_strength}%
                </div>
            </div>
        )}
     </motion.div>
   );
});

const ReaderModal = ({ item, onClose }) => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/reader?url=${encodeURIComponent(item.url)}`);
                const data = await res.json();
                setContent(data);
            } catch (err) {
                console.error("Reader fail:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [item.url]);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-xl"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 40 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full max-w-5xl max-h-[90vh] bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 p-4 rounded-full bg-black/5 hover:bg-black/10 transition-all z-10 group"
                >
                    <X size={24} className="text-textMain group-hover:rotate-90 transition-transform duration-300" />
                </button>

                <div className="overflow-y-auto flex-1 p-8 md:p-20">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-center gap-4 mb-8 text-[11px] font-black tracking-[0.3em] uppercase text-primary">
                            <span>{item.sourceName}</span>
                            <div className="w-1 h-1 rounded-full bg-black/10" />
                            <span className="text-textMuted/60">Journal Entry</span>
                        </div>

                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-textMain leading-[1.05] mb-12 font-display">
                            {item.title}
                        </h2>

                        <div className="flex items-center gap-6 mb-16 pb-16 border-b border-black/5">
                             <div className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest ${
                                item.sentiment?.toUpperCase() === 'BULLISH' ? 'bg-green-500 text-white' : 
                                item.sentiment?.toUpperCase() === 'BEARISH' ? 'bg-red-500 text-white' : 'bg-black/5 text-textMuted'
                             }`}>
                                {item.sentiment || 'Neutral'} Signal
                             </div>
                             <div className="text-[11px] font-bold text-textMuted uppercase tracking-widest">
                                Processing Confidence: {item.signal_strength}%
                             </div>
                        </div>

                        {loading ? (
                            <div className="space-y-8 animate-pulse">
                                <div className="h-4 bg-black/5 rounded-full w-full"></div>
                                <div className="h-4 bg-black/5 rounded-full w-5/6"></div>
                                <div className="h-4 bg-black/5 rounded-full w-full"></div>
                                <div className="h-4 bg-black/5 rounded-full w-4/5"></div>
                                <div className="h-4 bg-black/5 rounded-full w-full"></div>
                                <div className="h-4 bg-black/5 rounded-full w-3/4"></div>
                            </div>
                        ) : (
                            <div className="prose prose-2xl max-w-none text-textMain/70 leading-relaxed font-serif selection:bg-primary/20">
                                {content?.content ? (
                                    content.content.split('\n\n').map((para, i) => (
                                        <p key={i} className="mb-10 first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:mt-3 first-letter:text-primary">{para}</p>
                                    ))
                                ) : (
                                    <div className="py-20 text-center">
                                        <p className="text-textMuted mb-8 italic">Journal synthesis incomplete. Accessing direct neural link recommended.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-20 pt-20 border-t border-black/5 flex flex-col items-center gap-8 text-center">
                            <p className="text-textMuted text-xs font-medium max-w-sm">Deeply interested in this signal? Access the full documentation at the origin source.</p>
                            <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white rounded-full font-black uppercase tracking-widest text-[11px] hover:bg-primary transition-all group shadow-xl hover:shadow-primary/20"
                            >
                                Open Neural Source <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default IntelligenceFeed;


