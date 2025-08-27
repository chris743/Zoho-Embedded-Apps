// File: src/api/HarvestContractors.js
export const ContractorsApi = (api) => ({
list: (params) => api.get(`/HarvestContractors`, { params }),
get: (id) => api.get(`/HarvestContractors/${id}`),
create: (payload) => api.post(`/HarvestContractors`, payload),
update: (id, payload) => api.put(`/HarvestContractors/${id}`, payload),
remove: (id) => api.delete(`/HarvestContractors/${id}`),
});