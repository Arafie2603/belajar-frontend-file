import { useState, useEffect, useRef } from "react";
import { Document, Page } from 'react-pdf';
import "../pdfworker";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useNavigate, useParams } from "react-router-dom";
import {
    Card,
    Typography,
    Modal,
    Image,
    Spin,
    Button,
    Badge,
    Progress,
    Tooltip,
    Tag,
    Timeline,
    Result
} from "antd";
import {
    FileTextOutlined,
    CalendarOutlined,
    UserOutlined,
    AimOutlined,
    MailOutlined,
    EyeOutlined,
    DownloadOutlined,
    NumberOutlined,
    ArrowLeftOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    PrinterOutlined,
    ShareAltOutlined,
    LeftOutlined,
    RightOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    FullscreenOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface SuratMasuk {
    no_surat_masuk: string;
    tanggal: string;
    perihal: string;
    tujuan: string;
    pengirim: string;
    penerima: string;
    scan_surat: string;
}

// Utility functions
const extractFilename = (minioUrl: string | undefined): string | null => {
    if (!minioUrl) return null;
    const urlParts = minioUrl.split('/');
    return urlParts[urlParts.length - 1];
};

const generateViewUrl = (filename: string | null): string | null => {
    if (!filename) return null;
    return `https://api-efiling.vercel.app/api/files/view/${filename}`;
};

const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
};

// Enhanced DetailItem component with animations and hover effects
interface DetailItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    color?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({
    icon,
    label,
    value,
    color = '#1890ff'
}) => (
    <div
        style={{
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            marginBottom: '16px',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            cursor: 'default',
            display: 'flex',
            alignItems: 'center',
            width: "100%",
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            borderLeft: `4px solid ${color}`,
            overflow: 'hidden'
        }}
        className="hover:shadow-md hover:translate-y-[-3px]"
    >
        <div
            style={{
                color: color,
                fontSize: '24px',
                marginRight: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                backgroundColor: `${color}10`,
                borderRadius: '50%'
            }}
        >
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <Text type="secondary" style={{ display: 'block', fontSize: '14px' }}>{label}</Text>
            <Text strong style={{ fontSize: '16px', display: 'block', marginTop: '4px' }}>{value}</Text>
        </div>
    </div>
);

// Enhanced PDF Preview component
interface PDFPreviewProps {
    filename: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ filename }) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pdfBlob, setPdfBlob] = useState<string | null>(null);
    const [scale, setScale] = useState<number>(1.0);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const pdfContainerRef = useRef<HTMLDivElement>(null);

    const viewUrl = generateViewUrl(filename);
    const pdfBlobUrl = useRef<string | null>(null);

    useEffect(() => {
        const fetchPdf = async () => {
            if (!viewUrl) return;

            try {
                const response = await fetch(viewUrl, { method: 'GET', headers: { 'Accept': 'application/pdf' } });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                pdfBlobUrl.current = url;
                setPdfBlob(url);
            } catch (err) {
                console.error('Error fetching PDF:', err);
                setError('Failed to load PDF document');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPdf();

        return () => {
            if (pdfBlobUrl.current) {
                URL.revokeObjectURL(pdfBlobUrl.current);
            }
        };
    }, [viewUrl]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
        setNumPages(numPages);
        setIsLoading(false);
    };

    const onDocumentLoadError = (error: Error): void => {
        console.error('Error loading PDF:', error);
        setError('Failed to load PDF document');
        setIsLoading(false);
    };

    const changePage = (offset: number) => setPageNumber(prevPageNumber => prevPageNumber + offset);
    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    const zoomIn = () => setScale(prevScale => Math.min(prevScale + 0.1, 2.0));
    const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.1, 0.5));

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            if (pdfContainerRef.current?.requestFullscreen) {
                pdfContainerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div ref={pdfContainerRef} style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <Card
                className="mb-4"
                style={{
                    borderRadius: '12px',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)'
                }}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            onClick={previousPage}
                            disabled={pageNumber <= 1}
                            style={{ marginRight: '8px' }}
                            icon={<LeftOutlined />}
                            shape="circle"
                        />
                        <div className="page-indicator" style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            backgroundColor: '#f0f0f0',
                            display: 'inline-flex',
                            alignItems: 'center'
                        }}>
                            <Text strong>{pageNumber}</Text>
                            <Text type="secondary" style={{ margin: '0 4px' }}>/</Text>
                            <Text>{numPages || 0}</Text>
                        </div>
                        <Button
                            onClick={nextPage}
                            disabled={pageNumber >= (numPages || 0)}
                            style={{ marginLeft: '8px' }}
                            icon={<RightOutlined />}
                            shape="circle"
                        />
                    </div>

                    <div>
                        <Button
                            onClick={zoomOut}
                            icon={<ZoomOutOutlined />}
                            shape="circle"
                            style={{ marginRight: '8px' }}
                            disabled={scale <= 0.5}
                        />
                        <Button
                            onClick={zoomIn}
                            icon={<ZoomInOutlined />}
                            shape="circle"
                            style={{ marginRight: '8px' }}
                            disabled={scale >= 2.0}
                        />
                        <Button
                            onClick={toggleFullscreen}
                            icon={<FullscreenOutlined />}
                            shape="circle"
                            style={{ marginRight: '8px' }}
                        />
                        {viewUrl && (
                            <Button
                                type="primary"
                                href={viewUrl}
                                target="_blank"
                                icon={<DownloadOutlined />}
                            >
                                Download
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            <Card
                className="pdf-container"
                style={{
                    padding: '24px',
                    minHeight: '500px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                {isLoading && (
                    <div className="loading-container" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        zIndex: 10
                    }}>
                        <Spin size="large" />
                        <Text style={{ marginTop: '16px' }}>Loading document...</Text>
                    </div>
                )}
                {error ? (
                    <Result
                        status="error"
                        title="Failed to load document"
                        subTitle={error}
                        extra={viewUrl && (
                            <Button type="primary" href={viewUrl} target="_blank">
                                Download PDF Instead
                            </Button>
                        )}
                    />
                ) : pdfBlob && (
                    <div style={{
                        maxHeight: '600px',
                        overflow: 'auto',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        <Document
                            file={pdfBlob}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={null}
                        >
                            <Page
                                pageNumber={pageNumber}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                scale={scale}
                                loading={null}
                            />
                        </Document>
                    </div>
                )}
            </Card>
        </div>
    );
};

