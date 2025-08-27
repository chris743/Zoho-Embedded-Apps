export const BlocksApi = (api) => ({
list: (params) => api.get(`/Blocks`, { params }),
get: (id) => api.get(`/Blocks/${id}`),
create: (payload) => api.post(`/Blocks`, payload),
update: (id, payload) => api.put(`/Blocks/${id}`, payload),
remove: (id) => api.delete(`/Blocks/${id}`),
});