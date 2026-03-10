import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Activity } from 'lucide-react';

const DeepDiveModal = ({ entity, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchResearch = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/research/${entity}`);
        if (res.ok && active) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchResearch();
    return () => { active = false; };
  }, [entity]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white/80 backdrop-blur-3xl border border-white/40 w-full max-w-2xl overflow-hidden relative shadow-2xl rounded-3xl"
      >
        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-white/50">
          <div className="flex items-center space-x-2 text-textMain text-sm">
            <Activity size={16} className={loading ? 'animate-pulse text-primary' : 'text-green-500'} />
            <span className="font-semibold tracking-tight">Live Drill-Down: {entity}</span>
          </div>
          <button onClick={onClose} className="text-textMuted hover:text-textMain bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-8">
          {loading ? (
            <div className="space-y-4">
               <div className="w-full h-4 bg-gray-200 rounded-full animate-pulse"></div>
               <div className="w-3/4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
               <div className="w-5/6 h-4 bg-gray-200 rounded-full animate-pulse"></div>
               <div className="mt-8 text-xs text-textMuted flex items-center space-x-2 font-medium">
                 <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                 <span className="animate-pulse">WebCrawler deployed... Synthesizing Live Analysis...</span>
               </div>
            </div>
          ) : (
            <div className="space-y-6">
               <p className="text-textMain leading-relaxed text-sm">
                 {data?.report || "No live intel available."}
               </p>
               <div className="text-[11px] font-medium text-textMuted border-t border-border/50 pt-4 mt-8 flex justify-between">
                 <span>🌐 Extracted from Live Web</span>
                 <span className="flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span> Powered by Llama-3 70B</span>
               </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DeepDiveModal;
