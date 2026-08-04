import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';

// Look up a user's registered email by their user ID.
export async function fetchUserEmailById(userId) {
  if (!userId) return null;
  try {
    const u = await base44.entities.User.get(userId);
    return u?.email || null;
  } catch {
    return null;
  }
}

// Look up the registered email of the user who owns a given contract.
export async function fetchContractOwnerEmail(contractId) {
  if (!contractId) return null;
  try {
    const contract = await base44.entities.DebtContract.get(contractId);
    if (!contract?.created_by_id) return null;
    return await fetchUserEmailById(contract.created_by_id);
  } catch {
    return null;
  }
}

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