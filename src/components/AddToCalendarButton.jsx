import React from 'react';
import { CalendarPlus } from 'lucide-react';
import { buildIcsCalendar, downloadIcs } from '@/lib/ics';

export default function AddToCalendarButton({ title, description, startIso, location }) {
  const handleAdd = () => {
    const ics = buildIcsCalendar({ title, description, startIso, location });
    downloadIcs(`court-date-${Date.now()}.ics`, ics);
  };
  return (
    <button
      onClick={handleAdd}
      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-950/30 border border-blue-700/30 px-2 py-1 rounded-lg transition-colors"
    >
      <CalendarPlus className="w-3 h-3" /> Add to Calendar
    </button>
  );
}