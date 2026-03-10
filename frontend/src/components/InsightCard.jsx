import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, TrendingUp, TrendingDown, Activity } from 'lucide-react';

const InsightCard = ({ item, onDeepDive, compact }) => {
  const isMainstream = item.badge === 'Mainstream' || item.is_mainstream === 1;
  const isBreaking = item.is_breaking === 1 || item.is_breaking === true;
  
  const getSentimentColor = (sentiment) => {
      if (sentiment === 'Bullish') return 'text-green-600 bg-green-500/10 border-green-500/20';
      if (sentiment === 'Bearish') return 'text-red-500 bg-red-500/10 border-red-500/20';
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Live';
    // Handle the UTC timestamp from sqlite
    const date = new Date(timestamp + 'Z'); 
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${Math.max(1, diffMins)} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const isRecent = (timestamp) => {
      if (!timestamp) return true;
      const hours = (new Date() - new Date(timestamp + 'Z')) / 36e5;
      return hours < 2;
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`apple-panel-interactive p-6 h-full relative overflow-hidden flex flex-col ${isBreaking ? 'border-red-400/40 bg-gradient-to-br from-red-50/40 to-white/40' : 'bg-white/40'}`}
    >
      {/* Background Signal Pulse for Breaking */}
      {isBreaking && (
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-400/10 rounded-full blur-3xl animate-pulse" />
      )}

      {/* Header Array: Category, Sentiment, Radar */}
      <div className="flex justify-between items-start mb-4 relative z-10 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-textMain/70 bg-black/5 px-2.5 py-1 rounded-md">
                {item.category}
            </span>
            {item.sentiment && item.sentiment !== 'Neutral' && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border flex items-center gap-1 ${getSentimentColor(item.sentiment)}`}>
                    {item.sentiment === 'Bullish' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {item.sentiment}
                </span>
            )}
        </div>
        
        <div className="flex space-x-2 items-center">
          {!isMainstream ? (
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,113,227,0.8)] animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Under Radar</span>
             </div>
          ) : (
             <span className="text-[9px] font-bold uppercase tracking-wider text-textMuted px-2 py-0.5">Mainstream</span>
          )}
        </div>
      </div>

      {/* Image or Video Handling for Large Cards */}
      {!compact && (item.image_url || youtubeId) && (
          <div className="mb-4 w-full h-40 overflow-hidden rounded-xl bg-black/5 shadow-inner border border-white/50 shrink-0">
              {youtubeId ? (
                  <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${youtubeId}?controls=0`} 
                      title="YouTube video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      className="w-full h-full object-cover"
                  ></iframe>
              ) : (
                  <img src={item.image_url} alt="Cover" className="w-full h-full object-cover transition-transform duration-[2s] ease-out hover:scale-105" />
              )}
          </div>
      )}

      {/* Title */}
      <h3 className={`${compact ? 'text-[1.1rem]' : 'text-[1.3rem]'} font-bold mb-2 tracking-tight text-textMain leading-snug ${compact ? 'line-clamp-3' : 'line-clamp-2'}`}>
        {item.title}
        {isBreaking && <span className="inline-block ml-2 w-2 h-2 rounded-full bg-red-500 animate-pulse relative -top-1 shadow-[0_0_8px_rgba(239,68,68,0.8)]"/>}
      </h3>
      
      {/* Summary - Hidden if too compact and has image, else clamped */}
      <p className={`text-textMuted text-[13px] leading-relaxed font-normal flex-1 ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
        {item.summary}
      </p>

      {/* Entities & Data Density */}
      {item.entities && item.entities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 mb-1">
              {item.entities.map(entity => (
                  <span 
                      key={entity} 
                      onClick={(e) => { e.stopPropagation(); onDeepDive && onDeepDive(entity); }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/5 text-textMain hover:bg-primary hover:text-white transition-colors cursor-pointer border border-black/[0.03]"
                  >
                      ${entity}
                  </span>
              ))}
          </div>
      )}

      {/* Footer metadata: Signal meter and source */}
      <div className="mt-auto pt-4 border-t border-black/[0.04] flex flex-col gap-3">
          {/* Novelty Score Meter */}
          <div className="flex items-center gap-2">
             <Activity size={12} className={item.signal_strength > 70 ? 'text-red-500' : 'text-primary'} title="Novelty Score" />
             <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden" title={`Novelty Score: ${item.signal_strength || 30}`}>
                <div 
                    className={`h-full rounded-full ${item.signal_strength > 85 ? 'bg-fuchsia-500' : item.signal_strength > 60 ? 'bg-orange-400' : 'bg-primary'}`} 
                    style={{ width: `${Math.min(100, item.signal_strength || 30)}%` }} 
                />
             </div>
             <span className="text-[10px] font-bold text-textMain/60 w-6 text-right" title="Novelty Score">
                 {item.signal_strength || 30}
             </span>
          </div>

          {/* Source & Link */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col space-y-0.5">
              <span className="text-[12px] text-textMain font-bold tracking-tight">
                {item.sourceName || 'Unknown Scanner'}
              </span>
              <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-textMuted font-medium uppercase tracking-wider">
                    {getRelativeTime(item.created_at)}
                  </span>
                  {isRecent(item.created_at) && (
                      <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-sm animate-pulse">
                          NEW
                      </span>
                  )}
              </div>
            </div>
            
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex flex-shrink-0 items-center justify-center w-7 h-7 rounded-full bg-black/5 text-textMain hover:bg-black/90 hover:text-white transition-all duration-300"
              title="Read Full Source"
            >
              <ExternalLink size={12} />
            </a>
          </div>
      </div>
    </motion.div>
  );
};

export default InsightCard;
