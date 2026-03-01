export type GasProcess = 'isothermal' | 'isobaric' | 'isochoric';

export interface GasState {
  pressure: number; // Pa or relative unit
  volume: number;   // m^3 or relative unit
  temperature: number; // K
}

export interface Measurement {
  id: string;
  p: number;
  v: number;
  t: number;
  constant: number;
}
