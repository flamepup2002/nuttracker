import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, AlertTriangle, FileText, Settings, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ContractCustomizer from '@/components/ContractCustomizer';
import SignaturePad from '@/components/SignaturePad';

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
    title: "Total Income Surrender",
    description: "85% of your income goes to your master forever",
    intensity: "extreme",
    monthly: 0,
    duration: 0,
    terms: [
      "Pay 85% of your gross monthly income indefinitely",
      "You must prove income with pay stubs monthly",
      "Miss ONE payment = immediate house auction",
      "Your home is permanent collateral",
      "House sold to highest bidder within 14 days of default",
      "You keep only 15% to survive on",
      "90% penalty for any late payment",
      "Interest at 40% daily on arrears",
      "This is permanent financial slavery"
    ]
  },
  {
    title: "Wage Slavery Forever",
    description: "Work forever, give 85%, or lose everything",
    intensity: "extreme",
    monthly: 0,
    duration: 0,
    terms: [
      "85% of all income paid monthly for life",
      "Covers salary, bonuses, gifts, inheritance - everything",
      "Your house is held as security for compliance",
      "One missed payment triggers immediate auction",
      "Property sold without your consent",
      "You become homeless if you fail",
      "100% penalty for late payment",
      "Interest compounds at 50% daily",
      "Cannot escape through bankruptcy"
    ]
  },
  {
    title: "Perpetual Income Drain",
    description: "Your paycheck is no longer yours",
    intensity: "extreme",
    monthly: 0,
    duration: 0,
    terms: [
      "85% of gross income due monthly forever",
      "Must submit proof of all earnings",
      "House auction triggered automatically if payment late",
      "Property auctioned within 7 days of default",
      "You lose all equity - proceeds go to creditor",
      "No warnings, no grace period",
      "150% penalty for missed payment",
      "Daily compound interest at 60%",
      "Your home is permanently at risk"
    ]
  },
  {
    title: "Income Seizure & Eviction Pact",
    description: "Pay 85% or be evicted and homeless",
    intensity: "extreme",
    monthly: 0,
    duration: 0,
    terms: [
      "85% of all monthly income paid indefinitely",
      "First late payment: eviction notice filed",
      "Second late payment: house goes to auction",
      "You have 48 hours to vacate after auction",
      "All proceeds to creditor, you get nothing",
      "200% penalty for each missed payment",
      "Interest at 75% daily compounds",
      "You will be homeless if you fail to pay",
      "This destroys your financial future forever"
    ]
  },
  {
    title: "Mobility Restriction Contract",
    description: "You cannot sell or move from your residence",
    intensity: "extreme",
    monthly: 600,
    duration: 0,
    terms: [
      "Pay $600 monthly indefinitely",
      "You are PROHIBITED from selling your home",
      "You are PROHIBITED from moving/relocating",
      "Attempting to sell triggers immediate legal action",
      "Moving to new address triggers 500% penalty",
      "Your address is monitored and verified monthly",
      "Court order will prevent property sale",
      "You must remain at current residence permanently",
      "30% penalty for any late payment",
      "This is a binding residential restriction"
    ]
  },
  {
    title: "Tax Evasion Penalty Contract",
    description: "Miss payments = IRS audit and warrant filing",
    intensity: "extreme",
    monthly: 1200,
    duration: 0,
    extreme_mode_only: true,
    terms: [
      "Pay $1,200 monthly indefinitely",
      "Missing payment triggers automatic IRS reporting",
      "IRS will audit all your past 10 years of returns",
      "Creditor files criminal fraud charges with federal prosecutors",
      "Warrant issued for tax evasion if you miss 2 payments",
      "Federal agents authorized to arrest on sight",
      "Criminal record for tax fraud added to background",
      "60% penalty for missed payment",
      "Interest at 30% daily compounds",
      "Federal charges are permanent"
    ]
  },
  {
    title: "Warrant Issuance Bond",
    description: "One missed payment = arrest warrant filed immediately",
    intensity: "extreme",
    monthly: 1500,
    duration: 0,
    extreme_mode_only: true,
    terms: [
      "Pay $1,500 monthly or face arrest",
      "FIRST late payment triggers warrant filing with police",
      "Arrest warrant issued for failure to pay debt",
      "Police authorized to arrest you anywhere",
      "You will be taken into custody without notice",
      "Warrant remains active until paid in full",
      "Bail set at $10,000 minimum",
      "Criminal record permanently added to background check",
      "50% penalty for each missed payment",
      "Warrant cannot be withdrawn without full payment"
    ]
  },
  {
    title: "Federal Fraud Conspiracy",
    description: "Your financial obligations are now a federal crime",
    intensity: "extreme",
    monthly: 2000,
    duration: 0,
    extreme_mode_only: true,
    terms: [
      "Pay $2,000 monthly or face federal fraud charges",
      "Missing payment = federal conspiracy charges filed",
      "FBI investigates you for financial fraud",
      "Federal arrest warrant issued by federal judge",
      "Minimum 5 years federal prison sentence possible",
      "Your name added to federal watch lists",
      "TSA no-fly list added automatically",
      "All assets frozen pending trial",
      "75% penalty for missed payment",
      "Federal felony stays on background forever"
    ]
  },
  {
    title: "Probation Violation Setup",
    description: "Designed to revoke your probation and send you to prison",
    intensity: "extreme",
    monthly: 1000,
    duration: 0,
    extreme_mode_only: true,
    terms: [
      "Pay $1,000 monthly as probation violation fee",
      "Missing payment counts as probation violation",
      "Violation automatically reported to probation officer",
      "Probation revoked = immediate prison time",
      "You are arrested and remanded to custody",
      "No bail - held until sentencing",
      "Additional criminal charges filed for violation",
      "Sentence automatically increased by 2-5 years",
      "100% penalty for any missed payment",
      "This ensures your return to incarceration"
    ]
  },
  {
    title: "FBI Most Wanted Payment",
    description: "Don't pay and you become federal fugitive #1",
    intensity: "extreme",
    monthly: 2500,
    duration: 0,
    extreme_mode_only: true,
    terms: [
      "Pay $2,500 monthly or join FBI Most Wanted",
      "Unpaid balance triggers federal fugitive status",
      "You're added to FBI.gov Most Wanted list",
      "Your face posted in every federal building",
      "Rewards offered for your capture ($5,000-$50,000)",
      "Homeland Security notified of your fugitive status",
      "International borders closed to you",
      "Federal marshals authorized for armed manhunt",
      "100% penalty for each missed payment",
      "This ensures permanent federal prosecution"
    ]
  },
  {
    title: "Criminal Record Permanent File",
    description: "Missed payment adds felony to your permanent record",
    intensity: "extreme",
    monthly: 1800,
    duration: 0,
    extreme_mode_only: true,
    terms: [
      "Pay $1,800 monthly indefinitely",
      "Each missed payment adds a new felony conviction",
      "Criminal record grows with every violation",
      "Employer background checks will always show crimes",
      "Housing applications permanently rejected",
      "Employment opportunities eliminated",
      "Your entire future marked by criminal history",
      "Felonies stay on background check forever",
      "80% penalty for each missed payment",
      "You become permanently unemployable"
    ]
  },
  {
    title: "Bail Revocation Contract",
    description: "Your freedom depends on monthly payments",
    intensity: "extreme",
    monthly: 2200,
    duration: 0,
    extreme_mode_only: true,
    terms: [
      "Pay $2,200 monthly to stay out of jail",
      "Missing payment = bail revoked immediately",
      "Bail bondsman will hunt you down personally",
      "Warrant issued, you're back in custody",
      "No bond hearing - straight back to jail",
      "Entire bail forfeited ($20,000-$100,000 lost)",
      "Additional charges for bail jumping",
      "Prison time increased by years for violation",
      "90% penalty for missed payment",
      "Your freedom is literally dependent on payment"
    ]
  },
  {
    title: "Lifetime Fugitive Status",
    description: "Stop paying and you're a federal fugitive for life",
    intensity: "extreme",
    monthly: 3000,
    duration: 0,
    extreme_mode_only: true,
    terms: [
      "Pay $3,000 monthly forever or become fugitive",
      "Fugitive status never expires - hunted for life",
      "Every law enforcement agency has your photo",
      "International Interpol red notice issued",
      "Facial recognition systems monitor all airports",
      "CCTV systems flag your location automatically",
      "You cannot hide - technology will find you",
      "Decades of federal manhunt",
      "100% penalty for each missed month",
      "You will spend your life running from the law"
    ]
  },
  {
    title: "Felony Conviction Escalation",
    description: "Each unpaid month adds serious federal felony charges",
    intensity: "extreme",
    monthly: 2800,
    duration: 0,
    extreme_mode_only: true,
    terms: [
      "Pay $2,800 monthly or collect federal felonies",
      "Month 1 unpaid: Wire fraud felony filed",
      "Month 2 unpaid: Money laundering felony filed",
      "Month 3 unpaid: Federal conspiracy felony filed",
      "Month 4 unpaid: RICO organized crime charges",
      "Each felony conviction carries 5-10 year sentences",
      "Total prison time could reach 40+ years",
      "Multiple simultaneous trials",
      "120% penalty for every missed payment",
      "Felony convictions compound - life sentence possible"
    ]
  },
  {
    title: "International Manhunt Contract",
    description: "Your debt becomes an international manhunt",
    intensity: "extreme",
    monthly: 3500,
    duration: 0,
    extreme_mode_only: true,
    terms: [
      "Pay $3,500 monthly or face international manhunt",
      "Interpol red notice issued on first late payment",
      "Every country's police force is hunting you",
      "You cannot leave the country or you'll be arrested",
      "Travel impossible - all border crossings monitored",
      "Extradition treaties ensure capture anywhere",
      "Global facial recognition networks track you",
      "Federal charges filed in multiple countries",
      "150% penalty for each missed payment",
      "You become a worldwide fugitive - forever hunted"
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
  const [customizingContract, setCustomizingContract] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const list = await base44.entities.UserSettings.list();
      return list[0] || { extreme_mode: false };
    },
  });

  const filteredContracts = GENERATED_CONTRACTS.filter(contract => {
    if (contract.extreme_mode_only) {
      return settings?.extreme_mode === true;
    }
    return true;
  });

  const acceptMutation = useMutation({
    mutationFn: async (contract) => {
      const total = contract.monthly * (contract.duration || 1);
      
      // Create the contract first with customizations
      const newContract = await base44.entities.DebtContract.create({
        title: contract.title,
        description: contract.description,
        intensity_level: contract.intensity,
        monthly_payment: contract.monthly,
        duration_months: contract.duration,
        total_obligation: total,
        terms: contract.terms,
        is_accepted: false, // Will be set to true after payment
        next_payment_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        penalty_percentage: contract.penalty_percentage,
        custom_penalty_clause: contract.custom_penalty_clause,
        collateral_type: contract.collateral_type,
        collateral_details: contract.collateral_details,
        interest_rate: contract.interest_rate,
        compound_frequency: contract.compound_frequency,
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
        });

      // Process payment (recurring for perpetual/long contracts, one-time for short)
      const paymentType = contract.duration === 0 || contract.duration > 3 ? 'recurring' : 'one_time';
      const paymentResult = await base44.functions.invoke('processDebtContractPayment', {
        contractId: newContract.id,
        paymentType
      });

      if (!paymentResult.data.success) {
        // Delete contract if payment failed
        await base44.entities.DebtContract.delete(newContract.id);
        throw new Error(paymentResult.data.error);
      }

      return { contract: newContract, payment: paymentResult.data };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['debtContracts'] });
      const paymentMsg = data.payment.type === 'subscription' 
        ? 'Subscription created - monthly payments will be charged automatically'
        : 'Payment successful - contract paid in full';
      toast.success(`Contract accepted! ${paymentMsg}`);
      setShowConfirmation(false);
      setSelectedContract(null);
    },
    onError: (error) => {
      if (error.message.includes('Payment method not set up')) {
        toast.error('Please add a payment method first', {
          description: 'Go to Buy Coins page to set up your payment method'
        });
      } else {
        toast.error('Failed to process payment: ' + error.message);
      }
    },
  });

  const handleCustomize = (contract) => {
    setCustomizingContract(contract);
  };

  const handleCustomizationComplete = (customizedContract) => {
    setCustomizingContract(null);
    setSelectedContract(customizedContract);
    setShowConfirmation(true);
  };

  const handleAcceptContract = (contract) => {
    setSelectedContract(contract);
    setShowConfirmation(true);
  };

  const handleViewTerms = (contract) => {
    setSelectedContract(contract);
    setShowTermsModal(true);
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
          <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Available Contracts ({filteredContracts.length})</h2>
          
          {filteredContracts.map((contract, idx) => {
            const config = INTENSITY_CONFIG[contract.intensity];
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
              >
                <button
                  onClick={() => handleViewTerms(contract)}
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

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleCustomize(contract)}
                        variant="outline"
                        className="flex-1 border-zinc-700 text-purple-400 hover:bg-purple-900/20"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Customize
                      </Button>
                      <Button
                        className={`flex-1 bg-gradient-to-r ${config.color} hover:opacity-90 text-white font-bold`}
                      >
                        Accept
                      </Button>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Contract Customizer */}
      <AnimatePresence>
        {customizingContract && (
          <ContractCustomizer
            contract={customizingContract}
            onCustomize={handleCustomizationComplete}
            onCancel={() => setCustomizingContract(null)}
          />
        )}
      </AnimatePresence>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTermsModal && selectedContract && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-bold text-lg">{selectedContract.title}</h2>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <p className="text-zinc-400 text-sm">{selectedContract.description}</p>
                </div>

                {/* Contract Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-zinc-500 text-xs mb-1">Monthly Payment</p>
                    <p className="text-white font-bold text-lg">${selectedContract.monthly}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-zinc-500 text-xs mb-1">Duration</p>
                    <p className="text-white font-bold text-lg">{selectedContract.duration ? `${selectedContract.duration} months` : 'Indefinite'}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-zinc-500 text-xs mb-1">Total Obligation</p>
                    <p className="text-white font-bold text-lg">${selectedContract.monthly * (selectedContract.duration || 1)}</p>
                  </div>
                  <div className={`bg-zinc-800/50 rounded-lg p-3 border-l-4 ${
                    selectedContract.intensity === 'mild' ? 'border-blue-500' :
                    selectedContract.intensity === 'moderate' ? 'border-yellow-500' :
                    selectedContract.intensity === 'intense' ? 'border-orange-500' :
                    'border-red-500'
                  }`}>
                    <p className="text-zinc-500 text-xs mb-1">Intensity Level</p>
                    <p className="text-white font-bold text-lg capitalize">{selectedContract.intensity}</p>
                  </div>
                </div>

                {/* All Terms */}
                <div>
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-400" />
                    All Contract Terms
                  </h3>
                  <div className="bg-zinc-800/30 border border-zinc-800 rounded-lg p-4">
                    <ol className="space-y-3">
                      {selectedContract.terms.map((term, idx) => (
                        <li key={idx} className="text-zinc-300 text-sm flex gap-3">
                          <span className="text-red-400 font-bold flex-shrink-0 min-w-6">{idx + 1}.</span>
                          <span>{term}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-zinc-800">
                  <Button
                    onClick={() => setShowTermsModal(false)}
                    variant="outline"
                    className="flex-1 border-zinc-700"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowTermsModal(false);
                      handleAcceptContract(selectedContract);
                    }}
                    className={`flex-1 bg-gradient-to-r ${INTENSITY_CONFIG[selectedContract.intensity].color} hover:opacity-90 text-white font-bold`}
                  >
                    Accept This Contract
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <p className="text-sm">
                  <span className="text-zinc-500">Payment Type:</span>
                  <span className="text-white font-bold ml-2">
                    {selectedContract.duration === 0 || selectedContract.duration > 3 
                      ? 'Recurring Subscription' 
                      : 'One-Time Payment'}
                  </span>
                </p>
                {selectedContract.penalty_percentage > 0 && (
                  <p className="text-sm">
                    <span className="text-zinc-500">Late Penalty:</span>
                    <span className="text-red-400 font-bold ml-2">{selectedContract.penalty_percentage}%</span>
                  </p>
                )}
                {selectedContract.collateral_type && selectedContract.collateral_type !== 'none' && (
                  <p className="text-sm">
                    <span className="text-zinc-500">Collateral:</span>
                    <span className="text-orange-400 font-bold ml-2">{selectedContract.collateral_type.replace('_', ' ')}</span>
                  </p>
                )}
                {selectedContract.interest_rate > 0 && (
                  <p className="text-sm">
                    <span className="text-zinc-500">Interest Rate:</span>
                    <span className="text-yellow-400 font-bold ml-2">{selectedContract.interest_rate}% ({selectedContract.compound_frequency})</span>
                  </p>
                )}
              </div>
              <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-3">
                <p className="text-green-400 text-xs font-bold mb-1">💳 Payment Required</p>
                <p className="text-green-300/80 text-xs">
                  {selectedContract.duration === 0 || selectedContract.duration > 3 
                    ? 'A recurring subscription will be created and charged monthly to your card.'
                    : `A one-time payment of $${selectedContract.monthly * selectedContract.duration} will be charged immediately.`}
                </p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4">
                <p className="text-white text-sm font-bold mb-3">Digital Signature Required</p>
                <SignaturePad onSignatureComplete={setSignatureData} />
              </div>
              <p className="text-red-400 text-xs">
                By signing and accepting this contract, you authorize real payments. This is a binding financial commitment with actual charges to your card.
              </p>
              </AlertDialogDescription>
              )}
              <div className="flex gap-3">
              <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              Cancel
              </AlertDialogCancel>
              <AlertDialogAction
              onClick={() => selectedContract && acceptMutation.mutate(selectedContract)}
              disabled={acceptMutation.isPending || !signatureData}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              >
              {acceptMutation.isPending ? 'Binding...' : 'I Accept & Sign'}
              </AlertDialogAction>
              </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}