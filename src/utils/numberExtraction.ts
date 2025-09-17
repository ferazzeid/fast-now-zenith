export const extractNumber = (text: string): number | null => {
  if (!text) return null;
  
  // Normalize text
  const cleaned = text.replace(/,/g, '.').toLowerCase();

  // Try to find a numeric pattern first (e.g., 150, 150.5)
  const numberMatch = cleaned.match(/(-?\d+(?:\.\d+)?)/);
  if (numberMatch) {
    const n = parseFloat(numberMatch[1]);
    if (!Number.isNaN(n)) return n;
  }

  // Very basic word-to-number fallback for common quantities
  const wordMap: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100
  };

  const tokens = cleaned.split(/\s+/);
  let total = 0;
  let current = 0;
  let found = false;

  for (const t of tokens) {
    if (t in wordMap) {
      found = true;
      const val = wordMap[t];
      if (val === 100 && current > 0) {
        current *= 100;
      } else {
        current += val;
      }
    } else if (found) {
      // stop when sequence ends
      break;
    }
  }

  total = current;
  return found && total > 0 ? total : null;
};