import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, FileText, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function PublicRegistry() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['registryContracts'],
    queryFn: () => base44.entities.DebtContract.filter({ is_accepted: true, cancel_status: 'active' }, '-created_date', 200),
  });

  const filtered = contracts.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.intensity_level === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          Public Registry
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <p className="text-zinc-400 text-sm">A searchable directory of active debt and findom contracts for community accountability.</p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contracts..." className="bg-zinc-800 border-zinc-700 pl-10" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 text-white text-sm">
            <option value="all">All</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="intense">Intense</option>
            <option value="extreme">Extreme</option>
          </select>
        </div>

        <div className="text-zinc-500 text-xs">{filtered.length} contract{filtered.length !== 1 ? 's' : ''} on record</div>

        {isLoading && <div className="text-center py-8 text-zinc-500">Loading registry...</div>}

        {filtered.map((c, i) => {
          const total = c.total_obligation || (c.monthly_payment || 0) * (c.duration_months || 0);
          const paid = c.amount_paid || 0;
          const progress = total > 0 ? (paid / total) * 100 : 0;
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
              <div className="flex justify-between items-start mb-2">
                <p className="text-white font-bold">{c.title}</p>
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${c.intensity_level === 'extreme' ? 'bg-red-900/50 text-red-400' : c.intensity_level === 'intense' ? 'bg-orange-900/50 text-orange-400' : c.intensity_level === 'moderate' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-green-900/50 text-green-400'}`}>{c.intensity_level}</span>
              </div>
              {c.description && <p className="text-zinc-400 text-sm line-clamp-2">{c.description}</p>}
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div><p className="text-zinc-500 text-xs">Obligation</p><p className="text-white font-bold">${total.toFixed(0)}</p></div>
                <div><p className="text-zinc-500 text-xs">Paid</p><p className="text-green-400 font-bold">${paid.toFixed(0)}</p></div>
                <div><p className="text-zinc-500 text-xs">Duration</p><p className="text-white font-bold">{c.duration_months}mo</p></div>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-3">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
              <Link to="/MyContracts" className="flex items-center justify-center gap-1 mt-3 text-indigo-400 text-sm hover:text-indigo-300">
                <Eye className="w-4 h-4" /> View Details
              </Link>
            </motion.div>
          );
        })}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No contracts match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}