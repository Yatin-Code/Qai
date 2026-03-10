import React, { useEffect, useState } from 'react';

const MarketTicker = ({ theme }) => {
  const [marketData, setMarketData] = useState([]);
  const isTerminal = theme === 'terminal';

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
    <div className={`w-full backdrop-blur-md border-b overflow-hidden py-2 shadow-sm relative z-50 transition-colors duration-500 ${isTerminal ? 'bg-black border-primary/30' : 'bg-white/40 border-white/60'}`}>
      <div className="flex animate-marquee whitespace-nowrap">
        {marketData.map((item, index) => (
          <div key={`${item.symbol}-${index}`} className={`flex items-center space-x-2 mx-8 text-[13px] tracking-wide ${isTerminal ? 'font-terminal' : 'font-semibold text-textMain'}`}>
            <span className={isTerminal ? 'text-primary font-black' : 'opacity-60'}>{item.symbol}</span>
            <span className={isTerminal ? 'text-white' : ''}>${item.price.toFixed(2)}</span>
            <span className={item.change_pct >= 0 ? (isTerminal ? 'text-success font-black' : 'text-green-500') : (isTerminal ? 'text-error font-black' : 'text-red-500')}>
              {item.change_pct >= 0 ? '▲' : '▼'}{Math.abs(item.change_pct).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketTicker;
