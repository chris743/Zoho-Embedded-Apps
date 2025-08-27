export const PoolsApi = (api) => ({
list: (params) => api.get(`/pools`, { params }),
get: (id) => api.get(`/pools/${id}`)
});