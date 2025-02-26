import { useState, useEffect, useRef } from "react";
import { Card, Typography, Modal, Image, Spin, Alert, Button, Space, Badge, Divider } from "antd";
import { useParams } from "react-router-dom";
import { Document, Page } from 'react-pdf';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
    NumberOutlined,
    ArrowLeftOutlined,
    FilePdfOutlined,
    PrinterOutlined
} from '@ant-design/icons';
import { X } from 'lucide-react';
import headerPDF from '../assets/images-resource/headersurat.jpeg';

const { Title, Text } = Typography;

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

const extractFilename = (minioUrl: string | undefined): string | null => {
    if (!minioUrl) return null;
    const urlParts = minioUrl.split('/');
    return urlParts[urlParts.length - 1];
};

const generateViewUrl = (filename: string | null): string | null => {
    if (!filename) return null;
    return `https://api-efiling.vercel.app/api/files/view/${filename}`;
};

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
    const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState<boolean>(false);
    const [isPDF, setIsPDF] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [filename, setFilename] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const { id } = useParams<{ id: string }>();
    const API_URL = "https://api-efiling.vercel.app/";
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!id) {
            setError("Nomor surat keluar tidak ditemukan");
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // Tambahkan header Authorization
                const response = await fetch(`${API_URL}api/surat-keluar/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        // Handle unauthorized
                        window.location.href = '/';
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

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
    }, [id, API_URL, token]);

    const viewUrl = filename ? generateViewUrl(filename) : null;

    const handleDownload = async () => {
        setLoading(true);
        try {
            const content = document.getElementById('pdf-content');
            const canvas = await html2canvas(content, {
                scale: 2,
                useCORS: true,
                logging: false
            });

            const pdfWidth = 210;
            const pdfHeight = 297;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const contentWidth = canvas.width;
            const contentHeight = canvas.height;
            const ratio = Math.min(pdfWidth / contentWidth, pdfHeight / contentHeight);

            const xOffset = (pdfWidth - contentWidth * ratio) / 2;
            const yOffset = 0;

            pdf.addImage(
                canvas.toDataURL('image/png'),
                'PNG',
                xOffset,
                yOffset,
                contentWidth * ratio,
                contentHeight * ratio
            );

            pdf.save(`surat-keluar-${surat?.surat_nomor}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
        setLoading(false);
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const PDFContent = () => (
        <div id="pdf-content" className="w-[210mm] min-h-[297mm] bg-white mx-auto" style={{ padding: '12mm' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <img
                    src={headerPDF}
                    alt="Universitas Header"
                    className="w-full h-auto object-contain"
                />
            </div>

            {/* Document Title */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="text-center font-bold text-xl">
                    SURAT KELUAR
                </h1>
            </div>

            {/* Document Content */}
            <div style={{ lineHeight: '1.8' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="flex" style={{ marginBottom: '0.5rem' }}>
                        <span className="w-32">No.</span>
                        <span>: {surat?.surat_nomor}</span>
                    </div>
                    <div className="flex" style={{ marginBottom: '0.5rem' }}>
                        <span className="w-32">Tanggal</span>
                        <span>: {surat?.tanggal ? formatDate(surat.tanggal) : ''}</span>
                    </div>
                    <div className="flex">
                        <span className="w-32">Lampiran</span>
                        <span>: {surat?.lampiran || '-'}</span>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem', paddingTop: '1rem' }}>
                    <div className="flex" style={{ marginBottom: '0.5rem' }}>
                        <span className="w-32">Perihal</span>
                        <span>: {surat?.penerima}</span>
                    </div>
                    <div className="flex" style={{ marginBottom: '0.5rem' }}>
                        <span className="w-32">Tujuan</span>
                        <span>: {surat?.pengirim}</span>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem', paddingTop: '1rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        Yang bertanda tangan di bawah ini:
                    </div>

                    <div style={{ marginLeft: '2rem', marginBottom: '2rem' }}>
                        <div className="flex" style={{ marginBottom: '0.5rem' }}>
                            <span className="w-32">Nama</span>
                            <span>: {surat?.jabatan_pengirim}</span>
                        </div>
                        <div className="flex">
                            <span className="w-32">Jabatan</span>
                            <span>: {surat?.sifat_surat}</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', lineHeight: '1.8' }}>
                    <style>
                        {`
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 15px 0;
                        }
                        
                        table, th, td {
                            border: 1px solid #333;
                        }
                        
                        th, td {
                            padding: 8px;
                            text-align: left;
                        }
                        
                        figure.table {
                            margin: 15px 0;
                        }
                    `}
                    </style>
                    <div
                        dangerouslySetInnerHTML={{ __html: surat?.isi_surat || '' }}
                        className="wysiwyg-content"
                    ></div>
                </div>
            </div>

            {/* Footer with Signature */}
            <div style={{ marginTop: '3rem', textAlign: 'right' }}>
                <p>{surat?.tempat_surat || 'Jakarta'}, {formatDate(surat?.tanggal)}</p>
                <div style={{ height: '8rem', position: 'relative' }}>
                    {surat?.gambar && (
                        <img
                            src={surat.gambar}
                            alt={surat.keterangan_gambar || "Stamp"}
                            className="absolute right-0 top-0 object-contain"
                            style={{ maxHeight: '100px' }}
                        />
                    )}
                </div>
                <p>{surat?.jabatan_pengirim}</p>
                <p>({surat?.sifat_surat})</p>
            </div>
        </div>
    );

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
                    <Badge.Ribbon text="Surat Keluar" color="blue">
                        <Title level={2} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                            Detail Surat Keluar
                        </Title>
                    </Badge.Ribbon>
                </div>

                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/dashboard/surat-keluar')}
                    style={{
                        marginBottom: '16px',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                />

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
                    <Space size="middle">
                        {viewUrl ? (
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
                                    Download Dokumen
                                </Button>
                            </>
                        ) : surat?.gambar ? (
                            <>
                                <Button
                                    type="primary"
                                    icon={<EyeOutlined />}
                                    onClick={() => setIsModalOpen(true)}
                                    size="large"
                                >
                                    Lihat Gambar
                                </Button>
                                <Button
                                    icon={<DownloadOutlined />}
                                    href={surat.gambar}
                                    download={`gambar-${surat.surat_nomor}.png`}
                                    target="_blank"
                                    size="large"
                                >
                                    Download Gambar
                                </Button>
                            </>
                        ) : (
                            <Alert message="Tidak ada dokumen" type="warning" style={{ marginRight: '16px' }} />
                        )}
                    </Space>
                </div>
            </Card>

            {/* Document Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        <span>{viewUrl ? 'Dokumen Surat' : 'Gambar Surat'}</span>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {viewUrl ? (
                            <Button
                                icon={<DownloadOutlined />}
                                href={viewUrl}
                                target="_blank"
                            >
                                Download Dokumen
                            </Button>
                        ) : surat?.gambar ? (
                            <Button
                                icon={<DownloadOutlined />}
                                href={surat.gambar}
                                download={`gambar-${surat.surat_nomor}.png`}
                                target="_blank"
                            >
                                Download Gambar
                            </Button>
                        ) : null}
                    </div>
                }
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
                ) : surat?.gambar ? (
                    <Image
                        width="100%"
                        src={surat.gambar}
                        alt={surat.keterangan_gambar || "Gambar Surat"}
                        style={{ objectFit: 'contain' }}
                    />
                ) : (
                    <Alert message="Tidak ada dokumen atau gambar" type="error" />
                )}
            </Modal>

            {/* PDF Preview Modal */}
            {isPDFPreviewOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 1000 }}>
                    <div className="bg-white/90 rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4">
                            <h2 className="text-xl font-semibold">Preview PDF</h2>
                            <button
                                onClick={() => setIsPDFPreviewOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 p-4 overflow-auto bg-gray-100">
                            <PDFContent />
                        </div>

                        <div className="p-4 flex justify-end gap-x-2">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                                <PrinterOutlined style={{ marginRight: '8px' }} />
                                Cetak
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                            >
                                <DownloadOutlined style={{ marginRight: '8px' }} />
                                {loading ? 'Processing...' : 'Download'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailSuratKeluar;