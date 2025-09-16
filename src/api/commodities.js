export const CommoditiesApi = (api) => ({
list: (params) => api.get(`/commodities`, { params }).then(res => res.data),
get: (id) => api.get(`/commodities/${id}`).then(res => res.data)
});