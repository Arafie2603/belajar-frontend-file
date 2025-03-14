/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
    Card,
    Row,
    Col,
    Statistic,
    Typography,
    Avatar,
    Space,
    Table,
    Tag,
    Divider,
    Skeleton,
    Badge,
    Calendar,
    Alert,
    Empty,
    Button,
    Dropdown,
    Radio,
    Carousel
} from 'antd';
import {
    MailOutlined,
    SendOutlined,
    FileTextOutlined,
    UserOutlined,
    FileDoneOutlined,
    BellOutlined,
    CalendarOutlined,
    ReloadOutlined,
    DownOutlined,
    LeftOutlined,
    RightOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import useDashboardData, { CACHE_KEYS } from '../hooks/useDashboardData';
import ExpenseChart from '../components/ExpenseChart'; // Import the new component
import axios from 'axios';
import "../App.css";
import { storage } from '../utils/storage';
import { DATA_EVENTS, eventBus } from '../utils/eventBus';
import localeData from 'dayjs/plugin/localeData';
import dayjs from 'dayjs';

dayjs.extend(localeData);

const { Title, Text } = Typography;

interface EnhancedCalendarHeaderProps {
    value: Dayjs;
    type: "month" | "year";
    onChange: (newValue: Dayjs) => void;
    onTypeChange: (newType: "month" | "year") => void;
}

interface UpcomingEventAnnouncementProps {
    events: Event[];
}

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    description: string;
}


interface Event {
    id: number;
    judul: string;
    tanggal_rapat: string;
    lokasi: string;
    type: string;
    pemimpin_rapat: string;
    agenda: string;
    description: string;
}

const getUpcomingEvents = (events: Event[] | undefined, days = 7): Event[] => {
    if (!events || !Array.isArray(events)) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    futureDate.setHours(23, 59, 59, 999);

    return events.filter(event => {
        const eventDate = new Date(event.tanggal_rapat);
        return eventDate >= today && eventDate <= futureDate;
    }).sort((a, b) => new Date(a.tanggal_rapat).getTime() - new Date(b.tanggal_rapat).getTime()); // Urutkan berdasarkan tanggal terdekat
};


