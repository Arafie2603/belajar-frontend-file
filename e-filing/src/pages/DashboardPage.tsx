import React, { useState, useEffect } from 'react';
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
    Empty
} from 'antd';
import {
    MailOutlined,
    SendOutlined,
    FileTextOutlined,
    UserOutlined,
    FileDoneOutlined,
    ArrowUpOutlined,
    ClockCircleOutlined,
    BellOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
const { Title, Text } = Typography;

// Define proper interfaces for our data
interface UserData {
    id: string;
    nama: string;
    nomor_identitas: string;
    role: string;
    password?: string;
}

interface MetaData {
    currentPage: number;
    totalItems: number;
    totalPages: number;
    itemsPerPage: number;
}

interface ApiResponse<T> {
    data: {
        paginatedData: T[];
        meta: MetaData;
    };
    status: number;
    message: string;
}

interface ProfileResponse {
    data: UserData;
    status: number;
    message: string;
}

interface SuratMasuk {
    no_surat_masuk: string;
    tanggal: string;
    perihal: string;
    pengirim: string;
    penerima: string;
    sifat_surat: string;
}

interface SuratKeluar {
    id: string;
    tanggal: string;
    surat_nomor: string;
    pengirim: string;
    penerima: string;
    sifat_surat: string;
}

interface Faktur {
    id: string;
    bukti_pembayaran: string;
    deskripsi: string;
    tanggal?: string; // Added tanggal field
    nomor_faktur?: string; // Added nomor_faktur field
}

interface Notulen {
    id: string;
    judul: string;
    tanggal_rapat: string;
    lokasi: string;
    pemimpin_rapat: string;
    peserta?: string;
    agenda?: string;
}

interface DocumentItem {
    id: string;
    type: string;
    title: string;
    date: Date;
    sender: string;
    status: string;
}

interface CalendarEvent {
    type: "warning" | "success" | "error" | "processing";
    content: string;
}

const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [stats, setStats] = useState({
        suratMasuk: 0,
        suratKeluar: 0,
        faktur: 0,
        notulen: 0,
        users: 0
    });
    const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<Map<string, CalendarEvent[]>>(new Map());

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch user profile
                const profileRes = await axios.get<ProfileResponse>('https://api-efiling.vercel.app/api/users/profile');
                setUserData(profileRes.data.data);

                // Fetch statistics
                const [suratMasukRes, suratKeluarRes, fakturRes, notulenRes, usersRes] = await Promise.all([
                    axios.get<ApiResponse<SuratMasuk>>('https://api-efiling.vercel.app/api/surat-masuk'),
                    axios.get<ApiResponse<SuratKeluar>>('https://api-efiling.vercel.app/api/surat-keluar'),
                    axios.get<ApiResponse<Faktur>>('https://api-efiling.vercel.app/api/faktur'),
                    axios.get<ApiResponse<Notulen>>('https://api-efiling.vercel.app/api/notulen'),
                    axios.get<ApiResponse<UserData>>('https://api-efiling.vercel.app/api/users')
                ]);

                // Set stats - correctly extract data from the API responses
                setStats({
                    suratMasuk: suratMasukRes.data.data.meta.totalItems,
                    suratKeluar: suratKeluarRes.data.data.meta.totalItems,
                    faktur: fakturRes.data.data.meta.totalItems,
                    notulen: notulenRes.data.data.meta.totalItems,
                    users: usersRes.data.data.meta.totalItems
                });

                // Extract notulen data for calendar events
                const eventsMap = new Map<string, CalendarEvent[]>();
                notulenRes.data.data.paginatedData.forEach(rapat => {
                    const date = dayjs(rapat.tanggal_rapat).format('YYYY-MM-DD');
                    const event: CalendarEvent = {
                        type: "warning",
                        content: rapat.judul
                    };
                    
                    if (eventsMap.has(date)) {
                        eventsMap.get(date)?.push(event);
                    } else {
                        eventsMap.set(date, [event]);
                    }
                });
                setCalendarEvents(eventsMap);

                // Combine recent documents from different sources
                const combinedDocs: DocumentItem[] = [
                    ...suratMasukRes.data.data.paginatedData.map(doc => ({
                        id: doc.no_surat_masuk,
                        type: 'Surat Masuk',
                        title: doc.perihal,
                        date: new Date(doc.tanggal),
                        sender: doc.pengirim,
                        status: 'Masuk'
                    })),
                    ...suratKeluarRes.data.data.paginatedData.map(doc => ({
                        id: doc.id,
                        type: 'Surat Keluar',
                        title: 'Surat Keluar - ' + doc.surat_nomor,
                        date: new Date(doc.tanggal),
                        sender: doc.pengirim,
                        status: 'Keluar'
                    })),
                    ...fakturRes.data.data.paginatedData.map(doc => ({
                        id: doc.id,
                        type: 'Faktur',
                        title: 'Faktur - ' + (doc.nomor_faktur || doc.id),
                        date: new Date(doc.tanggal || Date.now()),
                        sender: '-',
                        status: 'Tagihan'
                    })),
                    ...notulenRes.data.data.paginatedData.map(doc => ({
                        id: doc.id,
                        type: 'Notulen',
                        title: doc.judul,
                        date: new Date(doc.tanggal_rapat),
                        sender: doc.pemimpin_rapat,
                        status: 'Rapat'
                    }))
                ];

                // Sort by date
                combinedDocs.sort((a, b) => b.date.getTime() - a.date.getTime());
                setRecentDocs(combinedDocs);

                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Dynamic calendar events based on fetched data
    const getListData = (value: Dayjs): CalendarEvent[] => {
        const dateStr = value.format('YYYY-MM-DD');
        return calendarEvents.get(dateStr) || [];
    };

    const dateCellRender = (value: Dayjs) => {
        const listData = getListData(value);
        return (
            <ul className="events" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {listData.map((item, index) => (
                    <li key={index}>
                        <Badge status={item.type} text={item.content} />
                    </li>
                ))}
            </ul>
        );
    };

    const columns = [
        {
            title: 'Tipe',
            dataIndex: 'type',
            key: 'type',
            render: (text: string) => {
                let color = 'blue';
                let icon = <SendOutlined />;
                
                switch(text) {
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
                    <Tag color={color} icon={icon}>
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
            render: (date: Date) => date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        },
        {
            title: 'Pengirim/Penerima',
            dataIndex: 'sender',
            key: 'sender',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (text: string) => {
                let color = 'blue';
                
                switch(text) {
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
                
                return <Tag color={color}>{text}</Tag>;
            },
        },
    ];

    const cardStyle = {
        height: '100%',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
    };

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>Dashboard E-Filing</Title>
            <Divider />

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
                            <Card style={cardStyle}>
                                <Row align="middle" gutter={16}>
                                    <Col xs={24} md={2}>
                                        <Avatar
                                            size={64}
                                            icon={<UserOutlined />}
                                            style={{ backgroundColor: '#1677ff' }}
                                        />
                                    </Col>
                                    <Col xs={24} md={14}>
                                        <Title level={4} style={{ margin: 0 }}>Selamat datang, {userData?.nama || 'Pengguna'}!</Title>
                                        <Space direction="vertical" size={0}>
                                            <Text>Nomor ID: {userData?.nomor_identitas}</Text>
                                            <Text>Role: <Tag color="blue">{userData?.role}</Tag></Text>
                                        </Space>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <Alert
                                            message="Pengumuman Terbaru"
                                            description="Rapat koordinasi akan diadakan pada tanggal 15 Maret 2025 pukul 09.00 WIB."
                                            type="info"
                                            showIcon
                                            icon={<BellOutlined />}
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>

                    {/* Stats Cards */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Card style={cardStyle}>
                                <Statistic
                                    title="Surat Masuk"
                                    value={stats.suratMasuk}
                                    valueStyle={{ color: '#3f8600' }}
                                    prefix={<MailOutlined />}
                                    suffix={<ArrowUpOutlined style={{ fontSize: '0.5em', verticalAlign: 'text-top' }} />}
                                />
                                <Text type="secondary">Total surat masuk tercatat</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Card style={cardStyle}>
                                <Statistic
                                    title="Surat Keluar"
                                    value={stats.suratKeluar}
                                    valueStyle={{ color: '#0958d9' }}
                                    prefix={<SendOutlined />}
                                />
                                <Text type="secondary">Total surat keluar tercatat</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Card style={cardStyle}>
                                <Statistic
                                    title="Faktur"
                                    value={stats.faktur}
                                    valueStyle={{ color: '#cf1322' }}
                                    prefix={<FileDoneOutlined />}
                                />
                                <Text type="secondary">Total faktur terdaftar</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Card style={cardStyle}>
                                <Statistic
                                    title="Notulen"
                                    value={stats.notulen}
                                    valueStyle={{ color: '#722ed1' }}
                                    prefix={<FileTextOutlined />}
                                />
                                <Text type="secondary">Total notulen rapat</Text>
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        {/* Recent Documents */}
                        <Col xs={24} lg={16}>
                            <Card
                                title={
                                    <Space>
                                        <ClockCircleOutlined />
                                        <span>Dokumen Terbaru</span>
                                    </Space>
                                }
                                style={cardStyle}
                            >
                                {recentDocs.length > 0 ? (
                                    <Table
                                        dataSource={recentDocs}
                                        columns={columns}
                                        rowKey="id"
                                        pagination={{ pageSize: 5 }}
                                        size="middle"
                                    />
                                ) : (
                                    <Empty description="Tidak ada dokumen terbaru" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                )}
                            </Card>
                        </Col>

                        {/* Calendar */}
                        <Col xs={24} lg={8}>
                            <Card
                                title={
                                    <Space>
                                        <ClockCircleOutlined />
                                        <span>Kalender Kegiatan</span>
                                    </Space>
                                }
                                style={{ ...cardStyle, overflow: 'hidden' }}
                            >
                                <Calendar
                                    fullscreen={false}
                                    dateCellRender={dateCellRender}
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