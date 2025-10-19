import type { CorsOptions } from "cors";

const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [];

const localhostRegex = /^http:\/\/localhost:\d+$/;


const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || localhostRegex.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Origin URL not included in allowedOrigins environment variable"));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'x-csrf-token'],
    exposedHeaders: ['x-csrf-token'],
};
export default corsOptions;
