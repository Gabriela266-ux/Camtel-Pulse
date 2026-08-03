export type EntityLevel = 'client' | 'dsm' | 'pos';

export interface DailyEntry {
  date: string;              // ex: "2026-08-03"
  entityId: string;
  entityName: string;
  level: EntityLevel;
  venteJour: number;
  achatsCumulés: number;
  stockSécurité: number;
  écartJour: number;
  écartCumulé: number;
}