import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Layout,
    Card,
    Typography,
    Button,
    Space,
    Spin,
    Alert,
    Divider,
    Tag,
    Row,
    Col,
    Image,
    Timeline,
    Avatar,
    Breadcrumb,
    Modal,
    Steps,
    Statistic,
    Badge,
    Menu,
    Dropdown,
    Tabs
} from 'antd';
import {
    FilePdfOutlined,
    FileTextOutlined,
    FileImageOutlined,
    CalendarOutlined,
    EnvironmentOutlined,
    TeamOutlined,
    UserOutlined,
    ClockCircleOutlined,
    EditOutlined,
    ArrowLeftOutlined,
    PrinterOutlined,
    ShareAltOutlined,
    FileProtectOutlined,
    DownloadOutlined,
    EllipsisOutlined,
    MoreOutlined,
    CheckCircleOutlined,
    ClockCircleFilled,
    FileOutlined,
    InfoCircleOutlined,
    CopyOutlined,
    CloseCircleOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
dayjs.locale('id');

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

interface NotulenDetail {
    id: string;
    judul: string;
    tanggal_rapat: string;
    lokasi: string;
    pemimpin_rapat: string;
    peserta: string;
    agenda: string;
    dokumen_lampiran: string;
    status: string;
    updated_by: string;
    created_by: string;
    user_id: string;
}

const getFileType = (url: string): 'pdf' | 'image' | 'document' | 'unknown' => {
    if (!url) return 'unknown';

    const extension = url.split('.').pop()?.toLowerCase() || '';

    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return 'document';

    return 'unknown';
};

const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('selesai') || statusLower.includes('approved')) return 'success';
    if (statusLower.includes('proses') || statusLower.includes('progress')) return 'processing';
    if (statusLower.includes('pending') || statusLower.includes('menunggu')) return 'warning';
    if (statusLower.includes('batal') || statusLower.includes('cancel')) return 'error';
    return 'default';
};

const getStatusStep = (status: string): number => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('selesai') || statusLower.includes('approved')) return 3;
    if (statusLower.includes('proses') || statusLower.includes('progress')) return 1;
    if (statusLower.includes('pending') || statusLower.includes('menunggu')) return 0;
    if (statusLower.includes('batal') || statusLower.includes('cancel')) return 2;
    return 0;
};

