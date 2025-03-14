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
    Alert,
    Segmented,
    Statistic,
    Row,
    Col,
    Tooltip as AntTooltip
} from 'antd';

import {
    LineChartOutlined,
    BarChartOutlined,
    ReloadOutlined,
    DollarOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    InfoCircleOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import { LineChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, Bar } from 'recharts';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useAuth } from '../hooks/useAuth';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

const { Title, Text } = Typography;

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
    sortBy: (string | { field: string; direction: 'asc' | 'desc' })[];
    filter: Record<string, unknown>;
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

type ChartType = 'line' | 'bar';
type ViewMode = 'yearly' | 'monthly' | 'weekly';

const ExpenseChart: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fakturData, setFakturData] = useState<FakturItem[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('monthly');
    const [chartType, setChartType] = useState<ChartType>('line');
    const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
    const [chartData, setChartData] = useState<ChartDataItem[]>([]);
    const [statistics, setStatistics] = useState<{
        total: number;
        average: number;
        maxMonth: string;
        maxValue: number;
        growth: number;
    }>({
        total: 0,
        average: 0,
        maxMonth: '',
        maxValue: 0,
        growth: 0
    });

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
            setStatistics({
                total: 0,
                average: 0,
                maxMonth: '',
                maxValue: 0,
                growth: 0
            });
            return;
        }

        const data = JSON.parse(JSON.stringify(fakturData));
        let formattedData: ChartDataItem[] = [];
        let totalSum = 0;
        let maxMonth = '';
        let maxValue = 0;
        let previousPeriodTotal = 0;
        let currentPeriodTotal = 0;

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

                // Calculate statistics
                formattedData.forEach((item, index) => {
                    item.average = item.total / item.count;
                    totalSum += item.total;

                    if (item.total > maxValue) {
                        maxValue = item.total;
                        maxMonth = item.year || '';
                    }

                    // Calculate growth between last two years
                    if (index === formattedData.length - 1) {
                        currentPeriodTotal = item.total;
                    } else if (index === formattedData.length - 2) {
                        previousPeriodTotal = item.total;
                    }
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

                // Calculate statistics
                formattedData.forEach((item) => {
                    item.average = item.count ? item.total / item.count : 0;
                    totalSum += item.total;

                    if (item.total > maxValue) {
                        maxValue = item.total;
                        maxMonth = item.month || '';
                    }
                });

                // Calculate month-over-month growth
                const currentMonth = dayjs().month();
                if (currentMonth > 0) {
                    currentPeriodTotal = monthlyData[currentMonth]?.total || 0;
                    previousPeriodTotal = monthlyData[currentMonth - 1]?.total || 0;
                }
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

                // Calculate statistics
                formattedData.forEach((item, index) => {
                    item.average = item.count ? item.total / item.count : 0;
                    totalSum += item.total;

                    if (item.total > maxValue) {
                        maxValue = item.total;
                        maxMonth = item.week || '';
                    }

                    // Calculate growth between last two weeks
                    if (index === formattedData.length - 1) {
                        currentPeriodTotal = item.total;
                    } else if (index === formattedData.length - 2) {
                        previousPeriodTotal = item.total;
                    }
                });
                break;
            }
        }

        // Calculate average and growth
        const averageValue = formattedData.length > 0 ? totalSum / formattedData.length : 0;
        const growthValue = previousPeriodTotal > 0
            ? ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100
            : 0;

        setChartData(formattedData);
        setStatistics({
            total: totalSum,
            average: averageValue,
            maxMonth,
            maxValue,
            growth: growthValue
        });
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
                    borderRadius: '8px'
                }}>
                    <p className="label" style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>{label}</p>
                    <p style={{ margin: '4px 0', color: '#f5222d' }}>
                        Total: {formatCurrency(payload[0].value)}
                    </p>
                    {payload[1] && (
                        <p style={{ margin: '4px 0', color: '#1890ff' }}>
                            Rata-rata: {formatCurrency(payload[1].value)}
                        </p>
                    )}
                    <p style={{ margin: '4px 0', color: '#8c8c8c', fontSize: '12px' }}>
                        Jumlah: {payload[0].payload.count} faktur
                    </p>
                </div>
            );
        }
        return null;
    };

    const getChartIcon = () => {
        return chartType === 'line' ? <LineChartOutlined /> : <BarChartOutlined />;
    };

    const getViewModeText = () => {
        switch (viewMode) {
            case 'yearly': return 'Tahunan';
            case 'monthly': return 'Bulanan';
            case 'weekly': return 'Mingguan';
            default: return '';
        }
    };

    const renderChart = () => {
        if (chartType === 'line') {
            return (
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
            );
        } else {
            return (
                <BarChart
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
                    <Bar
                        dataKey="total"
                        name="Total Pengeluaran"
                        fill="#f5222d"
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar
                        dataKey="average"
                        name="Rata-rata Pengeluaran"
                        fill="#1890ff"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            );
        }
    };

    // Removed the duplicate Card component and redesigned the layout
    return (
        <div className="expense-chart-container">
            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            <Card
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <Title level={4} style={{ margin: 0 }}>
                            {getChartIcon()} <span>{viewMode === 'yearly' ? 'Tren Pengeluaran Tahunan' : viewMode === 'monthly' ? 'Tren Pengeluaran Bulanan' : 'Tren Pengeluaran Mingguan'}</span>
                            </Title>
                            <AntTooltip title={`Menampilkan data pengeluaran ${getViewModeText().toLowerCase()}`}>
                                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                            </AntTooltip>
                        </Space>
                        <Space>
                            {viewMode !== 'yearly' && (
                                <DatePicker
                                    picker="year"
                                    value={dayjs().year(selectedYear)}
                                    onChange={(date) => setSelectedYear(date ? date.year() : dayjs().year())}
                                    format="YYYY"
                                    allowClear={false}
                                    style={{ marginRight: 8 }}
                                    suffixIcon={<CalendarOutlined />}
                                />
                            )}
                            <Segmented
                                value={viewMode}
                                onChange={(value) => setViewMode(value as ViewMode)}
                                options={[
                                    { value: 'yearly', label: 'Tahunan' },
                                    { value: 'monthly', label: 'Bulanan' },
                                    { value: 'weekly', label: 'Mingguan' }
                                ]}
                                style={{ marginRight: 8 }}
                            />
                            <Radio.Group
                                value={chartType}
                                onChange={(e) => setChartType(e.target.value)}
                                optionType="button"
                                buttonStyle="solid"
                            >
                               <Radio.Button value="line">{chartType === 'line' ? getChartIcon() : <LineChartOutlined />} Line</Radio.Button>
                               <Radio.Button value="bar">{chartType === 'bar' ? getChartIcon() : <BarChartOutlined />} Bar</Radio.Button>
                            </Radio.Group>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchData}
                                loading={loading}
                                type="primary"
                                ghost
                            />
                        </Space>
                    </div>
                }
                bordered={false}
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                bodyStyle={{ padding: '12px 24px 24px' }}
            >
                {/* Stats Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={12} xl={6}>
                        <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
                            <Statistic
                                title="Total Pengeluaran"
                                value={statistics.total}
                                precision={0}
                                valueStyle={{ color: '#52c41a' }}
                                prefix={<DollarOutlined />}
                                formatter={(value) => formatCurrency(Number(value))}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <Card bordered={false} style={{ background: '#e6f7ff', borderRadius: 8 }}>
                            <Statistic
                                title="Rata-rata Pengeluaran"
                                value={statistics.average}
                                precision={0}
                                valueStyle={{ color: '#1890ff' }}
                                prefix={<DollarOutlined />}
                                formatter={(value) => formatCurrency(Number(value))}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <Card bordered={false} style={{ background: '#fff1f0', borderRadius: 8 }}>
                            <Statistic
                                title={`${viewMode === 'yearly' ? 'Tahun' : viewMode === 'monthly' ? 'Bulan' : 'Minggu'} Tertinggi`}
                                value={statistics.maxValue}
                                precision={0}
                                valueStyle={{ color: '#f5222d' }}
                                prefix={<DollarOutlined />}
                                formatter={(value) => formatCurrency(Number(value))}
                                suffix={<Text type="secondary" style={{ fontSize: 14 }}>({statistics.maxMonth})</Text>}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} xl={6}>
                        <Card bordered={false} style={{ background: statistics.growth >= 0 ? '#f6ffed' : '#fff1f0', borderRadius: 8 }}>
                            <Statistic
                                title="Pertumbuhan"
                                value={statistics.growth}
                                precision={2}
                                valueStyle={{ color: statistics.growth >= 0 ? '#52c41a' : '#f5222d' }}
                                prefix={statistics.growth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                suffix="%"
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Chart Container */}
                <div style={{ width: '100%', height: 400, paddingTop: 8 }}>
                    {loading ? (
                        <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Spin size="large" />
                        </div>
                    ) : chartData.length === 0 ? (
                        <Empty
                            description="Tidak ada data pengeluaran untuk ditampilkan"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart()}
                        </ResponsiveContainer>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ExpenseChart;