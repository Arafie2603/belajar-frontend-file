import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Layout,
    Card,
    Typography,
    Descriptions,
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
    Tooltip,
    Modal
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

const DetailNotulen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<NotulenDetail | null>(null);
    const [previewVisible, setPreviewVisible] = useState<boolean>(false);

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

    if (loading) {
        return (
            <Content style={{ margin: '16px', padding: '24px', background: '#fff', borderRadius: '8px', textAlign: 'center' }}>
                <Spin size="large" tip="Memuat detail notulen..." />
            </Content>
        );
    }

    if (error) {
        return (
            <Content style={{ margin: '16px' }}>
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
            <Content style={{ margin: '16px' }}>
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

    return (
        <Content className="site-layout-background" style={{ margin: '16px' }}>
            <Card className="shadow-md" style={{ overflow: 'hidden' }}>
                <div style={{ marginBottom: '24px' }}>
                    <Breadcrumb items={[
                        { title: 'Dashboard' },
                        { title: <a onClick={handleBack}>Notulen</a> },
                        { title: 'Detail Notulen' }
                    ]} />
                </div>

                {/* Header */}
                <Row gutter={24} style={{ marginBottom: '24px' }}>
                    <Col xs={24} md={18}>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <div style={{
                                background: '#1890ff',
                                borderRadius: '8px',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '16px'
                            }}>
                                <FileProtectOutlined style={{ fontSize: '24px', color: 'white' }} />
                            </div>
                            <div>
                                <Title level={2} style={{ margin: '0 0 4px 0' }}>{data.judul}</Title>
                                <Space size="large">
                                    <Text type="secondary"><CalendarOutlined /> {formattedDate}</Text>
                                    <Text type="secondary"><EnvironmentOutlined /> {data.lokasi}</Text>
                                    <Tag color={getStatusColor(data.status)}>{data.status}</Tag>
                                </Space>
                            </div>
                        </div>
                    </Col>
                    <Col xs={24} md={6} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                        <Space>
                            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>Kembali</Button>
                            <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>Edit</Button>
                            <Tooltip title="Cetak">
                                <Button icon={<PrinterOutlined />} onClick={handlePrint} />
                            </Tooltip>
                            <Tooltip title="Bagikan">
                                <Button icon={<ShareAltOutlined />} onClick={handleShare} />
                            </Tooltip>
                        </Space>
                    </Col>
                </Row>

                <Row gutter={24}>
                    {/* Main content */}
                    <Col xs={24} lg={16}>
                        <Card
                            title={<><TeamOutlined /> Informasi Rapat</>}
                            bordered={false}
                            className="inner-card"
                            style={{ marginBottom: '24px' }}
                        >
                            <Descriptions layout="vertical" column={{ xs: 1, sm: 2, md: 3 }} bordered>
                                <Descriptions.Item label="Pemimpin Rapat" span={3}>
                                    <Space>
                                        <Avatar icon={<UserOutlined />} />
                                        {data.pemimpin_rapat}
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="Tanggal">
                                    {formattedDate}
                                </Descriptions.Item>
                                <Descriptions.Item label="Lokasi">
                                    {data.lokasi}
                                </Descriptions.Item>
                                <Descriptions.Item label="Status">
                                    <Tag color={getStatusColor(data.status)}>{data.status}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Dibuat Oleh">
                                    {data.created_by}
                                </Descriptions.Item>
                                <Descriptions.Item label="Diperbarui Oleh">
                                    {data.updated_by}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card
                            title={<><FileTextOutlined /> Agenda Rapat</>}
                            bordered={false}
                            className="inner-card"
                            style={{ marginBottom: '24px' }}
                        >
                            <Timeline
                                items={agendaItems.map((item) => ({
                                    color: 'blue',
                                    children: (
                                        <div style={{ marginBottom: '8px' }}>
                                            <Paragraph>{item}</Paragraph>
                                        </div>
                                    )
                                }))}
                            />
                        </Card>

                        <Card
                            title={<><TeamOutlined /> Peserta Rapat</>}
                            bordered={false}
                            className="inner-card"
                        >
                            <Row gutter={[16, 16]}>
                                {participantsList.map((participant, index) => (
                                    <Col xs={24} sm={12} key={index}>
                                        <Card size="small" style={{ background: '#f5f5f5' }}>
                                            <Space>
                                                <Avatar
                                                    style={{ backgroundColor: '#1890ff' }}
                                                    icon={<UserOutlined />}
                                                />
                                                {participant.trim()}
                                            </Space>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    </Col>

                    {/* Right sidebar */}
                    <Col xs={24} lg={8}>
                        <Card
                            title={<><DownloadOutlined /> Dokumen Lampiran</>}
                            bordered={false}
                            className="inner-card"
                            style={{ marginBottom: '24px' }}
                        >
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '16px',
                                border: '1px solid #f0f0f0',
                                borderRadius: '8px',
                                background: '#f9f9f9',
                                marginBottom: '16px'
                            }}>
                                {fileType === 'image' ? (
                                    <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
                                        <Image
                                            src={data.dokumen_lampiran}
                                            alt="Dokumen Lampiran"
                                            style={{ maxHeight: '200px', objectFit: 'contain' }}
                                            preview={{
                                                visible: previewVisible,
                                                onVisibleChange: (visible) => setPreviewVisible(visible),
                                                src: data.dokumen_lampiran
                                            }}
                                        />
                                        <div style={{ marginTop: '8px' }}>
                                            <Button
                                                type="primary"
                                                icon={<FileImageOutlined />}
                                                onClick={() => setPreviewVisible(true)}
                                            >
                                                Pratinjau Gambar
                                            </Button>
                                        </div>
                                    </div>
                                ) : fileType === 'pdf' ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <FilePdfOutlined style={{ fontSize: '64px', color: '#ff4d4f' }} />
                                        <div style={{ marginTop: '8px' }}>
                                            <Text>Dokumen PDF</Text>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <FileTextOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
                                        <div style={{ marginTop: '8px' }}>
                                            <Text>Dokumen Office</Text>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={handleDownload}
                                block
                            >
                                Unduh Dokumen
                            </Button>
                        </Card>

                        <Card
                            title={<><ClockCircleOutlined /> Linimasa</>}
                            bordered={false}
                            className="inner-card"
                        >
                            <Timeline
                                items={[
                                    {
                                        color: 'green',
                                        children: (
                                            <>
                                                <p><Text strong>Rapat Terjadwal</Text></p>
                                                <p>{formattedDate}</p>
                                                <p>Lokasi: {data.lokasi}</p>
                                            </>
                                        )
                                    },
                                    {
                                        color: 'blue',
                                        children: (
                                            <>
                                                <p><Text strong>Notulen Dibuat</Text></p>
                                                <p>Oleh: {data.created_by}</p>
                                            </>
                                        )
                                    },
                                    {
                                        color: 'blue',
                                        children: (
                                            <>
                                                <p><Text strong>Terakhir Diperbarui</Text></p>
                                                <p>Oleh: {data.updated_by}</p>
                                            </>
                                        )
                                    },
                                    {
                                        color: getStatusColor(data.status) === 'success' ? 'green' : 'blue',
                                        children: (
                                            <>
                                                <p><Text strong>Status Saat Ini</Text></p>
                                                <p><Tag color={getStatusColor(data.status)}>{data.status}</Tag></p>
                                            </>
                                        )
                                    }
                                ]}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Footer */}
                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">ID Dokumen: {data.id}</Text>
                    <Space>
                        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>Kembali ke Daftar</Button>
                        <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>Edit Notulen</Button>
                    </Space>
                </div>
            </Card>
        </Content>
    );
};

export default DetailNotulen;