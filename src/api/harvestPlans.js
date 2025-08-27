export const HarvestPlansApi = (api) => ({
list: (params) => api.get(`/HarvestPlans`, { params }),
get: (id) => api.get(`/HarvestPlans/${id}`),
create: (payload) => api.post(`/HarvestPlans`, payload),
update: (id, payload) => api.put(`/HarvestPlans/${id}`, payload),
remove: (id) => api.delete(`/HarvestPlans/${id}`),
});