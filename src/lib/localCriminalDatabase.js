// Alberta criminal records are entered into the local police service records
// management system and the RCMP Canadian Police Information Centre (CPIC).
// This simulates that filing by generating a reference and marking the record
// as entered into the local criminal database.

const LOCAL_DATABASE = 'Edmonton Police Service — Criminal Records Database (CPIC)';

export function fileWithLocalDatabase(record) {
  const ref = `CPIC-AB-${Date.now().toString(36).toUpperCase()}`;
  return {
    ...record,
    database_filed: true,
    database_name: LOCAL_DATABASE,
    database_reference: ref,
    filed_at: new Date().toISOString(),
  };
}