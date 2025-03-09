import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, DatePicker, Space, Button, Upload, message, Spin } from 'antd';
import { InboxOutlined, FileTextOutlined, EditOutlined, EnvironmentOutlined, LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { SuratMasuk } from '../types/surat';

interface LocationSuggestion {
    id: string;
    name: string;
    type: 'province' | 'regency' | 'district' | 'village';
    parent_id?: string;
    full_address?: string;
}

export interface SuratFormValues {
    tanggal: Dayjs;
    expired_data: Dayjs;
    perihal: string;
    organisasi: string;
    tujuan: string;
    pengirim: string;
    penerima: string;
    sifat_surat: string;
    tanggal_penyelesaian: Dayjs;
    isi_disposisi: string;
    alamat: string;
    provinsi_id?: string;
    provinsi_nama?: string;
    scan_surat?: File;
    diteruskan_kepada: string;
}

interface InputFormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: SuratFormValues | FormData) => Promise<void>;
    loading?: boolean;
    isEdit?: boolean;
    initialData?: SuratMasuk | null;
    title?: string;
}

export const InputForm: React.FC<InputFormProps> = ({
    visible,
    onCancel,
    onSubmit,
    loading,
    isEdit = false,
    initialData = null,
    title = 'Input Surat Masuk Baru',
}) => {
    const [form] = Form.useForm();
    const [fileChanged, setFileChanged] = useState(false);
    const alamatInputRef = useRef<InputRef | null>(null);
    const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [addressInput, setAddressInput] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const fetchLocationSuggestions = async (query: string) => {
        if (!query) return;
        setIsLoadingSuggestions(true);

        try {
            const response = await fetch(`https://api.example.com/location?query=${query}`);
            const data = await response.json();

            const suggestions = data.map((item: LocationSuggestion) => ({
                id: item.id,
                name: item.name,
                type: item.type,
                full_address: item.full_address,
            }));

            setLocationSuggestions(suggestions);
        } catch (error) {
            console.error('Error fetching location suggestions:', error);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    useEffect(() => {
        if (visible) {
            loadDefaultSuggestions();
        }
    }, [visible]);

    const loadDefaultSuggestions = async () => {
        setIsLoadingSuggestions(true);

        try {
            const provinceResponse = await fetch('https://arafie2603.github.io/api-wilayah-indonesia/api/provinces.json');
            if (!provinceResponse.ok) throw new Error('Failed to fetch provinces');
            const provinces = await provinceResponse.json();

            const prioritizedProvinces = [];

            const jakarta = provinces.find((p: { id: string; name: string }) => p.name.toLowerCase().includes('jakarta'));
            const banten = provinces.find((p: { id: string; name: string }) => p.name.toLowerCase().includes('banten'));

            if (jakarta) prioritizedProvinces.push(jakarta);
            if (banten) prioritizedProvinces.push(banten);

            for (const province of provinces) {
                if ((!jakarta || province.id !== jakarta.id) &&
                    (!banten || province.id !== banten.id)) {
                    prioritizedProvinces.push(province);
                }

                if (prioritizedProvinces.length >= 8) break;
            }

            const defaultSuggestions = prioritizedProvinces.map(province => ({
                id: province.id,
                name: province.name,
                type: 'province' as const,
                full_address: `${province.name}`
            }));

            setLocationSuggestions(defaultSuggestions);
        } catch (error) {
            console.error('Error fetching default location suggestions:', error);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAddressInput(value);
        form.setFieldsValue({ alamat: value });

        // Fetch location suggestions
        fetchLocationSuggestions(value);
    };

    const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
        setAddressInput(suggestion.full_address || suggestion.name);
        form.setFieldsValue({
            alamat: suggestion.full_address || suggestion.name,
            provinsi_nama: suggestion.type === 'province' ? suggestion.name : undefined,
            provinsi_id: suggestion.type === 'province' ? suggestion.id : undefined
        });
        setLocationSuggestions([]);
    };

    useEffect(() => {
        if (visible) {
            form.resetFields();
            setAddressInput('');
            setFileList([]); // Reset state

            if (isEdit && initialData) {
                const formattedValues = {
                    ...initialData,
                    tanggal: initialData.tanggal ? dayjs(initialData.tanggal) : undefined,
                    expired_data: initialData.expired_data ? dayjs(initialData.expired_data) : undefined,
                    tanggal_penyelesaian: initialData.tanggal_penyelesaian ? dayjs(initialData.tanggal_penyelesaian) : undefined,
                };

                form.setFieldsValue(formattedValues);

                if (initialData.alamat) {
                    setAddressInput(initialData.alamat);
                }

                if (initialData.scan_surat && typeof initialData.scan_surat === 'string') {
                    const fileType = initialData.scan_surat.toLowerCase().endsWith('.pdf')
                        ? 'application/pdf'
                        : 'image/jpeg';
                    const fileName = initialData.scan_surat.split('/').pop() || 'dokumen';

                    // Make sure to create a proper UploadFile array
                    setFileList([{
                        uid: '-1',
                        name: fileName,
                        status: 'done',
                        url: initialData.scan_surat,
                        type: fileType
                    }]);
                } else {
                    setFileList([]);
                }

                setFileChanged(false);
            }
        }
    }, [visible, isEdit, initialData, form]);

    // Fixed handler to ensure fileList is always correctly processed
    const handleChange = (info: UploadChangeParam) => {
        // Ensure we're working with a proper array
        const newFileList = Array.isArray(info.fileList) ? [...info.fileList] : [];
        setFileList(newFileList);
        setFileChanged(true);
    };

    const beforeUpload = (file: UploadFile) => {
        const isJpgOrPngOrPdf =
            file.type === 'image/jpeg' ||
            file.type === 'image/png' ||
            file.type === 'application/pdf';

        if (!isJpgOrPngOrPdf) {
            message.error('Anda hanya dapat mengunggah file JPG/PNG/PDF!');
            return Upload.LIST_IGNORE;
        }

        const isLt5M = file.size ? file.size / 1024 / 1024 < 5 : true;
        if (!isLt5M) {
            message.error('File harus lebih kecil dari 5MB!');
            return Upload.LIST_IGNORE;
        }

        return false; // Prevent upload
    };

    const convertToFormData = (values: SuratFormValues): FormData => {
        const formData = new FormData();

        // Format tanggal
        if (values.tanggal) {
            formData.append('tanggal', values.tanggal.format('YYYY-MM-DD'));
        }

        if (values.expired_data) {
            formData.append('expired_data', values.expired_data.format('YYYY-MM-DD'));
        }

        if (values.tanggal_penyelesaian) {
            formData.append('tanggal_penyelesaian', values.tanggal_penyelesaian.format('YYYY-MM-DD'));
        }

        // Tambahkan file jika ada
        if (fileChanged && fileList.length > 0 && fileList[0].originFileObj) {
            formData.append('scan_surat', fileList[0].originFileObj);
        }

        // Tambahkan field lainnya
        Object.entries(values).forEach(([key, value]) => {
            if (
                value !== undefined &&
                key !== 'tanggal' &&
                key !== 'expired_data' &&
                key !== 'tanggal_penyelesaian' &&
                key !== 'scan_surat'
            ) {
                formData.append(key, String(value));
            }
        });

        return formData;
    };

    const handleSubmit = async (values: SuratFormValues) => {
        try {
            setSubmitting(true);
            const formData = convertToFormData(values);
            await onSubmit(formData);

            setFileList([]);
            setFileChanged(false);
            form.resetFields();
            message.success(isEdit ? 'Berhasil memperbarui surat!' : 'Berhasil menambahkan surat baru!');
        } catch (err) {
            message.error('Gagal mengunggah data: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setSubmitting(false);
        }
    };

    const renderLocationSuggestions = () => {
        if (locationSuggestions.length === 0) return null;

        return (
            <div className="location-suggestions" style={{
                position: 'absolute',
                width: '100%',
                background: 'white',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                zIndex: 1000,
                maxHeight: '200px',
                overflowY: 'auto',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}>
                {locationSuggestions.map(suggestion => (
                    <div
                        key={`${suggestion.type}-${suggestion.id}`}
                        style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0'
                        }}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            <div>
                                <div>{suggestion.name}</div>
                                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                    {suggestion.type === 'province' ? 'Provinsi' :
                                        suggestion.type === 'regency' ? 'Kabupaten/Kota' :
                                            suggestion.type === 'district' ? 'Kecamatan' : 'Desa/Kelurahan'}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isEdit ? <EditOutlined style={{ color: '#1890ff' }} /> : <FileTextOutlined style={{ color: '#1890ff' }} />}
                    <span>{title}</span>
                </div>
            }
            open={visible}
            onCancel={() => {
                if (submitting) {
                    message.warning('Mohon tunggu, proses penyimpanan sedang berlangsung');
                    return;
                }
                setFileList([]);
                form.resetFields();
                onCancel();
            }}
            width={800}
            footer={null}
            maskClosable={!submitting}
            closable={!submitting}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    name="tanggal"
                    label="Tanggal Surat"
                    rules={[{ required: true, message: 'Mohon pilih tanggal surat!' }]}
                >
                    <DatePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="alamat"
                    label="Alamat/Lokasi"
                    rules={[{ required: true, message: 'Mohon masukkan alamat!' }]}
                >
                    <div style={{ position: 'relative' }}>
                        <Input
                            ref={alamatInputRef}
                            value={addressInput}
                            onChange={handleAddressInputChange}
                            placeholder="Masukkan alamat lengkap"
                            suffix={isLoadingSuggestions ? <Spin size="small" /> : null}
                            onClick={() => {
                                setIsDropdownOpen(true);
                                if (locationSuggestions.length === 0) {
                                    loadDefaultSuggestions();
                                }
                            }}
                            onFocus={() => {
                                setIsDropdownOpen(true);
                                if (locationSuggestions.length === 0) {
                                    loadDefaultSuggestions();
                                }
                            }}
                            onBlur={() => {
                                setTimeout(() => setIsDropdownOpen(false), 200);
                            }}
                            prefix={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
                        />
                        {isDropdownOpen && renderLocationSuggestions()}
                    </div>
                </Form.Item>

                {/* Hidden form items for storing location components */}
                <Form.Item name="provinsi_id" hidden>
                    <Input />
                </Form.Item>
                <Form.Item name="provinsi_nama" hidden>
                    <Input />
                </Form.Item>
                <Form.Item name="kabupaten_id" hidden>
                    <Input />
                </Form.Item>
                <Form.Item name="kabupaten_nama" hidden>
                    <Input />
                </Form.Item>
                <Form.Item name="kecamatan_id" hidden>
                    <Input />
                </Form.Item>
                <Form.Item name="kecamatan_nama" hidden>
                    <Input />
                </Form.Item>
                <Form.Item name="desa_id" hidden>
                    <Input />
                </Form.Item>
                <Form.Item name="desa_nama" hidden>
                    <Input />
                </Form.Item>

                <Form.Item
                    name="perihal"
                    label="Perihal"
                    rules={[{ required: true, message: 'Mohon masukkan perihal surat!' }]}
                >
                    <Input.TextArea rows={3} placeholder="Masukkan perihal surat" />
                </Form.Item>

                <Form.Item
                    name="organisasi"
                    label="Organisasi"
                    rules={[{ required: true, message: 'Mohon masukkan nama organisasi!' }]}
                >
                    <Input placeholder="Masukkan nama organisasi" />
                </Form.Item>

                <Form.Item
                    name="tujuan"
                    label="Tujuan Surat"
                    rules={[{ required: true, message: 'Mohon masukkan tujuan surat!' }]}
                >
                    <Input placeholder="Masukkan tujuan surat" />
                </Form.Item>

                <Form.Item
                    name="pengirim"
                    label="Pengirim"
                    rules={[{ required: true, message: 'Mohon masukkan nama pengirim!' }]}
                >
                    <Input placeholder="Masukkan nama pengirim" />
                </Form.Item>

                <Form.Item
                    name="penerima"
                    label="Penerima"
                    rules={[{ required: true, message: 'Mohon masukkan nama penerima!' }]}
                >
                    <Input placeholder="Masukkan nama penerima" />
                </Form.Item>

                <Form.Item
                    name="sifat_surat"
                    label="Sifat Surat"
                    rules={[{ required: true, message: 'Mohon masukkan sifat surat!' }]}
                >
                    <Input placeholder="Masukkan sifat surat" />
                </Form.Item>

                <Form.Item
                    name="expired_data"
                    label="Expired Data"
                    rules={[{ required: true, message: 'Mohon pilih tanggal expired!' }]}
                >
                    <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>

                <Form.Item
                    name="tanggal_penyelesaian"
                    label="Tanggal Penyelesaian"
                    rules={[{ required: true, message: 'Mohon pilih tanggal penyelesaian!' }]}
                >
                    <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                </Form.Item>

                <Form.Item
                    name="isi_disposisi"
                    label="Disposisi"
                    rules={[{ required: true, message: 'Mohon masukkan disposisi surat!' }]}
                >
                    <Input.TextArea rows={3} placeholder="Mohon masukkan disposisi surat!" />
                </Form.Item>

                <Form.Item
                    name="diteruskan_kepada"
                    label="Diteruskan Kepada"
                    rules={[{ required: true, message: 'Mohon masukkan diteruskan kepada!' }]}
                >
                    <Input placeholder="Mohon masukkan diteruskan kepada!" />
                </Form.Item>

                <Form.Item
                    name="scan_surat"
                    label="Scan Surat"
                >
                    <Upload.Dragger
                        name="scan_surat"
                        fileList={fileList}
                        beforeUpload={beforeUpload}
                        onChange={handleChange}
                        onRemove={() => {
                            setFileList([]);
                            setFileChanged(true);
                            return true;
                        }}
                        accept=".jpg,.jpeg,.png,.pdf"
                        maxCount={1}
                        listType="picture"
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Klik atau seret file ke area ini untuk mengunggah</p>
                        <p className="ant-upload-hint">Support format: .jpg, .jpeg, .png, .pdf (Maks. 5MB)</p>
                    </Upload.Dragger>
                </Form.Item>

                <Form.Item>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button
                            onClick={onCancel}
                            disabled={submitting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting || loading}
                            disabled={submitting || loading}
                            icon={submitting || loading ? <LoadingOutlined /> : <SaveOutlined />}
                        >
                            {submitting || loading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
            {(submitting || loading) && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    borderRadius: '8px'
                }}>
                    <Spin
                        size="large"
                        tip="Sedang menyimpan data..."
                        indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                    />
                </div>
            )}
        </Modal>
    );
};