const DetailNotulen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<NotulenDetail | null>(null);
    const [previewVisible, setPreviewVisible] = useState<boolean>(false);
    const [activeTabKey, setActiveTabKey] = useState<string>("1");

    const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api-efiling.vercel.app/';

    useEffect(() => {
        const fetchNotulenDetail = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${BASE_URL}api/notulen/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setData(response.data.data);
                setError(null);
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || 'Failed to fetch notulen detail');
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred');
                }
            }
            finally {
                setLoading(false);
            }
        };

        if (id && token) {
            fetchNotulenDetail();
        }
    }, [id, token, BASE_URL]);

    const handleEdit = () => {
        if (data) {
            navigate(`/dashboard/notulen/edit/${data.id}`);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        confirm({
            title: 'Bagikan Notulen',
            icon: <ShareAltOutlined />,
            content: 'Kirim link notulen ini melalui email kepada peserta rapat?',
            onOk() {
                console.log('OK');
            }
        });
    };

    const handleDownload = () => {
        if (data?.dokumen_lampiran) {
            window.open(data.dokumen_lampiran, '_blank');
        }
    };

    const handleBack = () => {
        navigate('/dashboard/notulen');
    };

    const handleCopyId = () => {
        if (data) {
            navigator.clipboard.writeText(data.id);
            Modal.success({
                title: 'ID Disalin',
                content: 'ID Notulen berhasil disalin ke clipboard',
            });
        }
    };

    const actions = [
        { label: 'Edit', icon: <EditOutlined />, onClick: handleEdit },
        { label: 'Print', icon: <PrinterOutlined />, onClick: handlePrint },
        { label: 'Share', icon: <ShareAltOutlined />, onClick: handleShare },
        { label: 'Download', icon: <DownloadOutlined />, onClick: handleDownload },
    ];

    const actionMenu = (
        <Menu>
            {actions.map((action, index) => (
                <Menu.Item key={index} icon={action.icon} onClick={action.onClick}>
                    {action.label}
                </Menu.Item>
            ))}
        </Menu>
    );

    if (loading) {
        return (
            <Content style={{ margin: '24px', padding: '50px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                <div style={{ textAlign: 'center' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '16px' }}>
                        <Text type="secondary">Memuat detail notulen...</Text>
                    </div>
                </div>
            </Content>
        );
    }

    if (error) {
        return (
            <Content style={{ margin: '24px' }}>
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button size="small" type="primary" onClick={handleBack}>
                            Kembali
                        </Button>
                    }
                />
            </Content>
        );
    }

    if (!data) {
        return (
            <Content style={{ margin: '24px' }}>
                <Alert
                    message="Notulen Tidak Ditemukan"
                    description="Detail notulen yang Anda cari tidak ditemukan."
                    type="warning"
                    showIcon
                    action={
                        <Button size="small" type="primary" onClick={handleBack}>
                            Kembali
                        </Button>
                    }
                />
            </Content>
        );
    }

    const fileType = getFileType(data.dokumen_lampiran);
    const formattedDate = dayjs(data.tanggal_rapat).format('dddd, D MMMM YYYY');
    const participantsList = data.peserta.split('\n').filter(p => p.trim());
    const agendaItems = data.agenda.split('\n').filter(a => a.trim());
    const statusStep = getStatusStep(data.status);

    return (
        <Content className="site-layout-background" style={{ margin: '24px' }}>
            {/* Breadcrumb Navigation */}
            <Breadcrumb
                style={{ marginBottom: '16px' }}
                items={[
                    { title: 'Dashboard' },
                    { title: <a onClick={handleBack}>Notulen</a> },
                    { title: 'Detail Notulen' }
                ]}
            />

            {/* Page Header */}
            <Card
                className="notulen-header-card"
                bordered={false}
                style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    marginBottom: '24px',
                    background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
            >
                <Row align="middle" gutter={[16, 16]}>
                    <Col xs={24} md={16}>
                        <div style={{ color: 'white' }}>
                            <Badge.Ribbon text={data.status} color={getStatusColor(data.status)}>
                                <Title level={2} style={{ color: 'white', margin: '0 0 8px 0' }}>{data.judul}</Title>
                            </Badge.Ribbon>
                            <Space size="large" style={{ marginTop: '16px' }}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}><CalendarOutlined /> {formattedDate}</Text>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}><EnvironmentOutlined /> {data.lokasi}</Text>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}><UserOutlined /> {data.pemimpin_rapat}</Text>
                            </Space>
                        </div>
                    </Col>
                    <Col xs={24} md={8} style={{ textAlign: 'right' }}>
                        <Space wrap>
                            <Button type="primary" ghost icon={<ArrowLeftOutlined />} onClick={handleBack}>
                                Kembali
                            </Button>
                            <Button type="primary" ghost icon={<EditOutlined />} onClick={handleEdit}>
                                Edit
                            </Button>
                            <Dropdown overlay={actionMenu} placement="bottomRight">
                                <Button type="primary" ghost icon={<EllipsisOutlined />} />
                            </Dropdown>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Step Progress */}
            <Card
                style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                bordered={false}
            >
                <Steps
                    current={statusStep}
                    labelPlacement="vertical"
                    items={[
                        {
                            title: 'Menunggu',
                            description: 'Notulen diajukan',
                            status: statusStep === 0 ? 'process' : statusStep > 0 ? 'finish' : 'wait',
                            icon: statusStep === 0 ? <ClockCircleFilled /> : <CheckCircleOutlined />
                        },
                        {
                            title: 'Dalam Proses',
                            description: 'Dalam review',
                            status: statusStep === 1 ? 'process' : statusStep > 1 ? 'finish' : 'wait',
                            icon: statusStep === 1 ? <ClockCircleFilled /> : statusStep > 1 ? <CheckCircleOutlined /> : <ClockCircleOutlined />
                        },
                        {
                            title: 'Dibatalkan',
                            description: 'Notulen dibatalkan',
                            status: statusStep === 2 ? 'error' : 'wait',
                            icon: statusStep === 2 ? <CloseCircleOutlined /> : <ClockCircleOutlined />
                        },
                        {
                            title: 'Selesai',
                            description: 'Notulen disetujui',
                            status: statusStep === 3 ? 'finish' : 'wait',
                            icon: statusStep === 3 ? <CheckCircleOutlined /> : <ClockCircleOutlined />
                        },
                    ]}
                />
            </Card>

            {/* Main Content Tabs */}
            <Tabs
                defaultActiveKey="1"
                activeKey={activeTabKey}
                onChange={setActiveTabKey}
                style={{
                    marginBottom: '24px',
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
                }}
                tabBarExtraContent={
                    <div>
                        <Space>
                            <Button icon={<PrinterOutlined />} onClick={handlePrint}>Cetak</Button>
                            <Button icon={<ShareAltOutlined />} onClick={handleShare}>Bagikan</Button>
                        </Space>
                    </div>
                }
                items={[
                    {
                        key: "1",
                        label: (
                            <span>
                                <InfoCircleOutlined />
                                Informasi Rapat
                            </span>
                        ),
                        children: (
                            <div className="tab-content">
                                <Row gutter={[24, 24]}>
                                    {/* Main Information Card */}
                                    <Col xs={24} lg={16}>
                                        <Card
                                            title={<span><TeamOutlined /> Detail Rapat</span>}
                                            bordered={false}
                                            style={{ borderRadius: '8px', height: '100%' }}
                                            className="info-card"
                                        >
                                            <Row gutter={[16, 16]}>
                                                <Col xs={24} md={12}>
                                                    <Statistic
                                                        title="Pemimpin Rapat"
                                                        value={data.pemimpin_rapat}
                                                        prefix={<Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />}
                                                        style={{ marginBottom: '16px' }}
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <Statistic
                                                        title="Tanggal Rapat"
                                                        value={formattedDate}
                                                        prefix={<CalendarOutlined style={{ color: '#1677ff' }} />}
                                                        style={{ marginBottom: '16px' }}
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <Statistic
                                                        title="Lokasi"
                                                        value={data.lokasi}
                                                        prefix={<EnvironmentOutlined style={{ color: '#1677ff' }} />}
                                                        style={{ marginBottom: '16px' }}
                                                    />
                                                </Col>
                                                <Col xs={24} md={12}>
                                                    <Statistic
                                                        title="Status"
                                                        value={data.status}
                                                        valueStyle={{ color: getStatusColor(data.status) === 'success' ? '#52c41a' : getStatusColor(data.status) === 'error' ? '#ff4d4f' : '#1677ff' }}
                                                        prefix={getStatusColor(data.status) === 'success' ? <CheckCircleOutlined /> : <ClockCircleFilled />}
                                                        style={{ marginBottom: '16px' }}
                                                    />
                                                </Col>
                                            </Row>

                                            <Divider style={{ margin: '8px 0 16px' }} />

                                            <Row gutter={[16, 16]}>
                                                <Col xs={24} sm={12}>
                                                    <div>
                                                        <Text type="secondary">Dibuat oleh</Text>
                                                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                                                            <Avatar style={{ backgroundColor: '#87d068', marginRight: '8px' }} icon={<UserOutlined />} />
                                                            <Text strong>{data.created_by}</Text>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col xs={24} sm={12}>
                                                    <div>
                                                        <Text type="secondary">Diperbarui oleh</Text>
                                                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                                                            <Avatar style={{ backgroundColor: '#faad14', marginRight: '8px' }} icon={<UserOutlined />} />
                                                            <Text strong>{data.updated_by}</Text>
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Card>
                                    </Col>

                                    {/* Document and ID Card */}
                                    <Col xs={24} lg={8}>
                                        <Card
                                            title={<span><FileOutlined /> Dokumen & ID</span>}
                                            bordered={false}
                                            style={{ borderRadius: '8px', height: '100%' }}
                                            className="document-card"
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    background: '#f5f5f5',
                                                    marginBottom: '16px'
                                                }}
                                            >
                                                {fileType === 'image' ? (
                                                    <>
                                                        <FileImageOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '8px' }} />
                                                        <Text strong>File Gambar</Text>
                                                        <Button
                                                            type="primary"
                                                            icon={<EyeOutlined />}
                                                            onClick={() => setPreviewVisible(true)}
                                                            style={{ marginTop: '8px' }}
                                                        >
                                                            Lihat Gambar
                                                        </Button>
                                                    </>
                                                ) : fileType === 'pdf' ? (
                                                    <>
                                                        <FilePdfOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '8px' }} />
                                                        <Text strong>File PDF</Text>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileTextOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: '8px' }} />
                                                        <Text strong>File Dokumen</Text>
                                                    </>
                                                )}
                                            </div>

                                            <Button
                                                type="primary"
                                                icon={<DownloadOutlined />}
                                                onClick={handleDownload}
                                                block
                                                style={{ marginBottom: '16px' }}
                                            >
                                                Unduh Dokumen
                                            </Button>

                                            <Divider style={{ margin: '8px 0 16px' }} />

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div>
                                                    <Text type="secondary">ID Dokumen</Text>
                                                    <div style={{ marginTop: '4px' }}>
                                                        <Text copyable code>{data.id}</Text>
                                                    </div>
                                                </div>
                                                <Button icon={<CopyOutlined />} onClick={handleCopyId}>
                                                    Salin ID
                                                </Button>
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>
                            </div>
                        ),
                    },
                    {
                        key: "2",
                        label: (
                            <span>
                                <FileTextOutlined />
                                Agenda
                            </span>
                        ),
                        children: (
                            <Card
                                bordered={false}
                                style={{ borderRadius: '8px' }}
                                className="agenda-card"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                    <FileTextOutlined style={{ fontSize: '24px', color: '#1677ff', marginRight: '8px' }} />
                                    <Title level={4} style={{ margin: 0 }}>Agenda Rapat</Title>
                                </div>

                                <Timeline
                                    mode="left"
                                    items={agendaItems.map((item, index) => ({
                                        color: index % 2 === 0 ? 'blue' : 'green',
                                        label: <Text strong>{`Agenda ${index + 1}`}</Text>,
                                        children: (
                                            <Card
                                                size="small"
                                                style={{
                                                    marginBottom: '8px',
                                                    borderLeft: index % 2 === 0 ? '3px solid #1677ff' : '3px solid #52c41a',
                                                    borderRadius: '4px'
                                                }}
                                            >
                                                <Paragraph>{item}</Paragraph>
                                            </Card>
                                        )
                                    }))}
                                />
                            </Card>
                        ),
                    },
                    {
                        key: "3",
                        label: (
                            <span>
                                <TeamOutlined />
                                Peserta
                            </span>
                        ),
                        children: (
                            <Card bordered={false} style={{ borderRadius: '8px' }} className="participants-card">
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                    <TeamOutlined style={{ fontSize: '24px', color: '#1677ff', marginRight: '8px' }} />
                                    <Title level={4} style={{ margin: 0 }}>Peserta Rapat</Title>
                                </div>

                                <Row gutter={[16, 16]}>
                                    {participantsList.map((participant, index) => (
                                        <Col xs={24} sm={12} md={8} lg={6} key={index}>
                                            <Card
                                                hoverable
                                                size="small"
                                                style={{
                                                    borderRadius: '8px',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                                                    transition: 'all 0.3s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <Avatar
                                                        size={40}
                                                        style={{
                                                            backgroundColor: [
                                                                '#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1',
                                                                '#eb2f96', '#fa8c16', '#13c2c2', '#1677ff', '#fadb14'
                                                            ][index % 10]
                                                        }}
                                                    >
                                                        {participant.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <div style={{ marginLeft: '12px' }}>
                                                        <Text strong>{participant}</Text>
                                                        <div>
                                                            <Text type="secondary" style={{ fontSize: '12px' }}>Peserta</Text>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            </Card>
                        ),
                    },
                    {
                        key: "4",
                        label: (
                            <span>
                                <ClockCircleOutlined />
                                Timeline
                            </span>
                        ),
                        children: (
                            <Card bordered={false} style={{ borderRadius: '8px' }} className="timeline-card">
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                                    <ClockCircleOutlined style={{ fontSize: '24px', color: '#1677ff', marginRight: '8px' }} />
                                    <Title level={4} style={{ margin: 0 }}>Timeline Notulen</Title>
                                </div>

                                <Steps
                                    progressDot
                                    current={4}
                                    direction="vertical"
                                    items={[
                                        {
                                            title: 'Rapat Dijadwalkan',
                                            description: (
                                                <>
                                                    <p>Tanggal: {formattedDate}</p>
                                                    <p>Lokasi: {data.lokasi}</p>
                                                    <p>Pemimpin: {data.pemimpin_rapat}</p>
                                                </>
                                            ),
                                            icon: <CalendarOutlined />
                                        },
                                        {
                                            title: 'Persiapan Notulen',
                                            description: (
                                                <>
                                                    <p>Agenda dibuat</p>
                                                    <p>Peserta diundang: {participantsList.length} orang</p>
                                                </>
                                            ),
                                            icon: <FileTextOutlined />
                                        },
                                        {
                                            title: 'Notulen Dibuat',
                                            description: (
                                                <>
                                                    <p>Dibuat oleh: {data.created_by}</p>
                                                    <p>Dokumen dilampirkan</p>
                                                </>
                                            ),
                                            icon: <FileProtectOutlined />
                                        },
                                        {
                                            title: 'Terakhir Diperbarui',
                                            description: (
                                                <>
                                                    <p>Diperbarui oleh: {data.updated_by}</p>
                                                </>
                                            ),
                                            icon: <EditOutlined />
                                        },
                                        {
                                            title: 'Status Saat Ini',
                                            description: (
                                                <>
                                                    <Tag color={getStatusColor(data.status)} style={{ padding: '4px 8px' }}>
                                                        {data.status}
                                                    </Tag>
                                                </>
                                            ),
                                            icon: getStatusColor(data.status) === 'success' ? <CheckCircleOutlined /> : <ClockCircleFilled />
                                        }
                                    ]}
                                />
                            </Card>
                        ),
                    }
                ]}
            />

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                        Kembali
                    </Button>
                    <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                        Edit Notulen
                    </Button>
                    <Dropdown overlay={actionMenu}>
                        <Button icon={<MoreOutlined />}>
                            Tindakan Lain
                        </Button>
                    </Dropdown>
                </Space>
            </div>

            {/* Image Preview Modal */}
            {fileType === 'image' && (
                <Image
                    style={{ display: 'none' }}
                    src={data.dokumen_lampiran}
                    preview={{
                        visible: previewVisible,
                        onVisibleChange: (visible) => setPreviewVisible(visible),
                        src: data.dokumen_lampiran
                    }}
                />
            )}
        </Content>
    );
};

export default DetailNotulen;