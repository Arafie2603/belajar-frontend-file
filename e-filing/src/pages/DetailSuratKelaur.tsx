import { useState, useEffect, useRef } from "react";
import { Card, Typography, Modal, Image, Spin, Alert, Button, Space, Badge, Divider } from "antd";
import { useParams } from "react-router-dom";
import { Document, Page } from 'react-pdf';
import "../pdfworker";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { 
    FileTextOutlined, 
    CalendarOutlined, 
    UserOutlined, 
    AimOutlined, 
    MailOutlined, 
    EyeOutlined, 
    DownloadOutlined,
    NumberOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Keep your existing interfaces
interface SuratKeluar {
    surat_nomor: string;
    tanggal: string;
    tempat_surat: string;
    lampiran: string;
    isi_surat: string;
    pengirim: string;
    penerima: string;
    jabatan_pengirim: string;
    gambar: string;
    keterangan_gambar: string;
    sifat_surat: string;
    id: string;
}

// Keep your existing utility functions
const extractFilename = (minioUrl: string | undefined): string | null => {
    if (!minioUrl) return null;
    const urlParts = minioUrl.split('/');
    return urlParts[urlParts.length - 1];
};

const generateViewUrl = (filename: string | null): string | null => {
    if (!filename) return null;
    return `https://belajar-backend-d3iolm3c5-arafie2603s-projects.vercel.app/api/files/view/${filename}`;
};

// Enhanced DetailItem component for consistent styling
interface DetailItemProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon, label, value }) => (
    
    <div style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginBottom: '16px',
        transition: 'all 0.3s ease',
        cursor: 'default',
        display: 'flex',
        alignItems: 'center',
        width: "100%"
    }}
    className="hover:bg-gray-100"
    >
        <div style={{ color: '#1890ff', fontSize: '20px', marginRight: '16px' }}>
            {icon}
        </div>
        <div>
            <Text type="secondary" style={{ display: 'block' }}>{label}</Text>
            <Text strong style={{ fontSize: '16px' }}>{value}</Text>
        </div>
    </div>
);

// Keep your existing PDFPreview component with enhanced styling
interface PDFPreviewProps {
    filename: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ filename }) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pdfBlob, setPdfBlob] = useState<string | null>(null);

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

    return (
        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
            <Card className="mb-4">
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <div>
                        <Text strong>Page {pageNumber} of {numPages || 0}</Text>
                        <div style={{ marginTop: '10px' }}>
                            <Button 
                                onClick={previousPage}
                                disabled={pageNumber <= 1}
                                style={{ marginRight: '8px' }}
                            >
                                Previous
                            </Button>
                            <Button 
                                onClick={nextPage}
                                disabled={pageNumber >= (numPages || 0)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                    {viewUrl && (
                        <Button 
                            type="primary"
                            href={viewUrl}
                            target="_blank"
                            icon={<DownloadOutlined />}
                        >
                            Download PDF
                        </Button>
                    )}
                </div>
            </Card>

            <Card
                variant={"borderless"}
                className="shadow-md"
                style={{
                    padding: '24px',
                    minHeight: '500px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {isLoading && (
                    <div style={{ position: 'absolute' }}>
                        <Spin size="large" />
                    </div>
                )}
                {error ? (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                    />
                ) : pdfBlob && (
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
                            scale={1.0}
                            loading={null}
                        />
                    </Document>
                )}
            </Card>
        </div>
    );
};

const DetailSuratKeluar: React.FC = () => {
    const [surat, setSurat] = useState<SuratKeluar | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isPDF, setIsPDF] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [filename, setFilename] = useState<string | null>(null);

    const { no_surat_masuk } = useParams<{ no_surat_masuk: string }>();
    const API_URL = "https://belajar-backend-6x1plp4je-arafie2603s-projects.vercel.app/";

    useEffect(() => {
        if (!no_surat_masuk) {
            setError("Nomor surat keluar tidak ditemukan");
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/surat-kelaur/${no_surat_masuk}`);
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
                setIsLoading(false);
            }
        };

        fetchData();
    }, [no_surat_masuk, API_URL]);

    const viewUrl = filename ? generateViewUrl(filename) : null;

    if (isLoading) {
        return (
            <div style={{ 
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f0f2f5'
            }}>
                <Spin size="large" />
                <Text style={{ marginTop: '16px' }}>Memuat data surat...</Text>
            </div>
        );
    }

    if (error || !surat) {
        return (
            <div style={{ 
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f0f2f5'
            }}>
                <Alert
                    message="Gagal mengambil data surat"
                    description={error || "Data tidak ditemukan"}
                    type="error"
                    showIcon
                />
            </div>
        );
    }

    return (
        <div style={{ 
            minHeight: '100vh',
            backgroundColor: '#f0f2f5',
            padding: '32px'
        }}>
            <Card 
                style={{
                    maxWidth: '100%',
                    margin: '0 auto',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <Badge.Ribbon text="Surat Masuk" color="blue">
                        <Title level={2} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                            Detail Surat Masuk
                        </Title>
                    </Badge.Ribbon>
                </div>

                <DetailItem
                    icon={<NumberOutlined />}
                    label="Nomor Surat"
                    value={surat.surat_nomor}
                />
                
                <DetailItem
                    icon={<CalendarOutlined />}
                    label="Tanggal"
                    value={new Date(surat.tanggal).toLocaleDateString("id-ID")}
                />

                <DetailItem
                    icon={<MailOutlined />}
                    label="Perihal"
                    value={surat.penerima}
                />

                <DetailItem
                    icon={<AimOutlined />}
                    label="Tujuan"
                    value={surat.pengirim}
                />

                <DetailItem
                    icon={<UserOutlined />}
                    label="Pengirim"
                    value={surat.jabatan_pengirim}
                />

                <DetailItem
                    icon={<UserOutlined />}
                    label="Penerima"
                    value={surat.sifat_surat}
                />

                <Divider />

                <div style={{ textAlign: 'center' }}>
                    {viewUrl ? (
                        <Space size="middle">
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
                        </Space>
                    ) : (
                        <Alert message="Tidak ada dokumen" type="error" />
                    )}
                </div>
            </Card>

            {/* <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Text type="secondary">E-Filing ©2025 Created by LAB ICT</Text>
            </div> */}

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        <span>Dokumen Surat</span>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width="50%"
                style={{ top: 20 }}
                styles={{
                    body: { 
                        padding: '24px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        display: 'flex',
                        justifyContent: 'center'
                    }
                }}
            >
                {viewUrl ? (
                    isPDF && filename ? (
                        <PDFPreview filename={filename} />
                    ) : (
                        <Image
                            width="100%"
                            src={viewUrl}
                            alt="Scan Surat"
                            style={{ objectFit: 'contain' }}
                        />
                    )
                ) : (
                    <Alert message="Tidak ada dokumen" type="error" />
                )}
            </Modal>
        </div>
    );
};

export default DetailSuratKeluar;