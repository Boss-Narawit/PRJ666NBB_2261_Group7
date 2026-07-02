// The backend stores WearLog.logDate at midnight UTC of the calendar day it
// receives. Sending new Date().toISOString() shifts evening logs onto the next
// UTC day for users behind UTC (a 9 PM Toronto wear lands on "tomorrow"), so
// quick-log paths must send the *local* calendar date instead.
export const localDateString = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
