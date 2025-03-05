import React, { useState } from 'react';
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
    Menu,
    Radio
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
import useDashboardData from '../hooks/useDashboardData';
import ExpenseChart from '../components/ExpenseChart'; // Import the new component

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

    const [calendarView, setCalendarView] = useState<'month' | 'year'>('month');

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

    const headerRender = ({ value, type, onChange, onTypeChange }: any) => {
        const current = value.clone();
        const localeData = value.localeData();
        const year = current.year();
        const month = current.month();

        const monthOptions = [];
        for (let i = 0; i < 12; i++) {
            monthOptions.push(
                <Button
                    key={i}
                    type={month === i ? 'primary' : 'text'}
                    onClick={() => {
                        const newValue = current.clone();
                        newValue.month(i);
                        onChange(newValue);
                    }}
                    size="small"
                    style={{
                        margin: '0 2px',
                        borderRadius: '20px',
                        fontWeight: month === i ? 'bold' : 'normal'
                    }}
                >
                    {localeData.months(current.month(i))}
                </Button>
            );
        }

        const yearOptions = [];
        for (let i = year - 10; i < year + 10; i++) {
            yearOptions.push(
                <Menu.Item key={i} onClick={() => {
                    const newValue = current.clone();
                    newValue.year(i);
                    onChange(newValue);
                }}>
                    {i}
                </Menu.Item>
            );
        }

        return (
            <div style={{
                padding: '8px 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                background: '#f0f5ff',
                borderRadius: '8px 8px 0 0',
                marginBottom: '8px',
                paddingBlock: '8px 16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        type="text"
                        icon={<LeftOutlined />}
                        onClick={() => {
                            const newValue = current.clone();
                            if (calendarView === 'month') {
                                newValue.month(newValue.month() - 1);
                            } else {
                                newValue.year(newValue.year() - 1);
                            }
                            onChange(newValue);
                        }}
                        style={{ marginRight: '8px' }}
                    />

                    <Dropdown
                        overlay={<Menu>{yearOptions}</Menu>}
                        trigger={['click']}
                    >
                        <Button style={{ marginRight: '8px' }}>
                            {year} <DownOutlined />
                        </Button>
                    </Dropdown>

                    {calendarView === 'month' && (
                        <Space wrap>
                            {monthOptions}
                        </Space>
                    )}

                    <Button
                        type="text"
                        icon={<RightOutlined />}
                        onClick={() => {
                            const newValue = current.clone();
                            if (calendarView === 'month') {
                                newValue.month(newValue.month() + 1);
                            } else {
                                newValue.year(newValue.year() + 1);
                            }
                            onChange(newValue);
                        }}
                        style={{ marginLeft: '8px' }}
                    />
                </div>

                <Space>
                    <Button
                        type={calendarView === 'month' ? 'primary' : 'default'}
                        onClick={() => setCalendarView('month')}
                        size="small"
                        style={{ borderRadius: '4px 0 0 4px' }}
                    >
                        Bulan
                    </Button>
                    <Button
                        type={calendarView === 'year' ? 'primary' : 'default'}
                        onClick={() => setCalendarView('year')}
                        size="small"
                        style={{ borderRadius: '0 4px 4px 0' }}
                    >
                        Tahun
                    </Button>
                </Space>
            </div>
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

    const StatCard = ({ title, value, icon, color, description }: any) => (
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
                prefix={React.cloneElement(icon, { style: { fontSize: '24px', marginRight: '8px' } })}
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
                                        <Alert
                                            message={
                                                <Text strong style={{ fontSize: '16px' }}>
                                                    <BellOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                                    Pengumuman Terbaru
                                                </Text>
                                            }
                                            description={
                                                <Text style={{ fontSize: '14px' }}>
                                                    Rapat koordinasi akan diadakan pada tanggal
                                                    <Text strong style={{ color: '#1890ff' }}> 15 Maret 2025 </Text>
                                                    pukul
                                                    <Text strong style={{ color: '#1890ff' }}> 09.00 WIB</Text>.
                                                </Text>
                                            }
                                            type="info"
                                            showIcon={false}
                                            style={{
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: 'rgba(24, 144, 255, 0.1)',
                                                padding: '12px 16px'
                                            }}
                                        />
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
                                    dateCellRender={dateCellRender}
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