import axios from 'axios';

// En producción usa la variable de entorno. En local usa el proxy.
const baseURL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : '/api';

const api = axios.create({
    baseURL: baseURL,
});

export const fetchProducts = async () => {
    const response = await api.get('/productos');
    return response.data;
};

export const fetchCategories = async () => {
    const response = await api.get('/categorias');
    return response.data;
};

export const fetchConfig = async () => {
    const response = await api.get('/configuracion');
    return response.data;
};

export const submitPurchase = async (compraData) => {
    const response = await api.post('/compras', compraData);
    return response.data;
};

export default api;
