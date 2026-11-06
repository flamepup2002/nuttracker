// Shared crime catalog + option pools used by the Crime page and Crime menu.

export const CRIME_CATALOG = [
  {
    id: 'wire_fraud', name: 'Wire Fraud', severity: 'FEDERAL', reward: 75000, risk: 'high',
    description: 'Intercept or initiate fraudulent wire transfers by impersonating a trusted party in a transaction chain.',
    variants: ['Business Email Compromise', 'Romance Scam Pipeline', 'Fake Invoice Scheme', 'CEO Impersonation'],
  },
  {
    id: 'identity_theft', name: 'Identity Theft', severity: 'FELONY', reward: 18000, risk: 'medium',
    description: 'Acquire and exploit another person\u2019s identifying information to open accounts, withdraw funds, or evade detection.',
    variants: ['Synthetic Identity', 'Dead-Baby Certificate', 'Mailbox Harvest', 'Database Breach Pull'],
  },
  {
    id: 'embezzlement', name: 'Embezzlement', severity: 'FELONY', reward: 95000, risk: 'medium',
    description: 'Systematically divert employer funds into accounts you control, concealed inside legitimate bookkeeping.',
    variants: ['Skimming Receivables', 'Ghost Employee Payroll', 'Fictitious Vendor', 'Expense Report Mill'],
  },
  {
    id: 'burglary', name: 'Burglary', severity: 'FELONY', reward: 30000, risk: 'high',
    description: 'Unlawfully enter a structure with intent to commit theft or another offence inside.',
    variants: ['Smash & Grab', 'After-Hours Entry', 'Safe Crack', 'Rooftop Access'],
  },
  {
    id: 'extortion', name: 'Extortion', severity: 'FELONY', reward: 45000, risk: 'high',
    description: 'Compel payment through threats of exposure, harm, or disruption unless a demand is met.',
    variants: ['Blackmail Leakage', 'Protection Racket', 'Sextortion', 'Data Ransom'],
  },
  {
    id: 'cyber_intrusion', name: 'Cyber Intrusion', severity: 'FEDERAL', reward: 140000, risk: 'extreme',
    description: 'Gain unauthorized access to a protected computer system and exfiltrate or deploy payloads.',
    variants: ['Ransomware Deployment', 'SQL Injection', 'Credential Stuffing', 'Supply-Chain Compromise'],
  },
  {
    id: 'credit_card_fraud', name: 'Credit Card Fraud', severity: 'FELONY', reward: 14000, risk: 'low',
    description: 'Use stolen or cloned card data to authorize transactions the real cardholder never approved.',
    variants: ['Card Skimming', 'Cloned Stripe', 'CNP Fraud Run', 'Refund Scheme'],
  },
  {
    id: 'money_laundering', name: 'Money Laundering', severity: 'FEDERAL', reward: 210000, risk: 'high',
    description: 'Pass illicit proceeds through layered transactions to disguise their illegal origin.',
    variants: ['Shell Company Layering', 'Crypto Tumbler', 'Casino Wash', 'Real-Estate Smurfing'],
  },
  {
    id: 'armed_robbery', name: 'Armed Robbery', severity: 'FELONY', reward: 38000, risk: 'extreme',
    description: 'Take property by force or threat of force, with a weapon presentable on the target.',
    variants: ['Bank Teller', 'Armored Truck', 'Pharmacy', 'High-End Jewelry Store'],
  },
  {
    id: 'bribery', name: 'Bribery of Official', severity: 'FEDERAL', reward: 60000, risk: 'high',
    description: 'Offer or give a benefit to a public office-holder to influence an official act.',
    variants: ['Customs Inspector', 'Building Inspector', 'Judge', 'Procurement Officer'],
  },
];

export const LOCATIONS = [
  'Downtown Financial District', 'Online / Remote Access', 'Riverside Warehouse',
  'Corporate Office Tower', 'Residential Estate', 'Offshore Bank Server',
  'Crypto Exchange Hot Wallet', 'Retail Branch', 'Airport Cargo Hold',
  'Marina Pier 9', 'Industrial Park Lot B', 'Private Vault Storage',
];

export const METHODS = [
  'Social engineering (spear-phishing)', 'Brute-force physical entry', 'Insider access (bribed employee)',
  'Remote network exploitation', 'Skimming device planted', 'Forged credentials & badges',
  'Dumpster diving + document reconstruction', 'Lock-pick & bypass alarm', 'Drone surveillance recon',
  'Bluetooth relay attack',
];

export const TIME_SLOTS = [
  '02:00', '04:00', '06:00', '08:00', '10:00', '12:00',
  '14:00', '16:00', '18:00', '20:00', '22:00', '23:30',
];

export function nextDays(n) {
  const out = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push({
      value: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    });
  }
  return out;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function rollBoard() {
  return shuffle(CRIME_CATALOG).slice(0, 6);
}

export const SEVERITY_COLOR = {
  FEDERAL: 'text-red-400 border-red-700/50 bg-red-950/40',
  FELONY: 'text-amber-400 border-amber-700/50 bg-amber-950/30',
};

export const RISK_COLOR = {
  extreme: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-amber-400',
  low: 'text-emerald-400',
};