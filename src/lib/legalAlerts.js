import { base44 } from '@/api/base44Client';

// Sends an email legal alert to a registered app user.
// Failures are swallowed so email issues never break the core flow.
export async function sendLegalAlert({ type, title, message, userEmail }) {
  if (!userEmail) return;
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
  } catch (e) {
    // ignore — email failures must not break the flow
  }
}