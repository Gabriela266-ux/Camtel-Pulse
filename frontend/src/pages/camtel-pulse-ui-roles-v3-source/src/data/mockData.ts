export type NodeType = 'centre' | 'client' | 'dsm' | 'pos'
export type StatusType = 'NORMAL' | 'CRITIQUE'

export interface TreeNode {
  id: string
  label: string
  type: NodeType
  status: StatusType
  children?: TreeNode[]
}

export interface DailyRecord {
  date: string
  prevision: number
  stockJournalier: number
  realisationVa: number
  cumulAchat: number
  cumulStock: number
  ecartStockSec: number
  ecartCumul: number
  status: StatusType
}

export const NETWORK_TREE: TreeNode = {
  id: 'centre1',
  label: 'Centre 1 CDPSM',
  type: 'centre',
  status: 'NORMAL',
  children: [
    {
      id: 'glotelho',
      label: 'Glotelho (Master SIM 1)',
      type: 'client',
      status: 'NORMAL',
    },
    {
      id: 'master-color',
      label: 'Master Color (Master SIM 2)',
      type: 'client',
      status: 'CRITIQUE',
    },
  ],
}

export const DAILY_RECORDS: DailyRecord[] = [
  { date: '2026-08-01', prevision: 850, stockJournalier: 420, realisationVa: 920, cumulAchat: 920, cumulStock: 420, ecartStockSec: 500, ecartCumul: 500, status: 'NORMAL' },
  { date: '2026-08-02', prevision: 850, stockJournalier: 380, realisationVa: 790, cumulAchat: 1710, cumulStock: 800, ecartStockSec: 410, ecartCumul: 910, status: 'NORMAL' },
  { date: '2026-08-03', prevision: 850, stockJournalier: 410, realisationVa: 880, cumulAchat: 2590, cumulStock: 1210, ecartStockSec: 470, ecartCumul: 1380, status: 'NORMAL' },
  { date: '2026-08-04', prevision: 850, stockJournalier: 390, realisationVa: 810, cumulAchat: 3400, cumulStock: 1600, ecartStockSec: 420, ecartCumul: 1800, status: 'NORMAL' },
  { date: '2026-08-05', prevision: 850, stockJournalier: 430, realisationVa: 950, cumulAchat: 4350, cumulStock: 2030, ecartStockSec: 520, ecartCumul: 2320, status: 'NORMAL' },
  { date: '2026-08-06', prevision: 850, stockJournalier: 540, realisationVa: 720, cumulAchat: 5070, cumulStock: 2570, ecartStockSec: 180, ecartCumul: 2500, status: 'NORMAL' },
  { date: '2026-08-07', prevision: 850, stockJournalier: 415, realisationVa: 890, cumulAchat: 5960, cumulStock: 2985, ecartStockSec: 475, ecartCumul: 2975, status: 'NORMAL' },
  { date: '2026-08-08', prevision: 850, stockJournalier: 405, realisationVa: 875, cumulAchat: 6835, cumulStock: 3390, ecartStockSec: 470, ecartCumul: 3445, status: 'NORMAL' },
  { date: '2026-08-09', prevision: 850, stockJournalier: 540, realisationVa: 760, cumulAchat: 7595, cumulStock: 3930, ecartStockSec: 220, ecartCumul: 3665, status: 'NORMAL' },
  { date: '2026-08-10', prevision: 850, stockJournalier: 425, realisationVa: 910, cumulAchat: 8505, cumulStock: 4355, ecartStockSec: 485, ecartCumul: 4150, status: 'NORMAL' },
  { date: '2026-08-11', prevision: 850, stockJournalier: 290, realisationVa: 640, cumulAchat: 9145, cumulStock: 4645, ecartStockSec: 350, ecartCumul: 4500, status: 'NORMAL' },
]

export const CHART_DATA = [
  { day: '05/08', ventes: 950, stockSec: 400 },
  { day: '06/08', ventes: 720, stockSec: 400 },
  { day: '07/08', ventes: 890, stockSec: 400 },
  { day: '08/08', ventes: 875, stockSec: 400 },
  { day: '09/08', ventes: 760, stockSec: 400 },
  { day: '10/08', ventes: 910, stockSec: 400 },
  { day: '11/08', ventes: 640, stockSec: 400 },
]

export const KPI_DATA = {
  venteJour: { value: 640, delta: -210, label: 'Vente du Jour', unit: 'U', target: 850 },
  achatsCumules: { value: 9145, delta: -205, label: 'Achats Cumulés', unit: 'U', target: 9350 },
  stockSecurite: { value: 290, delta: -110, label: 'Stock de Sécurité', unit: 'U', target: 400 },
  ecartJournalier: { value: -210, delta: -210, label: 'Écart Journalier', unit: 'U', target: 0 },
  ecartCumule: { value: -205, delta: -205, label: 'Écart Cumulé', unit: 'U', target: 0 },
}

export const ROLES = ['Administrateur', 'Manager', 'Chef opérationnel', 'Opérationnel']
