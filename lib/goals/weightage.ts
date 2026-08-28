export function totalWeightage(weightages: number[]) {
  return weightages.reduce((sum, value) => sum + (Number(value) || 0), 0);
}

export function canSubmitGoals(weightages: number[]) {
  if (weightages.length === 0) return false;
  return (
    weightages.every((value) => value >= 0 && value <= 100) &&
    totalWeightage(weightages) === 100
  );
}

export function remainingWeightage(weightages: number[]) {
  return 100 - totalWeightage(weightages);
}
