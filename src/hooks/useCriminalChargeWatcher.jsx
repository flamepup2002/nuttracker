import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Keywords that indicate criminal charges in contract terms
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
  const daysOut = Math.floor(Math.random() * 61) + 30; // 30–90 days
  const date = new Date();
  date.setDate(date.getDate() + daysOut);
  // Set to a weekday (Mon–Fri)
  const day = date.getDay();
  if (day === 0) date.setDate(date.getDate() + 1);
  if (day === 6) date.setDate(date.getDate() + 2);
  date.setHours(9, 0, 0, 0); // 9 AM court time
  return date.toISOString();
}

export default function useCriminalChargeWatcher() {
  const queryClient = useQueryClient();
  const processedRef = useRef(new Set());

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-criminal-watch'],
    queryFn: () => base44.entities.DebtContract.list('-created_date', 100),
    refetchInterval: 60000, // check every minute
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-criminal-watch'],
    queryFn: () => base44.entities.Notification.filter({ type: 'criminal_charge' }),
    refetchInterval: 60000,
  });

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

      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-criminal-watch'] });
    });
  }, [contracts, notifications]);
}