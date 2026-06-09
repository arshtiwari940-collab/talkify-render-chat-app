const isDev = process.env.NODE_ENV !== 'production';

const getAllowedOrigins = () =>
    (process.env.CLIENT_URL || '')
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);

const isVercelPreviewOrigin = (origin) =>
    process.env.ALLOW_VERCEL_PREVIEWS === 'true' &&
    /^https:\/\/[\w-]+(?:-[\w-]+)*\.vercel\.app$/.test(origin);

export const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (isDev && /^http:\/\/localhost:\d+$/.test(origin)) return true;

    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes(origin)) return true;
    if (isVercelPreviewOrigin(origin)) return true;

    return false;
};

export const corsOriginCallback = (origin, callback) => {
    if (isAllowedOrigin(origin)) {
        callback(null, true);
    } else {
        callback(new Error('Not allowed by CORS'));
    }
};

export const corsOptions = {
    origin: corsOriginCallback,
    credentials: true,
};
