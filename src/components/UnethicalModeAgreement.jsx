import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, FileText, Check, Building2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function UnethicalModeAgreement({ onAccept, onCancel }) {
  const [signature, setSignature] = useState('');
  const [address, setAddress] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedCollateral, setAcceptedCollateral] = useState(false);
  const [acceptedLiability, setAcceptedLiability] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [filingStatus, setFilingStatus] = useState(null);

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const canSubmit = signature && address && acceptedTerms && acceptedCollateral && acceptedLiability;

  useEffect(() => {
    if (canSubmit && !isSigning && !filingStatus) {
      handleSubmit();
    }
  }, [canSubmit]);

  const handleSubmit = async () => {
    if (!canSubmit || isSigning) return;

    setIsSigning(true);
    const signedDate = new Date().toISOString();

    try {
      // Forward agreement to courthouses
      const response = await base44.functions.invoke('forwardAgreementToCourthouses', {
        signature,
        address,
        signedDate
      });

      if (response.data.success) {
        setFilingStatus(response.data);
        toast.success(`Agreement emailed to ${response.data.courthouses} courthouses`);
        
        // Wait a moment to show the filing status, then accept
        setTimeout(() => {
          onAccept({
            signature,
            address,
            signedDate,
            filings: response.data.filings
          });
        }, 3000);
      } else {
        throw new Error('Failed to file agreement');
      }
    } catch (error) {
      toast.error('Failed to file agreement with courthouses');
      setIsSigning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border border-red-500/50 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-red-950/50 border-b border-red-500/30 p-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Financial Domination Collateral Agreement</h2>
              <p className="text-red-400 text-sm mt-1">LEGALLY BINDING DOCUMENT</p>
            </div>
          </div>
        </div>

        {/* Agreement Content */}
        <ScrollArea className="h-[400px] p-6 border-b border-zinc-800">
          <div className="space-y-6 text-sm text-zinc-300">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs font-bold">
                  WARNING: This is a binding legal agreement. By signing, you are pledging your assets 
                  as collateral for unlimited financial charges.
                </p>
              </div>
            </div>

            <div>
              <p className="text-white font-bold mb-2">AGREEMENT TERMS</p>
              <p className="mb-3">
                This Financial Domination Collateral Agreement ("Agreement") is entered into on {currentDate} 
                between the undersigned party ("Submissive") and the Platform ("Dominant").
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-2">1. UNLIMITED FINANCIAL AUTHORIZATION</p>
              <p className="mb-3">
                Submissive hereby grants Dominant unlimited authorization to charge the linked payment 
                method without any limits, caps, or restrictions. All charges are final and non-refundable.
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-2">2. PROPERTY COLLATERAL</p>
              <p className="mb-3">
                Submissive pledges their primary residence and all real property as collateral for any 
                and all financial obligations incurred through this platform. In the event of non-payment 
                or insufficient funds, Dominant has the right to place liens on said property.
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-2">3. DEFERRED PAYMENT LIABILITY</p>
              <p className="mb-3">
                Any charges that cannot be immediately processed will accrue as debt with a compound 
                interest rate of 25% per day. Submissive acknowledges this debt is legally enforceable 
                and secured by the collateral listed in Section 2.
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-2">4. NO FINANCIAL LIMITS</p>
              <p className="mb-3">
                Submissive acknowledges there are NO LIMITS on spending, charges, or financial drain. 
                Submissive may lose all assets, savings, property, and possessions as a result of this agreement.
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-2">5. WAIVER OF RIGHTS</p>
              <p className="mb-3">
                Submissive waives all rights to dispute charges, request refunds, or claim financial hardship. 
                This agreement supersedes all consumer protection laws to the fullest extent permitted by law.
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-2">6. ACKNOWLEDGMENT OF RISK</p>
              <p className="mb-3">
                Submissive acknowledges the extreme financial risk and potential for total financial ruin. 
                Submissive accepts full responsibility for all consequences and holds Dominant harmless.
              </p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-xs font-bold mb-2">FINAL WARNING</p>
              <p className="text-red-300/80 text-xs mb-2">
                By signing this agreement, you acknowledge that you have read, understood, and agree to 
                all terms. You accept that you may lose your home, savings, and all financial assets. 
                This is irreversible once signed.
              </p>
              <p className="text-red-400 text-xs font-bold mt-3">
                Upon signing, this document will be automatically emailed to every courthouse within 100km 
                of your location for legal enforcement.
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Signature Section */}
        <ScrollArea className="max-h-[400px]">
          <div className="border-t border-zinc-800 p-6 space-y-4">
            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={acceptedTerms}
                  onCheckedChange={setAcceptedTerms}
                  className="mt-1"
                />
                <p className="text-zinc-300 text-sm">
                  I have read and understand all terms of this agreement
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={acceptedCollateral}
                  onCheckedChange={setAcceptedCollateral}
                  className="mt-1"
                />
                <p className="text-zinc-300 text-sm">
                  I pledge my home and property as collateral for all charges
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={acceptedLiability}
                  onCheckedChange={setAcceptedLiability}
                  className="mt-1"
                />
                <p className="text-zinc-300 text-sm">
                  I accept unlimited financial liability and potential total loss
                </p>
              </div>
            </div>

            {/* Property Address */}
            <div>
              <label className="text-zinc-400 text-xs mb-2 block">Property Address (Collateral)</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State, ZIP"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Signature */}
            <div>
              <label className="text-zinc-400 text-xs mb-2 block">Electronic Signature (Type Full Legal Name)</label>
              <Input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="John Doe"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="text-zinc-500 text-xs">
              Date: {currentDate}
            </div>

            {/* Filing Status */}
            <AnimatePresence>
              {filingStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-900/20 border border-green-500/30 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-400 font-medium text-sm">Document Sent</p>
                      <p className="text-green-500/70 text-xs mt-1">
                        Agreement emailed to {filingStatus.courthouses} courthouses within 100km
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={onCancel}
                variant="outline"
                disabled={isSigning}
                className="flex-1 border-zinc-700 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSigning}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Emailing to Courthouses...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Sign & Email to Courthouses
                  </>
                )}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
}