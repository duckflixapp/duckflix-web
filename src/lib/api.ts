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
