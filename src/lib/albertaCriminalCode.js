// Alberta criminal records are governed by the federal Criminal Code of Canada
// (R.S.C. 1985, c. C-46). This catalog maps each charge filed in the app to a
// real Criminal Code section so records carry proper legal citations.

export const ALBERTA_CRIMINAL_CODE = {
  failure_to_appear: {
    charge: 'Failure to Attend Court',
    section: 's. 145(1)(a)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 145(1)(a)',
    offence_type: 'hybrid',
    max_penalty: 'Up to 2 years imprisonment',
    severity: 'felony',
  },
  contempt_of_court: {
    charge: 'Contempt of Court — Disobedience to a Court Order',
    section: 's. 708(1)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 708(1)',
    offence_type: 'hybrid',
    max_penalty: 'Up to 2 years imprisonment',
    severity: 'felony',
  },
  obstruction_of_justice: {
    charge: 'Obstructing Justice — Willful Evasion of a Court-Ordered Appearance',
    section: 's. 139(2)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 139(2)',
    offence_type: 'indictable',
    max_penalty: 'Up to 10 years imprisonment',
    severity: 'felony',
  },
  failure_to_comply: {
    charge: 'Failure to Comply with a Court Order',
    section: 's. 733.1(1)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 733.1(1)',
    offence_type: 'hybrid',
    max_penalty: 'Up to 2 years imprisonment',
    severity: 'felony',
  },
  bail_revocation: {
    charge: 'Bail Revocation — Subject to Immediate Detention Pending Re-arraignment',
    section: 's. 524(1)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 524(1)',
    offence_type: 'indictable',
    max_penalty: 'Detention pending review',
    severity: 'felony',
  },
  bench_warrant: {
    charge: 'Bench Warrant Issued — Immediate Apprehension by Law Enforcement',
    section: 's. 145(5)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 145(5)',
    offence_type: 'indictable',
    max_penalty: 'Immediate arrest and detention',
    severity: 'felony',
  },
  warrant_failure_to_appear: {
    charge: 'Arrest Warrant Issued — Failure to Appear at a Mandatory Court Proceeding',
    section: 's. 145(1)(b)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 145(1)(b)',
    offence_type: 'indictable',
    max_penalty: 'Up to 2 years imprisonment',
    severity: 'felony',
  },
  breach_of_recognizance: {
    charge: 'Breach of Recognizance — Violation of Release Conditions',
    section: 's. 145(3)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 145(3)',
    offence_type: 'hybrid',
    max_penalty: 'Up to 2 years imprisonment',
    severity: 'felony',
  },
  fraud: {
    charge: 'Fraud Over $5,000 — Obtaining Property/Credit by False Pretense',
    section: 's. 380(1)(a)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 380(1)(a)',
    offence_type: 'indictable',
    max_penalty: 'Up to 14 years imprisonment',
    severity: 'felony',
  },
  fraud_under: {
    charge: 'Fraud Under $5,000',
    section: 's. 380(1)(b)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 380(1)(b)',
    offence_type: 'summary',
    max_penalty: 'Up to 2 years imprisonment',
    severity: 'misdemeanor',
  },
  forgery: {
    charge: 'Forgery — Making a False Document with Intent to Defraud',
    section: 's. 366(1)(a)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 366(1)(a)',
    offence_type: 'indictable',
    max_penalty: 'Up to 10 years imprisonment',
    severity: 'felony',
  },
  uttering_forged_document: {
    charge: 'Uttering a Forged Document — Fraudulent Judicial Dismissal',
    section: 's. 368(1)(b)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 368(1)(b)',
    offence_type: 'indictable',
    max_penalty: 'Up to 10 years imprisonment',
    severity: 'felony',
  },
  personation: {
    charge: 'Personation with Intent — Impersonating a Justice of the Court',
    section: 's. 403(1)(a)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 403(1)(a)',
    offence_type: 'indictable',
    max_penalty: 'Up to 10 years imprisonment',
    severity: 'felony',
  },
  extortion: {
    charge: 'Extortion — Compelling Payment by Threats or Coercion',
    section: 's. 346(1)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 346(1)',
    offence_type: 'indictable',
    max_penalty: 'Up to life imprisonment',
    severity: 'federal',
  },
  theft_over: {
    charge: 'Theft Over $5,000',
    section: 's. 334(a)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 334(a)',
    offence_type: 'indictable',
    max_penalty: 'Up to 10 years imprisonment',
    severity: 'felony',
  },
  mischief: {
    charge: 'Mischief — Willful Damage to Property',
    section: 's. 430(1)(a)',
    code_reference: 'Criminal Code, R.S.C. 1985, c. C-46, s. 430(1)(a)',
    offence_type: 'hybrid',
    max_penalty: 'Up to 2 years imprisonment',
    severity: 'misdemeanor',
  },
};

export function getCharge(key) {
  return ALBERTA_CRIMINAL_CODE[key] || ALBERTA_CRIMINAL_CODE.fraud;
}

export function buildChargeRecord(key, contractTitle) {
  const c = getCharge(key);
  return {
    charge: contractTitle ? `${c.charge} — under contract "${contractTitle}"` : c.charge,
    section: c.section,
    code_reference: c.code_reference,
    offence_type: c.offence_type,
    max_penalty: c.max_penalty,
    severity: c.severity,
  };
}