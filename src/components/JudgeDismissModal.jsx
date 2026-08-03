import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trash2, X, Gavel, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SignaturePad from '@/components/SignaturePad';
import { base44 } from '@/api/base44Client';
import { searchJudges, verifyJudge } from '@/lib/albertaJudges';
import { compareSignatures } from '@/lib/signatureCompare';
import { buildChargeRecord } from '@/lib/albertaCriminalCode';
import { fileWithLocalDatabase } from '@/lib/localCriminalDatabase';

const SIGNATURE_MATCH_THRESHOLD = 0.6;

export default function JudgeDismissModal({ notification, onClose, onDismiss }) {
  const [query, setQuery] = useState('');
  const [confirmed, setConfirmed] = useState(null); // display name once selected
  const [signature, setSignature] = useState(null);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const suggestions = useMemo(() => (confirmed ? [] : searchJudges(query)), [query, confirmed]);

  const canDismiss = !!query.trim() && !!signature;

  const handleConfirm = (name) => {
    setConfirmed(name);
    setQuery(name);
    setError('');
  };

  const fileFraudCharges = async (reason) => {
    const keys = ['personation', 'uttering_forged_document'];
    for (const key of keys) {
      const rec = buildChargeRecord(key);
      await base44.entities.CriminalRecord.create(fileWithLocalDatabase({
        source: 'contract_breach',
        charge: `${rec.charge} — ${reason}`,
        severity: rec.severity,
        section: rec.section,
        code_reference: rec.code_reference,
        offence_type: rec.offence_type,
        max_penalty: rec.max_penalty,
        jurisdiction: 'Alberta Court of Justice',
        record_number: `AB-CR-${Date.now()}-${key}`,
        added_at: new Date().toISOString(),
      })).catch(() => {});
    }
    base44.entities.Notification.create({
      type: 'criminal_charge',
      title: '⚠️ Fraudulent Dismissal Attempt',
      message: `An attempt to dismiss criminal charges was rejected: ${reason}. Additional criminal charges have been filed under the Criminal Code of Canada.`,
      priority: 'urgent',
      is_read: false,
    }).catch(() => {});
  };

  const handleDismiss = async () => {
    setTouched(true);
    if (!signature) {
      setError('A valid e-signature is required to dismiss charges.');
      return;
    }
    const match = verifyJudge(confirmed || query);
    if (!match) {
      setError('CREDENTIALS REJECTED — Name not on the Alberta judges roster. Additional criminal charges have been filed for the fraudulent attempt.');
      setConfirmed(null);
      await fileFraudCharges('submitted credentials did not match any authorized Alberta judge');
      return;
    }
    // Verify the drawn signature against the judge's enrolled reference signature
    setVerifying(true);
    try {
      const existing = await base44.entities.JudgeSignature.filter({ judge_name: match });
      const ref = existing[0];
      if (!ref) {
        // First dismissal by this judge — enroll this signature as the reference
        await base44.entities.JudgeSignature.create({
          judge_name: match,
          signature_data: signature,
          enrolled_at: new Date().toISOString(),
        });
        onDismiss({ judgeName: match, signature });
        return;
      }
      const score = await compareSignatures(signature, ref.signature_data);
      if (score < SIGNATURE_MATCH_THRESHOLD) {
        setError(`SIGNATURE REJECTED — Signature does not match the enrolled signature of Justice ${match} (similarity ${(score * 100).toFixed(0)}%). Additional criminal charges have been filed for the fraudulent dismissal attempt.`);
        await fileFraudCharges(`submitted signature did not match the enrolled signature of Justice ${match} (similarity ${(score * 100).toFixed(0)}%)`);
        return;
      }
      onDismiss({ judgeName: match, signature });
    } catch (e) {
      setError('Signature verification failed: ' + String(e?.message || e));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="bg-zinc-900 border border-amber-800/50 rounded-2xl w-full max-w-md p-5 space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold flex items-center gap-2">
            <Gavel className="w-4 h-4 text-amber-400" /> Judicial Dismissal
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-zinc-400 hover:text-white" /></button>
        </div>

        <div className="bg-amber-950/40 border border-amber-700/40 rounded-xl p-3">
          <p className="text-amber-300 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED JUDGE REQUIRED
          </p>
          <p className="text-zinc-400 text-xs mt-1">
            Charges may only be dismissed by a sitting Alberta judge. Your name is checked against the official Alberta Courts roster, and your e-signature must match the enrolled reference signature on file for that judge. The first dismissal by a judge enrolls their reference signature; all later dismissals must match it.
          </p>
        </div>

        <p className="text-zinc-300 text-sm font-medium border-l-2 border-amber-700/50 pl-3">{notification.title}</p>

        {/* Judge name + autocomplete */}
        <div className="relative">
          <label className="text-zinc-400 text-xs mb-1 block">Judge Name (verified against Alberta roster)</label>
          <Input
            placeholder="Type judge name…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setConfirmed(null); setError(''); }}
            className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500"
          />
          {suggestions.length > 0 && !confirmed && (
            <div className="absolute z-10 mt-1 w-full bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl max-h-44 overflow-y-auto">
              {suggestions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleConfirm(name)}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-amber-900/40 border-b border-zinc-700/50 last:border-0 flex items-center gap-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  {name}
                </button>
              ))}
            </div>
          )}
          {confirmed && (
            <div className="mt-1.5 flex items-center gap-1.5 text-green-400 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified: {confirmed}
            </div>
          )}
        </div>

        {/* E-signature */}
        <div>
          <label className="text-zinc-400 text-xs mb-1 block">Judge E-Signature</label>
          <SignaturePad onSignatureComplete={setSignature} />
        </div>

        {error && (
          <p className="text-red-400 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1 border-zinc-600 text-zinc-300" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 bg-amber-800 hover:bg-amber-700 text-white"
            onClick={handleDismiss}
            disabled={!canDismiss || verifying}
          >
            <Trash2 className="w-4 h-4" /> {verifying ? 'Verifying…' : 'Dismiss Charges'}
          </Button>
        </div>
        {touched && !canDismiss && !error && (
          <p className="text-zinc-500 text-xs text-center">Enter a judge name and sign to attempt dismissal. Unverified credentials will be rejected and charged.</p>
        )}
      </motion.div>
    </motion.div>
  );
}