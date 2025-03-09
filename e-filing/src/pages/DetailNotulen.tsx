import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Layout,
    Card,
    Typography,
    Button,
    Space,
    Alert,
    Divider,
    Tag,
    Row,
    Col,
    Image,
    Timeline,
    Avatar,
    Modal,
    Steps,
    Statistic,
    Badge,
    Tabs,
    Progress
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
    parsedPeserta?: Array<{
        id?: string;
        name: string;
        type: string;
        role?: string;
        email?: string;
    }>;
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
    if (!status) return 'default';

    const statusLower = status.toLowerCase();
    if (statusLower.includes('selesai') || statusLower.includes('approved')) return 'success';
    if (statusLower.includes('proses') || statusLower.includes('progress')) return 'processing';
    if (statusLower.includes('pending') || statusLower.includes('menunggu')) return 'warning';
    if (statusLower.includes('batal') || statusLower.includes('cancel')) return 'error';
    return 'default';
};


const getStatusStep = (status: string): number => {
    if (!status) return 0;

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

    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [dataReady, setDataReady] = useState<boolean>(false);


    useEffect(() => {
        const fetchNotulenDetail = async () => {
            let loadingInterval: NodeJS.Timeout | undefined;

            try {
                // Reset loading state
                setLoadingProgress(0);
                setDataReady(false);

                // Mulai interval loading yang lebih lambat
                loadingInterval = setInterval(() => {
                    setLoadingProgress(prev => {
                        // Batasi progress maksimum ke 95% selama data masih diambil
                        if (prev >= 95) {
                            return 95;
                        }
                        return prev + 5; // Lebih lambat agar terlihat lebih natural
                    });
                }, 300);

                const response = await axios.get(`${BASE_URL}api/notulen/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const responseData = response.data.data;

                if (responseData.peserta) {
                    try {
                        responseData.parsedPeserta = JSON.parse(responseData.peserta);
                    } catch (parseErr) {
                        console.error('Error parsing peserta:', parseErr);
                        responseData.parsedPeserta = [];
                    }
                } else {
                    responseData.parsedPeserta = [];
                }

                // Setelah data selesai dimuat, selesaikan loading
                setData(responseData);
                setError(null);

                // Hentikan interval loading
                if (loadingInterval) clearInterval(loadingInterval);

                // Set loading ke 100% dan tunggu sebentar sebelum menampilkan halaman
                setLoadingProgress(100);

                // Tunggu 500ms setelah loading 100% sebelum menampilkan halaman
                setTimeout(() => {
                    setLoading(false);
                    setDataReady(true);
                }, 500);

            } catch (err: unknown) {
                console.error('Error fetching notulen details:', err);
                setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data');

                // Hentikan interval loading
                if (loadingInterval) clearInterval(loadingInterval);
                setLoadingProgress(100);

                setTimeout(() => {
                    setLoading(false);
                }, 500);
            }
        };

        if (id && token) {
            fetchNotulenDetail();
        }
    }, [id, token, BASE_URL]);

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


    if (loading || !dataReady) {
        return (
            <div className="loading-screen" style={{
                minHeight: '100vh',
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px'
            }}>
                <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                    <FileTextOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '24px' }} />

                    <Title level={3} style={{ marginBottom: '24px' }}>
                        Memuat Data Notulen
                    </Title>

                    <Progress
                        percent={Math.round(loadingProgress)}
                        status="active"
                        strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                        }}
                        style={{ marginBottom: '24px' }}
                    />

                    <Text type="secondary">
                        Mohon tunggu sebentar sementara kami memuat detail surat
                    </Text>
                </div>
            </div>
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
    const formattedDate = dayjs(data.tanggal_rapat).format('dddd, D MMMM YYYY');
    const participantsList = data.peserta ? data.peserta.split('\n').filter(p => p.trim()) : [];
    const agendaItems = data.agenda ? data.agenda.split('\n').filter(a => a.trim()) : [];
    const statusStep = data.status ? getStatusStep(data.status) : 0;
    const fileType = data?.dokumen_lampiran ? getFileType(data.dokumen_lampiran) : 'unknown';

    return (
        <Content className="site-layout-background" style={{ margin: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
                <Button
                    type="link"
                    onClick={handleBack}
                    style={{
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        color: '#1677ff'
                    }}
                >
                    <ArrowLeftOutlined style={{ marginRight: '8px' }} />
                    Kembali ke Daftar Notulen
                </Button>
            </div>


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
                            <Badge.Ribbon>
                                <Title level={2} style={{ color: 'white', margin: '0 0 8px 0' }}>{data.judul}</Title>
                            </Badge.Ribbon>
                            <Space size="large" style={{ marginTop: '16px' }}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}><CalendarOutlined /> {formattedDate}</Text>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}><EnvironmentOutlined /> {data.lokasi}</Text>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}><UserOutlined /> {data.pemimpin_rapat}</Text>
                            </Space>
                        </div>
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
                                    {data.parsedPeserta && data.parsedPeserta.map((participant, index) => (
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
                                                        {participant.name.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <div style={{ marginLeft: '12px' }}>
                                                        <Text strong>{participant.name}</Text>
                                                        <div>
                                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                                {participant.role || participant.type}
                                                            </Text>
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