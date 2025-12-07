import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:5224',
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');

        // Usuwamy ręczne ustawianie Content-Type, axios zrobi to sam
        // delete config.headers['Content-Type']; 

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;