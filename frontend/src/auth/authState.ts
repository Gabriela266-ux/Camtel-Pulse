import { createContext } from 'react';
import type { AppRole, PartnerAssignment } from '../types';

export interface User {
  id: string;
  nom_complet: string;
  email: string;
  role: AppRole;
  partenaireIds: string[];
  partenaires?: PartnerAssignment[];
  partenaireId?: string;
  mustChangePassword?: boolean;
  centerId?: string | null;
  centre?: {
    id: string;
    code_centre: string;
    nom_centre: string;
    region: string;
  } | null;
  chefOperationnel?: {
    id: string;
    nomComplet: string;
    matricule: string;
  } | null;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
