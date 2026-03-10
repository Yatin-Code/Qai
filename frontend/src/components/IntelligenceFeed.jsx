import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronDown, PlayCircle, Zap, Loader2 } from 'lucide-react';

const IntelligenceFeed = ({ category = 'dashboard', timeframe = 'week', onDeepDive }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
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
        // Prevent duplicates
        if (prev.some(item => item.id === newInsight.id)) return prev;
        return [newInsight, ...prev];
      });
      // Adjust offset because we prepended an item
      setOffset(prev => prev + 1);
    };

    eventSource.onerror = () => {
      console.error("SSE Connection Error. Attempting reconnect...");
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="w-full flex flex-col gap-3 pb-20">
      <AnimatePresence mode="popLayout">
        {insights.map((item, index) => (
           <FeedItem 
            key={item.id} 
            item={item} 
            index={index} 
            onDeepDive={onDeepDive} 
            ref={index === insights.length - 1 ? lastElementRef : null}
           />
        ))}
      </AnimatePresence>
      
      {loading && (
        <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      )}
      
      {!hasMore && insights.length > 0 && (
        <div className="text-center py-10 text-textMuted text-xs font-bold uppercase tracking-widest opacity-50">
           End of Intelligence Feed
        </div>
      )}
    </div>
  );
};

const FeedItem = React.forwardRef(({ item, index, onDeepDive }, ref) => {
   const [isExpanded, setIsExpanded] = useState(false);
   const isHighlyRelevant = item.signal_strength > 70;
   
   const getRelativeTime = (timestamp) => {
        if (!timestamp) return 'Live';
        const date = new Date(timestamp.includes('Z') ? timestamp : timestamp + 'Z'); 
        const now = new Date();
        const diffMins = Math.floor((now - date) / 60000);
        if (diffMins < 60) return `${Math.max(1, diffMins)}m`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h`;
        return `${Math.floor(diffHours / 24)}d`;
   };

   const getYouTubeId = (url) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
   };

   const youtubeId = getYouTubeId(item.url);

   return (
     <motion.div 
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={`apple-panel-interactive flex flex-col overflow-hidden relative ${isExpanded ? 'bg-white/80 shadow-md ring-1 ring-primary/20' : 'bg-white/40 shadow-sm'} ${isHighlyRelevant ? 'border-l-4 border-l-primary' : 'border border-white/50'}`}
     >
        {isHighlyRelevant && (
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" />
        )}

        {/* Main Row / Header */}
        <div 
            className="flex items-center px-5 py-4 cursor-pointer select-none"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Relevance Score Pill */}
            <div className="w-16 shrink-0 flex items-center justify-center">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${isHighlyRelevant ? 'bg-primary text-white shadow-[0_0_10px_rgba(0,113,227,0.3)]' : 'bg-black/5 text-textMuted'}`}>
                    <Zap size={10} className={isHighlyRelevant ? 'text-white fill-white' : ''} />
                    <span>{item.signal_strength}</span>
                </div>
            </div>

            {/* Headline and Source */}
            <div className="flex-1 px-3 flex flex-col justify-center min-w-0">
               <div className="flex items-center gap-2 mb-1">
                   {youtubeId && <PlayCircle size={14} className="text-red-500 shrink-0" />}
                   <h4 className={`text-[15px] font-bold tracking-tight truncate w-full ${isHighlyRelevant ? 'text-textMain' : 'text-textMain/80'}`}>
                       {item.title}
                   </h4>
               </div>
               <div className="flex items-center gap-3 text-[11px] font-medium text-textMuted uppercase tracking-wider">
                   <span className="text-primary truncate max-w-[150px]">{item.sourceName || 'Scanner'}</span>
                   <span className="w-1 h-1 rounded-full bg-black/10"></span>
                   <span>{getRelativeTime(item.created_at)}</span>
                   
                   {/* NEW SENTIMENT BADGE */}
                   {item.sentiment && (
                       <>
                           <span className="w-1 h-1 rounded-full bg-black/10"></span>
                           <div className="group relative flex items-center cursor-help">
                               <span className="mr-1">
                                   {item.sentiment.toUpperCase() === 'BULLISH' ? '🟢' : 
                                    item.sentiment.toUpperCase() === 'BEARISH' ? '🔴' : '⚪'}
                               </span>
                               <span className={
                                   item.sentiment.toUpperCase() === 'BULLISH' ? 'text-green-600' : 
                                   item.sentiment.toUpperCase() === 'BEARISH' ? 'text-red-500' : 'text-gray-500'
                               }>
                                   {item.sentiment.toUpperCase()}
                               </span>
                               
                               {/* Tooltip for AI Reasoning */}
                               {item.sentiment_reasoning && (
                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] leading-tight normal-case rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                       {item.sentiment_reasoning}
                                       <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                   </div>
                               )}
                           </div>
                       </>
                   )}

                   {isHighlyRelevant && (
                       <>
                           <span className="w-1 h-1 rounded-full bg-black/10"></span>
                           <span className="text-primary tracking-widest font-bold">MATCH</span>
                       </>
                   )}
               </div>
            </div>

            {/* Expand Toggle */}
            <div className="w-10 shrink-0 flex justify-end items-center text-textMuted/40 group-hover:text-primary transition-colors">
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={18} />
                </motion.div>
            </div>
        </div>

        {/* Expandable Details Area */}
        <AnimatePresence>
            {isExpanded && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden bg-black/[0.01] border-t border-black/[0.03]"
                >
                    <div className="px-5 py-5 pl-[5.5rem] flex flex-col md:flex-row gap-6">
                        {/* Text and Entities */}
                        <div className="flex-1 flex flex-col">
                            <p className="text-[14px] leading-relaxed text-textMain/80 mb-4">
                                {item.summary}
                            </p>

                            {/* Entities */}
                            {item.entities && item.entities.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {item.entities.map(entity => (
                                        <button 
                                            key={entity} 
                                            onClick={(e) => { e.stopPropagation(); onDeepDive && onDeepDive(entity); }}
                                            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white shadow-sm text-textMain hover:text-primary hover:shadow transition-all border border-black/[0.04]"
                                        >
                                            ${entity}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Action Row */}
                            <div className="mt-auto pt-2 flex items-center">
                                 <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-white text-[11px] font-bold hover:bg-primary/90 transition-colors shadow-sm"
                                  >
                                    <span>Open Source Report</span>
                                    <ExternalLink size={12} />
                                  </a>
                            </div>
                        </div>

                        {/* Rich Media Right-Side Rendering */}
                        {(youtubeId || item.image_url) && (
                            <div className="w-full md:w-72 shrink-0">
                                {youtubeId ? (
                                    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-inner border border-black/5 bg-black/5">
                                      <iframe 
                                          width="100%" height="100%" 
                                          src={`https://www.youtube.com/embed/${youtubeId}?controls=1`} 
                                          title="YouTube Video" frameBorder="0" allowFullScreen
                                      ></iframe>
                                    </div>
                                ) : (
                                    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden shadow-inner border border-black/5 bg-black/5">
                                       <img src={item.image_url} alt="Cover" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
     </motion.div>
   );
});

export default IntelligenceFeed;

