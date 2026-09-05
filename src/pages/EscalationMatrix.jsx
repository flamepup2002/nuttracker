import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ArrowUp, Gavel, DollarSign, Siren, ShieldX } from 'lucide-react';

const TIERS = [
  {
    level: 1, name: 'First Notice', color: 'border-blue-600/50 bg-blue-950/30', icon: AlertTriangle, iconColor: 'text-blue-400',
    trigger: 'Payment 1-7 days late',
    penalty: 'Automated reminder + 5% late fee',
    escalation: 'No further action if paid within 7 days',
  },
  {
    level: 2, name: 'Overdue', color: 'border-yellow-600/50 bg-yellow-950/30', icon: DollarSign, iconColor: 'text-yellow-400',
    trigger: 'Payment 8-30 days late',
    penalty: '10% penalty + daily compounding interest + failed payment record',
    escalation: 'Debt Enforcer agent activated — contract flagged for monitoring',
  },
  {
    level: 3, name: 'Contract Breach', color: 'border-orange-600/50 bg-orange-950/30', icon: ShieldX, iconColor: 'text-orange-400',
    trigger: 'Payment 31-90 days late or dispute rejected',
    penalty: '25% breach penalty + collateral marked at-risk + criminal charge filed (s. 145(1)(a) failure to appear)',
    escalation: 'Arrest warrant issued — Police dispatch authorized',
  },
  {
    level: 4, name: 'Default', color: 'border-red-600/50 bg-red-950/30', icon: Siren, iconColor: 'text-red-400',
    trigger: 'Payment 90+ days late or warrant unresolved',
    penalty: 'Collateral liquidation begins + criminal record filed + court date scheduled',
    escalation: 'Judge AI adjudicates — prison remand possible',
  },
  {
    level: 5, name: 'Maximum Enforcement', color: 'border-red-700/70 bg-red-950/50', icon: Gavel, iconColor: 'text-red-300',
    trigger: 'Missed court date or sentence violation',
    penalty: 'Additional criminal charges (s. 145(1)(a)) + reputation ruined + court-ordered name & address lock + maximum security prison remand',
    escalation: 'Full enforcement — no appeal available without Judge review',
  },
];

export default function EscalationMatrix() {
  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-800">
        <Link to="/"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          Escalation Matrix
        </h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        <p className="text-zinc-400 text-sm">The rules, penalty tiers, and escalation paths for violations and contract breaches within the NUTtracker legal framework.</p>

        <div className="space-y-3">
          {TIERS.map((tier, i) => (
            <motion.div key={tier.level} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-2xl border-2 ${tier.color} p-5`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center flex-shrink-0">
                  <tier.icon className={`w-5 h-5 ${tier.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-xs font-bold">TIER {tier.level}</span>
                    <p className="text-white font-bold">{tier.name}</p>
                  </div>
                </div>
                {i < TIERS.length - 1 && <ArrowUp className="w-4 h-4 text-zinc-600" />}
              </div>
              <div className="space-y-2 ml-13">
                <div>
                  <p className="text-zinc-500 text-xs uppercase">Trigger</p>
                  <p className="text-zinc-300 text-sm">{tier.trigger}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase">Penalty</p>
                  <p className="text-zinc-300 text-sm">{tier.penalty}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase">Escalation Path</p>
                  <p className="text-zinc-300 text-sm">{tier.escalation}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-amber-950/20 border border-amber-700/30 rounded-2xl p-5">
          <h3 className="text-amber-400 font-bold mb-2">Important Notes</h3>
          <ul className="text-zinc-400 text-sm space-y-1">
            <li>• Penalties compound — each tier adds to previous penalties, they do not replace them.</li>
            <li>• Extreme mode removes all leniency — escalation is automatic and maximum.</li>
            <li>• Irrevocable contracts skip Tier 1-2 and escalate directly to Tier 3 upon any breach.</li>
            <li>• Criminal charges can only be dismissed by a verified Alberta judge via e-signature.</li>
            <li>• Reputation damage is permanent until overturned by the Judge or Appeals Board.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}