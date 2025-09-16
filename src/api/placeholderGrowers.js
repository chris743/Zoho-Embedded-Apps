export const PlaceholderGrowersApi = (api) => ({
  // Get all placeholder growers
  getAll: () => api.get('/placeholdergrower').then(res => res.data),

  // Get active placeholder growers only
  getActive: () => api.get('/placeholdergrower/active').then(res => res.data),

  // Get placeholder grower by ID
  getById: (id) => api.get(`/placeholdergrower/${id}`).then(res => res.data),

  // Create new placeholder grower
  create: (data) => api.post('/placeholdergrower', data).then(res => res.data),

  // Update placeholder grower
  update: (id, data) => api.put(`/placeholdergrower/${id}`, data).then(res => res.data),

  // Delete placeholder grower (soft delete by setting is_active to false)
  delete: (id) => api.delete(`/placeholdergrower/${id}`).then(res => res.data),

  // Hard delete placeholder grower
  hardDelete: (id) => api.delete(`/placeholdergrower/${id}/hard`).then(res => res.data),

  // Restore deleted placeholder grower
  restore: (id) => api.post(`/placeholdergrower/${id}/restore`).then(res => res.data)
});
