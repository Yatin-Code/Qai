import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

const HeroBriefing = ({ insights }) => {
  // Get top 3 insights for the hero section
  const topInsights = insights.slice(0, 3);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="mb-12 border-b border-border/50 pb-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Sparkles size={24} />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-textMain">Briefing</h2>
        <span className="text-xs font-medium text-textMuted ml-4 bg-white/50 px-3 py-1 rounded-full shadow-sm border border-border/30">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {topInsights.map((insight, index) => (
          <motion.div 
            key={insight.id}
            variants={itemVariants}
            className={`apple-panel p-6 relative rounded-3xl ${index === 0 ? 'md:col-span-2' : ''}`}
          >

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center space-x-2 mb-4 border-b border-border/50 pb-3">
                {insight.signalStrength > 90 ? (
                  <AlertTriangle size={14} className="text-red-500" />
                ) : (
                  <TrendingUp size={14} className="text-primary" />
                )}
                <span className="text-[11px] font-semibold tracking-wide uppercase text-textMuted">
                  {insight.category} &middot; Signal: {insight.signalStrength}
                </span>
              </div>
              
              <h3 className={`font-semibold mb-3 text-textMain ${index === 0 ? 'text-3xl leading-snug' : 'text-xl leading-tight'}`}>
                {insight.title}
              </h3>
              
              <p className="text-textMuted leading-relaxed mb-6 flex-grow text-sm">
                {insight.summary}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-[11px] font-medium text-textMuted">Source: <span className="text-textMain">{insight.sourceName}</span></span>
                <div className="flex gap-2 items-center">
                    {insight.sentiment && insight.sentiment !== 'Neutral' && (
                        <span className={`px-2 h-6 flex items-center rounded-full font-bold uppercase tracking-wider text-[9px] shadow-sm border ${insight.sentiment === 'Bullish' ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-500 bg-red-50 border-red-200'}`}>
                            {insight.sentiment}
                        </span>
                    )}
                    {insight.badge === 'Under the Radar' && (
                      <span className="px-3 h-6 flex items-center bg-primary/10 text-primary border border-primary/20 rounded-full font-bold uppercase tracking-wider text-[9px] shadow-sm">
                        Under Radar
                      </span>
                    )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default HeroBriefing;
