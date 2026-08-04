// Generates a downloadable .ics calendar file for court dates.
// Works with Google Calendar, Apple Calendar, Outlook, etc.

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatIcsDate(iso) {
  const d = new Date(iso);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcs(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function buildIcsCalendar({ title, description, startIso, endIso, location }) {
  const start = formatIcsDate(startIso);
  const end = formatIcsDate(endIso || new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString());
  const stamp = formatIcsDate(new Date().toISOString());
  const uid = `${Date.now()}@nuttracker`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NUTtracker//Court Date//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    location ? `LOCATION:${escapeIcs(location)}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcs('Reminder: ' + title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n') + '\r\n';
}

export function buildIcsCalendarMulti(events) {
  const stamp = formatIcsDate(new Date().toISOString());
  const blocks = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NUTtracker//Court Dates//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const ev of events) {
    const start = formatIcsDate(ev.startIso);
    const end = formatIcsDate(ev.endIso || new Date(new Date(ev.startIso).getTime() + 60 * 60 * 1000).toISOString());
    const uid = `${ev.id || Date.now() + Math.random()}@nuttracker`;
    blocks.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeIcs(ev.title)}`,
      `DESCRIPTION:${escapeIcs(ev.description)}`,
      ev.location ? `LOCATION:${escapeIcs(ev.location)}` : '',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcs('Reminder: ' + ev.title)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }
  blocks.push('END:VCALENDAR');
  return blocks.filter(Boolean).join('\r\n') + '\r\n';
}

export function downloadIcs(filename, icsContent) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}