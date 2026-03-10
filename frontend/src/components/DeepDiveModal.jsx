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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl overflow-hidden relative shadow-[0_40px_80px_rgba(0,0,0,0.8)] rounded-3xl text-white"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center space-x-2 text-white text-sm">
            <Activity size={16} className={loading ? 'animate-pulse text-primary' : 'text-green-500'} />
            <span className="font-bold tracking-tight uppercase text-[10px] tracking-widest">Live Drill-Down: {entity}</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all border border-white/5">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-8">
          {loading ? (
            <div className="space-y-6">
               <div className="w-full h-3 bg-white/5 rounded-full animate-pulse"></div>
               <div className="w-3/4 h-3 bg-white/5 rounded-full animate-pulse"></div>
               <div className="w-5/6 h-3 bg-white/5 rounded-full animate-pulse"></div>
               <div className="mt-8 text-[10px] text-white/40 flex items-center space-x-3 font-black uppercase tracking-widest">
                 <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                 <span className="animate-pulse">WebCrawler deployed... Synthesizing Live Analysis...</span>
               </div>
            </div>
          ) : (
            <div className="space-y-6">
               <p className="text-white/80 leading-relaxed text-sm font-medium">
                 {data?.report || "No live intel available."}
               </p>
               <div className="text-[10px] font-black uppercase tracking-widest text-white/20 border-t border-white/5 pt-6 mt-12 flex justify-between">
                 <span>🌐 Extracted from Live Web</span>
                 <span className="flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span> Powered by Llama-3 70B</span>
               </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DeepDiveModal;
