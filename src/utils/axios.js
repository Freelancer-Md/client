// client/src/utils/axios.js
import axios from '../api/api';

const instance = axios.create();

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
