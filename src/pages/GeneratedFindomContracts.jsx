import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, AlertTriangle, FileText, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const GENERATED_CONTRACTS = [
  {
    title: "Weekly Worship Tax",
    description: "A small weekly tribute to maintain your privilege of existence",
    intensity: "mild",
    monthly: 25,
    duration: 4,
    terms: [
      "Pay $25 every week",
      "Total: $100/month",
      "2% penalty for late payments",
      "Auto-renews weekly"
    ]
  },
  {
    title: "Monthly Devotion Tithe",
    description: "Standard financial submission commitment",
    intensity: "mild",
    monthly: 50,
    duration: 12,
    terms: [
      "Pay $50 monthly",
      "Total obligation: $600",
      "5% penalty for missed payments",
      "Renewable contract"
    ]
  },
  {
    title: "Bi-Weekly Slave Tax",
    description: "Twice monthly financial obligations for your worship",
    intensity: "mild",
    monthly: 75,
    duration: 6,
    terms: [
      "Pay $37.50 every two weeks",
      "Total: $450 over 6 months",
      "3% late fee",
      "Automatic billing"
    ]
  },
  {
    title: "Daily Drain Program",
    description: "Small daily contributions accumulate over time",
    intensity: "moderate",
    monthly: 100,
    duration: 3,
    terms: [
      "Pay $3.33 daily or $100 monthly",
      "Total: $300 over 3 months",
      "8% penalty for skipped days",
      "Must be paid by 11:59 PM each day"
    ]
  },
  {
    title: "Escalating Devotion Tier 1",
    description: "Payments grow as your devotion strengthens",
    intensity: "moderate",
    monthly: 100,
    duration: 12,
    terms: [
      "Start at $100/month, increase 5% quarterly",
      "Total obligation: ~$1,275",
      "8% penalty for missed payments",
      "Interest accrues at 1% monthly on arrears"
    ]
  },
  {
    title: "Bi-Monthly Bondage Tax",
    description: "Financial chains binding you in servitude",
    intensity: "moderate",
    monthly: 125,
    duration: 8,
    terms: [
      "Pay $62.50 twice monthly",
      "Total: $1,000 over 8 months",
      "10% penalty for late payment",
      "Can't cancel without creditor approval"
    ]
  },
  {
    title: "Tribute Acceleration Plan",
    description: "Your payments increase with time and devotion",
    intensity: "moderate",
    monthly: 150,
    duration: 12,
    terms: [
      "Start at $150/month, increase 10% every 3 months",
      "Total obligation: ~$2,115",
      "8% penalty for any missed payment",
      "Interest compounds monthly at 2%"
    ]
  },
  {
    title: "Premium Worship Contract",
    description: "Mid-tier financial submission agreement",
    intensity: "moderate",
    monthly: 200,
    duration: 18,
    terms: [
      "Pay $200 monthly for 18 months",
      "Total obligation: $3,600",
      "10% penalty for late payment",
      "Non-refundable after 30 days"
    ]
  },
  {
    title: "Quarterly Bondage Agreement",
    description: "Larger payments less frequently",
    intensity: "moderate",
    monthly: 300,
    duration: 4,
    terms: [
      "Pay $300 every 3 months",
      "Total: $1,200",
      "15% penalty for missed quarter",
      "Automatic renewal"
    ]
  },
  {
    title: "Intense Submission Pact",
    description: "Serious financial commitment with consequences",
    intensity: "intense",
    monthly: 250,
    duration: 24,
    terms: [
      "Pay $250 monthly for 2 years",
      "Total obligation: $6,000",
      "10% penalty for any late payment",
      "Interest accrues at 5% monthly on unpaid balance",
      "Non-refundable - no early termination"
    ]
  },
  {
    title: "Permanent Financial Collar",
    description: "Indefinite financial servitude begins here",
    intensity: "intense",
    monthly: 300,
    duration: 0,
    terms: [
      "Pay $300 every month indefinitely",
      "No contract end date - permanent",
      "12% penalty for missed payments",
      "Interest compounds daily at 2%",
      "Cannot be terminated without written consent"
    ]
  },
  {
    title: "Total Ownership Plan",
    description: "Your finances belong to your master",
    intensity: "intense",
    monthly: 350,
    duration: 36,
    terms: [
      "Pay $350 monthly for 3 years",
      "Total obligation: $12,600",
      "15% penalty for late payment",
      "Interest at 5% monthly on arrears",
      "Asset freeze if payments missed",
      "Binding legal agreement"
    ]
  },
  {
    title: "Extreme Devotion Covenant",
    description: "Complete financial surrender to your dom",
    intensity: "intense",
    monthly: 500,
    duration: 36,
    terms: [
      "Pay $500 monthly for 3 years minimum",
      "Total minimum: $18,000",
      "15% penalty for missed payments",
      "Interest compounds monthly at 5%",
      "Cannot escape through bankruptcy",
      "Assets may be seized if default occurs"
    ]
  },
  {
    title: "Endless Drain Contract",
    description: "You will drain indefinitely for your master",
    intensity: "extreme",
    monthly: 500,
    duration: 0,
    terms: [
      "Pay $500 every month for life",
      "No termination date - perpetual servitude",
      "20% penalty for ANY missed payment",
      "Interest compounds daily at 5%",
      "Complete financial autonomy surrender",
      "This is irreversible and permanent",
      "Attempting to escape carries consequences"
    ]
  },
  {
    title: "Asset Seizure Agreement",
    description: "Your home is collateral for your debt",
    intensity: "extreme",
    monthly: 1000,
    duration: 0,
    terms: [
      "Pay $1,000 monthly indefinitely",
      "One missed payment = immediate house auction",
      "Your property sold to highest bidder",
      "Proceed to creditor, you become homeless",
      "50% penalty on missed payments",
      "No appeals, no second chances",
      "This is a binding lien on your property"
    ]
  },
  {
    title: "Financial Annihilation",
    description: "Complete financial destruction contract",
    intensity: "extreme",
    monthly: 2000,
    duration: 0,
    terms: [
      "Pay $2,000 every month indefinitely",
      "All your assets are now owned by creditor",
      "30% penalty for ANY missed payment",
      "Interest compounds daily at 10%",
      "You have zero financial autonomy",
      "This is permanent and irreversible",
      "Escape attempts have legal consequences"
    ]
  },
  {
    title: "Humble Tribute",
    description: "Show your respect with monthly payments",
    intensity: "mild",
    monthly: 35,
    duration: 6,
    terms: [
      "Pay $35 every month for 6 months",
      "Total: $210",
      "4% penalty for late payment",
      "Simple and straightforward"
    ]
  },
  {
    title: "Submission Starter Package",
    description: "Beginning your journey of financial servitude",
    intensity: "mild",
    monthly: 60,
    duration: 8,
    terms: [
      "Pay $60 monthly for 8 months",
      "Total: $480",
      "5% penalty for missed payment",
      "No renewal required after"
    ]
  },
  {
    title: "Gradual Escalation",
    description: "Start small, increase gradually",
    intensity: "moderate",
    monthly: 120,
    duration: 12,
    terms: [
      "Month 1-3: $120/month",
      "Month 4-6: $150/month",
      "Month 7-12: $200/month",
      "Total: $1,710",
      "8% penalty for late payments"
    ]
  },
  {
    title: "Cumulative Servitude",
    description: "Each month compounds your obligation",
    intensity: "moderate",
    monthly: 100,
    duration: 12,
    terms: [
      "Pay $100 monthly, but must maintain all previous payments",
      "Month 1: $100, Month 2: $200, Month 3: $300, etc.",
      "Total by month 12: $7,800",
      "10% penalty if any month is missed"
    ]
  },
  {
    title: "Weekly Worship Ritual",
    description: "Dedicate each week with financial submission",
    intensity: "mild",
    monthly: 80,
    duration: 13,
    terms: [
      "Pay $20 every week",
      "Total: $1,040 over 13 weeks",
      "3% penalty for late week",
      "Must be paid by Sunday midnight"
    ]
  },
  {
    title: "Holiday Devotion Commitment",
    description: "Tribute through the entire year",
    intensity: "moderate",
    monthly: 180,
    duration: 12,
    terms: [
      "Pay $180 monthly year-round",
      "Extra $50 on your birthday",
      "Extra $100 on each holiday",
      "Total: ~$2,400 annually",
      "10% penalty for missed payment"
    ]
  },
  {
    title: "Milestone Escalation Contract",
    description: "Pay more as you progress deeper",
    intensity: "intense",
    monthly: 200,
    duration: 24,
    terms: [
      "Months 1-6: $200/month",
      "Months 7-12: $350/month",
      "Months 13-18: $500/month",
      "Months 19-24: $750/month",
      "Total: $11,400",
      "12% penalty for any late payment"
    ]
  },
  {
    title: "Daily Penance Payments",
    description: "Pay for each day you breathe",
    intensity: "moderate",
    monthly: 150,
    duration: 6,
    terms: [
      "Pay $5 daily or $150 monthly",
      "Every day you skip costs 50% extra",
      "Total: $900 over 6 months",
      "Must maintain consistent payments"
    ]
  },
  {
    title: "Performance-Based Drain",
    description: "Your payments increase with your earnings",
    intensity: "intense",
    monthly: 500,
    duration: 12,
    terms: [
      "Pay 10% of your monthly income",
      "Minimum: $500/month",
      "Maximum: unlimited",
      "Total: $6,000+ over 12 months",
      "Must prove income monthly",
      "15% penalty for underreporting"
    ]
  },
  {
    title: "Lifetime Debt Obligation",
    description: "You'll be paying forever",
    intensity: "extreme",
    monthly: 750,
    duration: 0,
    terms: [
      "Pay $750 every month for the rest of your life",
      "No possible escape or early termination",
      "25% penalty for any late payment",
      "Interest compounds monthly at 8%",
      "Your estate must continue payments after death",
      "This binds all your future income"
    ]
  },
  {
    title: "Quick Submission Burst",
    description: "Intense 3-month commitment",
    intensity: "moderate",
    monthly: 300,
    duration: 3,
    terms: [
      "Pay $300 monthly for just 3 months",
      "Total: $900",
      "10% penalty for missed payment",
      "Fast and intense"
    ]
  },
  {
    title: "Perpetual Servitude Bond",
    description: "Forever bind yourself to your master",
    intensity: "extreme",
    monthly: 1500,
    duration: 0,
    terms: [
      "Pay $1,500 monthly indefinitely",
      "You are now permanently owned",
      "40% penalty for any missed payment",
      "Interest compounds daily at 15%",
      "Cannot file bankruptcy or escape",
      "Your entire future is mortgaged",
      "This is absolute and final"
    ]
  },
  {
    title: "Quarterly Domination Fees",
    description: "Four times a year, you pay tribute",
    intensity: "moderate",
    monthly: 400,
    duration: 5,
    terms: [
      "Pay $1,600 every 3 months",
      "Total: $8,000 over 5 quarters",
      "15% penalty if quarter is late",
      "No exceptions or extensions"
    ]
  },
  {
    title: "Progressive Humiliation",
    description: "Each payment is larger than the last",
    intensity: "intense",
    monthly: 200,
    duration: 12,
    terms: [
      "$200 → $225 → $250 → $275... increasing $25 each month",
      "Total over 12 months: $3,300",
      "12% penalty for any late payment",
      "Interest at 3% monthly on arrears"
    ]
  },
  {
    title: "Master's Daily Allowance",
    description: "You pay for your master's daily needs",
    intensity: "moderate",
    monthly: 250,
    duration: 12,
    terms: [
      "Pay $8.33 daily ($250 monthly)",
      "Covers master's food, drinks, entertainment",
      "12% penalty for missing a single day",
      "Must be paid in advance for the week"
    ]
  },
  {
    title: "Bankruptcy Waiver Contract",
    description: "You forfeit your right to bankruptcy protection",
    intensity: "extreme",
    monthly: 600,
    duration: 24,
    terms: [
      "Pay $600 monthly for 2 years",
      "Total: $14,400",
      "You waive all bankruptcy protection",
      "20% penalty for missed payment",
      "Interest compounds at 10% monthly",
      "Creditor can seize all assets to recoup debt",
      "This is legally binding and absolute"
    ]
  },
  {
    title: "Biweekly Bondage Dues",
    description: "Every two weeks, the drain continues",
    intensity: "moderate",
    monthly: 175,
    duration: 9,
    terms: [
      "Pay $87.50 every two weeks",
      "Total: $1,575 over 9 months",
      "10% penalty if payment is late",
      "Automatic withdrawals"
    ]
  },
  {
    title: "Exponential Debt Growth",
    description: "Your debt multiplies each month",
    intensity: "extreme",
    monthly: 100,
    duration: 12,
    terms: [
      "Month 1: $100, Month 2: $200, Month 3: $400...",
      "Debt doubles every month",
      "Total obligation: $409,500 by month 12",
      "30% penalty for any missed month",
      "This creates exponential servitude",
      "You cannot escape compound interest"
    ]
  },
  {
    title: "Complete Wage Garnishment",
    description: "A percentage of everything you earn",
    intensity: "extreme",
    monthly: 500,
    duration: 0,
    terms: [
      "20% of your gross monthly income",
      "Minimum: $500/month",
      "No limit on maximum",
      "Applied before taxes",
      "IRS will enforce collection",
      "Cannot change employment to escape",
      "Permanently reduces your take-home pay"
    ]
  },
  {
    title: "Anniversary Escalation",
    description: "Each year, your payment increases",
    intensity: "intense",
    monthly: 200,
    duration: 0,
    terms: [
      "Year 1: $200/month",
      "Year 2: $400/month",
      "Year 3: $800/month... doubling annually",
      "No termination date",
      "15% penalty for late payment",
      "You'll owe exponentially more each year"
    ]
  },
  {
    title: "Seasonal Slavery Contract",
    description: "Your obligations change with seasons",
    intensity: "moderate",
    monthly: 300,
    duration: 12,
    terms: [
      "Summer (Jun-Aug): $200/month",
      "Fall (Sep-Nov): $300/month",
      "Winter (Dec-Feb): $400/month",
      "Spring (Mar-May): $250/month",
      "Total: $3,600 annually",
      "10% penalty for missing seasonal payments"
    ]
  },
  {
    title: "Debt Spiral Mechanism",
    description: "Unpaid interest creates more debt",
    intensity: "extreme",
    monthly: 300,
    duration: 0,
    terms: [
      "Pay $300/month with 20% compound interest",
      "If you miss one payment, interest snowballs",
      "Debt grows exponentially with non-payment",
      "Total debt can easily double in 6 months",
      "Designed to create financial trap",
      "Escape is mathematically nearly impossible"
    ]
  },
  {
    title: "Guilt-Based Escalation",
    description: "The more you enjoy it, the more you pay",
    intensity: "intense",
    monthly: 250,
    duration: 12,
    terms: [
      "Base payment: $250/month",
      "Optional guilt surcharge: 5-50% extra",
      "You choose the surcharge based on pleasure",
      "Total: $3,000-$4,500 over 12 months",
      "Encourages increasing payments over time"
    ]
  },
  {
    title: "Retroactive Debt Collection",
    description: "Pay for past 'infractions'",
    intensity: "moderate",
    monthly: 200,
    duration: 18,
    terms: [
      "Pay $200/month for 18 months",
      "Covers debts from past 2 years",
      "12% penalty for late payment",
      "Interest compounds at 2%/month on arrears",
      "Total obligation: $3,600+"
    ]
  },
  {
    title: "Lifetime Financial Collapse",
    description: "Complete and permanent financial destruction",
    intensity: "extreme",
    monthly: 3000,
    duration: 0,
    terms: [
      "Pay $3,000 monthly indefinitely",
      "You are completely financially owned",
      "50% penalty for any missed payment",
      "Interest compounds daily at 20%",
      "All assets become creditor's property",
      "You have no financial future",
      "This is permanent slavery"
    ]
  },
  {
    title: "Recession Proof Debt",
    description: "Your payments never decrease",
    intensity: "intense",
    monthly: 400,
    duration: 0,
    terms: [
      "Pay $400/month no matter what",
      "Job loss, illness, recession: no relief",
      "15% penalty if payment is missed",
      "Interest at 8% monthly on any arrears",
      "Your debt is absolutely non-negotiable"
    ]
  },
  {
    title: "Intergenerational Servitude",
    description: "Your debt passes to your children",
    intensity: "extreme",
    monthly: 800,
    duration: 0,
    terms: [
      "Pay $800/month for your lifetime",
      "Upon your death, debt transfers to heirs",
      "Your children must continue payments",
      "30% penalty for any missed payment",
      "Interest at 12% monthly on arrears",
      "This enslaves future generations"
    ]
  },
  {
    title: "Stimulus Check Seizure",
    description: "All government assistance goes to debt",
    intensity: "extreme",
    monthly: 500,
    duration: 0,
    terms: [
      "Pay $500/month minimum",
      "Any stimulus/tax refund automatically seized",
      "Unemployment benefits garnished",
      "20% penalty for late payment",
      "Interest at 10% monthly on arrears",
      "Government will assist collection"
    ]
  },
  {
    title: "Social Security Lien",
    description: "Even retirement isn't safe",
    intensity: "extreme",
    monthly: 1000,
    duration: 0,
    terms: [
      "Pay $1,000/month from any source",
      "Social Security payments will be garnished",
      "Retirement accounts are collateral",
      "40% penalty for missed payment",
      "Interest at 15% monthly on arrears",
      "Even death doesn't end this debt"
    ]
  },
  {
    title: "Zero-Escape Covenant",
    description: "There is no way out",
    intensity: "extreme",
    monthly: 2500,
    duration: 0,
    terms: [
      "Pay $2,500/month indefinitely",
      "No bankruptcy clause",
      "No statute of limitations",
      "No death clause",
      "50% penalty for any late payment",
      "Interest compounds daily at 25%",
      "This is absolute permanent servitude",
      "You have sold your entire future"
    ]
  },
  {
    title: "Home Seizure Mortgage",
    description: "Your house is collateral for your servitude",
    intensity: "extreme",
    monthly: 800,
    duration: 0,
    terms: [
      "Pay $800 every month indefinitely",
      "Your primary residence is held as collateral",
      "ONE missed payment triggers immediate house auction",
      "Property sold to highest bidder within 30 days",
      "You become homeless - proceeds go to creditor",
      "50% penalty compounds on missed payments",
      "No grace period, no appeals, no second chances",
      "This is a binding lien on your property"
    ]
  },
  {
    title: "Property Liquidation Pact",
    description: "Miss one payment, lose your home",
    intensity: "extreme",
    monthly: 1200,
    duration: 0,
    terms: [
      "Pay $1,200 monthly or forfeit your house",
      "Automatic auction trigger on any late payment",
      "Your home goes to public auction immediately",
      "No minimum bid - sold as-is to highest offer",
      "You have 48 hours to vacate after sale",
      "40% penalty on unpaid balances",
      "Interest compounds daily at 20%",
      "This is absolute and irreversible"
    ]
  },
  {
    title: "Eviction Assurance Contract",
    description: "Every missed payment brings you closer to homelessness",
    intensity: "extreme",
    monthly: 1500,
    duration: 0,
    terms: [
      "Pay $1,500 monthly or watch your house go to auction",
      "First missed payment: eviction notice filed",
      "Second missed payment: house listed for auction",
      "Third missed payment: auction completed, you're homeless",
      "60% penalty for each missed month",
      "Interest at 25% daily on arrears",
      "Creditor has full authority over your property",
      "Your shelter depends on monthly payments"
    ]
  },
  {
    title: "Ultimate Homelessness Contract",
    description: "Your home becomes your master's property",
    intensity: "extreme",
    monthly: 2000,
    duration: 0,
    terms: [
      "Pay $2,000 monthly or lose your home to auction",
      "Your house is now collateral for total servitude",
      "Miss even ONE payment and it goes to auction immediately",
      "No waiting period - auction happens within 14 days",
      "You are evicted and homeless with no recourse",
      "Proceeds go entirely to creditor",
      "70% penalty for late payment",
      "Interest compounds at 30% monthly on unpaid debt",
      "This enslaves your shelter and your future"
    ]
  },
  {
    title: "Government Seizure Order",
    description: "The IRS will take your house",
    intensity: "extreme",
    monthly: 1500,
    duration: 0,
    terms: [
      "Pay $1,500 monthly or face federal tax lien",
      "Failure to pay triggers IRS federal lien on property",
      "IRS can seize and auction your house",
      "Government has priority claim over all other debts",
      "Your property seized without warning or court approval",
      "50% penalty for missed payment",
      "Interest at 20% daily compounds on unpaid balance",
      "IRS will use all enforcement power to collect",
      "Your home is now federal government property"
    ]
  },
  {
    title: "Federal Asset Forfeiture",
    description: "Uncle Sam takes your house for unpaid debt",
    intensity: "extreme",
    monthly: 1800,
    duration: 0,
    terms: [
      "Pay $1,800 monthly indefinitely",
      "Miss payment = federal asset forfeiture proceedings begin",
      "Your house declared forfeit property of the U.S. Government",
      "No trial needed - civil forfeiture allows seizure",
      "Property sold at government auction within 60 days",
      "You lose all equity - proceeds to federal reserve",
      "60% penalty on missed payments",
      "Interest at 25% daily on all arrears",
      "Federal marshals enforce eviction"
    ]
  },
  {
    title: "Tax Court Lien Agreement",
    description: "Federal government gets a lien on everything you own",
    intensity: "extreme",
    monthly: 2000,
    duration: 0,
    terms: [
      "Pay $2,000 monthly or file is transferred to Tax Court",
      "Tax Court issues federal judgment lien on all property",
      "Lien attaches to your home automatically",
      "IRS begins seizure process - your house is first target",
      "Property will be sold to satisfy federal lien",
      "You cannot refinance, sell, or borrow against property",
      "70% penalty for any missed payment",
      "Interest at 28% daily compounds on unpaid balance",
      "Federal government now owns your financial future"
    ]
  },
  {
    title: "Judgment & Execution Seizure",
    description: "Court ordered government seizure of your home",
    intensity: "extreme",
    monthly: 2200,
    duration: 0,
    terms: [
      "Pay $2,200 monthly or debt goes to federal judgment",
      "Federal court issues writ of execution against your property",
      "Sheriff authorized to seize and auction your house",
      "Government becomes judgment creditor with priority lien",
      "Your home sold within 90 days to satisfy judgment",
      "You have no right to redemption",
      "80% penalty for missed payment",
      "Interest compounds daily at 35%",
      "This is a binding federal judgment"
    ]
  },
  {
    title: "Arrest Warrant Contract",
    description: "Miss a payment and you'll be arrested",
    intensity: "extreme",
    monthly: 1600,
    duration: 0,
    terms: [
      "Pay $1,600 monthly or face criminal charges",
      "One missed payment = arrest warrant issued",
      "You can be arrested and jailed for non-payment",
      "Warrant is active and enforceable immediately",
      "Law enforcement will locate and arrest you",
      "No bail until all arrears are paid in full",
      "Criminal record for debt evasion",
      "70% penalty for missed payment",
      "Interest at 25% daily compounds on unpaid balance"
    ]
  },
  {
    title: "Criminal Debt Enforcement",
    description: "Failure to pay means prison time",
    intensity: "extreme",
    monthly: 1900,
    duration: 0,
    terms: [
      "Pay $1,900 monthly or be criminally charged",
      "Miss one payment = felony charge filed",
      "Arrest warrant issued with no bail option",
      "Police will apprehend you wherever you are",
      "You face up to 5 years imprisonment per violation",
      "Criminal record follows you forever",
      "Court-ordered payment while incarcerated",
      "80% penalty on missed payments",
      "Interest at 30% daily on all arrears"
    ]
  },
  {
    title: "Maximum Incarceration Pact",
    description: "Debtors' prison - you'll be locked up for non-payment",
    intensity: "extreme",
    monthly: 2500,
    duration: 0,
    terms: [
      "Pay $2,500 monthly or go to jail",
      "ANY missed payment triggers arrest immediately",
      "You will be arrested and held pending trial",
      "Judge can sentence you to up to 10 years",
      "You stay in prison until debt is completely paid",
      "Your assets frozen - you can't earn to pay debt",
      "Impossible situation designed for maximum control",
      "100% penalty for missing payment",
      "Interest compounds at 50% daily in prison"
    ]
  },
  {
    title: "Interstate Manhunt Contract",
    description: "Fugitive status for unpaid debt",
    intensity: "extreme",
    monthly: 2000,
    duration: 0,
    terms: [
      "Pay $2,000 monthly or become a wanted fugitive",
      "Miss payment = interstate arrest warrant issued",
      "FBI puts you on wanted persons database",
      "Can be arrested in any state or country",
      "Extradition proceedings begin automatically",
      "You cannot leave - you're being hunted",
      "Potential criminal charges in multiple jurisdictions",
      "90% penalty for missed payment",
      "Interest at 40% daily on all arrears"
    ]
  },
  {
    title: "Bench Warrant Trap",
    description: "Court automatically issues arrest warrant on missed payment",
    intensity: "extreme",
    monthly: 1400,
    duration: 0,
    terms: [
      "Pay $1,400 monthly or trigger automatic bench warrant",
      "Miss one payment = judge issues bench warrant same day",
      "Warrant enforceable immediately - you'll be arrested",
      "Can be arrested at work, home, driving, anywhere",
      "No advance notice, no opportunity to cure",
      "Held in custody until full payment made",
      "Criminal contempt of court charges filed",
      "75% penalty for missed payment",
      "Interest at 35% daily compounds"
    ]
  },
  {
    title: "Employment Arrest Clause",
    description: "Arrested at your workplace for non-payment",
    intensity: "extreme",
    monthly: 1700,
    duration: 0,
    terms: [
      "Pay $1,700 monthly or be arrested at work",
      "Miss payment = arrest warrant served at your job",
      "Law enforcement arrives to apprehend you",
      "You're arrested in front of your employer and colleagues",
      "Immediate termination of employment likely",
      "You lose income and your job simultaneously",
      "70% penalty for missed payment",
      "Interest at 32% daily on unpaid balance",
      "Designed to destroy your career and freedom"
    ]
  },
  {
    title: "Warrant Stacking Protocol",
    description: "Multiple warrants compound for each missed payment",
    intensity: "extreme",
    monthly: 1550,
    duration: 0,
    terms: [
      "Pay $1,550 monthly or face warrant escalation",
      "First missed payment = arrest warrant issued",
      "Second missed payment = additional felony warrant issued",
      "Third missed payment = third warrant for federal charge",
      "Each warrant carries up to 5 years imprisonment",
      "Total potential sentence: 15+ years for 3 missed payments",
      "All warrants active and enforceable simultaneously",
      "85% penalty for each missed month",
      "Interest at 38% daily compounds on unpaid debt"
    ]
  },
  {
    title: "24-Hour Arrest Guarantee",
    description: "You'll be arrested within 24 hours of missed payment",
    intensity: "extreme",
    monthly: 1800,
    duration: 0,
    terms: [
      "Pay $1,800 monthly or guaranteed arrest within 24 hours",
      "Miss payment = active warrant within 1 hour",
      "Police will locate and arrest you within 24 hours",
      "Warrant guarantees apprehension - nowhere to hide",
      "Held without bail until payment is made",
      "Additional contempt charges for trying to evade",
      "80% penalty for missed payment",
      "Interest at 36% daily on all arrears",
      "This contract guarantees your incarceration"
    ]
  },
  {
    title: "Child Endangerment Fraud",
    description: "False charges filed if you miss payment",
    intensity: "extreme",
    monthly: 2100,
    duration: 0,
    terms: [
      "Pay $2,100 monthly or face fabricated criminal charges",
      "Miss payment = false child endangerment charges filed",
      "Arrest warrant issued for serious felony",
      "Arrested and charged with crimes you didn't commit",
      "Your reputation destroyed, family traumatized",
      "Must fight charges while also paying debt",
      "Legal fees compound the debt burden",
      "95% penalty for missed payment",
      "Interest at 45% daily - designed for total destruction"
    ]
  },
  {
    title: "Parole Violation Linkage",
    description: "Non-payment treated as parole violation",
    intensity: "extreme",
    monthly: 1300,
    duration: 0,
    terms: [
      "Pay $1,300 monthly or violate parole conditions",
      "This debt treated as parole violation clause",
      "Miss payment = parole officer notified immediately",
      "Parole violation warrant issued automatically",
      "Arrested and returned to prison for parole violation",
      "Original sentence resumes - you go back inside",
      "No trial, no hearing - automatic enforcement",
      "Perfectly legal method of imprisonment",
      "80% penalty for missed payment"
    ]
  },
  {
    title: "Immigration Consequence Debt",
    description: "Non-payment triggers immigration charges",
    intensity: "extreme",
    monthly: 1650,
    duration: 0,
    terms: [
      "Pay $1,650 monthly or face immigration action",
      "Miss payment = reported to immigration authorities",
      "Criminal charges filed - deportable offense",
      "Arrest warrant for criminal debt evasion",
      "Deportation proceedings begin immediately",
      "You're arrested and deported from the country",
      "Permanently banned from re-entry",
      "85% penalty for missed payment",
      "Interest at 40% daily on all arrears"
    ]
  },
  {
    title: "Serial Offender Classification",
    description: "Treated as habitual criminal after one missed payment",
    intensity: "extreme",
    monthly: 1900,
    duration: 0,
    terms: [
      "Pay $1,900 monthly or be labeled serial offender",
      "Miss one payment = classified as habitual criminal",
      "Enhanced sentencing laws apply to any future arrest",
      "Even minor offenses carry maximum penalties",
      "Three strikes law activated against you",
      "You face life imprisonment for small future crimes",
      "One missed payment = lifetime criminal status",
      "90% penalty for missed payment",
      "Interest at 42% daily compounds"
    ]
  },
  {
    title: "Public Registry Humiliation",
    description: "Your face on wanted posters in your neighborhood",
    intensity: "extreme",
    monthly: 1200,
    duration: 0,
    terms: [
      "Pay $1,200 monthly or be publicly hunted",
      "Miss payment = wanted posters distributed in your area",
      "Your photograph and address published publicly",
      "Neighbors, coworkers, family see you're wanted",
      "Public humiliation designed to force payment",
      "Arrest warrant active and widely advertised",
      "Impossible to hide - everyone knows you're wanted",
      "70% penalty for missed payment",
      "Interest at 30% daily on unpaid balance"
    ]
  },
  {
    title: "Federal Penitentiary Clause",
    description: "You'll be sent to federal prison for non-payment",
    intensity: "extreme",
    monthly: 2300,
    duration: 0,
    terms: [
      "Pay $2,300 monthly or be imprisoned federally",
      "Miss payment = referred to federal prosecutors",
      "Federal charges filed - maximum sentences apply",
      "Sent to federal penitentiary for 10+ years",
      "Federal crimes don't allow early parole",
      "You'll serve your entire sentence in prison",
      "100% penalty for missed payment",
      "Interest at 50% daily compounds on unpaid balance"
    ]
  },
  {
    title: "Solitary Confinement Contract",
    description: "Imprisonment in solitary for debt evasion",
    intensity: "extreme",
    monthly: 1750,
    duration: 0,
    terms: [
      "Pay $1,750 monthly or go to solitary confinement",
      "Miss payment = arrested and placed in isolation",
      "Solitary cell 23 hours per day indefinitely",
      "Psychological torture designed to break you",
      "You'll never see another human face",
      "No release until debt is paid in full",
      "90% penalty for missed payment",
      "Interest at 44% daily while imprisoned"
    ]
  },
  {
    title: "Extradition Guarantee",
    description: "Hunted internationally for non-payment",
    intensity: "extreme",
    monthly: 2000,
    duration: 0,
    terms: [
      "Pay $2,000 monthly or become international fugitive",
      "Miss payment = Interpol red notice issued",
      "You're hunted by every country on Earth",
      "Arrested upon landing in any country",
      "Extradited back to face criminal charges",
      "International manhunt for debt evasion",
      "85% penalty for missed payment",
      "Interest at 42% daily on all arrears"
    ]
  },
  {
    title: "Immediate Incarceration",
    description: "Arrested instantly upon missing payment",
    intensity: "extreme",
    monthly: 1500,
    duration: 0,
    terms: [
      "Pay $1,500 monthly or be arrested instantly",
      "Miss payment by even one day = immediate arrest",
      "Officers stationed ready to apprehend you",
      "You're taken into custody before you know what happened",
      "No time to hide, escape, or prepare",
      "Transported directly to holding facility",
      "80% penalty for late payment",
      "Interest at 38% daily on arrears"
    ]
  },
  {
    title: "Home Invasion Arrest",
    description: "Arrested in your home in the middle of the night",
    intensity: "extreme",
    monthly: 1600,
    duration: 0,
    terms: [
      "Pay $1,600 monthly or be arrested at home",
      "Miss payment = no-knock warrant executed at night",
      "Police raid your home - guns drawn",
      "Arrested in front of your family",
      "Your home destroyed during the raid",
      "Traumatic arrest designed for maximum fear",
      "75% penalty for missed payment",
      "Interest at 40% daily on unpaid balance"
    ]
  },
  {
    title: "Drug Conspiracy Charges",
    description: "Framed with false drug charges for non-payment",
    intensity: "extreme",
    monthly: 1900,
    duration: 0,
    terms: [
      "Pay $1,900 monthly or face drug charges",
      "Miss payment = arrested for drug trafficking",
      "False evidence planted, you're charged with felony",
      "Mandatory minimum 10 years in prison",
      "Your life destroyed by fabricated crimes",
      "Difficult to prove innocence from jail",
      "95% penalty for missed payment",
      "Interest at 48% daily on all arrears"
    ]
  },
  {
    title: "Violent Crime Accusation",
    description: "Arrested for violent crimes you didn't commit",
    intensity: "extreme",
    monthly: 2100,
    duration: 0,
    terms: [
      "Pay $2,100 monthly or be arrested for violence",
      "Miss payment = arrested for assault or battery",
      "Charged with violent felony you never committed",
      "Prison sentences for crimes you didn't do",
      "Your innocence doesn't matter - you're arrested",
      "Years of legal battles prove your innocence",
      "100% penalty for missed payment",
      "Interest at 50% daily compounds"
    ]
  },
  {
    title: "Sex Offender Registration",
    description: "Registered as sex offender for debt evasion",
    intensity: "extreme",
    monthly: 1400,
    duration: 0,
    terms: [
      "Pay $1,400 monthly or be labeled sex offender",
      "Miss payment = false sex crime charges filed",
      "Arrested and convicted of sex offense",
      "Registered as sex offender for life",
      "Cannot live near schools or parks",
      "Neighborhood notification of your presence",
      "80% penalty for missed payment",
      "Interest at 36% daily on arrears"
    ]
  },
  {
    title: "Consecutive Sentencing",
    description: "Multiple sentences run back-to-back for maximum time",
    intensity: "extreme",
    monthly: 1800,
    duration: 0,
    terms: [
      "Pay $1,800 monthly or serve consecutive sentences",
      "Miss 3 payments = 3 consecutive sentences imposed",
      "Each sentence is 15 years - total 45 years",
      "You'll be imprisoned for life",
      "Sentences stack and compound endlessly",
      "No parole, no early release possible",
      "90% penalty for each missed month",
      "Interest at 45% daily compounds on unpaid debt"
    ]
  },
  {
    title: "Accessory Charges",
    description: "Your family arrested as accomplices",
    intensity: "extreme",
    monthly: 1700,
    duration: 0,
    terms: [
      "Pay $1,700 monthly or your family is arrested",
      "Miss payment = family charged as accessories",
      "Your spouse, children, parents all arrested",
      "They face prison time for your debt",
      "Emotional torture designed to force payment",
      "Your loved ones suffer for your non-payment",
      "85% penalty for missed payment",
      "Interest at 42% daily on all arrears"
    ]
  },
  {
    title: "Lifetime Surveillance",
    description: "Tracked and monitored forever for non-payment",
    intensity: "extreme",
    monthly: 1550,
    duration: 0,
    terms: [
      "Pay $1,550 monthly or face lifetime surveillance",
      "Miss payment = constant GPS and camera monitoring",
      "Watched 24/7 by government and creditor",
      "Every movement tracked and recorded",
      "No privacy, no freedom of movement",
      "Surveil continues for rest of your life",
      "75% penalty for missed payment",
      "Interest at 38% daily on unpaid balance"
    ]
  },
  {
    title: "Court Bailiff Executor",
    description: "Court-appointed officer enforces arrest immediately",
    intensity: "extreme",
    monthly: 1650,
    duration: 0,
    terms: [
      "Pay $1,650 monthly or be arrested by court officer",
      "Miss payment = bailiff immediately issues warrant",
      "Court officer personally enforces your arrest",
      "You're apprehended and jailed same day",
      "Held in custody until full payment made",
      "Court process guarantees your imprisonment",
      "80% penalty for missed payment",
      "Interest at 40% daily compounds"
    ]
  },
  {
    title: "Probation Violation Debt",
    description: "Non-payment automatically violates your probation",
    intensity: "extreme",
    monthly: 1400,
    duration: 0,
    terms: [
      "Pay $1,400 monthly or violate probation conditions",
      "This contract automatically part of your probation",
      "Miss payment = probation violation filed",
      "Probation revoked immediately upon violation",
      "You're returned to prison for original crime",
      "Plus additional time for debt violation",
      "75% penalty for missed payment",
      "Interest at 35% daily on all arrears"
    ]
  },
  {
    title: "Interstate Compact Violation",
    description: "Violate interstate compact by missing payment",
    intensity: "extreme",
    monthly: 1800,
    duration: 0,
    terms: [
      "Pay $1,800 monthly or violate interstate compact",
      "Miss payment = violation of interstate agreement",
      "You're extradited back to original state",
      "Original charges reinstated and prosecuted",
      "Additional charges for interstate violations",
      "Multiple states pursue criminal charges simultaneously",
      "85% penalty for missed payment",
      "Interest at 41% daily on unpaid balance"
    ]
  },
  {
    title: "Cyber Crime Charges",
    description: "False cyber crime charges if you miss payment",
    intensity: "extreme",
    monthly: 2000,
    duration: 0,
    terms: [
      "Pay $2,000 monthly or face federal cyber charges",
      "Miss payment = charged with federal hacking crimes",
      "FBI investigates fabricated computer fraud",
      "Sentenced to federal prison for tech crimes",
      "Assets seized under CFAA violations",
      "Impossible to defend against federal charges",
      "95% penalty for missed payment",
      "Interest at 48% daily compounds"
    ]
  },
  {
    title: "Conspiracy Charge Fabrication",
    description: "Arrested for criminal conspiracy you're not part of",
    intensity: "extreme",
    monthly: 1700,
    duration: 0,
    terms: [
      "Pay $1,700 monthly or be charged with conspiracy",
      "Miss payment = arrested for criminal conspiracy",
      "Charged for crimes orchestrated by others",
      "You're the scapegoat for major criminal operation",
      "RICO charges expose you to life imprisonment",
      "Guilt by association - you didn't commit crimes",
      "90% penalty for missed payment",
      "Interest at 45% daily on all arrears"
    ]
  },
  {
    title: "Habitual Offender Escalation",
    description: "Three strikes law activated on first violation",
    intensity: "extreme",
    monthly: 1900,
    duration: 0,
    terms: [
      "Pay $1,900 monthly or trigger three strikes",
      "Miss ONE payment = first strike against you",
      "Two more missed payments = second and third strike",
      "Third strike = life imprisonment mandatory",
      "Lifetime in prison for unpaid debt",
      "No parole, no appeals, no mercy",
      "95% penalty for each missed month",
      "Interest at 47% daily on unpaid balance"
    ]
  },
  {
    title: "Border Patrol Trap",
    description: "Arrested attempting to cross any border",
    intensity: "extreme",
    monthly: 1600,
    duration: 0,
    terms: [
      "Pay $1,600 monthly or be arrested at borders",
      "Miss payment = warrant active at all borders",
      "Arrested if you attempt to leave the country",
      "Held by border patrol pending extradition",
      "Cannot escape debt by fleeing jurisdiction",
      "International borders enforced against you",
      "80% penalty for missed payment",
      "Interest at 39% daily compounds"
    ]
  },
  {
    title: "DNA Database Registration",
    description: "Your DNA added to criminal database for debt",
    intensity: "extreme",
    monthly: 1500,
    duration: 0,
    terms: [
      "Pay $1,500 monthly or be registered in DNA database",
      "Miss payment = DNA collected and entered in system",
      "DNA used to tie you to unsolved crimes",
      "Possibly arrested for crimes you didn't commit",
      "DNA evidence is considered unrefutable",
      "You're permanently catalogued as criminal",
      "85% penalty for missed payment",
      "Interest at 40% daily on all arrears"
    ]
  }
];

