import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

export default function EmailAlertButton({ title, message }) {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const me = await base44.auth.me().catch(() => null);
      if (!me?.email) {
        toast({ title: 'No email on file', description: 'Your account has no email address.', variant: 'destructive' });
        setSending(false);
        return;
      }
      await base44.integrations.Core.SendEmail({
        to: me.email,
        subject: '⚖️ Court Date Reminder — ' + title,
        body:
          `${title}\n\n${message}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `⚠️ These charges are to be treated as REAL and binding.\n\n` +
          `This is an automated legal alert from your NUTtracker app.`,
      });
      toast({ title: '📧 Email alert sent', description: `Sent to ${me.email}` });
    } catch (e) {
      toast({ title: 'Email alert failed', description: String(e?.message || e), variant: 'destructive' });
    }
    setSending(false);
  };

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-950/30 border border-amber-700/30 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
    >
      <Mail className="w-3 h-3" /> {sending ? 'Sending...' : 'Email me'}
    </button>
  );
}