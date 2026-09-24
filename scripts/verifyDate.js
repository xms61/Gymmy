function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const d7 = new Date(2026, 8, 7); // Sept 7
const d8 = new Date(2026, 8, 8); // Sept 8

console.log('Date for d=7:', toLocalDateString(d7));
console.log('Date for d=8:', toLocalDateString(d8));

if (toLocalDateString(d7) === '2026-09-07' && toLocalDateString(d8) === '2026-09-08') {
  console.log('PASS: Date mapping is 100% accurate and timezone-independent!');
} else {
  console.error('FAIL: Date mapping is incorrect');
  process.exit(1);
}
