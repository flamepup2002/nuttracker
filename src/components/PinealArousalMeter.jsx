import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Zap, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function PinealArousalMeter({ user, onMultiplierChange }) {
  const queryClient = useQueryClient();
  const [arousal, setArousal] = useState(15);
  const [boosting, setBoosting] = useState(false);
  const intervalRef = useRef(null);

  const multiplier = user?.pineal_chip_arousal_multiplier || 1;
  const chipped = user?.pineal_chip_installed === true;
  const chipId = user?.pineal_chip_id;

  // Arousal builds over time, speed proportional to the multiplier.
  // At 100% it locks — the chip only releases through criminal behavior.
  useEffect(() => {
    if (!chipped) return;
    intervalRef.current = setInterval(() => {
      setArousal(prev => {
        if (prev >= 100) return 100;
        // build rate: ~0.5% per tick * (multiplier / 3) so higher chips fill faster
        const rate = 0.5 * (multiplier / 3);
        return Math.min(100, prev + rate);
      });
    }, 800);
    return () => clearInterval(intervalRef.current);
  }, [chipped, multiplier]);

  const handleBoost = async () => {
    if (!chipped) { toast.error('No pineal chip installed.'); return; }
    setBoosting(true);
    try {
      const newMultiplier = Math.round((multiplier * 1.8) * 10) / 10;
      await base44.auth.updateMe({ pineal_chip_arousal_multiplier: newMultiplier });
      toast.success(`Chip multiplier boosted to ×${newMultiplier}`);
      queryClient.invalidateQueries({ queryKey: ['iceMe'] });
      onMultiplierChange?.(newMultiplier);
    } catch {
      toast.error('Failed to boost chip.');
    } finally {
      setBoosting(false);
    }
  };

  if (!chipped) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-zinc-600" />
          <p className="text-zinc-500 font-bold text-sm">Pineal Chip — Not Installed</p>
        </div>
        <p className="text-zinc-600 text-xs">No arousal chip detected. Visit Agent Voss to begin removal proceedings.</p>
      </div>
    );
  }

  const peaked = arousal >= 100;

  return (
    <div className="bg-pink-950/30 border border-pink-800/50 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-pink-600 to-red-700 flex items-center justify-center border border-pink-400/40 ${peaked ? 'animate-pulse' : ''}`}>
            <Zap className="w-5 h-5 text-pink-100" />
          </div>
          <div>
            <p className="text-pink-200 font-bold text-sm">Pineal Arousal Chip</p>
            <p className="text-pink-400/60 text-xs">Unit {chipId || '—'} · ×{multiplier}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-black ${peaked ? 'text-red-400 animate-pulse' : 'text-pink-300'}`}>
            {Math.round(arousal)}%
          </p>
          <p className="text-pink-400/50 text-[10px] uppercase tracking-wide">Arousal</p>
        </div>
      </div>

      {/* Arousal bar */}
      <div className="relative h-4 rounded-full bg-zinc-900 overflow-hidden border border-pink-900/40">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${arousal}%`,
            background: peaked
              ? 'linear-gradient(to right, #f43f5e, #dc2626, #b91c1c)'
              : 'linear-gradient(to right, #ec4899, #f43f5e, #e11d48)',
            boxShadow: peaked ? '0 0 12px rgba(220,38,38,0.8)' : '0 0 8px rgba(236,72,153,0.5)',
          }}
        />
        {peaked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-bold text-white tracking-widest animate-pulse">NO RELEASE — COMMIT CRIME</span>
          </div>
        )}
      </div>

      {peaked ? (
        <div className="flex items-center gap-2 text-red-300 text-xs">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>Arousal locked at maximum. The chip will not release this pressure. Only criminal behavior brings relief.</span>
        </div>
      ) : (
        <p className="text-pink-400/50 text-xs">
          Arousal is building. The chip permanently increases your baseline ×{multiplier}. It will not stop.
        </p>
      )}

      {/* Boost button */}
      <button
        onClick={handleBoost}
        disabled={boosting}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-700 to-red-700 hover:from-pink-600 hover:to-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 border border-pink-500/40"
      >
        <TrendingUp className="w-4 h-4 text-pink-100" />
        <span className="text-pink-100 font-bold text-sm">
          {boosting ? 'BOOSTING...' : `BOOST CHIP +80% → ×${(Math.round((multiplier * 1.8) * 10) / 10)}`}
        </span>
      </button>
      <p className="text-pink-500/40 text-[10px] text-center">Permanently increases the chip's arousal multiplier by 80%. Irreversible.</p>
    </div>
  );
}