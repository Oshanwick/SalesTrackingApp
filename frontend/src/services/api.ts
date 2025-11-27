import axios from 'axios';
import { SaleItem } from '../types/SaleItem';
import { SummaryReport, RevenueTrendPoint, SalesByType, TopCustomer, MonthlyData } from '../types/ReportTypes';

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

export const reportsApi = {
    getSummary: async (): Promise<SummaryReport> => {
        const response = await api.get<SummaryReport>('/reports/summary');
        return response.data;
    },

    getRevenueTrend: async (startDate?: string, endDate?: string): Promise<RevenueTrendPoint[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await api.get<RevenueTrendPoint[]>(`/reports/revenue-trend?${params.toString()}`);
        return response.data;
    },

    getSalesByType: async (): Promise<SalesByType[]> => {
        const response = await api.get<SalesByType[]>('/reports/sales-by-type');
        return response.data;
    },

    getTopCustomers: async (limit: number = 10): Promise<TopCustomer[]> => {
        const response = await api.get<TopCustomer[]>(`/reports/top-customers?limit=${limit}`);
        return response.data;
    },

    getMonthlyComparison: async (year?: number): Promise<MonthlyData[]> => {
        const params = year ? `?year=${year}` : '';
        const response = await api.get<MonthlyData[]>(`/reports/monthly-comparison${params}`);
        return response.data;
    },
};
