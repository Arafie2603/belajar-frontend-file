import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    Printer,
    Check,
    Calendar,
    DollarSign,
    CreditCard,
    User,
    FileText,
    Briefcase,
    Hash,
    Clock,
    Image,
    Copy,
    ArrowDownCircle,
    Eye
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

// Definisi tipe data untuk struktur response API
interface UserInfo {
    id: string;
    nama: string;
    jabatan: string;
    nomor_identitas: string;
}

interface FakturData {
    id: string;
    deskripsi: string;
    jumlah_pengeluaran: number;
    metode_pembayaran: string;
    status_pembayaran: string;
    bukti_pembayaran: string;
    tanggal?: string;
    created_at?: string;
    user: UserInfo;
    created_by?: string;
    updated_by?: string;
}

const DetailFaktur = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [showReceipt, setShowReceipt] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const [faktur, setFaktur] = useState<FakturData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api-efiling.vercel.app/';

    useEffect(() => {
        const fetchFakturDetail = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${BASE_URL}api/faktur/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setFaktur(response.data.data);
                setError(null);
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || 'Failed to fetch faktur detail');
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchFakturDetail();
    }, [id, token, BASE_URL]);

    const handleGoBack = () => {
        navigate(-1);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Loading Skeleton
    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen p-4">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 w-40 bg-gray-200 rounded mb-8"></div>
                        <div className="h-48 bg-gray-200 rounded-t-2xl mb-1"></div>
                        <div className="bg-white rounded-b-2xl p-6">
                            <div className="flex flex-wrap -mx-4 mb-6 pb-6 border-b">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-full md:w-1/3 px-4 mb-4">
                                        <div className="flex">
                                            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                                            <div className="ml-4 flex-1">
                                                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                                <div className="h-6 bg-gray-200 rounded w-32"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="bg-gray-100 rounded-xl p-6">
                                        <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                                        <div className="space-y-4">
                                            {[...Array(3)].map((_, j) => (
                                                <div key={j}>
                                                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                                    <div className="h-6 bg-gray-200 rounded w-full"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error Display
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="p-8 rounded-xl shadow-lg bg-white text-center max-w-md">
                    <div className="text-red-500 text-xl mb-4 font-bold">Error!</div>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={handleGoBack}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    if (!faktur) {
        return null;
    }

    // Status display helper
    const isCompleted = faktur.status_pembayaran.toLowerCase().includes('lunas');

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Top Navigation */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <button
                        onClick={handleGoBack}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Kembali ke Daftar Faktur</span>
                    </button>
                    <div className="flex items-center space-x-3">
                        <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition">
                            <Printer className="w-5 h-5 text-gray-700" />
                        </button>
                        <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition">
                            <Download className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl p-8 text-white">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                            <h1 className="text-3xl font-bold">Detail Faktur</h1>
                            <div className="mt-2 flex items-center">
                                <div className="text-blue-200">ID: {faktur.id.substring(0, 8)}...</div>
                                <button
                                    onClick={() => copyToClipboard(faktur.id)}
                                    className="ml-2 text-blue-200 hover:text-white transition"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                {copySuccess && <span className="ml-2 text-xs bg-blue-800 px-2 py-1 rounded">Copied!</span>}
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <div className={`px-4 py-2 rounded-full ${isCompleted
                                    ? 'bg-green-500'
                                    : 'bg-yellow-500'
                                } flex items-center`}>
                                {isCompleted ? (
                                    <Check className="w-5 h-5 mr-2" />
                                ) : (
                                    <Clock className="w-5 h-5 mr-2" />
                                )}
                                <span className="font-medium capitalize">{faktur.status_pembayaran}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-b-2xl shadow-xl overflow-hidden">
                    {/* Summary Card */}
                    <div className="p-6 border-b">
                        <div className="flex flex-wrap -mx-4">
                            <div className="w-full md:w-1/3 px-4 mb-4 md:mb-0">
                                <div className="flex items-center">
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <Calendar className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm text-gray-500">Tanggal</div>
                                        <div className="font-semibold">{formatDate(faktur.tanggal || faktur.created_at)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-1/3 px-4 mb-4 md:mb-0">
                                <div className="flex items-center">
                                    <div className="bg-green-100 p-3 rounded-full">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm text-gray-500">Jumlah</div>
                                        <div className="font-semibold text-green-600">{formatCurrency(faktur.jumlah_pengeluaran)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-1/3 px-4">
                                <div className="flex items-center">
                                    <div className="bg-purple-100 p-3 rounded-full">
                                        <CreditCard className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm text-gray-500">Metode Pembayaran</div>
                                        <div className="font-semibold capitalize">{faktur.metode_pembayaran}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Information */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Invoice Info */}
                        <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center mb-4">
                                <FileText className="text-blue-600 w-5 h-5 mr-2" />
                                <h2 className="text-lg font-bold text-gray-800">Informasi Faktur</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Deskripsi</label>
                                    <p className="font-medium text-gray-800">{faktur.deskripsi}</p>
                                </div>
                                {faktur.created_by && (
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Dibuat Oleh</label>
                                        <p className="font-medium text-gray-800">{faktur.created_by}</p>
                                    </div>
                                )}
                                {faktur.updated_by && (
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Diperbarui Oleh</label>
                                        <p className="font-medium text-gray-800">{faktur.updated_by}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center mb-4">
                                <User className="text-blue-600 w-5 h-5 mr-2" />
                                <h2 className="text-lg font-bold text-gray-800">Informasi Pengguna</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Nama</label>
                                    <p className="font-medium text-gray-800">{faktur.user.nama}</p>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Jabatan</label>
                                    <div className="flex items-center">
                                        <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                                        <p className="font-medium text-gray-800">{faktur.user.jabatan}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Nomor Identitas</label>
                                    <div className="flex items-center">
                                        <Hash className="w-4 h-4 mr-2 text-gray-500" />
                                        <p className="font-medium text-gray-800">{faktur.user.nomor_identitas}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Receipt */}
                    {faktur.bukti_pembayaran && (
                        <div className="p-6 border-t">
                            <div className="bg-blue-50 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <Image className="text-blue-600 w-5 h-5 mr-2" />
                                        <h2 className="text-lg font-bold text-gray-800">Bukti Pembayaran</h2>
                                    </div>
                                    <button
                                        onClick={() => setShowReceipt(!showReceipt)}
                                        className="flex items-center text-blue-600 hover:text-blue-800 transition"
                                    >
                                        {showReceipt ? 'Tutup' : 'Lihat'}
                                        <Eye className="w-4 h-4 ml-1" />
                                    </button>
                                </div>

                                {showReceipt && (
                                    <div className="mt-4 transition-all duration-300 ease-in-out">
                                        <div className="bg-white p-4 rounded-lg shadow-md">
                                            <img
                                                src={faktur.bukti_pembayaran}
                                                alt="Bukti Pembayaran"
                                                className="mx-auto rounded-lg max-h-64 object-contain"
                                            />
                                            <div className="mt-4 flex justify-center">
                                                <a
                                                    href={faktur.bukti_pembayaran}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                                >
                                                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                                                    Unduh Bukti Pembayaran
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Footer */}
                    <div className="bg-gray-50 p-6 border-t flex flex-col sm:flex-row justify-between items-center">
                        <div className="text-sm text-gray-500 mb-4 sm:mb-0">
                            ID Faktur: {faktur.id}
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={handleGoBack}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                            >
                                Kembali
                            </button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
                                <Printer className="w-4 h-4 mr-2" />
                                Cetak
                            </button>
                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center">
                                <Download className="w-4 h-4 mr-2" />
                                Unduh
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailFaktur;