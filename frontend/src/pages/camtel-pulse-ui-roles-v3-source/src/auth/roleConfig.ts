import { NETWORK_TREE, type NodeType, type TreeNode } from "../data/mockData"

export type Role = "Administrateur" | "Manager" | "Chef opérationnel" | "Opérationnel"

export interface BreadcrumbNode {
  id: string
  label: string
  type: NodeType
}

export interface RoleProfile {
  label: Role
  initials: string
  tone: string
  surface: string
  scopeLabel: string
  primaryAction: string
  dashboardTitle: string
  description: string
  canCreateEntry: boolean
  canExport: boolean
  adminTools: boolean
  correctionValidation: boolean
  readOnly: boolean
}

export const ROLES: Role[] = [
  "Administrateur",
  "Manager",
  "Chef opérationnel",
  "Opérationnel",
]

export const ROLE_PROFILES: Record<Role, RoleProfile> = {
  Administrateur: {
    label: "Administrateur",
    initials: "AD",
    tone: "#0284c7",
    surface: "#e0f2fe",
    scopeLabel: "Accès complet Centre 1 CDPSM",
    primaryAction: "Objectifs mensuels",
    dashboardTitle: "Console d'administration",
    description: "Gestion utilisateurs, réseau, imports, objectifs, audit et actions techniques.",
    canCreateEntry: false,
    canExport: true,
    adminTools: true,
    correctionValidation: false,
    readOnly: false,
  },
  Manager: {
    label: "Manager",
    initials: "MG",
    tone: "#475569",
    surface: "#f1f5f9",
    scopeLabel: "Lecture seule sur tous les indicateurs",
    primaryAction: "Lecture seule",
    dashboardTitle: "Vue de pilotage manager",
    description: "Restitution, alertes, graphiques et historique sans saisie ni modification.",
    canCreateEntry: false,
    canExport: true,
    adminTools: false,
    correctionValidation: false,
    readOnly: true,
  },
  "Chef opérationnel": {
    label: "Chef opérationnel",
    initials: "CO",
    tone: "#7c3aed",
    surface: "#ede9fe",
    scopeLabel: "Centre 1 CDPSM - Glotelho et Master Color",
    primaryAction: "Valider corrections",
    dashboardTitle: "Suivi opérationnel du centre",
    description: "Supervision des DAs, affectation des opérationnels et validation des corrections.",
    canCreateEntry: false,
    canExport: true,
    adminTools: false,
    correctionValidation: true,
    readOnly: false,
  },
  Opérationnel: {
    label: "Opérationnel",
    initials: "OP",
    tone: "#15803d",
    surface: "#dcfce7",
    scopeLabel: "Partenaire affecté - Glotelho",
    primaryAction: "Saisie journalière",
    dashboardTitle: "Saisie et suivi du périmètre affecté",
    description: "Accès limité au partenaire affecté, avec saisie du stock journalier et de la Réalisation/VA(U).",
    canCreateEntry: true,
    canExport: false,
    adminTools: false,
    correctionValidation: false,
    readOnly: false,
  },
}

export const DEFAULT_BREADCRUMBS: Record<Role, BreadcrumbNode[]> = {
  Administrateur: [{ id: "centre1", label: "Centre 1 CDPSM", type: "centre" }],
  Manager: [{ id: "centre1", label: "Centre 1 CDPSM", type: "centre" }],
  "Chef opérationnel": [
    { id: "centre1", label: "Centre 1 CDPSM", type: "centre" },
    { id: "glotelho", label: "Glotelho", type: "client" },
  ],
  Opérationnel: [
    { id: "centre1", label: "Centre 1 CDPSM", type: "centre" },
    { id: "glotelho", label: "Glotelho (Master SIM 1)", type: "client" },
  ],
}

export const DEFAULT_SELECTED_ID: Record<Role, string> = {
  Administrateur: "centre1",
  Manager: "centre1",
  "Chef opérationnel": "glotelho",
  Opérationnel: "glotelho",
}

function filterTree(node: TreeNode, allowedIds: Set<string>): TreeNode | null {
  const children = (node.children ?? [])
    .map((child) => filterTree(child, allowedIds))
    .filter((child): child is TreeNode => Boolean(child))

  if (!allowedIds.has(node.id) && children.length === 0) return null

  return {
    ...node,
    children: children.length > 0 ? children : undefined,
  }
}

export function getVisibleTree(role: Role): TreeNode {
  if (role !== "Opérationnel") return NETWORK_TREE

  const allowedIds = new Set(["centre1", "glotelho"])
  return filterTree(NETWORK_TREE, allowedIds) ?? NETWORK_TREE
}
