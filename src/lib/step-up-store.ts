let token: string | null = null;
let expiry: number | null = null;

export const stepUpStore = {
    get: () => (token && expiry && Date.now() < expiry ? token : null),
    set: (t: string, expiresIn: number) => {
        token = t;
        expiry = Date.now() + expiresIn * 1000;
    },
    clear: () => {
        token = null;
        expiry = null;
    },
};
