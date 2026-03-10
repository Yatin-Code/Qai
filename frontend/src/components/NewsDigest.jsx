import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, PlayCircle, Zap, X, MessageSquare, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

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

const SentimentBadge = ({ sentiment, reasoning }) => {
    if (!sentiment) return null;
    const isBullish = sentiment.toLowerCase() === 'bullish';
    const isBearish = sentiment.toLowerCase() === 'bearish';
    
    return (
        <div className="group/sent relative inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/[0.03] border border-black/[0.05] transition-all hover:bg-black/[0.05]">
            {isBullish ? <ArrowUpRight size={12} className="text-success" /> : 
             isBearish ? <ArrowDownRight size={12} className="text-error" /> : 
             <Minus size={12} className="text-textMuted" />}
            <span className={`text-[9px] font-black uppercase tracking-widest ${isBullish ? 'text-success' : isBearish ? 'text-error' : 'text-textMuted'}`}>
                {sentiment}
            </span>
            {reasoning && (
                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black text-white text-[10px] rounded-lg opacity-0 invisible group-hover/sent:opacity-100 group-hover/sent:visible transition-all z-50 pointer-events-none shadow-xl border border-white/10">
                    {reasoning}
                </div>
            )}
        </div>
    );
};

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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-3 rounded-full bg-black/5 hover:bg-black/10 transition-all z-10"
                >
                    <X size={20} className="text-textMain" />
                </button>

                <div className="overflow-y-auto flex-1 p-8 md:p-12">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-3 mb-6 text-[11px] font-black tracking-widest uppercase text-primary">
                            <span>{item.sourceName}</span>
                            <span className="text-textMuted">•</span>
                            <span>{getRelativeTime(item.created_at)}</span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-textMain leading-[1.1] mb-8 font-display">
                            {item.title}
                        </h2>

                        <div className="flex items-center gap-4 mb-10 pb-10 border-b border-black/5">
                            <SentimentBadge sentiment={item.sentiment} reasoning={item.sentiment_reasoning} />
                            {item.signal_strength && (
                                <div className="text-[10px] font-black px-3 py-1 bg-primary/10 text-primary rounded-md uppercase tracking-widest">
                                    SIGNAL {item.signal_strength}%
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-4 bg-black/5 rounded w-full"></div>
                                <div className="h-4 bg-black/5 rounded w-5/6"></div>
                                <div className="h-4 bg-black/5 rounded w-full"></div>
                                <div className="h-4 bg-black/5 rounded w-4/5"></div>
                            </div>
                        ) : (
                            <div className="prose prose-lg max-w-none text-textMain/80 leading-relaxed font-serif">
                                {content?.content ? (
                                    content.content.split('\n\n').map((para, i) => (
                                        <p key={i} className="mb-6">{para}</p>
                                    ))
                                ) : (
                                    <p>Content extraction failed. Please visit the original source.</p>
                                )}
                            </div>
                        )}

                        <div className="mt-12 pt-12 border-t border-black/5 flex justify-center">
                            <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-full font-black uppercase tracking-widest text-xs hover:bg-primary transition-all group"
                            >
                                Read Original Source <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const HeroArticle = ({ item, onDeepDive, theme, onOpenReader }) => {
    if (!item) return null;
    const isHighlyRelevant = item.signal_strength > 70;
    const youtubeId = getYouTubeId(item.url);
    const isTerminal = theme === 'terminal';

    if (isTerminal) return <TerminalRow item={item} isHeader={false} onDeepDive={onDeepDive} onOpenReader={onOpenReader} />;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col md:flex-row gap-8 mb-12 group cursor-pointer"
            onClick={() => onOpenReader(item)}
        >
            {/* Very large media container */}
            <div className="w-full md:w-3/5 aspect-[16/9] rounded-[2.5rem] overflow-hidden bg-black/[0.03] shadow-apple relative shrink-0 flex items-center justify-center p-8">
               {youtubeId ? (
                   <iframe 
                      width="100%" height="100%" 
                      src={`https://www.youtube.com/embed/${youtubeId}?controls=1`} 
                      title="YouTube Video" frameBorder="0" allowFullScreen
                      className="absolute inset-0"
                  ></iframe>
               ) : item.image_url ? (
                   <img 
                    src={item.image_url} 
                    alt="Hero" 
                    className={`w-full h-full transition-transform duration-[3s] ease-out group-hover:scale-105 ${item.image_url.includes('huggingface') ? 'object-contain' : 'object-cover'}`} 
                   />
               ) : (
                   <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary/30 font-bold text-4xl">
                       {item.category}
                   </div>
               )}
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col justify-center py-4 relative">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 text-[11px] font-black tracking-[0.2em]">
                        <span className="text-primary uppercase">{item.sourceName || 'Scanner'}</span>
                        <span className="w-1 h-1 rounded-full bg-black/10"></span>
                        <span className="text-textMuted uppercase">{getRelativeTime(item.created_at)}</span>
                    </div>
                    <SentimentBadge sentiment={item.sentiment} reasoning={item.sentiment_reasoning} />
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-textMain leading-[1.1] mb-6 group-hover:text-primary transition-colors font-display break-words line-clamp-3">
                    {item.title}
                </h1>
                
                <p className="text-textMuted/90 text-lg leading-relaxed line-clamp-4 mb-8">
                    {item.summary}
                </p>

                <div className="flex items-center gap-4 mt-auto">
                    {item.entities && item.entities.slice(0, 3).map(entity => (
                        <button 
                            key={entity} 
                            onClick={(e) => { e.stopPropagation(); onDeepDive && onDeepDive(entity); }}
                            className="text-[10px] font-black px-4 py-2 rounded-full bg-white shadow-sm border border-black/5 text-textMain hover:bg-primary hover:text-white transition-all uppercase tracking-widest"
                        >
                            {entity}
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

const TerminalRow = ({ item, onDeepDive, isHeader, onOpenReader }) => {
    if (isHeader) {
        return (
            <div className="grid grid-cols-[80px_1fr_120px_100px_100px] gap-4 px-4 py-2 border-b-2 border-primary/30 text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                <div>Signal</div>
                <div>Headline</div>
                <div>Source</div>
                <div>Time</div>
                <div>Action</div>
            </div>
        );
    }

    const signalColor = item.signal_strength > 80 ? 'text-success' : item.signal_strength > 50 ? 'text-primary' : 'text-textMuted';

    return (
        <div 
            className="grid grid-cols-[80px_1fr_120px_100px_100px] gap-4 px-4 py-3 border-b border-white/10 hover:bg-white/5 cursor-pointer items-center group font-terminal text-[13px]"
            onClick={() => onOpenReader(item)}
        >
            <div className={`font-black ${signalColor}`}>
                {item.signal_strength}%
            </div>
            <div className="text-white group-hover:text-primary transition-colors font-bold truncate">
                {item.title}
            </div>
            <div className="text-textMuted text-[11px] uppercase truncate">
                {item.sourceName || 'SCAN'}
            </div>
            <div className="text-textMuted text-[11px]">
                {getRelativeTime(item.created_at)}
            </div>
            <div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDeepDive && onDeepDive(item.entities?.[0]); }}
                    className="text-[10px] border border-primary/50 px-2 py-0.5 text-primary hover:bg-primary hover:text-black transition-all"
                >
                    ANALYZE
                </button>
            </div>
        </div>
    );
};

const TopStoryCard = ({ item, onDeepDive, theme, onOpenReader }) => {
    if (!item) return null;
    const isTerminal = theme === 'terminal';
    if (isTerminal) return <TerminalRow item={item} isHeader={false} onDeepDive={onDeepDive} onOpenReader={onOpenReader} />;

    const isHighlyRelevant = item.signal_strength > 70;
    const youtubeId = getYouTubeId(item.url);

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col group cursor-pointer apple-panel-interactive bg-white/40 border border-white/60 p-5 h-full relative overflow-hidden rounded-[2rem] hover:shadow-2xl transition-all"
            onClick={() => onOpenReader(item)}
        >
            {/* Media Container */}
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/[0.03] mb-5 relative shrink-0 flex items-center justify-center p-4">
                {youtubeId ? (
                   <iframe 
                      width="100%" height="100%" 
                      src={`https://www.youtube.com/embed/${youtubeId}?controls=0&modestbranding=1`} 
                      title="YouTube Video" frameBorder="0" allowFullScreen
                      className="absolute inset-0 pointer-events-none" 
                  ></iframe>
               ) : item.image_url ? (
                   <img 
                    src={item.image_url} 
                    alt="Story" 
                    className={`w-full h-full transition-transform duration-[3s] ease-out group-hover:scale-110 ${item.image_url.includes('huggingface') ? 'object-contain' : 'object-cover'}`} 
                   />
               ) : (
                   <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                       <span className="text-primary/40 font-black text-2xl uppercase tracking-widest">{item.category}</span>
                   </div>
               )}
            </div>

            <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                        <span className="text-primary truncate max-w-[120px]">{item.sourceName || 'Scanner'}</span>
                        <span className="text-textMuted">• {getRelativeTime(item.created_at)}</span>
                    </div>
                    <SentimentBadge sentiment={item.sentiment} reasoning={item.sentiment_reasoning} />
                </div>

                <h3 className="text-xl font-black tracking-tight text-textMain leading-tight line-clamp-3 mb-3 group-hover:text-primary transition-colors font-display">
                    {item.title}
                </h3>
                
                <p className="text-textMuted text-sm leading-relaxed line-clamp-3 mt-auto">
                    {item.summary}
                </p>
            </div>
        </motion.div>
    );
};

const SidePulseItem = ({ item, theme, onOpenReader }) => {
    if (!item) return null;
    const isTerminal = theme === 'terminal';
    if (isTerminal) return <TerminalRow item={item} isHeader={false} onOpenReader={onOpenReader} />;

    const isHighlyRelevant = item.signal_strength > 70;

    return (
        <div 
            className="group cursor-pointer py-4 border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02] px-2 -mx-2 rounded-xl transition-all flex gap-4"
            onClick={() => onOpenReader(item)}
        >
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-primary font-black mb-1">
                    <span>{item.sourceName || 'Scanner'}</span>
                    <span className="text-textMuted">•</span>
                    <span className="text-textMuted">{getRelativeTime(item.created_at)}</span>
                    <SentimentBadge sentiment={item.sentiment} />
                </div>
                <h4 className="text-[14px] font-bold text-textMain leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2 font-display">
                    {item.title}
                </h4>
                {item.sentiment_reasoning && (
                    <p className="text-[9px] text-textMuted line-clamp-1 italic mt-1 group-hover:text-textMain/70">
                        {item.sentiment_reasoning}
                    </p>
                )}
            </div>
        </div>
    );
};
const NewsDigest = ({ insights, onDeepDive, theme }) => {
  const isTerminal = theme === 'terminal';
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Sort insights safely
  const sortedInsights = Array.isArray(insights) ? [...insights].sort((a, b) => {
      if (b.signal_strength !== a.signal_strength) {
          return b.signal_strength - a.signal_strength;
      }
      return new Date(b.created_at) - new Date(a.created_at);
  }) : [];

  if (!sortedInsights || sortedInsights.length === 0) return null;

  const heroItem = sortedInsights[0];
  const topStories = sortedInsights.slice(1, 4); // Grid of 3
  const secondaryStories = sortedInsights.slice(4, 8); // Grid of 4 small
  const pulseFeed = sortedInsights.slice(8);

  if (isTerminal) {
      return (
          <div className="w-full apple-panel bg-black border border-white/10 rounded-none overflow-hidden">
              <TerminalRow isHeader={true} />
              <div className="max-h-[80vh] overflow-y-auto">
                  {sortedInsights.map(item => (
                      <TerminalRow key={item.id} item={item} onDeepDive={onDeepDive} onOpenReader={setSelectedItem} />
                  ))}
              </div>
              <AnimatePresence>
                {selectedItem && <ReaderModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
              </AnimatePresence>
          </div>
      );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-12 relative">
        <AnimatePresence>
            {selectedItem && (
                <ReaderModal 
                    item={selectedItem} 
                    onClose={() => setSelectedItem(null)} 
                />
            )}
        </AnimatePresence>

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0">
            {heroItem && (
                <div className="mb-12">
                    <HeroArticle item={heroItem} onDeepDive={onDeepDive} theme={theme} onOpenReader={setSelectedItem} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {topStories.map(item => (
                    <TopStoryCard key={item.id} item={item} onDeepDive={onDeepDive} theme={theme} onOpenReader={setSelectedItem} />
                ))}
            </div>

            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-textMuted mb-6 flex items-center gap-4">
                <span className="shrink-0">Deeper Intelligence</span>
                <div className="h-px bg-black/5 w-full"></div>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {secondaryStories.map(item => (
                    <TopStoryCard key={item.id} item={item} onDeepDive={onDeepDive} theme={theme} onOpenReader={setSelectedItem} />
                ))}
            </div>
        </div>

        {/* Pulse Side Column */}
        <div className="w-full lg:w-96 shrink-0 flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-widest text-textMain mb-6 flex items-center justify-between border-b-2 border-primary pb-2">
                <span>The Pulse</span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-primary animate-pulse">LIVE</span>
                    <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
            </h2>
            <div className="flex flex-col">
                {pulseFeed.map((item) => (
                    <SidePulseItem key={item.id} item={item} theme={theme} onOpenReader={setSelectedItem} />
                ))}
            </div>
        </div>
    </div>
  );
};

export default NewsDigest;
