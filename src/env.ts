
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        console.error(`❌ Missing required environment variable: ${name}`);
        process.exit(1);
    }
    return value;
}

export const ENV = {
    DATABASE_URL: requireEnv("DATABASE_URL"),
    CORS_ORIGINS: requireEnv("CORS_ORIGINS").split(",").map((s) => s.trim()),
    BASE_URL: requireEnv("BASE_URL"),
    CLIENT_URL: requireEnv("CLIENT_URL"),
    AUTH_SECRET: requireEnv("AUTH_SECRET"),
    AUTH_RESEND_KEY: requireEnv("AUTH_RESEND_KEY"),
    AUTH_URL: requireEnv("AUTH_URL"),
    AUTH_TRUST_HOST: requireEnv("AUTH_TRUST_HOST") === "true",
    JWT_SECRET: requireEnv("JWT_SECRET"),
    PORT: parseInt(requireEnv("PORT"), 10),
};
