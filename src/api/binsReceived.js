// File: src/api/binsReceived.js
export const BinsReceivedApi = (api) => ({
    list: (params) => api.get(`/BinsReceived`, { params }),
    get: (id) => api.get(`/BinsReceived/${id}`),
});

