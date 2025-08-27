export const CommoditiesApi = (api) => ({
list: (params) => api.get(`/commodities`, { params }),
get: (id) => api.get(`/commodities/${id}`)
});