// For pages/DashboardPage.tsx
import React from 'react';
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
import type { Dayjs } from 'dayjs';
import useDashboardData from '../hooks/useDashboardData';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
    const {
        loading,
        userData,
        stats,
        recentDocs,
        getCalendarEventsForDate,
        forceRefresh
    } = useDashboardData();

    // Calendar cell renderer using the hook data
    const dateCellRender = (value: Dayjs) => {
        const dateStr = value.format('YYYY-MM-DD');
        const listData = getCalendarEventsForDate(dateStr);
        
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
            <Space style={{ marginBottom: '16px' }}>
                <Tag color="blue" onClick={() => forceRefresh()} style={{ cursor: 'pointer' }}>
                    <ClockCircleOutlined /> Perbarui Data
                </Tag>
            </Space>
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