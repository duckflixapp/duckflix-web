// eslint-disable-next-line
const config = (window as any).__CONFIG__;

export const API_URL = config?.apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000/v1';
