import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const requiredEnvVars = [
    "PORT",
    "JWT_SECRET",
] as const;

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
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
        port: parseInt(process.env.PORT, 10),
        jwtSecret: process.env.JWT_SECRET,
    }
} as const;
