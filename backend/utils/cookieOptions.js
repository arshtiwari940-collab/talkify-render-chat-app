export const getAuthCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const crossOrigin = Boolean(process.env.CLIENT_URL?.trim());

    return {
        maxAge: 15 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction && crossOrigin ? 'none' : 'strict',
    };
};

export const getClearAuthCookieOptions = () => ({
    ...getAuthCookieOptions(),
    maxAge: 0,
});
