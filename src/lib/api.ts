import axios from 'axios';

declare module 'axios' {
    export interface AxiosInstance {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        get<R = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        post<R = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        put<R = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        patch<R = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete<R = any, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    }
}

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    withCredentials: true,
    xsrfCookieName: 'csrf_token',
    xsrfHeaderName: 'x-csrf-token',
    withXSRFToken: true,
});

let isRefreshing = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let failedQueue: any[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => {
        const res = response.data;
        return res.meta ? res : res.data;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }

        const isAuthRequest =
            originalRequest.url.includes('/auth/login') ||
            originalRequest.url.includes('/auth/refresh') ||
            originalRequest.url.includes('/auth/verify-email');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log('refreshing...');
                await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
                processQueue(null);

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
