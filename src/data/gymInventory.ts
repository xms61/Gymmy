// The home equipment. Every suggested load and every plate layout is built from these plates.
export interface PlateStock {
  kg: number;
  count: number;
}

export const GYM_INVENTORY = {
  barbellKg: 10,
  dumbbellHandleKg: 0, // not counted: a logged dumbbell weight is its plates only
  dumbbellMaxKg: 25, // the most one dumbbell handle takes
  plates: [
    { kg: 20, count: 2 },
    { kg: 15, count: 2 },
    { kg: 10, count: 2 },
    { kg: 5, count: 6 },
    { kg: 2.5, count: 4 },
    { kg: 1.25, count: 2 }
  ] satisfies PlateStock[]
};
