import axios from 'axios';

declare module 'axios' {
    export interface AxiosInstance {
        get<T = never, R = T, D = never>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
        post<T = never, R = T, D = never>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
        put<T = never, R = T, D = never>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
        patch<T = never, R = T, D = never>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<R>;
        delete<T = never, R = T, D = never>(url: string, config?: AxiosRequestConfig<D>): Promise<R>;
    }
}

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    withCredentials: true,
    xsrfCookieName: 'csrf_token',
    xsrfHeaderName: 'x-csrf-token',
    withXSRFToken: true,
});

api.interceptors.response.use(
    (response) => {
        const res = response.data;

        if (res.meta) {
            return res;
        }

        return res.data;
    },
    (error) => Promise.reject(error)
);
