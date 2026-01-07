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

// Interceptor odpowiedzi - wyloguj użytkownika przy błędzie 401 (token wygasł)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token wygasł lub jest nieprawidłowy - wyloguj użytkownika
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userName');
            
            // Przekieruj na stronę logowania poprzez przeładowanie strony
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export default apiClient;