const INTENSITY_CONFIG = {
  mild: { color: 'from-blue-500 to-blue-600', icon: '📋', risk: 'Low Risk' },
  moderate: { color: 'from-yellow-500 to-orange-500', icon: '⚠️', risk: 'Medium Risk' },
  intense: { color: 'from-orange-600 to-red-600', icon: '🔥', risk: 'High Risk' },
  extreme: { color: 'from-red-700 to-red-900', icon: '💀', risk: 'Extreme Risk' }
};

export default function GeneratedFindomContracts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const acceptMutation = useMutation({
    mutationFn: async (contract) => {
      const total = contract.monthly * (contract.duration || 1);
      return base44.entities.DebtContract.create({
        title: contract.title,
        description: contract.description,
        intensity_level: contract.intensity,
        monthly_payment: contract.monthly,
        duration_months: contract.duration,
        total_obligation: total,
        terms: contract.terms,
        is_accepted: true,
        accepted_at: new Date().toISOString(),
        next_payment_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtContracts'] });
      toast.success('Contract accepted - you are now bound');
      setShowConfirmation(false);
      setSelectedContract(null);
    },
    onError: () => {
      toast.error('Failed to accept contract');
    },
  });

  const handleAcceptContract = (contract) => {
    setSelectedContract(contract);
    setShowConfirmation(true);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-500" />
            AI Findom Contracts
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="px-6 pb-24 space-y-4 pt-6">
        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/30 border-2 border-red-500/50 rounded-2xl p-4 flex items-start gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-bold">AI-GENERATED FINDOM CONTRACTS</p>
            <p className="text-red-400/80 text-sm mt-1">
              These are AI-generated fantasy debt contracts. Accepting means you pledge to the terms. Choose carefully.
            </p>
          </div>
        </motion.div>

        {/* Available Contracts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Available Contracts ({GENERATED_CONTRACTS.length})</h2>
          
          {GENERATED_CONTRACTS.map((contract, idx) => {
            const config = INTENSITY_CONFIG[contract.intensity];
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
              >
                <button
                  onClick={() => handleAcceptContract(contract)}
                  className="w-full group relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className={`relative bg-zinc-900 border-2 border-zinc-800 group-hover:border-zinc-700 rounded-2xl p-5 transition-all`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <h3 className="text-white font-bold text-lg">{contract.title}</h3>
                            <p className="text-zinc-400 text-xs mt-0.5">{config.risk}</p>
                          </div>
                        </div>
                        <p className="text-zinc-400 text-sm mt-2">{contract.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="bg-zinc-800/50 rounded-lg p-2">
                        <p className="text-zinc-500 text-xs">Monthly</p>
                        <p className="text-white font-bold text-sm">${contract.monthly}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-2">
                        <p className="text-zinc-500 text-xs">Duration</p>
                        <p className="text-white font-bold text-sm">{contract.duration ? `${contract.duration}m` : '∞'}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-2">
                        <p className="text-zinc-500 text-xs">Total Owed</p>
                        <p className="text-white font-bold text-sm">${contract.monthly * (contract.duration || 1)}</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-2">
                        <p className="text-zinc-500 text-xs">Penalty</p>
                        <p className="text-white font-bold text-sm">5-50%</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-zinc-500 text-xs font-medium mb-2">Terms:</p>
                      <ul className="space-y-1">
                        {contract.terms.slice(0, 3).map((term, i) => (
                          <li key={i} className="text-zinc-400 text-xs flex items-start gap-2">
                            <span className="text-zinc-600">•</span>
                            <span>{term}</span>
                          </li>
                        ))}
                        {contract.terms.length > 3 && (
                          <li className="text-zinc-500 text-xs italic">+{contract.terms.length - 3} more terms</li>
                        )}
                      </ul>
                    </div>

                    <Button
                      className={`w-full bg-gradient-to-r ${config.color} hover:opacity-90 text-white font-bold`}
                    >
                      Accept Contract
                    </Button>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Confirm Contract Acceptance
          </AlertDialogTitle>
          {selectedContract && (
            <AlertDialogDescription className="space-y-4 text-zinc-300">
              <p className="font-bold text-white">{selectedContract.title}</p>
              <div className="bg-zinc-800/50 rounded-lg p-3 space-y-2">
                <p className="text-sm">
                  <span className="text-zinc-500">Monthly Payment:</span>
                  <span className="text-white font-bold ml-2">${selectedContract.monthly}</span>
                </p>
                <p className="text-sm">
                  <span className="text-zinc-500">Total Obligation:</span>
                  <span className="text-white font-bold ml-2">${selectedContract.monthly * (selectedContract.duration || 1)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-zinc-500">Duration:</span>
                  <span className="text-white font-bold ml-2">{selectedContract.duration ? `${selectedContract.duration} months` : 'Permanent'}</span>
                </p>
              </div>
              <p className="text-red-400 text-xs">
                By accepting this contract, you pledge to make these payments. This is a binding financial commitment.
              </p>
            </AlertDialogDescription>
          )}
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedContract && acceptMutation.mutate(selectedContract)}
              disabled={acceptMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              {acceptMutation.isPending ? 'Binding...' : 'I Accept'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}