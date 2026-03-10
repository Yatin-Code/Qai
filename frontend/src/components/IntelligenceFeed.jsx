import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronDown, ChevronUp, PlayCircle, Activity, Zap } from 'lucide-react';

const IntelligenceFeed = ({ insights, onDeepDive }) => {
  // Sort insights strictly by relevance (signal_strength) and then recency
  const sortedInsights = [...insights].sort((a, b) => {
      if (b.signal_strength !== a.signal_strength) {
          return b.signal_strength - a.signal_strength;
      }
      return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="w-full flex flex-col gap-3 pb-20">
      {sortedInsights.map((item, index) => (
         <FeedItem key={item.id} item={item} index={index} onDeepDive={onDeepDive} />
      ))}
    </div>
  );
};

const FeedItem = ({ item, index, onDeepDive }) => {
   const [isExpanded, setIsExpanded] = useState(false);
   const isHighlyRelevant = item.signal_strength > 70;
   
   const getRelativeTime = (timestamp) => {
        if (!timestamp) return 'Live';
        const date = new Date(timestamp + 'Z'); 
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.4, ease: "easeOut" }}
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
};

export default IntelligenceFeed;
