export interface WeightGoalData {
  weight: number;
  unit: 'kg' | 'lbs' | 'stones';
  whyReasons: string[];
}

export const WEIGHT_UNITS = {
  metric: [
    { value: 'kg', label: 'Kilograms (kg)' }
  ],
  imperial: [
    { value: 'lbs', label: 'Pounds (lbs)' },
    { value: 'stones', label: 'Stones (st)' }
  ]
} as const;

export const formatWeightDisplay = (weight: number, unit: 'kg' | 'lbs' | 'stones'): string => {
  const unitLabels = {
    kg: 'kg',
    lbs: 'lbs', 
    stones: 'st'
  };
  
  return `${weight} ${unitLabels[unit]}`;
};

export const generateWeightGoalTitle = (weight: number, unit: 'kg' | 'lbs' | 'stones'): string => {
  return `Reach ${formatWeightDisplay(weight, unit)}`;
};

export const formatWhyReasons = (reasons: string[]): string => {
  return reasons
    .filter(reason => reason.trim().length > 0)
    .map((reason, index) => `${index + 1}. ${reason.trim()}`)
    .join('\n');
};

export const parseWeightGoalContent = (content: string): string[] => {
  return content
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(line => line.length > 0);
};

export const encodeWeightGoalData = (data: WeightGoalData): string => {
  return JSON.stringify({
    weight: data.weight,
    unit: data.unit,
    whyReasons: data.whyReasons
  });
};

export const decodeWeightGoalData = (encodedData: string): WeightGoalData | null => {
  try {
    const parsed = JSON.parse(encodedData);
    return {
      weight: parsed.weight,
      unit: parsed.unit,
      whyReasons: parsed.whyReasons || []
    };
  } catch {
    return null;
  }
};

export const isWeightGoal = (motivator: any): boolean => {
  return motivator?.category === 'weight_goal';
};

export const getWeightUnitsForSystem = (units: 'metric' | 'imperial') => {
  return WEIGHT_UNITS[units];
};

export const getDefaultWeightUnit = (units: 'metric' | 'imperial'): 'kg' | 'lbs' | 'stones' => {
  return units === 'metric' ? 'kg' : 'lbs';
};