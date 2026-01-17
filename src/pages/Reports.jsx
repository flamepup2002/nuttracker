import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, Download, Calendar, TrendingUp, DollarSign, 
  FileText, BarChart3, Filter, RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function Reports() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30'); // days
  const [reportType, setReportType] = useState('overview');

  const { data: contracts = [], isLoading: contractsLoading, refetch: refetchContracts } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.DebtContract.list('-created_date', 500),
  });

  const { data: payments = [], isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => base44.entities.Payment.list('-created_date', 500),
  });

  const { data: assets = [], isLoading: assetsLoading, refetch: refetchAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.UserAsset.list(),
  });

  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => base44.entities.Session.list('-created_date', 500),
  });

  const isLoading = contractsLoading || paymentsLoading || assetsLoading;

  // Filter data by date range
  const filteredData = useMemo(() => {
    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    return {
      contracts: contracts.filter(c => new Date(c.created_date) >= cutoffDate),
      payments: payments.filter(p => new Date(p.created_date) >= cutoffDate),
      sessions: sessions.filter(s => new Date(s.created_date) >= cutoffDate),
    };
  }, [contracts, payments, sessions, dateRange]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalPaid = filteredData.payments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalDebt = filteredData.contracts
      .filter(c => c.is_accepted && !c.cancelled_at)
      .reduce((sum, c) => sum + (c.total_obligation - c.amount_paid), 0);

    const activeContracts = filteredData.contracts.filter(c => c.is_accepted && !c.cancelled_at);
    const completedContracts = filteredData.contracts.filter(c => c.cancelled_at && c.amount_paid >= c.total_obligation);

    // Group by intensity
    const contractsByIntensity = filteredData.contracts.reduce((acc, c) => {
      acc[c.intensity_level] = (acc[c.intensity_level] || 0) + 1;
      return acc;
    }, {});

    // Payment timeline data
    const paymentTimeline = {};
    filteredData.payments.forEach(p => {
      const date = new Date(p.created_date).toLocaleDateString();
      if (!paymentTimeline[date]) {
        paymentTimeline[date] = { date, amount: 0, count: 0 };
      }
      paymentTimeline[date].amount += p.amount;
      paymentTimeline[date].count += 1;
    });

    // Contract creation timeline
    const contractTimeline = {};
    filteredData.contracts.forEach(c => {
      const date = new Date(c.created_date).toLocaleDateString();
      if (!contractTimeline[date]) {
        contractTimeline[date] = { date, count: 0 };
      }
      contractTimeline[date].count += 1;
    });

    return {
      totalPaid,
      totalDebt,
      activeContracts: activeContracts.length,
      completedContracts: completedContracts.length,
      totalContracts: filteredData.contracts.length,
      avgPayment: filteredData.payments.length > 0 ? totalPaid / filteredData.payments.length : 0,
      contractsByIntensity: Object.entries(contractsByIntensity).map(([name, value]) => ({ name, value })),
      paymentTimeline: Object.values(paymentTimeline).sort((a, b) => new Date(a.date) - new Date(b.date)),
      contractTimeline: Object.values(contractTimeline).sort((a, b) => new Date(a.date) - new Date(b.date)),
      totalAssetValue: assets.reduce((sum, a) => sum + a.estimated_value, 0),
    };
  }, [filteredData, assets]);

  // Export to CSV
  const exportToCSV = () => {
    let csvContent = '';
    
    if (reportType === 'overview' || reportType === 'payments') {
      csvContent += 'Payment Report\n\n';
      csvContent += 'Date,Amount,Status,ID\n';
      filteredData.payments.forEach(p => {
        csvContent += `${new Date(p.created_date).toLocaleDateString()},${p.amount},${p.status},${p.id}\n`;
      });
      csvContent += `\nTotal Paid:,${analytics.totalPaid}\n`;
      csvContent += `Average Payment:,${analytics.avgPayment.toFixed(2)}\n`;
    }

    if (reportType === 'overview' || reportType === 'contracts') {
      csvContent += '\n\nContract Report\n\n';
      csvContent += 'Title,Monthly Payment,Duration,Total,Status,Created Date\n';
      filteredData.contracts.forEach(c => {
        csvContent += `${c.title},${c.monthly_payment},${c.duration_months},${c.total_obligation},${c.is_accepted ? 'Active' : 'Pending'},${new Date(c.created_date).toLocaleDateString()}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${reportType}_${dateRange}days.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Financial Report', 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Period: Last ${dateRange} days`, 20, 35);
    
    doc.setFontSize(14);
    doc.text('Summary', 20, 50);
    
    doc.setFontSize(10);
    let y = 60;
    doc.text(`Total Paid: $${analytics.totalPaid.toFixed(2)}`, 20, y);
    y += 7;
    doc.text(`Total Debt: $${analytics.totalDebt.toFixed(2)}`, 20, y);
    y += 7;
    doc.text(`Active Contracts: ${analytics.activeContracts}`, 20, y);
    y += 7;
    doc.text(`Completed Contracts: ${analytics.completedContracts}`, 20, y);
    y += 7;
    doc.text(`Average Payment: $${analytics.avgPayment.toFixed(2)}`, 20, y);
    y += 15;

    doc.setFontSize(14);
    doc.text('Recent Payments', 20, y);
    y += 10;
    
    doc.setFontSize(8);
    filteredData.payments.slice(0, 10).forEach(p => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${new Date(p.created_date).toLocaleDateString()} - $${p.amount.toFixed(2)} - ${p.status}`, 20, y);
      y += 5;
    });

    doc.save(`report_${reportType}_${dateRange}days.pdf`);
    toast.success('PDF exported successfully');
  };

  const handleRefresh = () => {
    refetchContracts();
    refetchPayments();
    refetchAssets();
    refetchSessions();
    toast.success('Data refreshed');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="relative border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent" />
        <div className="relative px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Advanced Reports
          </h1>
          <div className="w-12" />
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-zinc-800">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[150px]">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="payments">Payments</SelectItem>
                <SelectItem value="contracts">Contracts</SelectItem>
                <SelectItem value="trends">Trends</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
                <SelectItem value="9999">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleRefresh}
            variant="outline"
            className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button
            onClick={exportToCSV}
            variant="outline"
            className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>

          <Button
            onClick={exportToPDF}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-24 space-y-6 mt-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <p className="text-zinc-400 text-xs">Total Paid</p>
            </div>
            <p className="text-white text-2xl font-bold">${analytics.totalPaid.toFixed(0)}</p>
            <p className="text-zinc-600 text-xs mt-1">{filteredData.payments.length} payments</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <p className="text-zinc-400 text-xs">Total Contracts</p>
            </div>
            <p className="text-white text-2xl font-bold">{analytics.totalContracts}</p>
            <p className="text-zinc-600 text-xs mt-1">{analytics.activeContracts} active</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <p className="text-zinc-400 text-xs">Avg Payment</p>
            </div>
            <p className="text-white text-2xl font-bold">${analytics.avgPayment.toFixed(0)}</p>
            <p className="text-zinc-600 text-xs mt-1">per transaction</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-red-400" />
              <p className="text-zinc-400 text-xs">Total Debt</p>
            </div>
            <p className="text-white text-2xl font-bold">${analytics.totalDebt.toFixed(0)}</p>
            <p className="text-zinc-600 text-xs mt-1">outstanding</p>
          </motion.div>
        </div>

        {/* Charts */}
        {reportType === 'overview' || reportType === 'trends' ? (
          <>
            {/* Payment Timeline */}
            {analytics.paymentTimeline.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
              >
                <h3 className="text-white font-bold mb-4">Payment Timeline</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.paymentTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#71717a" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                      labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} name="Amount ($)" />
                    <Line type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2} name="Count" />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Contract Distribution */}
            {analytics.contractsByIntensity.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
              >
                <h3 className="text-white font-bold mb-4">Contracts by Intensity</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.contractsByIntensity}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.contractsByIntensity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </>
        ) : null}

        {/* Payments Table */}
        {(reportType === 'overview' || reportType === 'payments') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
          >
            <h3 className="text-white font-bold mb-4">Recent Payments</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-zinc-400 text-xs font-medium pb-3">Date</th>
                    <th className="text-left text-zinc-400 text-xs font-medium pb-3">Amount</th>
                    <th className="text-left text-zinc-400 text-xs font-medium pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.payments.slice(0, 10).map((payment, idx) => (
                    <tr key={payment.id} className="border-b border-zinc-800/50">
                      <td className="py-3 text-white text-sm">{new Date(payment.created_date).toLocaleDateString()}</td>
                      <td className="py-3 text-green-400 font-bold text-sm">${payment.amount.toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          payment.status === 'succeeded' ? 'bg-green-900/30 text-green-400' :
                          payment.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-red-900/30 text-red-400'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Contracts Table */}
        {(reportType === 'overview' || reportType === 'contracts') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
          >
            <h3 className="text-white font-bold mb-4">Recent Contracts</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left text-zinc-400 text-xs font-medium pb-3">Title</th>
                    <th className="text-left text-zinc-400 text-xs font-medium pb-3">Monthly</th>
                    <th className="text-left text-zinc-400 text-xs font-medium pb-3">Total</th>
                    <th className="text-left text-zinc-400 text-xs font-medium pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.contracts.slice(0, 10).map((contract) => (
                    <tr key={contract.id} className="border-b border-zinc-800/50">
                      <td className="py-3 text-white text-sm">{contract.title}</td>
                      <td className="py-3 text-purple-400 font-bold text-sm">${contract.monthly_payment}</td>
                      <td className="py-3 text-zinc-400 text-sm">${contract.total_obligation}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          contract.is_accepted && !contract.cancelled_at ? 'bg-green-900/30 text-green-400' :
                          contract.cancelled_at ? 'bg-zinc-800 text-zinc-500' :
                          'bg-yellow-900/30 text-yellow-400'
                        }`}>
                          {contract.is_accepted && !contract.cancelled_at ? 'Active' :
                           contract.cancelled_at ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}