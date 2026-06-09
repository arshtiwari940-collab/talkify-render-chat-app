export const getApiErrorMessage = (error, fallback = 'Something went wrong') => {
    if (error?.response?.data?.error) return error.response.data.error;
    if (error?.message === 'Network Error') {
        return 'Cannot reach the server. Make sure the backend is running.';
    }
    return error?.message || fallback;
};
