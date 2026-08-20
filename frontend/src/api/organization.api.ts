import { http } from './http';

export const organizationApi = {
  getTree: async () => {
    const { data } = await http.get('/business/organization/tree');
    return data;
  },

  getClients: async () => {
    const { data } = await http.get('/organization/clients');
    return data;
  },
};