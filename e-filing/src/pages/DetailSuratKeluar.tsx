import { useState, useEffect, useRef } from "react";
import { Document, Page } from 'react-pdf';
import { useParams, useNavigate } from "react-router-dom";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import "../pdfworker";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import {
    FilePdfFilled,
} from '@ant-design/icons';
import {
    ArrowLeft,
    FileText,
    Calendar,
    Mail,
    Target,
    Hash,
    User,
    Download,
    X,
    ChevronLeft,
    ChevronRight,
    Info,
    CheckCircle,
    Clock,
    Clipboard
} from 'lucide-react';

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
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl mx-auto">
            {isLoading ? (
                <div className="flex justify-center items-center h-60">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
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
                    <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg">
                        <div className="space-y-2">
                            <p className="font-semibold flex items-center">
                                <Clipboard className="h-4 w-4 mr-2 text-indigo-600" />
                                <span>Halaman {pageNumber} dari {numPages || 0}</span>
                            </p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={previousPage}
                                    disabled={pageNumber <= 1}
                                    className={`px-3 py-1 rounded-full flex items-center ${pageNumber <= 1
                                        ? "bg-gray-200 text-gray-400"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-300"
                                        }`}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    <span>Previous</span>
                                </button>
                                <button
                                    onClick={nextPage}
                                    disabled={pageNumber >= (numPages || 0)}
                                    className={`px-3 py-1 rounded-full flex items-center ${pageNumber >= (numPages || 0)
                                        ? "bg-gray-200 text-gray-400"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-300"
                                        }`}
                                >
                                    <span>Next</span>
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </button>
                            </div>
                        </div>

                        {viewUrl && (
                            <a
                                href={viewUrl}
                                target="_blank"
                                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-300 shadow-md"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </a>
                        )}
                    </div>

                    <div className="flex justify-center shadow-lg rounded-xl overflow-hidden bg-gray-100 p-6 border border-gray-200">
                        <Document
                            file={pdfBlob}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                                <div className="flex flex-col items-center justify-center space-y-4 h-96 w-full">
                                    <div className="animate-pulse bg-gray-200 h-4 w-32 rounded-full"></div>
                                    <div className="animate-pulse bg-gray-200 h-64 w-full rounded-xl"></div>
                                    <div className="animate-pulse bg-gray-200 h-4 w-48 rounded-full"></div>
                                </div>
                            }
                        >
                            <Page
                                pageNumber={pageNumber}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                scale={1.2}
                                loading={
                                    <div className="flex flex-col items-center justify-center space-y-4 h-96 w-full">
                                        <div className="animate-pulse bg-gray-200 h-4 w-32 rounded-full"></div>
                                        <div className="animate-pulse bg-gray-200 h-64 w-full rounded-xl"></div>
                                        <div className="animate-pulse bg-gray-200 h-4 w-48 rounded-full"></div>
                                    </div>
                                }
                            />
                        </Document>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailItem: React.FC<DetailItemProps> = ({ icon, label, value }) => (
    <div className="group bg-white border border-gray-200 p-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:border-indigo-200 flex items-center space-x-4 transform hover:-translate-y-1">
        <div className="bg-indigo-50 p-3 rounded-full text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            {icon}
        </div>
        <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className="font-semibold text-gray-800 mt-1">{value}</p>
        </div>
    </div>
);

const DetailSuratKeluar = () => {
    const [surat, setSurat] = useState<SuratKeluar | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // const [isModalOpen, setIsModalOpen] = useState(false);
    // const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
    const [isPDF, setIsPDF] = useState(false);
    const [error, setError] = useState("");
    const [filename, setFilename] = useState<string | null>(null);
    const [activePage, setActivePage] = useState("details"); // details, document, generate
    const [darkMode, setDarkMode] = useState(false);
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
            <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-4 border-t-transparent border-r-indigo-400 border-b-transparent border-l-transparent rounded-full animate-spin animation-delay-150"></div>
                    <div className="absolute inset-4 border-4 border-t-transparent border-r-transparent border-b-indigo-200 border-l-transparent rounded-full animate-spin animation-delay-300"></div>
                </div>
                <p className="mt-6 text-indigo-800 font-medium animate-pulse">Memuat data surat...</p>
            </div>
        );
    }

    if (error || !surat) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full transform transition-all hover:scale-105 duration-300">
                    <div className="flex items-center mb-6 text-red-500">
                        <div className="bg-red-50 p-3 rounded-full mr-4">
                            <X className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Gagal mengambil data surat</h2>
                    </div>
                    <p className="text-gray-600 mb-6 border-l-4 border-red-300 pl-3">{error || "Data tidak ditemukan"}</p>
                    <button
                        onClick={() => navigate('/dashboard/surat-keluar')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-all duration-300 shadow-md flex items-center justify-center font-medium"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Kembali ke daftar surat
                    </button>
                </div>
            </div>
        );
    }

    const viewUrl = filename ? generateViewUrl(filename) : null;

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-indigo-50 to-blue-50'} p-4 md:p-8 transition-all duration-500`}>
            <div className="max-w-6xl mx-auto">
                {/* Top Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <button
                        onClick={() => navigate('/dashboard/surat-keluar')}
                        className={`flex items-center ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} transition-colors`}
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        <span>Kembali ke daftar surat</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Mode Tampilan:
                        </span>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`px-3 py-1 rounded-full text-sm ${darkMode
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-indigo-600 border border-indigo-200 shadow-sm'}`}
                        >
                            {darkMode ? 'Mode Terang' : 'Mode Gelap'}
                        </button>
                    </div>
                </div>

                {/* Main Container */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl overflow-hidden transition-all duration-500 transform hover:shadow-2xl`}>
                    {/* Header with ribbon */}
                    <div className="relative bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-8">
                        <div className="absolute top-0 right-0 bg-yellow-500 text-xs font-bold uppercase px-3 py-1 rounded-bl-lg">
                            Surat Keluar
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold flex items-center mb-2">
                                    <FileText className="mr-3 h-8 w-8" />
                                    Detail Surat Keluar
                                </h1>
                                <p className="text-indigo-200 text-lg">
                                    {surat.surat_nomor}
                                </p>
                            </div>

                            <div className="mt-4 md:mt-0 flex gap-2 flex-wrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-800 text-indigo-100 text-sm">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {formatDate(surat.tanggal)}
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-600 text-white text-sm">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Terverifikasi
                                </span>
                            </div>
                        </div>

                        {/* Tab navigation */}
                        <div className="flex flex-wrap gap-2 mt-6 border-b border-indigo-500">
                            <button
                                onClick={() => setActivePage("details")}
                                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${activePage === "details"
                                        ? "bg-white text-indigo-600 shadow-lg"
                                        : "text-indigo-200 hover:text-white hover:bg-indigo-700"
                                    }`}
                            >
                                Detail Surat
                            </button>

                            {viewUrl && (
                                <button
                                    onClick={() => setActivePage("document")}
                                    className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${activePage === "document"
                                            ? "bg-white text-indigo-600 shadow-lg"
                                            : "text-indigo-200 hover:text-white hover:bg-indigo-700"
                                        }`}
                                >
                                    Dokumen
                                </button>
                            )}

                            <button
                                onClick={() => setActivePage("generate")}
                                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${activePage === "generate"
                                        ? "bg-white text-indigo-600 shadow-lg"
                                        : "text-indigo-200 hover:text-white hover:bg-indigo-700"
                                    }`}
                            >
                                Generate PDF
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} transition-all duration-500`}>
                        {/* Details Page */}
                        {activePage === "details" && (
                            <>
                                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl mb-6 flex items-center">
                                    <Info className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                                    <p className="text-gray-700 text-sm">
                                        Berikut adalah detail lengkap surat keluar. Gunakan tab navigasi di atas untuk melihat dokumen atau membuat PDF.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                    <DetailItem
                                        icon={<Hash className="h-5 w-5" />}
                                        label="Nomor Surat"
                                        value={surat.surat_nomor}
                                    />

                                    <DetailItem
                                        icon={<Calendar className="h-5 w-5" />}
                                        label="Tanggal Surat"
                                        value={formatDate(surat.tanggal)}
                                    />

                                    <DetailItem
                                        icon={<Target className="h-5 w-5" />}
                                        label="Sifat Surat"
                                        value={surat.sifat_surat}
                                    />

                                    <DetailItem
                                        icon={<User className="h-5 w-5" />}
                                        label="Pengirim"
                                        value={surat.pengirim}
                                    />

                                    <DetailItem
                                        icon={<Mail className="h-5 w-5" />}
                                        label="Penerima"
                                        value={surat.penerima}
                                    />

                                    <DetailItem
                                        icon={<User className="h-5 w-5" />}
                                        label="Jabatan Pengirim"
                                        value={surat.jabatan_pengirim}
                                    />
                                </div>

                                <div className={`mt-8 p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-all duration-300`}>
                                    <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
                                        <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                                        Isi Surat
                                    </h2>
                                    <div
                                        className={`prose max-w-none ${darkMode ? 'prose-invert' : ''} prose-headings:font-bold prose-headings:text-indigo-600 prose-p:text-justify`}
                                        dangerouslySetInnerHTML={{
                                            __html: surat.isi_surat
                                                ? processHtmlContent(surat.isi_surat)
                                                : '<p class="text-gray-500 italic">Tidak ada isi surat</p>'
                                        }}
                                    ></div>
                                </div>

                                {surat.gambar && (
                                    <div className={`mt-6 p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-all duration-300`}>
                                        <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
                                            <FilePdfFilled className="mr-2 text-indigo-600" />
                                            Gambar Terkait
                                        </h2>
                                        <div className="flex justify-center">
                                            <img
                                                src={surat.gambar}
                                                alt={surat.keterangan_gambar || "Dokumen terkait"}
                                                className="max-h-64 object-contain border border-gray-200 p-2 rounded-lg shadow-sm"
                                            />
                                        </div>
                                        {surat.keterangan_gambar && (
                                            <p className={`text-center mt-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-sm italic`}>
                                                {surat.keterangan_gambar}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Document Page */}
                        {activePage === "document" && viewUrl && (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl mb-6 flex items-center">
                                    <Info className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                                    <p className="text-gray-700 text-sm">
                                        Berikut adalah dokumen asli yang diunggah untuk surat keluar ini.
                                    </p>
                                </div>

                                {filename && isPDF ? (
                                    <PDFPreview filename={filename} />
                                ) : (
                                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl mx-auto">
                                        <div className="flex justify-center items-center h-60 border-2 border-dashed border-gray-200 rounded-xl">
                                            <div className="text-center p-5">
                                                <FilePdfFilled className="text-5xl text-indigo-600 mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold text-gray-800">Dokumen tidak dapat ditampilkan</h3>
                                                <p className="text-gray-500 mt-2">Format file tidak didukung untuk pratinjau.</p>
                                                {viewUrl && (
                                                    <a
                                                        href={viewUrl}
                                                        target="_blank"
                                                        className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-300 shadow-md"
                                                    >
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Download Dokumen
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Generate PDF Page */}
                        {activePage === "generate" && (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-xl mb-6 flex items-center">
                                    <Info className="h-5 w-5 text-indigo-600 mr-3 flex-shrink-0" />
                                    <p className="text-gray-700 text-sm">
                                        Anda dapat membuat atau mencetak PDF dari surat keluar ini. Pratinjau dokumen akan ditampilkan di bawah.
                                    </p>
                                </div>

                                <div className="flex items-center justify-center mb-6">
                                    <button
                                        onClick={handleDownload}
                                        disabled={loading}
                                        className={`px-6 py-3 rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all duration-300 flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                                                Membuat PDF...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="mr-2 h-5 w-5" />
                                                Download PDF
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className={`border-2 border-dashed ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-xl overflow-hidden transition-all duration-300`}>
                                    <PDFContent />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailSuratKeluar;