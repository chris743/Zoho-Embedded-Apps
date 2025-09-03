export const ScoutReportsApi = (api) => ({
  listWithBlock: (params) => {
    // Add cache-busting to the URL itself
    const cacheBuster = Date.now();
    const url = `/scoutreportswithblock?_cb=${cacheBuster}`;
    
    return api.get(url, { 
      params,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },
  get: (id) => api.get(`/scoutreportswithblock/${id}`)
});