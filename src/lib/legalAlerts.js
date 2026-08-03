import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

// Sends an email legal alert to a registered app user.
// Shows a toast on success/failure so the user can confirm it worked.
export async function sendLegalAlert({ type, title, message, userEmail }) {
  if (!userEmail) {
    toast({ title: 'Email alert skipped', description: 'No email address on file for your account.', variant: 'destructive' });
    return;
  }
  const subjectMap = {
    criminal_charge: '⚖️ CRIMINAL CHARGES FILED — Court Appearance Required',
    arrest_warrant: '🚨 ARREST WARRANT ISSUED — Action Required Immediately',
    court_date: '📅 COURT DATE SCHEDULED — Appearance Required',
  };
  try {
    await base44.integrations.Core.SendEmail({
      to: userEmail,
      subject: subjectMap[type] || title,
      body:
        `${title}\n\n` +
        `${message}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚠️ These charges are to be treated as REAL and binding. ` +
        `They carry real legal consequences and real penalties. ` +
        `Only a verified judge may dismiss them.\n\n` +
        `This is an automated legal alert from your NUTtracker app.`,
    });
    toast({ title: '📧 Legal email alert sent', description: `Sent to ${userEmail}` });
  } catch (e) {
    toast({ title: 'Email alert failed', description: String(e?.message || e), variant: 'destructive' });
  }
}