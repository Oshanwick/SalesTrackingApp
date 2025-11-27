import axios from 'axios';
import { SaleItem } from '../types/SaleItem';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const salesApi = {
    getAllSales: async (): Promise<SaleItem[]> => {
        const response = await api.get<SaleItem[]>('/sales');
        return response.data;
    },

    addSale: async (sale: SaleItem): Promise<SaleItem> => {
        const response = await api.post<SaleItem>('/sales', sale);
        return response.data;
    },

    updateSale: async (id: number, sale: SaleItem): Promise<void> => {
        await api.put(`/sales/${id}`, sale);
    },

    deleteSale: async (id: number): Promise<void> => {
        await api.delete(`/sales/${id}`);
    },

    deleteAllSales: async (): Promise<void> => {
        await api.delete('/sales/all');
    },
};
