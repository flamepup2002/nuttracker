import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { sendLegalAlert, fetchContractOwnerEmail } from '@/lib/legalAlerts';

const DAY = 24 * 60 * 60 * 1000;

// Sends automated email reminders for upcoming court dates:
//  - 7 days before the appearance
//  - 24 hours before the appearance
// Runs while the app is open. Tracks sent state on the notification so
// reminders are not duplicated across reloads.
export default function useCourtDateAlertWatcher() {
  const queryClient = useQueryClient();
  const sendingRef = useRef(new Set());

  const { data: notifications = [] } = useQuery({
    queryKey: ['court-date-alerts'],
    queryFn: () => base44.entities.Notification.filter({ type: 'criminal_charge' }),
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!notifications.length) return;
    const now = Date.now();
    const ensureEmail = async (n) => {
      const ownerEmail = await fetchContractOwnerEmail(n.contract_id);
      if (ownerEmail) return ownerEmail;
      const me = await base44.auth.me().catch(() => null);
      return me?.email;
    };

    notifications.forEach(async (n) => {
      if (!n.court_date || n.charges_dismissed) return;
      const courtTime = new Date(n.court_date).getTime();
      const delta = courtTime - now;

      // 7-day reminder
      if (delta <= 7 * DAY && delta > DAY && !n.alert_7d_sent && !sendingRef.current.has(`${n.id}-7d`)) {
        sendingRef.current.add(`${n.id}-7d`);
        const email = await ensureEmail(n);
        await sendLegalAlert({
          type: 'court_date',
          title: '📅 Court Date Reminder — 7 Days',
          message: `Your court appearance is scheduled for ${new Date(n.court_date).toLocaleString()}. You are required to appear. Failure to appear will result in an arrest warrant and additional criminal charges.`,
          userEmail: email,
        });
        await base44.entities.Notification.update(n.id, { alert_7d_sent: true }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ['court-date-alerts'] });
      }

      // 24-hour reminder
      if (delta <= DAY && delta > 0 && !n.alert_24h_sent && !sendingRef.current.has(`${n.id}-24h`)) {
        sendingRef.current.add(`${n.id}-24h`);
        const email = await ensureEmail(n);
        await sendLegalAlert({
          type: 'court_date',
          title: '🚨 Court Date Tomorrow — Appearance Required',
          message: `Your court appearance is scheduled for ${new Date(n.court_date).toLocaleString()}. This is your final reminder. Failure to appear will result in an arrest warrant and additional criminal charges.`,
          userEmail: email,
        });
        await base44.entities.Notification.update(n.id, { alert_24h_sent: true }).catch(() => {});
        queryClient.invalidateQueries({ queryKey: ['court-date-alerts'] });
      }
    });
  }, [notifications]);
}