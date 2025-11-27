import { useState, useEffect, FC } from 'react';
import { reportsApi } from '../services/api';
import { SummaryReport, RevenueTrendPoint, SalesByType, TopCustomer, MonthlyData } from '../types/ReportTypes';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const Reports: FC = () => {
    const [summary, setSummary] = useState<SummaryReport | null>(null);
    const [revenueTrend, setRevenueTrend] = useState<RevenueTrendPoint[]>([]);
    const [salesByType, setSalesByType] = useState<SalesByType[]>([]);
    const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30'); // days
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchAllReports();
    }, [dateRange, selectedYear]);

    const fetchAllReports = async () => {
        try {
            setLoading(true);

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(dateRange));

            // Fetch all reports concurrently
            const [summaryData, trendData, typeData, customersData, monthlyDataResult] = await Promise.all([
                reportsApi.getSummary(),
                reportsApi.getRevenueTrend(startDate.toISOString(), endDate.toISOString()),
                reportsApi.getSalesByType(),
                reportsApi.getTopCustomers(10),
                reportsApi.getMonthlyComparison(selectedYear)
            ]);

            setSummary(summaryData);
            setRevenueTrend(trendData);
            setSalesByType(typeData);
            setTopCustomers(customersData);
            setMonthlyData(monthlyDataResult);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => `Rs ${value.toFixed(2)}`;
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (loading) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 bg-clip-text text-transparent mb-2">
                            Reports & Analytics
                        </h1>
                        <p className="text-slate-600 text-lg">Insights and trends from your sales data</p>
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="input-field"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="stat-card">
                            <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide mb-1">Total Revenue</p>
                            <p className="text-3xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
                        </div>
                        <div className="stat-card">
                            <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide mb-1">Total Sales</p>
                            <p className="text-3xl font-bold text-blue-600">{summary.totalSales}</p>
                        </div>
                        <div className="stat-card">
                            <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide mb-1">Average Sale</p>
                            <p className="text-3xl font-bold text-purple-600">{formatCurrency(summary.averageRevenue)}</p>
                        </div>
                        <div className="stat-card">
                            <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide mb-1">Highest Sale</p>
                            <p className="text-3xl font-bold text-orange-600">{formatCurrency(summary.highestSale)}</p>
                        </div>
                        <div className="stat-card">
                            <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide mb-1">Top Customer</p>
                            <p className="text-xl font-bold text-slate-700">{summary.topCustomer}</p>
                        </div>
                        <div className="stat-card">
                            <p className="text-slate-600 text-sm font-semibold uppercase tracking-wide mb-1">Most Sold Type</p>
                            <p className="text-xl font-bold text-slate-700">{summary.mostSoldType}</p>
                        </div>
                    </div>
                )}

                {/* Revenue Trend Chart */}
                <div className="glass-card rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-slate-700 mb-4">Revenue Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" tickFormatter={formatDate} stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                labelFormatter={formatDate}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Revenue" />
                            <Line type="monotone" dataKey="salesCount" stroke="#3b82f6" strokeWidth={2} name="Sales Count" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Sales by Type */}
                    <div className="glass-card rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-slate-700 mb-4">Sales by Type</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={salesByType}
                                    dataKey="revenue"
                                    nameKey="type"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={(entry) => `${entry.type}: ${entry.percentage.toFixed(1)}%`}
                                >
                                    {salesByType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Customers */}
                    <div className="glass-card rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-slate-700 mb-4">Top 10 Customers</h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topCustomers} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" stroke="#64748b" />
                                <YAxis dataKey="customerName" type="category" width={100} stroke="#64748b" />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Bar dataKey="totalRevenue" fill="#3b82f6" name="Revenue" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Comparison */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-700">Monthly Comparison</h2>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="input-field w-32"
                        >
                            {[...Array(5)].map((_, i) => {
                                const year = new Date().getFullYear() - i;
                                return <option key={year} value={year}>{year}</option>;
                            })}
                        </select>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                            <Bar dataKey="salesCount" fill="#3b82f6" name="Sales Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Reports;
