const requiredEnvVars = [
    "VITE_JWT_SECRET",
    "VITE_API_URL",
] as const;

for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
        throw new Error(`⛔️ Required environment variable ${envVar} is not set! ⛔️`);
    }
}

export {};

interface AppConfig {
    server: {
        jwtSecret: string;
        apiUrl: string;
    }
}

export const config: AppConfig = {
    server: {
        jwtSecret: import.meta.env.VITE_JWT_SECRET,
        apiUrl: import.meta.env.VITE_API_URL,
    }
} as const;