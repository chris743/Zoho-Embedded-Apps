export const ScoutReportsApi = (api) => ({
  listWithBlock: (params) => api.get(`/scoutreportswithblock`, { params }),
  get: (id) => api.get(`/scoutreportswithblock/${id}`)
});