import { http } from './http';

export const salesApi = {
  createEntry: async (payload: {
    id_pos: string;
    date: string;
    vente_jour: number;
  }) => {
    const { data } = await http.post('/saisies', payload);
    return data;
  },
};