const useUpcomingEvents = () => {
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const CACHE_EXPIRY = 30 * 60 * 1000;

    const isCacheValid = useCallback((cachedData: any): boolean => {
        if (!cachedData) return false;
        return Date.now() - cachedData.timestamp < CACHE_EXPIRY;
    }, [CACHE_EXPIRY]);

    useEffect(() => {
        const fetchNotulenData = async () => {
            try {
                setLoading(true);

                // Check if we have valid cached data
                const cachedEvents = storage.get(CACHE_KEYS.UPCOMING_EVENTS);

                if (cachedEvents && isCacheValid(cachedEvents)) {
                    console.log('Using cached upcoming events data');
                    setUpcomingEvents(cachedEvents.data);
                    setLoading(false);
                    return;
                }

                const response = await axios.get('https://api-efiling.vercel.app/api/notulen');

                if (response.data.status === 200 && response.data.data.paginatedData) {
                    // Transform notulen data to event format
                    const notulenEvents = response.data.data.paginatedData.map((notulen: Event) => ({
                        id: notulen.id,
                        judul: notulen.judul,
                        tanggal_rapat: notulen.tanggal_rapat,
                        type: 'meeting',
                        agenda: `Rapat: ${notulen.agenda || 'Tidak ada agenda'}`,
                        lokasi: notulen.lokasi || 'Tidak ditentukan',
                        pemimpin_rapat: notulen.pemimpin_rapat || 'Tidak ditentukan'
                    }));

                    // Filter upcoming events within the next 7 days
                    const upcoming = getUpcomingEvents(notulenEvents, 7);
                    setUpcomingEvents(upcoming);
                    console.log('Upcoming events:', upcoming);

                    // Cache the upcoming events
                    storage.set(CACHE_KEYS.UPCOMING_EVENTS, {
                        data: upcoming,
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                console.error('Error fetching notulen data:', error);

                // Try to use cached data as fallback if API fails
                const cachedEvents = storage.get(CACHE_KEYS.UPCOMING_EVENTS);
                if (cachedEvents) {
                    console.log('Using cached upcoming events data as fallback');
                    setUpcomingEvents(cachedEvents.data);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchNotulenData();

        // Set up event listener for notulen updates
        const unsubscribeNotulen = eventBus.on(DATA_EVENTS.NOTULEN_UPDATED, () => {
            console.log('Notulen updated, refreshing upcoming events');
            // Invalidate cache for upcoming events
            storage.remove(CACHE_KEYS.UPCOMING_EVENTS);
            // Fetch fresh data
            fetchNotulenData();
        });

        return () => {
            unsubscribeNotulen();
        };
    }, [isCacheValid]);

    return { upcomingEvents, loading };
};


const Dashboard: React.FC = () => {
    const {
        loading,
        userData,
        stats,
        recentDocs,
        getCalendarEventsForDate,
        forceRefresh
    } = useDashboardData();

    const [calendarView, setCalendarView] = useState<'month' | 'year'>('month');
    const { upcomingEvents } = useUpcomingEvents();




    // Calendar cell renderer using the hook data
    const dateCellRender = (value: Dayjs) => {
        const dateStr = value.format('YYYY-MM-DD');
        const listData = getCalendarEventsForDate(dateStr);

        return (
            <ul className="events" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {listData.map((item, index) => (
                    <li key={index} style={{
                        padding: '2px 4px',
                        marginBottom: '2px',
                        borderRadius: '4px',
                        backgroundColor: item.type === 'success' ? 'rgba(82, 196, 26, 0.1)' :
                            item.type === 'warning' ? 'rgba(250, 173, 20, 0.1)' :
                                item.type === 'error' ? 'rgba(245, 34, 45, 0.1)' : 'rgba(24, 144, 255, 0.1)',
                        color: item.type === 'success' ? '#52c41a' :
                            item.type === 'warning' ? '#faad14' :
                                item.type === 'error' ? '#f5222d' : '#1890ff',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        <Badge
                            color={item.type === 'success' ? '#52c41a' :
                                item.type === 'warning' ? '#faad14' :
                                    item.type === 'error' ? '#f5222d' : '#1890ff'}
                            text={item.content}
                            style={{ fontSize: '11px' }}
                        />
                    </li>
                ))}
            </ul>
        );
    };

    const headerRender = (props: EnhancedCalendarHeaderProps) => {
        return <EnhancedCalendarHeader {...props} />;
    };

    const columns = [
        {
            title: 'Tipe',
            dataIndex: 'type',
            key: 'type',
            render: (text: string) => {
                let color = 'blue';
                let icon = <SendOutlined />;

                switch (text) {
                    case 'Surat Masuk':
                        color = 'green';
                        icon = <MailOutlined />;
                        break;
                    case 'Surat Keluar':
                        color = 'blue';
                        icon = <SendOutlined />;
                        break;
                    case 'Faktur':
                        color = 'red';
                        icon = <FileDoneOutlined />;
                        break;
                    case 'Notulen':
                        color = 'purple';
                        icon = <FileTextOutlined />;
                        break;
                }

                return (
                    <Tag color={color} icon={icon} style={{
                        padding: '4px 8px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        width: 'fit-content'
                    }}>
                        {text}
                    </Tag>
                );
            },
        },
        {
            title: 'Judul',
            dataIndex: 'title',
            key: 'title',
            render: (text: string) => <Text ellipsis={{ tooltip: text }}>{text}</Text>,
        },
        {
            title: 'Tanggal',
            dataIndex: 'date',
            key: 'date',
            render: (date: Date) => (
                <Text style={{
                    background: '#f0f5ff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#1890ff'
                }}>
                    {date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
            ),
        },
        {
            title: 'Pengirim/Penerima',
            dataIndex: 'sender',
            key: 'sender',
            render: (text: string) => (
                <Space>
                    <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{text.charAt(0)}</Avatar>
                    <Text>{text}</Text>
                </Space>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (text: string) => {
                let color = 'blue';

                switch (text) {
                    case 'Masuk':
                        color = 'green';
                        break;
                    case 'Keluar':
                        color = 'blue';
                        break;
                    case 'Tagihan':
                        color = 'red';
                        break;
                    case 'Rapat':
                        color = 'purple';
                        break;
                }

                return (
                    <Tag color={color} style={{
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        padding: '0 8px'
                    }}>
                        {text}
                    </Tag>
                );
            },
        },
    ];

    const UpcomingEventAnnouncement: React.FC<UpcomingEventAnnouncementProps> = ({ events }) => {
        const carouselRef = React.useRef<any>(null);
        const [activeIndex, setActiveIndex] = useState(0);
    
        // Auto-slide every 5 seconds
        useEffect(() => {
            if (!events || events.length <= 1) return;
    
            const interval = setInterval(() => {
                if (carouselRef.current) {
                    carouselRef.current.next();
                    setActiveIndex((prev) => (prev + 1) % events.length);
                }
            }, 5000); // 5 seconds interval
    
            return () => clearInterval(interval);
        }, [events]);
    
        if (!events || events.length === 0) {
            return (
                <Alert
                    message={
                        <Text strong style={{ fontSize: '16px' }}>
                            <BellOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                            Pengumuman Terbaru
                        </Text>
                    }
                    description={
                        <Text style={{ fontSize: '14px' }}>
                            Tidak ada kegiatan yang akan datang dalam 7 hari ke depan.
                        </Text>
                    }
                    type="info"
                    showIcon={false}
                    style={{
                        borderRadius: '12px',
                        border: 'none',
                        backgroundImage: 'linear-gradient(135deg, rgba(24, 144, 255, 0.15), rgba(24, 144, 255, 0.05))',
                        padding: '12px 16px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                    }}
                />
            );
        }
    
        return (
            <div style={{ position: 'relative' }}>
                <Alert
                    message={
                        <Text strong style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                            <BellOutlined style={{
                                marginRight: '8px',
                                color: '#1890ff',
                                fontSize: '18px',
                                animation: 'pulse 2s infinite'
                            }} />
                            Pengumuman Kegiatan ({events.length})
                        </Text>
                    }
                    description={
                        <div>
                            <style>{`
                                @keyframes pulse {
                                    0% { transform: scale(1); }
                                    50% { transform: scale(1.1); }
                                    100% { transform: scale(1); }
                                }
                            `}</style>
                            <Carousel
                                ref={carouselRef}
                                dots={false} // Remove default dots
                                effect="fade"
                                beforeChange={(next) => setActiveIndex(next)}
                            >
                                {events.map((event) => (
                                    <div key={event.id}>
                                        <div style={{
                                            borderLeft: '4px solid #1890ff',
                                            paddingLeft: '12px',
                                            minHeight: '90px',
                                            borderRadius: '4px',
                                            background: 'rgba(24, 144, 255, 0.03)',
                                            padding: '12px',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 1px 6px rgba(0, 0, 0, 0.05)',
                                        }}>
                                            <Text style={{ fontSize: '15px', display: 'block', marginBottom: '6px' }}>
                                                <Text strong style={{ color: '#262626' }}>{event.judul}</Text>
                                            </Text>
    
                                            <Text style={{
                                                fontSize: '14px',
                                                color: '#1890ff',
                                                display: 'block',
                                                fontWeight: 'bold',
                                                marginBottom: '4px',
                                                background: 'rgba(24, 144, 255, 0.08)',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                width: 'fit-content'
                                            }}>
                                                <CalendarOutlined style={{ marginRight: '5px' }} />
                                                {new Date(event.tanggal_rapat).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </Text>
    
                                            <div style={{ fontSize: '13px', color: '#595959', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div>
                                                    <Text strong style={{ marginRight: '4px' }}>Lokasi:</Text>
                                                    {event.lokasi}
                                                </div>
                                                <div>
                                                    <Text strong style={{ marginRight: '4px' }}>Pemimpin:</Text>
                                                    {event.pemimpin_rapat}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Carousel>
    
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: '8px',
                            }}>
                                <Button
                                    type="text"
                                    icon={<LeftOutlined />}
                                    size="small"
                                    onClick={() => {
                                        carouselRef.current?.prev();
                                        setActiveIndex((prev) => (prev - 1 + events.length) % events.length);
                                    }}
                                    style={{
                                        borderRadius: '50%',
                                        width: '28px',
                                        height: '28px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                />
    
                                <div style={{ margin: '0 8px', display: 'flex', gap: '4px' }}>
                                    {events.map((_, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                width: index === activeIndex ? '16px' : '6px',
                                                height: '6px',
                                                borderRadius: index === activeIndex ? '4px' : '50%',
                                                background: index === activeIndex ? '#1890ff' : '#d9d9d9',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => {
                                                carouselRef.current?.goTo(index);
                                                setActiveIndex(index);
                                            }}
                                        />
                                    ))}
                                </div>
    
                                <Button
                                    type="text"
                                    icon={<RightOutlined />}
                                    size="small"
                                    onClick={() => {
                                        carouselRef.current?.next();
                                        setActiveIndex((prev) => (prev + 1) % events.length);
                                    }}
                                    style={{
                                        borderRadius: '50%',
                                        width: '28px',
                                        height: '28px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                />
                            </div>
                        </div>
                    }
                    type="info"
                    showIcon={false}
                    style={{
                        borderRadius: '12px',
                        border: 'none',
                        backgroundImage: 'linear-gradient(135deg, rgba(24, 144, 255, 0.15), rgba(24, 144, 255, 0.05))',
                        padding: '16px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}
                />
            </div>
        );
    };

    const EnhancedCalendarHeader: React.FC<EnhancedCalendarHeaderProps> = ({ value, type, onChange, onTypeChange }) => {
        const current = value.clone();
        const year = current.year();
        const month = current.month();
    
        const renderMonthButtons = () => {
            const monthRows = [
                [0, 1, 2, 3],  
                [4, 5, 6, 7],  // May-Aug
                [8, 9, 10, 11] // Sep-Dec
            ];
    
            return monthRows.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    {row.map((monthIndex) => (
                        <Button
                            key={monthIndex}
                            type={month === monthIndex ? 'primary' : 'default'}
                            onClick={() => {
                                const newValue = current.clone().month(monthIndex);
                                onChange(newValue);
                            }}
                            size="small"
                            style={{
                                width: '70px',
                                borderRadius: '4px',
                                fontWeight: month === monthIndex ? 'bold' : 'normal'
                            }}
                        >
                            {dayjs.monthsShort()[monthIndex]} 
                        </Button>
                    ))}
                </div>
            ));
        };
    
        const yearOptions = [];
        for (let i = year - 5; i <= year + 5; i++) {
            yearOptions.push({
                key: i,
                label: i.toString(),
                onClick: () => {
                    const newValue = current.clone().year(i);
                    onChange(newValue);
                }
            });
        }
    
        return (
            <div style={{
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                background: '#f0f5ff',
                borderRadius: '8px 8px 0 0',
                marginBottom: '8px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            type="text"
                            icon={<LeftOutlined />}
                            onClick={() => {
                                const newValue = current.clone();
                                if (type === 'month') newValue.subtract(1, 'month');
                                else newValue.subtract(1, 'year');
                                onChange(newValue);
                            }}
                        />
    
                        <Dropdown menu={{ items: yearOptions }} trigger={['click']}>
                            <Button style={{ margin: '0 8px' }}>
                                {year} <DownOutlined />
                            </Button>
                        </Dropdown>
    
                        <Button
                            type="text"
                            icon={<RightOutlined />}
                            onClick={() => {
                                const newValue = current.clone();
                                if (type === 'month') newValue.add(1, 'month');
                                else newValue.add(1, 'year');
                                onChange(newValue);
                            }}
                        />
                    </div>
    
                    <Radio.Group
                        value={type}
                        onChange={(e) => onTypeChange(e.target.value)}
                        buttonStyle="solid"
                        size="small"
                    >
                    </Radio.Group>
                </div>
    
                {type === 'month' && (
                    <div style={{ padding: '0 8px' }}>
                        {renderMonthButtons()}
                    </div>
                )}
            </div>
        );
    };


    const StatCard = ({ title, value, icon, color, description }: StatCardProps) => (
        <Card
            style={{
                height: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                border: 'none',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
            }}
            bodyStyle={{
                padding: '24px',
                background: `linear-gradient(135deg, ${color}10, ${color}01)`,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{ position: 'absolute', right: '-15px', top: '-15px', opacity: 0.1, fontSize: '100px', color: color }}>
                {icon}
            </div>
            <Statistic
                title={<Text strong style={{ fontSize: '16px', color: '#595959' }}>{title}</Text>}
                value={value}
                valueStyle={{ color: color, fontWeight: 'bold', fontSize: '32px' }}
                prefix={
                    React.isValidElement(icon)
                        ? React.cloneElement(icon as React.ReactElement, { style: { fontSize: '24px', marginRight: '8px' } })
                        : icon
                }
            />
            <div style={{ marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: '13px' }}>{description}</Text>
            </div>
        </Card>
    );
    

    return (
        <div style={{
            padding: '24px',
            background: '#f5f7fa',
            minHeight: '100vh'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
            }}>
                <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                    <AppstoreOutlined style={{ marginRight: '8px' }} />
                    Dashboard E-Filing
                </Title>

                <Radio.Group
                    value={calendarView}
                    onChange={(e) => setCalendarView(e.target.value)}
                    buttonStyle="solid"
                    size="small"
                >

                </Radio.Group>

                <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={() => forceRefresh()}
                    style={{
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    Perbarui Data
                </Button>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            {loading ? (
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Skeleton active />
                    </Col>
                    <Col span={24}>
                        <Skeleton active />
                    </Col>
                </Row>
            ) : (
                <>
                    {/* Welcome Card with User Info */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col xs={24}>
                            <Card
                                style={{
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #e6f7ff, #f0f5ff)',
                                    border: 'none',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
                                }}
                                bodyStyle={{ padding: '24px' }}
                            >
                                <Row align="middle" gutter={16}>
                                    <Col xs={24} md={2}>
                                        <Avatar
                                            size={80}
                                            icon={<UserOutlined />}
                                            style={{
                                                backgroundColor: '#1890ff',
                                                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                                            }}
                                        />
                                    </Col>
                                    <Col xs={24} md={14}>
                                        <Title level={3} style={{ margin: 0, color: '#262626' }}>
                                            Selamat datang, {userData?.nama || 'Pengguna'}!
                                        </Title>
                                        <Space direction="vertical" size={4} style={{ marginTop: '8px' }}>
                                            <Text style={{ fontSize: '14px' }}>
                                                Nomor ID: <Text strong>{userData?.nomor_identitas}</Text>
                                            </Text>
                                            <Text style={{ fontSize: '14px' }}>
                                                Role: <Tag color="blue" style={{ borderRadius: '12px', padding: '0 8px' }}>{userData?.role}</Tag>
                                            </Text>
                                        </Space>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <UpcomingEventAnnouncement events={upcomingEvents} />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>

                    {/* Stats Cards */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col xs={24} sm={12} md={6}>
                            <StatCard
                                title="Surat Masuk"
                                value={stats.suratMasuk}
                                icon={<MailOutlined />}
                                color="#52c41a"
                                description="Total surat masuk tercatat"
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatCard
                                title="Surat Keluar"
                                value={stats.suratKeluar}
                                icon={<SendOutlined />}
                                color="#1890ff"
                                description="Total surat keluar tercatat"
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatCard
                                title="Faktur"
                                value={stats.faktur}
                                icon={<FileDoneOutlined />}
                                color="#f5222d"
                                description="Total faktur tercatat"
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatCard
                                title="Notulen"
                                value={stats.notulen}
                                icon={<FileTextOutlined />}
                                color="#722ed1"
                                description="Total notulen rapat tercatat"
                            />
                        </Col>
                    </Row>

                    {/* Expense Chart Section */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col xs={24}>
                            <Card
                                title={
                                    <Space>
                                        <FileDoneOutlined style={{ color: '#f5222d' }} />
                                        <Text strong>Grafik Pengeluaran</Text>
                                    </Space>
                                }
                                extra={
                                    <Space>
                                        <Radio.Group defaultValue="bulanan" buttonStyle="solid" size="small">
                                            <Radio.Button value="mingguan">Mingguan</Radio.Button>
                                            <Radio.Button value="bulanan">Bulanan</Radio.Button>
                                            <Radio.Button value="tahunan">Tahunan</Radio.Button>
                                        </Radio.Group>
                                        <Button type="text" icon={<ReloadOutlined />} />
                                    </Space>
                                }
                                style={{
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: 'none',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
                                }}
                                bodyStyle={{ padding: '24px' }}
                            >
                                <ExpenseChart />
                            </Card>
                        </Col>
                    </Row>

                    {/* Main Content Tabs */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={16}>
                            <Card
                                title={
                                    <Space>
                                        <FileTextOutlined style={{ color: '#1890ff' }} />
                                        <Text strong>Dokumen Terbaru</Text>
                                    </Space>
                                }
                                style={{
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: 'none',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
                                }}
                                bodyStyle={{ padding: 0 }}
                            >
                                {recentDocs.length > 0 ? (
                                    <Table
                                        dataSource={recentDocs}
                                        columns={columns}
                                        pagination={{ pageSize: 5 }}
                                        rowKey="id"
                                        style={{ borderRadius: '12px', overflow: 'hidden' }}
                                        size="middle"
                                    />
                                ) : (
                                    <Empty
                                        description="Belum ada dokumen terbaru"
                                        style={{ padding: '40px 0' }}
                                    />
                                )}
                            </Card>
                        </Col>
                        <Col xs={24} md={8}>
                            <Card
                                title={
                                    <Space>
                                        <CalendarOutlined style={{ color: '#1890ff' }} />
                                        <Text strong>Kalender Kegiatan</Text>
                                    </Space>
                                }
                                style={{
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: 'none',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                                    height: '100%'
                                }}
                                bodyStyle={{ padding: '0', height: 'calc(100% - 57px)' }}
                            >
                                <Calendar
                                    mode={calendarView}
                                    fullscreen={false}
                                    headerRender={headerRender}
                                    cellRender={(current, info) => {
                                        if (info.type === 'date') return dateCellRender(current);
                                        return null;
                                    }}
                                    style={{ height: '100%' }}
                                />
                            </Card>
                        </Col>
                    </Row>
                </>
            )}

            <Outlet />
        </div>
    );
};

export default Dashboard;