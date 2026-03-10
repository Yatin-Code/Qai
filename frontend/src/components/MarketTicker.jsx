import React, { useEffect, useState } from 'react';

const MarketTicker = () => {
  const [marketData, setMarketData] = useState([]);

  useEffect(() => {
    // Fetch initial market data
    const fetchMarket = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/market');
        const data = await res.json();
        if (data && data.length > 0) {
           // Duplicate the data multiple times to ensure enough content for a seamless infinite scroll loop
           setMarketData([...data, ...data, ...data, ...data]);
        }
      } catch (e) {
        console.error("Failed to fetch market data:", e);
      }
    };
    fetchMarket();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarket, 300000);
    return () => clearInterval(interval);
  }, []);

  if (marketData.length === 0) return null;

  return (
    <div className="w-full bg-black/30 backdrop-blur-md border-b border-white/5 overflow-hidden py-2 shadow-sm relative z-50">
      <div className="flex animate-marquee whitespace-nowrap">
        {marketData.map((item, index) => (
          <div key={`${item.symbol}-${index}`} className="flex items-center space-x-2 mx-8 text-[13px] tracking-wide font-black uppercase">
            <span className="text-white/40">{item.symbol}</span>
            <span className="text-white font-bold tracking-tighter">${item.price.toFixed(2)}</span>
            <span className={`flex items-center gap-1 ${item.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              <span className="text-[10px]">{item.change_pct >= 0 ? '▲' : '▼'}</span>
              <span>{Math.abs(item.change_pct).toFixed(2)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketTicker;
