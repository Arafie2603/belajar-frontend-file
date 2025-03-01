import { useState, useEffect, useRef } from "react";
import { Document, Page } from 'react-pdf';
import { useParams, useNavigate } from "react-router-dom";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import "../pdfworker";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import {
    ArrowLeftOutlined,
    FilePdfFilled,
} from '@ant-design/icons';
import { X, FileText, Calendar, Mail, Target, Hash, User, Eye, Download, Printer } from 'lucide-react';

import headerPDF from '../assets/images-resource/headersurat.jpeg';

interface DetailItemProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
}

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
    scan_surat?: string;
}

interface PDFPreviewProps {
    filename: string;
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
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
};

const processHtmlContent = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Improve table styling
    const tables = tempDiv.querySelectorAll('table');
    tables.forEach(table => {
        (table as HTMLElement).style.borderCollapse = 'collapse';
        (table as HTMLElement).style.width = '100%';
        (table as HTMLElement).style.marginBottom = '1rem';
        (table as HTMLElement).style.fontFamily = 'Arial, sans-serif';

        const cells = table.querySelectorAll('th, td');
        cells.forEach(cell => {
            (cell as HTMLElement).style.border = '1px solid #000';
            (cell as HTMLElement).style.padding = '8px';
            (cell as HTMLElement).style.textAlign = 'left';
        });
        
        // Style table headers
        const headers = table.querySelectorAll('th');
        headers.forEach(header => {
            (header as HTMLElement).style.backgroundColor = '#f2f2f2';
            (header as HTMLElement).style.fontWeight = 'bold';
        });
    });

    // Improve paragraphs
    const paragraphs = tempDiv.querySelectorAll('p');
    paragraphs.forEach(paragraph => {
        (paragraph as HTMLElement).style.margin = '0 0 10px 0';
        (paragraph as HTMLElement).style.lineHeight = '1.5';
    });

    return tempDiv.innerHTML;
};

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
                const response = await fetch(viewUrl, {
                    method: "GET",
                    headers: { Accept: "application/pdf" },
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                pdfBlobUrl.current = url;
                setPdfBlob(url);
            } catch (err) {
                console.error("Error fetching PDF:", err);
                setError("Failed to load PDF document");
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

    const changePage = (offset: number) => setPageNumber((prevPageNumber) => prevPageNumber + offset);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl mx-auto">
            {isLoading ? (
                <div className="flex justify-center items-center h-60">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <X className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg">
                        <div className="space-y-2">
                            <p className="font-semibold">Page {pageNumber} of {numPages || 0}</p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={previousPage}
                                    disabled={pageNumber <= 1}
                                    className={`px-3 py-1 rounded ${pageNumber <= 1
                                        ? "bg-gray-200 text-gray-400"
                                        : "bg-blue-500 text-white hover:bg-blue-600"
                                        }`}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={nextPage}
                                    disabled={pageNumber >= (numPages || 0)}
                                    className={`px-3 py-1 rounded ${pageNumber >= (numPages || 0)
                                        ? "bg-gray-200 text-gray-400"
                                        : "bg-blue-500 text-white hover:bg-blue-600"
                                        }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                        {viewUrl && (
                            <a
                                href={viewUrl}
                                target="_blank"
                                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </a>
                        )}
                    </div>

                    <div className="flex justify-center shadow-lg rounded-lg overflow-hidden bg-gray-100 p-6">
                        <Document
                            file={pdfBlob}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={<div className="animate-pulse bg-gray-200 h-96 w-full rounded"></div>}
                        >
                            <Page
                                pageNumber={pageNumber}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                scale={1.0}
                                loading={<div className="animate-pulse bg-gray-200 h-96 w-full rounded"></div>}
                            />
                        </Document>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailItem: React.FC<DetailItemProps> = ({ icon, label, value }) => (
    <div className="group bg-white border border-gray-200 p-4 rounded-lg transition-all duration-300 hover:shadow-md hover:border-blue-200 flex items-center space-x-4">
        <div className="bg-blue-50 p-3 rounded-full text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
            {icon}
        </div>
        <div className="flex-1">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-semibold text-gray-800 mt-1">{value}</p>
        </div>
    </div>
);

const DetailSuratKeluar = () => {
    const [surat, setSurat] = useState<SuratKeluar | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
    const [isPDF, setIsPDF] = useState(false);
    const [error, setError] = useState("");
    const [filename, setFilename] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    const API_URL = "https://api-efiling.vercel.app/";
    const token = localStorage.getItem('token');
    const pdfContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) {
            setError("Nomor surat keluar tidak ditemukan");
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const response = await fetch(`${API_URL}api/surat-keluar/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
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

    const handleDownload = async () => {
        setLoading(true);
        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
    
            // Add header image
            const headerImg = new Image();
            headerImg.src = headerPDF;
    
            // We'll need to wait for the image to load
            await new Promise((resolve) => {
                headerImg.onload = resolve;
            });
    
            // Add header image
            pdf.addImage(
                headerPDF,
                'JPEG',
                10, // x position
                10, // y position
                190, // width
                30 // height
            );
    
            // Add title
            pdf.setFontSize(16);
            pdf.setFont("helvetica", "bold");
            pdf.text("SURAT KELUAR", 105, 50, { align: "center" });
    
            // Reset font for content
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "normal");
    
            // Add letter details
            let yPos = 70;
    
            // No. Surat
            pdf.text("No.", 20, yPos);
            pdf.text(": " + (surat?.surat_nomor || "-"), 60, yPos);
            yPos += 8;
    
            // Tanggal
            pdf.text("Tanggal", 20, yPos);
            pdf.text(": " + formatDate(surat?.tanggal || ""), 60, yPos);
            yPos += 8;
    
            // Lampiran
            pdf.text("Lampiran", 20, yPos);
            pdf.text(": " + (surat?.lampiran || "-"), 60, yPos);
            yPos += 16;
    
            // Perihal
            pdf.text("Perihal", 20, yPos);
            pdf.text(": " + (surat?.penerima || "-"), 60, yPos);
            yPos += 8;
    
            // Tujuan
            pdf.text("Tujuan", 20, yPos);
            pdf.text(": " + (surat?.pengirim || "-"), 60, yPos);
            yPos += 16;
    
            // For the HTML content including tables, we'll render it to a canvas first
            if (surat?.isi_surat) {
                // Create a temporary div to render the HTML content
                const tempDiv = document.createElement('div');
                tempDiv.style.width = '170mm';
                tempDiv.style.padding = '10mm';
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.innerHTML = processHtmlContent(surat.isi_surat);
                document.body.appendChild(tempDiv);
    
                // Use html2canvas to capture the rendered HTML
                const canvas = await html2canvas(tempDiv, {
                    scale: 2,
                    logging: false,
                    backgroundColor: '#ffffff'
                });
                
                // Remove the temporary div
                document.body.removeChild(tempDiv);
    
                // Add the content image to the PDF
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const contentWidth = 170; // mm
                const contentHeight = canvas.height * contentWidth / canvas.width;
                
                // Check if we need a new page for the content
                if (yPos + contentHeight > 270) {
                    pdf.addPage();
                    yPos = 20;
                }
                
                pdf.addImage(imgData, 'JPEG', 20, yPos, contentWidth, contentHeight);
                yPos += contentHeight + 10;
            }
            
            // Check if we need a new page for the signature
            if (yPos + 40 > 270) {
                pdf.addPage();
                yPos = 20;
            }
    
            // Add footer (date and signature)
            pdf.text((surat?.tempat_surat || 'Jakarta') + ', ' + formatDate(surat?.tanggal || ""), 140, yPos);
            yPos += 30; // Space for signature
    
            // Add signature name
            pdf.text(surat?.jabatan_pengirim || '', 140, yPos);
            yPos += 8;
    
            // Add signature status
            pdf.text('(' + (surat?.sifat_surat || '') + ')', 140, yPos);
    
            // Save the PDF
            pdf.save(`surat-keluar-${surat?.surat_nomor}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.');
        }
        setLoading(false);
    };
    const PDFContent = () => (
        <div ref={pdfContentRef} className="w-full max-w-[210mm] min-h-[297mm] bg-white mx-auto p-12">
            {/* Header */}
            <div className="mb-8">
                <img
                    src={headerPDF}
                    alt="Universitas Header"
                    className="w-full h-auto object-contain"
                />
            </div>

            {/* Title */}
            <div className="text-center mb-10">
                <h1 className="text-xl font-bold">SURAT KELUAR</h1>
            </div>

            {/* Document Content */}
            <div className="leading-relaxed">
                <div className="mb-6">
                    <div className="flex mb-2">
                        <span className="w-20">No.</span>
                        <span>: {surat?.surat_nomor}</span>
                    </div>
                    <div className="flex mb-2">
                        <span className="w-20">Tanggal</span>
                        <span>: {formatDate(surat?.tanggal || '')}</span>
                    </div>
                    <div className="flex">
                        <span className="w-20">Lampiran</span>
                        <span>: {surat?.lampiran || '-'}</span>
                    </div>
                </div>

                <div className="mb-6 pt-4">
                    <div className="flex mb-2">
                        <span className="w-20">Perihal</span>
                        <span>: {surat?.penerima}</span>
                    </div>
                    <div className="flex mb-2">
                        <span className="w-20">Tujuan</span>
                        <span>: {surat?.pengirim}</span>
                    </div>
                </div>

                <div className="mb-8 leading-relaxed">
                    <div dangerouslySetInnerHTML={{
                        __html: surat?.isi_surat ? processHtmlContent(surat.isi_surat) : ''
                    }}></div>
                </div>
            </div>

            <div className="mt-12 text-right">
                <p>{(surat?.tempat_surat ?? 'Jakarta') + ', ' + formatDate(surat?.tanggal ?? '')}</p>
                <div className="h-32 relative">
                    {surat?.gambar && (
                        <img
                            src={surat.gambar}
                            alt={surat?.keterangan_gambar ?? "Stamp"}
                            className="absolute right-0 top-0 object-contain"
                            style={{ maxHeight: '100px' }}
                        />
                    )}
                </div>
                <p>{surat?.jabatan_pengirim ?? ''}</p>
                <p>({surat?.sifat_surat ?? ''})</p>
            </div>
        </div>
    );
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                <p className="mt-4 text-gray-600">Memuat data surat...</p>
            </div>
        );
    }

    if (error || !surat) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                    <div className="flex items-center mb-4 text-red-500">
                        <X className="h-8 w-8 mr-2" />
                        <h2 className="text-xl font-bold">Gagal mengambil data surat</h2>
                    </div>
                    <p className="text-gray-600">{error || "Data tidak ditemukan"}</p>
                    <button
                        onClick={() => navigate('/dashboard/surat-keluar')}
                        className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-all"
                    >
                        Kembali ke daftar surat
                    </button>
                </div>
            </div>
        );
    }

    const viewUrl = filename ? generateViewUrl(filename) : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Back button */}
                <button
                    onClick={() => navigate('/dashboard/surat-keluar')}
                    className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                    <ArrowLeftOutlined className="mr-2" />
                    <span>Kembali ke daftar surat</span>
                </button>

                {/* Main card */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-8">
                    {/* Header with ribbon */}
                    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                        <div className="absolute top-0 right-0 bg-yellow-500 text-xs font-bold uppercase px-3 py-1 rounded-bl-lg">
                            Surat Keluar
                        </div>
                        <h1 className="text-3xl font-bold flex items-center justify-center">
                            <FileText className="mr-3 h-8 w-8" />
                            Detail Surat Keluar
                        </h1>
                        <div className="mt-2 text-center opacity-80">
                            Surat Nomor: {surat.surat_nomor}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <DetailItem
                                icon={<Hash className="h-5 w-5" />}
                                label="Nomor Surat"
                                value={surat.surat_nomor}
                            />

                            <DetailItem
                                icon={<Calendar className="h-5 w-5" />}
                                label="Tanggal"
                                value={formatDate(surat.tanggal)}
                            />

                            <DetailItem
                                icon={<Mail className="h-5 w-5" />}
                                label="Perihal"
                                value={surat.penerima}
                            />

                            <DetailItem
                                icon={<Target className="h-5 w-5" />}
                                label="Tujuan"
                                value={surat.pengirim}
                            />

                            <DetailItem
                                icon={<User className="h-5 w-5" />}
                                label="Jabatan Pengirim"
                                value={surat.jabatan_pengirim}
                            />

                            <DetailItem
                                icon={<User className="h-5 w-5" />}
                                label="Penerima"
                                value={surat.sifat_surat}
                            />
                        </div>

                        {/* Document preview if available */}
                        {viewUrl && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-lg font-semibold mb-3 flex items-center">
                                    <Eye className="mr-2 h-5 w-5 text-blue-500" />
                                    Preview Dokumen
                                </h3>
                                <div className="h-48 bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden cursor-pointer" onClick={() => setIsModalOpen(true)}>
                                    {isPDF ? (
                                        <div className="flex flex-col items-center text-gray-500">
                                            <FilePdfFilled style={{ fontSize: '48px', color: '#e53e3e' }} />
                                            <p className="mt-2">Klik untuk membuka dokumen PDF</p>
                                        </div>
                                    ) : (
                                        <img
                                            src={viewUrl}
                                            alt="Document Preview"
                                            className="h-full object-contain opacity-80 hover:opacity-100 transition-opacity"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            {viewUrl ? (
                                <>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                        <Eye className="mr-2 h-5 w-5" />
                                        Lihat Dokumen
                                    </button>

                                    <a
                                        href={viewUrl}
                                        target="_blank"
                                        className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                    >
                                        <Download className="mr-2 h-5 w-5" />
                                        Download
                                    </a>
                                </>
                            ) : (
                                <div className="px-4 py-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded">
                                    Tidak ada dokumen tersedia
                                </div>
                            )}

                            <button
                                onClick={() => setIsPDFPreviewOpen(true)}
                                className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                                <FilePdfFilled className="mr-2" />
                                Generate PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-xl font-bold flex items-center">
                                <FileText className="mr-2 h-5 w-5 text-blue-500" />
                                Dokumen Surat
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 p-4 overflow-auto">
                            {viewUrl ? (
                                isPDF && filename ? (
                                    <PDFPreview filename={filename} />
                                ) : (
                                    <div className="bg-gray-100 p-4 rounded-lg flex justify-center">
                                        <img
                                            src={viewUrl}
                                            alt="Scan Surat"
                                            className="max-h-[70vh] object-contain shadow-lg rounded-lg"
                                        />
                                    </div>
                                )
                            ) : (
                                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                                    Tidak ada dokumen tersedia
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Preview Modal with transparent background */}
            {isPDFPreviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-blur bg-opacity-50" onClick={() => setIsPDFPreviewOpen(false)}></div>
                    <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col relative z-10">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-xl font-bold flex items-center">
                                <FilePdfFilled className="mr-2" style={{ color: '#e53e3e' }} />
                                Preview PDF
                            </h2>
                            <button
                                onClick={() => setIsPDFPreviewOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 p-4 overflow-auto bg-white">
                            <PDFContent />
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded flex items-center transition-colors"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Cetak
                            </button>

                            <button
                                onClick={handleDownload}
                                disabled={loading}
                                className={`px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {loading ? 'Processing...' : 'Download PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailSuratKeluar;