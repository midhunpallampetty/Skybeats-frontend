import axios from 'axios';
import Cookies from 'js-cookie';

const API_ENDPOINT = "https://www.skybeatscloud.upskillr.online";

const axiosInstance = axios.create({
  baseURL: API_ENDPOINT,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    let accessToken = Cookies.get('accessToken');
    const refreshToken = Cookies.get('refreshToken');

    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);

    if (!accessToken || !refreshToken) {
      logoutUser();
      throw new Error('No access token or refresh token available.');
    }

    try {
      const validationResponse = await axios.post(
        `${API_ENDPOINT}/validateToken`,
        { token: accessToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (validationResponse.data?.success !== true) {
        throw new Error('Access token invalid — refreshing...');
      }
    } catch (validationError) {
      console.warn('Token validation failed:', validationError);

      try {
        console.log('Attempting to refresh access token...', API_ENDPOINT);
        const refreshTokenResponse = await axios.post(
          `${API_ENDPOINT}/refreshToken`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        accessToken = refreshTokenResponse.data?.accessToken;
        if (!accessToken) throw new Error('Token refresh failed.');

        Cookies.set('accessToken', accessToken, { expires: 1 / 24, path: '/' });
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        logoutUser();
        throw refreshError;
      }
    }

    config.headers['Authorization'] = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

function logoutUser() {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
}

export default axiosInstance;
