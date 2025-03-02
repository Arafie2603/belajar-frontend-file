import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface RegisterValues {
    nama: string;
    nomor_identitas: string;
    fakultas: string;
    prodi: string;
    alamat: string;
    jabatan: string;
    password: string;
    konfirmasi_password: string;
    no_telp: string;
    foto?: File;
}

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<RegisterValues>({
        nama: '',
        nomor_identitas: '',
        fakultas: '',
        prodi: '',
        alamat: '',
        jabatan: '',
        password: '',
        konfirmasi_password: '',
        no_telp: '',
    });
    const [step, setStep] = useState(1);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [customFakultas, setCustomFakultas] = useState(false);
    const [customProdi, setCustomProdi] = useState(false);
    const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
    const [passwordStrength, setPasswordStrength] = useState<number>(0);

    const fakultasList = [
        "FTI", "FHSD", "FIK"
    ];

    const prodiMapping: Record<string, string[]> = {
        "FTI": ["Teknik Informatika", "Sistem Informasi", "Teknik Elektro", "Lainnya"],
        "FHSD": ["Hukum", "Ilmu Komunikasi", "Sastra Indonesia", "Lainnya"],
        "FIK": ["Ilmu Keperawatan", "Farmasi", "Kesehatan Masyarakat", "Lainnya"],
        "Lainnya": ["Lainnya"]
    };

    // Password strength checker
    useEffect(() => {
        if (!formData.password) {
            setPasswordStrength(0);
            return;
        }

        let strength = 0;
        if (formData.password.length >= 8) strength += 1;
        if (/[A-Z]/.test(formData.password)) strength += 1;
        if (/[0-9]/.test(formData.password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;

        setPasswordStrength(strength);
    }, [formData.password]);

    // Phone number validation
    useEffect(() => {
        if (!formData.no_telp) {
            setPhoneValid(null);
            return;
        }

        const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/;
        setPhoneValid(phoneRegex.test(formData.no_telp));
    }, [formData.no_telp]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
    
        if (name === 'fakultas' && value === 'Lainnya') {
            // Just enable custom input without changing the value yet
            setCustomFakultas(true);
            setFormData({
                ...formData,
                prodi: '' // Reset prodi since fakultas changed
            });
        } else if (name === 'prodi' && value === 'Lainnya') {
            // Just enable custom input without changing the value yet
            setCustomProdi(true);
        } else {
            // For all inputs including the custom text inputs for fakultas and prodi
            setFormData({
                ...formData,
                [name]: value
            });
    
            // If changing fakultas dropdown back to a standard option
            if (name === 'fakultas' && customFakultas) {
                setCustomFakultas(false);
                setCustomProdi(false);
                setFormData({
                    ...formData,
                    [name]: value,
                    prodi: ''
                });
            }
            
            // If changing prodi dropdown back to a standard option
            if (name === 'prodi' && customProdi) {
                setCustomProdi(false);
                setFormData({
                    ...formData,
                    [name]: value
                });
            }
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError('Ukuran foto tidak boleh lebih dari 2MB');
                return;
            }

            setFormData({
                ...formData,
                foto: file
            });

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateStep1 = () => {
        if (!formData.nama || !formData.nomor_identitas || !formData.fakultas || !formData.prodi) {
            setError('Mohon lengkapi semua field yang diperlukan');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.alamat || !formData.jabatan || !formData.no_telp) {
            setError('Mohon lengkapi semua field yang diperlukan');
            return false;
        }

        if (!phoneValid) {
            setError('Format nomor telepon tidak valid. Gunakan format: +628xxx atau 08xxx');
            return false;
        }

        return true;
    };

    const validateStep3 = () => {
        if (!formData.password || !formData.konfirmasi_password) {
            setError('Mohon lengkapi password');
            return false;
        }

        if (formData.password !== formData.konfirmasi_password) {
            setError('Konfirmasi password tidak cocok');
            return false;
        }

        if (formData.password.length < 3) {
            setError('Password minimal 6 karakter');
            return false;
        }

        return true;
    };

    const nextStep = () => {
        setError('');
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        }
    };

    const prevStep = () => {
        setError('');
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const submitForm = async () => {
        if (!validateStep3()) return;

        try {
            setLoading(true);
            setError('');
            const BASE_URL = "https://api-efiling.vercel.app/";

            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== 'konfirmasi_password' && key !== 'foto') {
                    submitData.append(key, formData[key as keyof RegisterValues] as string);
                }
            });

            if (formData.foto) {
                submitData.append('foto', formData.foto);
            }

            const response = await axios.post(`${BASE_URL}api/users/register`, submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('Registration successful:', response.data);

            if (response.data && response.data.data && response.data.data.token) {
                localStorage.setItem('token', response.data.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }

            setSuccess('Registrasi berhasil! Silahkan login dengan akun Anda.');

            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            console.error('Registration error:', err);
            if (axios.isAxiosError(err)) {
                setError(`Registrasi gagal: ${err.response?.data?.message || 'Terjadi kesalahan'}`);
            } else {
                setError((err as Error).message || 'Terjadi kesalahan pada server');
            }
        } finally {
            setLoading(false);
        }
    };

    const progressPercentage = ((step - 1) / 2) * 100;

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                id="nama"
                                name="nama"
                                value={formData.nama}
                                onChange={handleInputChange}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="Masukkan nama lengkap Anda"
                                required
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <label htmlFor="nomor_identitas" className="block text-sm font-medium text-gray-700 mb-1">
                                Nomor Identitas
                            </label>
                            <input
                                type="text"
                                id="nomor_identitas"
                                name="nomor_identitas"
                                value={formData.nomor_identitas}
                                onChange={handleInputChange}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="Masukkan nomor identitas Anda"
                                required
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            <label htmlFor="fakultas" className="block text-sm font-medium text-gray-700 mb-1">
                                Fakultas
                            </label>
                            {!customFakultas ? (
                                <select
                                    id="fakultas"
                                    name="fakultas"
                                    value={formData.fakultas}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    required
                                >
                                    <option value="">Pilih Fakultas</option>
                                    {fakultasList.map((fakultas) => (
                                        <option key={fakultas} value={fakultas}>{fakultas}</option>
                                    ))}
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    id="fakultas"
                                    name="fakultas"
                                    value={formData.fakultas}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    placeholder="Masukkan nama fakultas Anda"
                                    required
                                />
                            )}
                            {customFakultas && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCustomFakultas(false);
                                        setFormData(prev => ({ ...prev, fakultas: '' }));
                                    }}
                                    className="mt-1 text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                    Kembali ke pilihan fakultas
                                </button>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                        >
                            <label htmlFor="prodi" className="block text-sm font-medium text-gray-700 mb-1">
                                Program Studi
                            </label>
                            {!customProdi ? (
                                <select
                                    id="prodi"
                                    name="prodi"
                                    value={formData.prodi}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    disabled={!formData.fakultas && !customFakultas}
                                    required
                                >
                                    <option value="">Pilih Program Studi</option>
                                    {formData.fakultas && prodiMapping[formData.fakultas]?.map((prodi) => (
                                        <option key={prodi} value={prodi}>{prodi}</option>
                                    ))}
                                    {/* Add Lainnya option for custom fakultas */}
                                    {customFakultas && <option value="Lainnya">Lainnya</option>}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    id="prodi"
                                    name="prodi"
                                    value={formData.prodi}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    placeholder="Masukkan nama program studi Anda"
                                    required
                                />
                            )}
                            {customProdi && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCustomProdi(false);
                                        setFormData(prev => ({ ...prev, prodi: '' }));
                                    }}
                                    className="mt-1 text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                    Kembali ke pilihan program studi
                                </button>
                            )}
                        </motion.div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-1">
                                Alamat
                            </label>
                            <textarea
                                id="alamat"
                                name="alamat"
                                value={formData.alamat}
                                onChange={handleInputChange}
                                rows={3}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="Masukkan alamat lengkap Anda"
                                required
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <label htmlFor="jabatan" className="block text-sm font-medium text-gray-700 mb-1">
                                Jabatan
                            </label>
                            <input
                                type="text"
                                id="jabatan"
                                name="jabatan"
                                value={formData.jabatan}
                                onChange={handleInputChange}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                placeholder="Masukkan jabatan Anda"
                                required
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            <label htmlFor="no_telp" className="block text-sm font-medium text-gray-700 mb-1">
                                Nomor Telepon
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    id="no_telp"
                                    name="no_telp"
                                    value={formData.no_telp}
                                    onChange={handleInputChange}
                                    className={`block w-full px-4 py-3 border rounded-lg bg-white focus:ring-2 focus:border-2 transition ${phoneValid === true ? 'border-green-500 focus:ring-green-500 focus:border-green-500' :
                                        phoneValid === false ? 'border-red-500 focus:ring-red-500 focus:border-red-500' :
                                            'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                                        }`}
                                    placeholder="Contoh: +628123456789 atau 08123456789"
                                    required
                                />
                                {phoneValid !== null && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        {phoneValid ? (
                                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                )}
                            </div>
                            {phoneValid === false && (
                                <p className="mt-1 text-sm text-red-600">
                                    Format nomor telepon tidak valid. Gunakan format: +628xxx atau 08xxx
                                </p>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                        >
                            <label htmlFor="foto" className="block text-sm font-medium text-gray-700 mb-1">
                                Foto Profil (Opsional)
                            </label>
                            <div className="mt-1 flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="Preview"
                                            className="h-20 w-20 rounded-full object-cover border-2 border-indigo-300"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-400">
                                            <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition"
                                    >
                                        <span>Upload Foto</span>
                                        <input
                                            id="file-upload"
                                            name="foto"
                                            type="file"
                                            className="sr-only"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF hingga 2MB</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    placeholder="Minimal 6 karakter"
                                    required
                                />
                            </div>
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex gap-1">
                                        {[...Array(4)].map((_, index) => (
                                            <div
                                                key={index}
                                                className={`h-1 rounded-full flex-1 ${index < passwordStrength ?
                                                    index === 0 ? 'bg-red-400' :
                                                        index === 1 ? 'bg-orange-400' :
                                                            index === 2 ? 'bg-yellow-400' :
                                                                'bg-green-400'
                                                    : 'bg-gray-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {passwordStrength === 0 && "Sangat lemah"}
                                        {passwordStrength === 1 && "Lemah - tambahkan huruf kapital dan angka"}
                                        {passwordStrength === 2 && "Sedang - tambahkan karakter khusus"}
                                        {passwordStrength === 3 && "Kuat - password aman"}
                                        {passwordStrength === 4 && "Sangat kuat - password sangat aman"}
                                    </p>
                                </div>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <label htmlFor="konfirmasi_password" className="block text-sm font-medium text-gray-700 mb-1">
                                Konfirmasi Password
                            </label>
                            <input
                                type="password"
                                id="konfirmasi_password"
                                name="konfirmasi_password"
                                value={formData.konfirmasi_password}
                                onChange={handleInputChange}
                                className={`block w-full px-4 py-3 border rounded-lg bg-white focus:ring-2 focus:border-indigo-500 transition ${formData.password && formData.konfirmasi_password ?
                                    formData.password === formData.konfirmasi_password ?
                                        'border-green-500 focus:ring-green-500' :
                                        'border-red-500 focus:ring-red-500' :
                                    'border-gray-300 focus:ring-indigo-500'
                                    }`}
                                placeholder="Masukkan kembali password Anda"
                                required
                            />
                            {formData.password && formData.konfirmasi_password && formData.password !== formData.konfirmasi_password && (
                                <p className="mt-1 text-sm text-red-600">Password tidak cocok</p>
                            )}
                        </motion.div>

                        <div className="pt-4">
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-sm text-gray-500"
                            >
                                Dengan mendaftar, Anda menyetujui Syarat dan Ketentuan serta Kebijakan Privasi kami.
                            </motion.p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    return (
        <div className=" min-h-screen flex  items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 p-6">
            <div className="w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-center">
                        <div className="absolute top-0 left-0 w-full h-full opacity-20">
                            <svg width="100%" height="100%" fill="none">
                                <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                    <circle cx="1" cy="1" r="1" fill="white" />
                                </pattern>
                                <rect width="100%" height="100%" fill="url(#pattern)" />
                            </svg>
                        </div>
                        <motion.h2
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-white text-3xl font-bold mb-1 relative z-10"
                        >
                            Create Account
                        </motion.h2>
                        <p className="text-indigo-100 mb-6 relative z-10">Join our community today</p>

                        <div className="w-full bg-white/20 rounded-full h-2 mb-2 relative z-10">
                            <motion.div
                                className="bg-white h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-indigo-100 relative z-10">
                            <span className={`${step >= 1 ? "font-semibold" : ""} transition-all`}>Identitas</span>
                            <span className={`${step >= 2 ? "font-semibold" : ""} transition-all`}>Informasi</span>
                            <span className={`${step >= 3 ? "font-semibold" : ""} transition-all`}>Keamanan</span>
                        </div>
                    </div>

                    <div className="p-8">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm"
                                >
                                    {success}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={(e) => e.preventDefault()}>
                            {renderStepContent()}

                            <div className="mt-8 flex justify-between items-center">
                                {step > 1 ? (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    >
                                        Kembali
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => navigate('/')}
                                        className="px-4 py-2 text-gray-600 hover:text-indigo-600 transition-colors focus:outline-none"
                                    >
                                        Sudah punya akun?
                                    </button>
                                )}

                                {step < 3 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Lanjut
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={submitForm}
                                        disabled={loading}
                                        className={`px-6 py-2 bg-indigo-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                                    >
                                        {loading ? (
                                            <div className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Memproses...
                                            </div>
                                        ) : 'Daftar'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="px-8 pb-6 text-center">
                        <p className="text-xs text-gray-500">
                            E-Filing - © 2023 All Rights Reserved
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;