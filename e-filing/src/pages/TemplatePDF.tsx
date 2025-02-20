import { useState } from 'react';
import { X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import headerPDF from '../assets/images-resource/headersurat.jpeg';

const TemplatePDF = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleShowModal = () => {
        setIsModalOpen(true);
    };

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
            
            pdf.save('surat-keterangan-penelitian.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
        setLoading(false);
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
                    SURAT KETERANGAN SELESAI PENELITIAN
                </h1>
            </div>

            {/* Document Content */}
            <div style={{ lineHeight: '1.8' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div className="flex" style={{ marginBottom: '0.5rem' }}>
                        <span className="w-32">No.</span>
                        <span>: H/UBL/LAB/010/65/07/24</span>
                    </div>
                    <div className="flex">
                        <span className="w-32">Lampiran</span>
                        <span>: -</span>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem', paddingTop: '1rem' }}>
                    Yang bertanda tangan di bawah ini:
                </div>
                
                <div style={{ marginLeft: '2rem', marginBottom: '2rem' }}>
                    <div className="flex" style={{ marginBottom: '0.5rem' }}>
                        <span className="w-32">Nama</span>
                        <span>: Achmad Syarif, S.T., M.Kom</span>
                    </div>
                    <div className="flex">
                        <span className="w-32">Jabatan</span>
                        <span>: Kepala Lab ICT</span>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem', paddingTop: '0.5rem' }}>
                    Dengan ini menerangkan bahwa mahasiswa berikut ini:
                </div>

                <div style={{ marginLeft: '2rem', marginBottom: '2rem' }}>
                    <div className="flex" style={{ marginBottom: '0.5rem' }}>
                        <span className="w-32">Nama</span>
                        <span>: Muhammad Reza Calvino</span>
                    </div>
                    <div className="flex" style={{ marginBottom: '0.5rem' }}>
                        <span className="w-32">NIM</span>
                        <span>: 201100301</span>
                    </div>
                    <div className="flex" style={{ marginBottom: '0.5rem' }}>
                        <span className="w-32">Program Studi</span>
                        <span>: Teknik Informatika</span>
                    </div>
                    <div className="flex">
                        <span className="w-32">Fakultas</span>
                        <span>: Teknologi Informasi</span>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', paddingTop: '1rem', lineHeight: '1.8' }}>
                    Telah selesai melakukan penelitian di Lab ICT tentang pembuatan aplikasi presence berbasis 
                    Android untuk wadah Lab ICT melalui pengambilan wajah. Penelitian tersebut dilakukan dari 
                    tanggal 22 Mei 2024 sampai dengan 15 Juli 2024 yang digunakan untuk Laporan Tugas Akhir 
                    (skripsi).
                </div>

                <div style={{ marginBottom: '2rem', lineHeight: '1.8' }}>
                    Demikian surat keterangan ini dibuat dengan sebenar-benarnya dan tanpa ada paksaan dari 
                    pihak manapun.
                </div>
            </div>

            {/* Footer with Signature */}
            <div style={{ marginTop: '3rem', textAlign: 'right' }}>
                <p>Jakarta, 16 Juli 2024</p>
                <div style={{ height: '8rem', position: 'relative' }}>
                    <img
                        src="/api/placeholder/150/150"
                        alt="Signature and Stamp"
                        className="absolute right-0 top-0 object-contain"
                    />
                </div>
                <p>Achmad Syarif, S.T., M.Kom</p>
                <p>(Kepala Lab ICT)</p>
            </div>
        </div>
    );

    return (
        <div className="p-4">
            <button
                onClick={handleShowModal}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Generate PDF
            </button>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white/90 rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4">
                            <h2 className="text-xl font-semibold">Preview PDF</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
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
                                Cetak
                            </button>
                            <button 
                                onClick={handleDownload}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                            >
                                {loading ? 'Processing...' : 'Download'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplatePDF;