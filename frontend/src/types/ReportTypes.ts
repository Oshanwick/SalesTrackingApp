export interface SummaryReport {
    totalRevenue: number;
    totalSales: number;
    averageRevenue: number;
    highestSale: number;
    lowestSale: number;
    topCustomer: string;
    mostSoldType: string;
}

export interface RevenueTrendPoint {
    date: string;
    revenue: number;
    salesCount: number;
}

export interface SalesByType {
    type: string;
    count: number;
    revenue: number;
    percentage: number;
}

export interface TopCustomer {
    customerName: string;
    salesCount: number;
    totalRevenue: number;
}

export interface MonthlyData {
    month: string;
    monthNumber: number;
    revenue: number;
    salesCount: number;
}
