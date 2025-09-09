
const ProcessPlansApi = (apiClient) => ({
    list: (params = {}) => {
        const queryParams = new URLSearchParams();
        
        // Add common query parameters
        if (params.take) queryParams.append('take', params.take);
        if (params.skip) queryParams.append('skip', params.skip);
        if (params.orderBy) queryParams.append('orderBy', params.orderBy);
        if (params.filter) queryParams.append('filter', params.filter);
        
        // Add date range filters
        if (params.runDateFrom) queryParams.append('runDateFrom', params.runDateFrom);
        if (params.runDateTo) queryParams.append('runDateTo', params.runDateTo);
        if (params.pickDateFrom) queryParams.append('pickDateFrom', params.pickDateFrom);
        if (params.pickDateTo) queryParams.append('pickDateTo', params.pickDateTo);
        
        // Add status filters
        if (params.run_status) queryParams.append('run_status', params.run_status);
        if (params.batchId) queryParams.append('batchId', params.batchId);
        
        const queryString = queryParams.toString();
        const url = queryString ? `/Processproductionruns?${queryString}` : '/Processproductionruns';
        
        return apiClient.get(url);
    },

    get: (id) => apiClient.get(`/Processproductionruns/${id}`),

    create: (data) => {
        console.log('API: Creating process plan with data:', data);
        return apiClient.post('/Processproductionruns', data);
    },

    update: (id, data) => apiClient.put(`/Processproductionruns/${id}`, data),

    remove: (id) => apiClient.delete(`/Processproductionruns/${id}`),

    // Bulk operations
    updateBatch: (updates) => apiClient.post('/Processproductionruns/batch', updates),

    // Status operations
    updateStatus: (id, status, batchId = null) => {
        const data = { run_status: status };
        if (batchId) data.batchId = batchId;
        return apiClient.patch(`/Processproductionruns/${id}/status`, data);
    },

    // Time tracking
    startProcess: (id) => {
        const data = { 
            run_status: 'in_progress',
            time_started: new Date().toISOString()
        };
        console.log('API: Starting process', { id, data });
        return apiClient.put(`/Processproductionruns/${id}`, data);
    },
    completeProcess: (id) => {
        const data = { 
            run_status: 'completed',
            time_completed: new Date().toISOString()
        };
        console.log('API: Completing process', { id, data });
        return apiClient.put(`/Processproductionruns/${id}`, data);
    },

    // Reorder operations
    reorder: (updates) => apiClient.post('/Processproductionruns/reorder', updates)
});

export { ProcessPlansApi };