// Main Component
const DetailSuratMasuk: React.FC = () => {
    const [surat, setSurat] = useState<SuratMasuk | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isPDF, setIsPDF] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [filename, setFilename] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<string>('detail');

    const { no_surat_masuk } = useParams<{ no_surat_masuk: string }>();
    const API_URL = "https://api-efiling.vercel.app";
    const navigate = useNavigate();


    useEffect(() => {
        if (!no_surat_masuk) {
            setError("Nomor surat masuk tidak ditemukan");
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Simulate loading progress for better user experience
                const loadingInterval = setInterval(() => {
                    setLoadingProgress(prev => {
                        if (prev >= 90) {
                            clearInterval(loadingInterval);
                            return prev;
                        }
                        return prev + 10;
                    });
                }, 300);

                const response = await fetch(`${API_URL}/api/surat-masuk/${no_surat_masuk}`);
                clearInterval(loadingInterval);
                setLoadingProgress(100);

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data = await response.json();
                if (data.data) {
                    setSurat(data.data);
                    const extractedFilename = extractFilename(data.data.scan_surat);
                    setFilename(extractedFilename);
                    setIsPDF(extractedFilename?.toLowerCase().endsWith('.pdf') ?? false);
                } else {
                    setError("Data surat tidak ditemukan");
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengambil data");
            } finally {
                // Small delay to finish the animation
                setTimeout(() => {
                    setIsLoading(false);
                }, 500);
            }
        };

        fetchData();
    }, [no_surat_masuk, API_URL]);

    const viewUrl = filename ? generateViewUrl(filename) : null;

    // Animated loader
    if (isLoading) {
        return (
            <div className="loading-screen" style={{
                minHeight: '100vh',
                backgroundColor: '#f7f9fc',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px'
            }}>
                <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                    <FileTextOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '24px' }} />

                    <Title level={3} style={{ marginBottom: '24px' }}>
                        Memuat Data Surat
                    </Title>

                    <Progress
                        percent={loadingProgress}
                        status="active"
                        strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                        }}
                        style={{ marginBottom: '24px' }}
                    />

                    <Text type="secondary">
                        Mohon tunggu sebentar sementara kami memuat detail surat masuk
                    </Text>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !surat) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#f7f9fc',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px'
            }}>
                <Result
                    status="404"
                    title="Data Tidak Ditemukan"
                    subTitle={error || "Maaf, data surat yang Anda cari tidak dapat ditemukan atau terjadi kesalahan."}
                    extra={
                        <Button type="primary" onClick={() => navigate("/daftar-surat")}
                            icon={<ArrowLeftOutlined />}>
                            Kembali ke Daftar Surat
                        </Button>
                    }
                />
            </div>
        );
    }

    // Success state with beautiful UI
    return (
        <div className="detail-surat-container" style={{
            minHeight: '100vh',
            backgroundColor: '#f7f9fc',
            padding: '32px 24px'
        }}>
            {/* Breadcrumb navigation */}
            <div style={{ marginBottom: '24px' }}>
                <Button
                    onClick={() => navigate('/dashboard/surat-masuk')}
                    type="link"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: 0,
                        fontSize: '16px'
                    }}
                >
                    <ArrowLeftOutlined style={{ marginRight: '8px' }} />
                    Kembali ke Daftar Surat
                </Button>
            </div>

            {/* Main content */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                {/* Header card */}
                <Card
                    style={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}
                    bodyStyle={{ padding: 0 }}
                >
                    <div style={{
                        background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
                        padding: '32px',
                        color: '#fff',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Background pattern */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 20%)',
                            backgroundSize: '60% 60%',
                            backgroundRepeat: 'no-repeat'
                        }} />

                        <Badge.Ribbon text="Surat Masuk" color="blue">
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '24px'
                                }}>
                                    <div>
                                        <Text style={{
                                            color: 'rgba(255,255,255,0.8)',
                                            fontSize: '16px',
                                            marginBottom: '8px',
                                            display: 'block'
                                        }}>
                                            No. Surat: {surat.no_surat_masuk}
                                        </Text>
                                        <Title
                                            level={2}
                                            style={{
                                                color: '#fff',
                                                margin: '0 0 16px 0',
                                                maxWidth: '600px'
                                            }}
                                        >
                                            {surat.perihal}
                                        </Title>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                            <Tag color="blue" style={{ padding: '4px 12px', borderRadius: '16px' }}>
                                                <CalendarOutlined style={{ marginRight: '4px' }} />
                                                {formatDate(surat.tanggal)}
                                            </Tag>
                                            <Tag color="cyan" style={{ padding: '4px 12px', borderRadius: '16px' }}>
                                                <UserOutlined style={{ marginRight: '4px' }} />
                                                Dari: {surat.pengirim}
                                            </Tag>
                                            <Tag color="green" style={{ padding: '4px 12px', borderRadius: '16px' }}>
                                                <AimOutlined style={{ marginRight: '4px' }} />
                                                Untuk: {surat.tujuan}
                                            </Tag>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Badge.Ribbon>
                    </div>

                    {/* Tabs navigation */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: '#fff'
                    }}>
                        <Button
                            type={activeTab === 'detail' ? 'link' : 'text'}
                            onClick={() => setActiveTab('detail')}
                            style={{
                                padding: '16px 24px',
                                fontWeight: activeTab === 'detail' ? 'bold' : 'normal',
                                borderBottom: activeTab === 'detail' ? '2px solid #1890ff' : 'none',
                                borderRadius: 0
                            }}
                        >
                            Detail Surat
                        </Button>
                        <Button
                            type={activeTab === 'preview' ? 'link' : 'text'}
                            onClick={() => setActiveTab('preview')}
                            style={{
                                padding: '16px 24px',
                                fontWeight: activeTab === 'preview' ? 'bold' : 'normal',
                                borderBottom: activeTab === 'preview' ? '2px solid #1890ff' : 'none',
                                borderRadius: 0
                            }}
                        >
                            Pratinjau Dokumen
                        </Button>
                    </div>
                </Card>

                {/* Content based on active tab */}
                <div style={{ display: activeTab === 'detail' ? 'block' : 'none' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '24px',
                        marginBottom: '24px'
                    }}>
                        <Card
                            style={{
                                borderRadius: '16px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                            }}
                            title={
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                    <span>Informasi Dokumen</span>
                                </div>
                            }
                        >
                            <DetailItem
                                icon={<NumberOutlined />}
                                label="Nomor Surat"
                                value={surat.no_surat_masuk}
                                color="#1890ff"
                            />

                            <DetailItem
                                icon={<CalendarOutlined />}
                                label="Tanggal"
                                value={formatDate(surat.tanggal)}
                                color="#52c41a"
                            />

                            <DetailItem
                                icon={<MailOutlined />}
                                label="Perihal"
                                value={surat.perihal}
                                color="#faad14"
                            />
                        </Card>

                        <Card
                            style={{
                                borderRadius: '16px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                            }}
                            title={
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <UserOutlined style={{ marginRight: '8px', color: '#722ed1' }} />
                                    <span>Pengirim & Penerima</span>
                                </div>
                            }
                        >
                            <DetailItem
                                icon={<AimOutlined />}
                                label="Tujuan"
                                value={surat.tujuan}
                                color="#722ed1"
                            />

                            <DetailItem
                                icon={<UserOutlined />}
                                label="Pengirim"
                                value={surat.pengirim}
                                color="#eb2f96"
                            />

                            <DetailItem
                                icon={<UserOutlined />}
                                label="Penerima"
                                value={surat.penerima}
                                color="#f5222d"
                            />
                        </Card>
                    </div>

                    <Card
                        style={{
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                        }}
                        title={
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <ClockCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                <span>Timeline Surat</span>
                            </div>
                        }
                    >
                        <Timeline
                            mode="left"
                            items={[
                                {
                                    label: formatDate(surat.tanggal),
                                    children: 'Surat diterima',
                                    dot: <CheckCircleOutlined style={{ fontSize: '16px' }} />,
                                    color: 'green',
                                },
                                {
                                    label: formatDate(surat.tanggal),
                                    children: 'Surat diregistrasi dalam sistem',
                                    dot: <CheckCircleOutlined style={{ fontSize: '16px' }} />,
                                    color: 'green',
                                },
                                {
                                    label: formatDate(surat.tanggal),
                                    children: 'Surat diteruskan kepada penerima',
                                    dot: <CheckCircleOutlined style={{ fontSize: '16px' }} />,
                                    color: 'green',
                                }
                            ]}
                        />
                    </Card>

                    {/* Actions footer */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '24px',
                        gap: '16px',
                        flexWrap: 'wrap'
                    }}>
                        {viewUrl && (
                            <>
                                <Button
                                    type="primary"
                                    icon={<EyeOutlined />}
                                    onClick={() => setIsModalOpen(true)}
                                    size="large"
                                >
                                    Lihat Dokumen
                                </Button>
                                <Button
                                    icon={<DownloadOutlined />}
                                    href={viewUrl}
                                    target="_blank"
                                    size="large"
                                >
                                    Download
                                </Button>
                            </>
                        )}
                        <Button
                            icon={<PrinterOutlined />}
                            size="large"
                            onClick={() => window.print()}
                        >
                            Cetak Detail
                        </Button>
                        <Tooltip title="Fitur ini akan segera hadir">
                            <Button
                                icon={<ShareAltOutlined />}
                                size="large"
                                disabled
                            >
                                Bagikan
                            </Button>
                        </Tooltip>
                    </div>
                </div>

                {/* Document preview tab */}
                <div style={{ display: activeTab === 'preview' ? 'block' : 'none' }}>
                    <Card
                        style={{
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                            minHeight: '600px'
                        }}
                    >
                        {viewUrl ? (
                            isPDF && filename ? (
                                <PDFPreview filename={filename} />
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}>
                                    <Image
                                        width="auto"
                                        height="auto"
                                        src={viewUrl}
                                        alt="Scan Surat"
                                        style={{
                                            objectFit: 'contain',
                                            maxHeight: '600px',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Button
                                        type="primary"
                                        href={viewUrl}
                                        target="_blank"
                                        icon={<DownloadOutlined />}
                                        style={{ marginTop: '24px' }}
                                    >
                                        Download Gambar
                                    </Button>
                                </div>
                            )
                        ) : (
                            <Result
                                status="warning"
                                title="Tidak ada dokumen tersedia"
                                subTitle="Dokumen untuk surat ini tidak ditemukan atau belum diunggah."
                            />
                        )}
                    </Card>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                textAlign: 'center',
                marginTop: '48px',
                color: '#8c8c8c',
                fontSize: '14px'
            }}>
                <div style={{ marginBottom: '8px' }}>
                    <Text type="secondary">E-Filing System &copy;2025 Created by LAB ICT</Text>
                </div>
                <div>
                    <Text type="secondary">Version 2.0.1</Text>
                </div>
            </div>

            {/* Full-size document modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        <span>Dokumen: {surat.perihal}</span>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width="90%"
                style={{ top: 20 }}
                bodyStyle={{
                    padding: '24px',
                    maxHeight: '80vh',
                    overflow: 'auto',
                    display: 'flex',
                    justifyContent: 'center'
                }}
            >
                {viewUrl ? (
                    isPDF && filename ? (
                        <PDFPreview filename={filename} />
                    ) : (
                        <Image
                            width="auto"
                            height="auto"
                            src={viewUrl}
                            alt="Scan Surat"
                            style={{
                                objectFit: 'contain',
                                maxHeight: 'calc(80vh - 48px)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                borderRadius: '8px'
                            }}
                        />
                    )
                ) : (
                    <Result
                        status="warning"
                        title="Tidak ada dokumen tersedia"
                        subTitle="Dokumen untuk surat ini tidak ditemukan atau belum diunggah."
                    />
                )}
            </Modal>
        </div>
    );
};
export default DetailSuratMasuk;