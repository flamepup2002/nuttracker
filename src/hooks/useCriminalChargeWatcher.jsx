import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { sendLegalAlert } from '@/lib/legalAlerts';
import { getCharge, buildChargeRecord } from '@/lib/albertaCriminalCode';
import { fileWithLocalDatabase } from '@/lib/localCriminalDatabase';
import { captureGps } from '@/lib/gpsCapture';

const CRIMINAL_KEYWORDS = [
  'criminal', 'arrest', 'prison', 'jail', 'felony', 'charges',
  'prosecution', 'incarceration', 'court', 'indictment', 'fraud',
  'lawsuit', 'legal action', 'law enforcement', 'police'
];

function hasCriminalTerms(contract) {
  const textToSearch = [
    ...(contract.terms || []),
    contract.description || '',
    contract.custom_penalty_clause || '',
    contract.title || '',
  ].join(' ').toLowerCase();
  return CRIMINAL_KEYWORDS.some(kw => textToSearch.includes(kw));
}

function generateCourtDate() {
  const daysOut = Math.floor(Math.random() * 61) + 30;
  const date = new Date();
  date.setDate(date.getDate() + daysOut);
  const day = date.getDay();
  if (day === 0) date.setDate(date.getDate() + 1);
  if (day === 6) date.setDate(date.getDate() + 2);
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
}

const MISSED_COURT_CHARGE_KEYS = ['failure_to_appear', 'contempt_of_court', 'obstruction_of_justice', 'bench_warrant'];

function originalChargeKey(contract) {
  const intensity = (contract.intensity_level || '').toLowerCase();
  if (intensity === 'extreme') return 'extortion';
  if (intensity === 'intense') return 'fraud';
  return 'fraud_under';
}

