import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const requiredEnvVars = [
    "PORT",
    "JWT_SECRET",
] as const;

for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
        throw new Error(`Environment variable ${envVar} is not set.`);
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
        port: parseInt(import.meta.env.PORT, 10),
        jwtSecret: import.meta.env.JWT_SECRET,
    }
} as const;