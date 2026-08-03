// Files criminal records with the local Alberta criminal records database
// (CPIC — Canadian Police Information Centre, Alberta region). Each record is
// assigned an official filing reference when it is created.

import { base44 } from '@/api/base44Client';

export const LOCAL_CRIMINAL_DATABASE = 'Alberta Criminal Records Database (CPIC)';

function generateFilingReference() {
  const y = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000000 + 1000000);
  return `CPIC-${y}-${seq}`;
}

export function withDatabaseFiling(partial) {
  return {
    ...partial,
    filed_database: LOCAL_CRIMINAL_DATABASE,
    filing_reference: generateFilingReference(),
    filed_at: new Date().toISOString(),
  };
}

export async function fileCriminalRecord(partial) {
  return base44.entities.CriminalRecord.create(withDatabaseFiling(partial));
}