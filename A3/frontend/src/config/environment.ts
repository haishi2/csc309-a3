// import { config as dotenvConfig } from "dotenv";
// dotenvConfig();

const requiredEnvVars = [
    "VITE_PORT",
    "VITE_JWT_SECRET",
] as const;

for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
        throw new Error(`⛔️ Required environment variable ${envVar} is not set! ⛔️`);
    }
}

export {};

interface AppConfig {
    server: {
        port: number;
        jwtSecret: string;
    }
}

export const config: AppConfig = {
    server: {
        port: parseInt(import.meta.env.VITE_PORT, 10),
        jwtSecret: import.meta.env.VITE_JWT_SECRET,
    }
} as const;