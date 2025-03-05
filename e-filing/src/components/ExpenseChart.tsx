import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Typography,
    Spin,
    Empty,
    Button,
    Radio,
    DatePicker,
    Space,
    Alert
} from 'antd';

import {
    LineChartOutlined,
    ReloadOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useAuth } from '../hooks/useAuth';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

const { Text } = Typography;

interface User {
    id: string;
    nama: string;
    jabatan: string;
    nomor_identitas: string;
}

interface FakturItem {
    id: string;
    bukti_pembayaran: string;
    deskripsi: string;
    jumlah_pengeluaran: number;
    metode_pembayaran: string;
    status_pembayaran: string;
    user: User;
    tanggal: string;
}

interface ApiResponseMeta {
    currentPage: number;
    offset: number;
    itemsPerPage: number;
    unpaged: boolean;
    totalPages: number;
    totalItems: number;
    sortBy: any[];
    filter: Record<string, any>;
}

interface ApiResponseData {
    paginatedData: FakturItem[];
    meta: ApiResponseMeta;
}

interface ApiResponse {
    data: ApiResponseData;
    status: number;
    message: string;
}

interface ChartDataItem {
    month?: string;
    monthNum?: number;
    week?: string;
    weekNum?: number;
    year?: string;
    total: number;
    count: number;
    average: number;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number;
        name: string;
        payload: ChartDataItem;
    }>;
    label?: string;
}

