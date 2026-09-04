import type { DAHierarchy, DANode, DSMNode, EntitySelection, POSNode } from '../types';

export function normalizeHierarchySearch(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesQuery(fields: Array<string | undefined>, query: string): boolean {
  const tokens = normalizeHierarchySearch(query).split(' ').filter(Boolean);
  if (tokens.length === 0) return true;
  const searchable = normalizeHierarchySearch(fields.filter(Boolean).join(' '));
  return tokens.every((token) => searchable.includes(token));
}

export function matchesPartner(partner: DANode, query: string): boolean {
  return includesQuery([
    partner.nom,
    partner.nom_reseau,
    partner.numero_sim,
    partner.code,
    partner.code_zone,
    partner.region,
  ], query);
}

export function matchesDsm(dsm: DSMNode, query: string): boolean {
  return includesQuery([
    dsm.nom,
    dsm.nom_reseau,
    dsm.numero_telephone,
    dsm.code_dsm,
    dsm.code_zone,
  ], query);
}

export function matchesPos(pos: POSNode, query: string): boolean {
  return includesQuery([
    pos.nom,
    pos.nom_reseau,
    pos.numero_telephone,
    pos.code_pos,
    pos.code_dsm,
    pos.code_zone,
  ], query);
}

export function filterHierarchy(data: DAHierarchy, query: string): DANode[] {
  if (!normalizeHierarchySearch(query)) return data.da;

  return data.da.flatMap((partner) => {
    const filteredDsms = partner.dsm.flatMap((dsm) => {
      const filteredPos = dsm.pos.filter((pos) => matchesPos(pos, query));
      return matchesDsm(dsm, query) || filteredPos.length > 0
        ? [{ ...dsm, pos: filteredPos }]
        : [];
    });

    return matchesPartner(partner, query) || filteredDsms.length > 0
      ? [{ ...partner, dsm: filteredDsms }]
      : [];
  });
}

interface SearchCandidate {
  selection: EntitySelection;
  exactValues: string[];
  matches: boolean;
}

export function findFirstHierarchyMatch(data: DAHierarchy, query: string): EntitySelection | null {
  const normalizedQuery = normalizeHierarchySearch(query);
  if (!normalizedQuery) return null;

  const candidates: SearchCandidate[] = [];
  for (const partner of data.da) {
    candidates.push({
      selection: { type: 'DA', id: partner.id, nom: partner.nom_reseau || partner.nom },
      exactValues: [partner.numero_sim, partner.code_zone, partner.code, partner.nom].filter(Boolean).map((value) => normalizeHierarchySearch(String(value))),
      matches: matchesPartner(partner, query),
    });
    for (const dsm of partner.dsm) {
      candidates.push({
        selection: { type: 'DSM', id: dsm.id, nom: dsm.nom_reseau || dsm.nom },
        exactValues: [dsm.numero_telephone, dsm.code_dsm, dsm.code_zone, dsm.nom].filter(Boolean).map((value) => normalizeHierarchySearch(String(value))),
        matches: matchesDsm(dsm, query),
      });
      for (const pos of dsm.pos) {
        candidates.push({
          selection: { type: 'POS', id: pos.id, nom: pos.nom_reseau || pos.nom },
          exactValues: [pos.numero_telephone, pos.code_pos, pos.nom].filter(Boolean).map((value) => normalizeHierarchySearch(String(value))),
          matches: matchesPos(pos, query),
        });
      }
    }
  }

  return candidates.find((candidate) => candidate.exactValues.includes(normalizedQuery))?.selection
    ?? candidates.find((candidate) => candidate.matches)?.selection
    ?? null;
}
