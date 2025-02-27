import axios from "axios";;

const api = axios.create({
  baseURL: process.env.VITE_BACKEND_URL,
  withCredentials: false
});

// Simplified request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