const ExpenseChart: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fakturData, setFakturData] = useState<FakturItem[]>([]);
    const [viewMode, setViewMode] = useState<'yearly' | 'monthly' | 'weekly'>('monthly');
    const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
    const [chartData, setChartData] = useState<ChartDataItem[]>([]);

    const { token } = useAuth();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://api-efiling.vercel.app/api/faktur', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result: ApiResponse = await response.json();

            if (result.status === 200 && result.data && result.data.paginatedData) {
                setFakturData(result.data.paginatedData);
            } else {
                throw new Error(result.message || 'Failed to fetch data');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const prepareChartData = useCallback(() => {
        if (!fakturData.length) {
            setChartData([]);
            return;
        }

        const data = JSON.parse(JSON.stringify(fakturData));

        let formattedData: ChartDataItem[] = [];

        switch (viewMode) {
            case 'yearly': {
                // Group by year
                const yearlyData: Record<string, ChartDataItem> = data.reduce((acc: Record<string, ChartDataItem>, item: FakturItem) => {
                    const year = dayjs(item.tanggal).year();
                    const yearStr = year.toString();
                    if (!acc[yearStr]) {
                        acc[yearStr] = { year: yearStr, total: 0, count: 0, average: 0 };
                    }
                    acc[yearStr].total += Number(item.jumlah_pengeluaran);
                    acc[yearStr].count += 1;
                    return acc;
                }, {});

                formattedData = Object.values(yearlyData).sort((a, b) => Number(a.year) - Number(b.year));
                formattedData.forEach(item => {
                    item.average = item.total / item.count;
                });
                break;
            }

            case 'monthly': {
                // Group by month for the selected year
                const monthlyData: Record<number, ChartDataItem> = data.reduce((acc: Record<number, ChartDataItem>, item: FakturItem) => {
                    const date = dayjs(item.tanggal);
                    const year = date.year();

                    if (year === selectedYear) {
                        const month = date.month();
                        if (!acc[month]) {
                            acc[month] = {
                                month: date.format('MMM'),
                                monthNum: month,
                                total: 0,
                                count: 0,
                                average: 0
                            };
                        }
                        acc[month].total += Number(item.jumlah_pengeluaran);
                        acc[month].count += 1;
                    }
                    return acc;
                }, {});

                // Fill in missing months
                for (let i = 0; i < 12; i++) {
                    if (!monthlyData[i]) {
                        monthlyData[i] = {
                            month: dayjs().month(i).format('MMM'),
                            monthNum: i,
                            total: 0,
                            count: 0,
                            average: 0
                        };
                    }
                }

                formattedData = Object.values(monthlyData).sort((a, b) => (a.monthNum as number) - (b.monthNum as number));
                formattedData.forEach(item => {
                    item.average = item.count ? item.total / item.count : 0;
                });
                break;
            }

            case 'weekly': {
                // Group by week for the selected year
                const weeklyData: Record<number, ChartDataItem> = data.reduce((acc: Record<number, ChartDataItem>, item: FakturItem) => {
                    const date = dayjs(item.tanggal);
                    const year = date.year();

                    if (year === selectedYear) {
                        const week = date.isoWeek();
                        if (!acc[week]) {
                            acc[week] = {
                                week: `Week ${week}`,
                                weekNum: week,
                                total: 0,
                                count: 0,
                                average: 0
                            };
                        }
                        acc[week].total += Number(item.jumlah_pengeluaran);
                        acc[week].count += 1;
                    }
                    return acc;
                }, {});

                formattedData = Object.values(weeklyData).sort((a, b) => (a.weekNum as number) - (b.weekNum as number));
                formattedData.forEach(item => {
                    item.average = item.count ? item.total / item.count : 0;
                });
                break;
            }
        }

        setChartData(formattedData);
    }, [fakturData, viewMode, selectedYear]);

    useEffect(() => {
        prepareChartData();
    }, [prepareChartData]);

    // Format currency for display
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Custom tooltip for the chart
    const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip" style={{
                    backgroundColor: 'white',
                    padding: '12px',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRadius: '6px'
                }}>
                    <p className="label" style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>{label}</p>
                    <p style={{ margin: '4px 0', color: '#f5222d' }}>
                        Total: {formatCurrency(payload[0].value)}
                    </p>
                    {payload[1] && (
                        <p style={{ margin: '4px 0', color: '#1890ff' }}>
                            Average: {formatCurrency(payload[1].value)}
                        </p>
                    )}
                    <p style={{ margin: '4px 0', color: '#8c8c8c', fontSize: '12px' }}>
                        Count: {payload[0].payload.count} invoices
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card
            title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <LineChartOutlined style={{ color: '#f5222d', marginRight: '8px', fontSize: '18px' }} />
                    <Text strong style={{ fontSize: '16px' }}>Grafik Pengeluaran Faktur</Text>
                </div>
            }
            extra={
                <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={fetchData}
                    loading={loading}
                    style={{
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    Perbarui
                </Button>
            }
            style={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                marginBottom: '16px'
            }}
        >
            <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <Radio.Group
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        optionType="button"
                        buttonStyle="solid"
                        style={{ marginBottom: '16px' }}
                    >
                        <Radio.Button value="yearly">Tahunan</Radio.Button>
                        <Radio.Button value="monthly">Bulanan</Radio.Button>
                        <Radio.Button value="weekly">Mingguan</Radio.Button>
                    </Radio.Group>

                    {viewMode !== 'yearly' && (
                        <DatePicker
                            picker="year"
                            value={dayjs().year(selectedYear)}
                            onChange={(date) => setSelectedYear(date ? date.year() : dayjs().year())}
                            allowClear={false}
                            style={{ width: '120px' }}
                        />
                    )}
                </div>

                {error && (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: '16px' }}
                    />
                )}

                {loading ? (
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Spin size="large" />
                    </div>
                ) : chartData.length === 0 ? (
                    <Empty
                        description="Tidak ada data pengeluaran tersedia"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ margin: '32px 0' }}
                    />
                ) : (
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey={viewMode === 'yearly' ? 'year' : viewMode === 'monthly' ? 'month' : 'week'}
                                    tick={{ fontSize: 12 }}
                                    axisLine={{ stroke: '#d9d9d9' }}
                                    tickLine={{ stroke: '#d9d9d9' }}
                                />
                                <YAxis
                                    axisLine={{ stroke: '#d9d9d9' }}
                                    tickLine={{ stroke: '#d9d9d9' }}
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => `Rp${value / 1000}k`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    name="Total Pengeluaran"
                                    stroke="#f5222d"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: '#f5222d', stroke: 'white', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: '#f5222d', stroke: 'white', strokeWidth: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="average"
                                    name="Rata-rata Pengeluaran"
                                    stroke="#1890ff"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: '#1890ff', stroke: 'white', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: '#1890ff', stroke: 'white', strokeWidth: 2 }}
                                    strokeDasharray="3 3"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <div style={{ marginTop: '12px', textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                        <DollarOutlined style={{ marginRight: '4px' }} />
                        {chartData.length > 0
                            ? `Total pengeluaran: ${formatCurrency(chartData.reduce((sum, item) => sum + item.total, 0))}`
                            : 'Tidak ada data'
                        }
                    </Text>
                </div>
            </Space>
        </Card>
    );
};

export default ExpenseChart;