export default function useCriminalChargeWatcher() {
  const queryClient = useQueryClient();
  const processedRef = useRef(new Set());
  const missedCourtRef = useRef(new Set());

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-criminal-watch'],
    queryFn: () => base44.entities.DebtContract.list('-created_date', 100),
    refetchInterval: 60000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-criminal-watch'],
    queryFn: () => base44.entities.Notification.filter({ type: 'criminal_charge' }),
    refetchInterval: 60000,
  });

  const { data: warrants = [] } = useQuery({
    queryKey: ['warrants-watch'],
    queryFn: () => base44.entities.ArrestWarrant.list('-issued_at', 100),
    refetchInterval: 60000,
  });

  // Create criminal_charge notifications for newly accepted contracts with criminal terms
  useEffect(() => {
    if (!contracts.length) return;
    const existingContractIds = new Set(notifications.map(n => n.contract_id));

    const eligible = contracts.filter(c =>
      c.is_accepted &&
      hasCriminalTerms(c) &&
      !existingContractIds.has(c.id) &&
      !processedRef.current.has(c.id)
    );

    eligible.forEach(async (contract) => {
      processedRef.current.add(contract.id);
      const me = await base44.auth.me().catch(() => null);
      const gps = await captureGps();
      const courtDate = generateCourtDate();
      const courtDateFormatted = new Date(courtDate).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      await base44.entities.Notification.create({
        type: 'criminal_charge',
        title: '⚖️ Criminal Charges Filed — Court Appearance Required',
        message: `Criminal charges have been filed against you under the terms of "${contract.title}". You are required to appear in court on ${courtDateFormatted}. A judge must review and dismiss these charges. Failure to appear may result in additional penalties.`,
        contract_id: contract.id,
        action_url: 'CriminalCharges',
        priority: 'urgent',
        court_date: courtDate,
        charges_dismissed: false,
        is_read: false,
      });

      // Add to criminal record (Alberta / Criminal Code of Canada)
      const rec = buildChargeRecord(originalChargeKey(contract), contract.title);
      await base44.entities.CriminalRecord.create(fileWithLocalDatabase({
        source: 'original_charge',
        charge: rec.charge,
        contract_id: contract.id,
        severity: rec.severity,
        section: rec.section,
        code_reference: rec.code_reference,
        offence_type: rec.offence_type,
        max_penalty: rec.max_penalty,
        jurisdiction: 'Alberta Court of Justice',
        record_number: `AB-CR-${Date.now()}`,
        ...(gps || {}),
        added_at: new Date().toISOString(),
      }));

      // Email alert: criminal charges + court date
      await sendLegalAlert({
        type: 'criminal_charge',
        title: '⚖️ Criminal Charges Filed — Court Appearance Required',
        message: `Criminal charges have been filed against you under the terms of "${contract.title}". You are required to appear in court on ${courtDateFormatted}. A judge must review and dismiss these charges. Failure to appear may result in additional penalties.`,
        userEmail: me?.email,
      });

      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-criminal-watch'] });
      queryClient.invalidateQueries({ queryKey: ['criminalRecords'] });
    });
  }, [contracts, notifications]);

  // Check for missed court dates — issue arrest warrants and add charges
  useEffect(() => {
    if (!notifications.length) return;
    const now = new Date();
    const existingWarrantNotifIds = new Set(warrants.map(w => w.notification_id));

    const missed = notifications.filter(n =>
      !n.charges_dismissed &&
      n.court_date &&
      new Date(n.court_date) < now &&
      !existingWarrantNotifIds.has(n.id) &&
      !missedCourtRef.current.has(n.id)
    );

    missed.forEach(async (notification) => {
      missedCourtRef.current.add(notification.id);
      const me = await base44.auth.me().catch(() => null);
      const gps = await captureGps();
      const now = new Date().toISOString();
      const addedKeys = [
        MISSED_COURT_CHARGE_KEYS[Math.floor(Math.random() * MISSED_COURT_CHARGE_KEYS.length)],
        'bail_revocation',
      ];
      const addedCharges = addedKeys.map(k => getCharge(k).charge);

      // Issue arrest warrant
      await base44.entities.ArrestWarrant.create({
        notification_id: notification.id,
        contract_id: notification.contract_id || '',
        reason: `Arrest warrant issued: failure to appear at scheduled court date for "${notification.title}". You were required to appear and did not attend. Law enforcement has been notified.`,
        issued_at: now,
        status: 'active',
        charges_added: addedCharges,
      });

      // Add new charges to criminal record (Alberta / Criminal Code of Canada)
      for (const key of addedKeys) {
        const mRec = buildChargeRecord(key);
        await base44.entities.CriminalRecord.create(fileWithLocalDatabase({
          source: 'missed_court_date',
          charge: mRec.charge,
          contract_id: notification.contract_id || '',
          severity: mRec.severity,
          section: mRec.section,
          code_reference: mRec.code_reference,
          offence_type: mRec.offence_type,
          max_penalty: mRec.max_penalty,
          jurisdiction: 'Alberta Court of Justice',
          record_number: `AB-CR-${Date.now()}-${key}`,
          ...(gps || {}),
          added_at: now,
        }));
      }

      // Add warrant-issued record
      const warrantRec = buildChargeRecord('warrant_failure_to_appear');
      await base44.entities.CriminalRecord.create(fileWithLocalDatabase({
        source: 'warrant_issued',
        charge: warrantRec.charge,
        contract_id: notification.contract_id || '',
        severity: warrantRec.severity,
        section: warrantRec.section,
        code_reference: warrantRec.code_reference,
        offence_type: warrantRec.offence_type,
        max_penalty: warrantRec.max_penalty,
        jurisdiction: 'Alberta Court of Justice',
        record_number: `AB-CR-${Date.now()}-warrant`,
        ...(gps || {}),
        added_at: now,
      }));

      // Create urgent notification about the warrant
      await base44.entities.Notification.create({
        type: 'criminal_charge',
        title: '🚨 ARREST WARRANT ISSUED',
        message: `You missed your court appearance. An arrest warrant has been issued in your name. Additional charges have been added to your criminal record. Report to the nearest courthouse immediately.`,
        contract_id: notification.contract_id || '',
        action_url: 'ArrestWarrants',
        priority: 'urgent',
        court_date: null,
        charges_dismissed: false,
        is_read: false,
      });

      // Email alert: arrest warrant issued
      await sendLegalAlert({
        type: 'arrest_warrant',
        title: '🚨 ARREST WARRANT ISSUED',
        message: `You missed your scheduled court appearance. An arrest warrant has been issued in your name. Additional charges have been added to your criminal record: ${addedCharges.join('; ')}. Report to the nearest courthouse immediately.`,
        userEmail: me?.email,
      });

      queryClient.invalidateQueries({ queryKey: ['arrestWarrants'] });
      queryClient.invalidateQueries({ queryKey: ['warrants-watch'] });
      queryClient.invalidateQueries({ queryKey: ['criminalRecords'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-criminal-watch'] });
    });
  }, [notifications, warrants]);
}