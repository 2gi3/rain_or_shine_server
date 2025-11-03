import type { CorsOptions } from "cors";
import { ENV } from "../../env.js";


// const allowedOrigins = ENV.CORS_ORIGINS?.split(",") || [];
const allowedOrigins = ENV.CORS_ORIGINS;
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
    ],
    exposedHeaders: ["X-CSRF-Token"],
};

export default corsOptions;
