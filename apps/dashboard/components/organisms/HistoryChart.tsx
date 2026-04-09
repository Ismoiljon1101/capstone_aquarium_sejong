import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { LineChart, Download } from 'lucide-react';

/**
 * Organism: Displays historical sensor trends and provides data export.
 */
export const HistoryChart: React.FC = () => {
  const { getHistory } = useApi();
  const [range, setRange] = useState('24h');
  const [data, setData] = useState([]);

  useEffect(() => {
    getHistory(range).then(setData).catch(console.error);
  }, [range]);

  return (
    <section className="card-glass p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LineChart className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold">Trend Analysis</h2>
        </div>
        <select 
          value={range} 
          onChange={(e) => setRange(e.target.value)}
          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
        >
          <option value="24h">24 Hours</option>
          <option value="1w">1 Week</option>
          <option value="1m">1 Month</option>
        </select>
      </div>
      
      <div className="h-48 flex items-center justify-center bg-white/5 rounded-xl border border-dashed border-white/10">
        <div className="text-center opacity-40">
          <p className="text-sm">Chart visualization would be integrated here.</p>
          <button className="btn btn-ghost btn-sm mt-2">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>
    </section>
  );
};
