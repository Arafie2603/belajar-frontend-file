/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
    Layout,
    Table,
    Button,
    Modal,
    message,
    Card,
    Typography,
    Form,
    Input,
    Space,
    Tooltip,
    Upload,
    Alert,
    Select,
    InputNumber,
    DatePicker,
    Tag,
    Result,
    Flex,
    Badge,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    InboxOutlined,
    SearchOutlined,
    DollarOutlined,
    CalendarOutlined,
    ExclamationCircleOutlined,
    FilterOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { UploadProps } from 'antd';
import { useFakturCache } from '../hooks/useFakturCache';
import { useAuth } from '../hooks/useAuth';
import { eventBus, DATA_EVENTS } from '../utils/eventBus';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);


const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

interface User {
    id: string;
    nama: string;
    jabatan: string;
    nomor_identitas: string;
}

interface FakturType {
    id: string;
    bukti_pembayaran: string;
    deskripsi: string;
    jumlah_pengeluaran: number;
    metode_pembayaran: string;
    status_pembayaran: string;
    user?: User;
    tanggal: string;
    created_by: string;
    updated_by: string;
}

const formatToIDR = (value: number | undefined): string => {
    if (value === undefined) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

interface FormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
    submitting: boolean;
    initialValues?: FakturType | null;
    isEdit?: boolean;
}

const FakturForm: React.FC<FormProps> = ({
    visible,
    onCancel,
    onSubmit,
    submitting,
    initialValues = null,
    isEdit = false
}) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<any[]>([]);

    // Reset form when modal visibility changes or initialValues change
    useEffect(() => {
        if (visible) {
            form.resetFields();

            if (initialValues) {
                form.setFieldsValue(initialValues);

                // Set file list if there's an existing image
                if (initialValues.bukti_pembayaran) {
                    setFileList([
                        {
                            uid: '-1',
                            name: 'Current File',
                            status: 'done',
                            url: initialValues.bukti_pembayaran,
                            thumbUrl: initialValues.bukti_pembayaran
                        }
                    ]);
                } else {
                    setFileList([]);
                }
            } else {
                setFileList([]);
            }
        }
    }, [visible, initialValues, form]);

    const uploadProps: UploadProps = {
        name: "bukti_pembayaran",
        multiple: false,
        accept: ".pdf,.jpg,.jpeg,.png",
        maxCount: 1,
        fileList: fileList,
        onChange(info) {
            setFileList(info.fileList);
        },
        beforeUpload: (file) => {
            const isValidType = file.type === "application/pdf" || file.type.startsWith("image/");
            const isValidSize = file.size / 1024 / 1024 < 5;

            if (!isValidType) {
                message.error("Hanya mendukung file PDF dan gambar!");
                return Upload.LIST_IGNORE;
            }

            if (!isValidSize) {
                message.error("Ukuran file tidak boleh lebih dari 5MB!");
                return Upload.LIST_IGNORE;
            }

            return false;
        },
    };

    const handleSubmit = (values: any) => {
        const formData = new FormData();

        // Add all form values to FormData
        Object.entries(values).forEach(([key, value]: [string, any]) => {
            if (value !== undefined && value !== null) {
                // Handle jumlah_pengeluaran specially to ensure it's sent as a number
                if (key === 'jumlah_pengeluaran') {
                    formData.append(key, value.toString());
                } else if (key === 'tanggal') {
                    const date = dayjs(values.tanggal);
                    value.tanggal = date.format('DD/MM/YYYY');
                    formData.append(key, value.tanggal);
                } else {
                    formData.append(key, value);
                }
            }
        });

        // Add file if a new file has been selected
        if (fileList.length > 0 && fileList[0].originFileObj) {
            formData.append('bukti_pembayaran', fileList[0].originFileObj);
        }

        // For edit mode, we need to handle whether a new file was selected
        if (isEdit) {
            formData.append('keep_existing_file', (!fileList.length || !fileList[0].originFileObj) ? 'true' : 'false');
        }

        onSubmit(formData);
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarOutlined style={{ color: '#1890ff' }} />
                    <span>{isEdit ? 'Edit Faktur' : 'Input Faktur Baru'}</span>
                </div>
            }
            open={visible}
            onCancel={() => {
                form.resetFields();
                setFileList([]);
                onCancel();
            }}
            width={700}
            footer={[
                <Button key="back" onClick={onCancel}>
                    Batal
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={submitting}
                    onClick={() => form.submit()}
                >
                    {isEdit ? 'Simpan Perubahan' : 'Simpan'}
                </Button>,
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    name="deskripsi"
                    label="Deskripsi"
                    rules={[
                        { required: true, message: 'Mohon isi deskripsi faktur!' },
                        { min: 3, message: 'Deskripsi harus memiliki minimal 3 karakter!' }
                    ]}
                >
                    <TextArea rows={4} placeholder="Masukkan deskripsi faktur" />
                </Form.Item>

                <Form.Item
                    name="tanggal"
                    label="Tanggal"
                    rules={[{ required: true, message: 'Mohon pilih tanggal!' }]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        format="YYYY-MM-DD"
                        placeholder="Pilih tanggal"
                    />
                </Form.Item>


                <Form.Item
                    name="jumlah_pengeluaran"
                    label="Jumlah Pengeluaran (Rp)"
                    rules={[{ required: true, message: 'Mohon isi jumlah pengeluaran!' }]}
                >
                    <InputNumber<number>
                        style={{ width: '100%' }}
                        placeholder="Masukkan jumlah pengeluaran"
                        formatter={(value) =>
                            value ? `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
                        }
                        parser={(value) =>
                            value ? Number(value.replace(/Rp\s?|(\.)/g, '')) || 0 : 0
                        }
                        min={0}
                    />
                </Form.Item>

                <Form.Item
                    name="metode_pembayaran"
                    label="Metode Pembayaran"
                    rules={[{ required: true, message: 'Mohon pilih metode pembayaran!' }]}
                >
                    <Select placeholder="Pilih metode pembayaran">
                        <Option value="cash">Cash</Option>
                        <Option value="transfer">Transfer Bank</Option>
                        <Option value="qris">QRIS</Option>
                        <Option value="kartu_kredit">Kartu Kredit</Option>
                        <Option value="kartu_debit">Kartu Debit</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="status_pembayaran"
                    label="Status Pembayaran"
                    rules={[{ required: true, message: 'Mohon pilih status pembayaran!' }]}
                >
                    <Select placeholder="Pilih status pembayaran">
                        <Option value="lunas">Lunas</Option>
                        <Option value="belum_lunas">Belum Lunas</Option>
                        <Option value="sebagian">Dibayar Sebagian</Option>
                        <Option value="dibatalkan">Dibatalkan</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    name="bukti_pembayaran"
                    label="Bukti Pembayaran"
                >
                    <Dragger {...uploadProps}>
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">
                            {fileList.length > 0 && fileList[0].url
                                ? 'File saat ini: ' + fileList[0].name
                                : 'Klik atau seret file ke area ini untuk mengunggah'}
                        </p>
                        <p className="ant-upload-hint">
                            Mendukung file PDF atau gambar. Maksimal ukuran file 5MB.
                        </p>
                    </Dragger>
                </Form.Item>
            </Form>
        </Modal>
    );
};


// Multi-delete confirmation modal
const DeleteConfirmationModal: React.FC<{
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    selectedItems: FakturType[];
    loading: boolean;
}> = ({ visible, onCancel, onConfirm, selectedItems, loading }) => {
    return (
        <Modal
            title={null}
            open={visible}
            footer={null}
            onCancel={onCancel}
            width={500}
            className="delete-confirmation-modal"
            closable={!loading}
            maskClosable={!loading}
        >
            <Result
                status="warning"
                icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
                title="Konfirmasi Penghapusan"
                subTitle={
                    <div>
                        <Paragraph style={{ fontSize: '16px', marginBottom: '24px' }}>
                            Anda akan menghapus <Text strong>{selectedItems.length}</Text> faktur berikut:
                        </Paragraph>
                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            padding: '12px',
                            border: '1px solid #f0f0f0',
                            borderRadius: '4px',
                            backgroundColor: '#fafafa',
                            marginBottom: '24px'
                        }}>
                            {selectedItems.map((item, index) => (
                                <div key={item.id} style={{
                                    padding: '8px 12px',
                                    marginBottom: '8px',
                                    backgroundColor: 'white',
                                    borderRadius: '4px',
                                    border: '1px solid #f0f0f0'
                                }}>
                                    <div><Text strong>{index + 1}. {item.deskripsi.substring(0, 30)}{item.deskripsi.length > 30 ? '...' : ''}</Text></div>
                                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                                        <CalendarOutlined style={{ marginRight: '4px' }} />
                                        {dayjs(item.tanggal).format('DD MMM YYYY')} |
                                        <DollarOutlined style={{ margin: '0 4px 0 8px' }} />
                                        Rp {formatToIDR(item.jumlah_pengeluaran)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Alert
                            message="Peringatan: Tindakan ini tidak dapat dibatalkan"
                            type="error"
                            showIcon
                            style={{ marginBottom: '24px' }}
                        />
                    </div>
                }
                extra={[
                    <Flex gap="middle" justify="center">
                        <Button onClick={onCancel} disabled={loading}>
                            Batal
                        </Button>
                        <Button danger type="primary" onClick={onConfirm} loading={loading}>
                            Hapus ({selectedItems.length} faktur)
                        </Button>
                    </Flex>
                ]}
            />
        </Modal>
    );
};

const Faktur: React.FC = () => {
    const { isAuthenticated, token } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<FakturType | null>(null);
    const [searchText, setSearchText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [selectedItems, setSelectedItems] = useState<FakturType[]>([]);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [filters, setFilters] = useState<Record<string, any>>({});
    const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api-efiling.vercel.app/';
    const navigate = useNavigate();

    const {
        data,
        loading,
        error,
        fetchFakturById,
        updateFaktur,
        deleteFaktur,
        refreshData
    } = useFakturCache(BASE_URL);

    // Create a memoized callback for refreshData to avoid recreating it on every render
    const refreshDataCallback = useCallback(() => {
        refreshData();
    }, [refreshData]);

    useEffect(() => {
        if (!isAuthenticated) {
            window.location.href = '/';
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Use the return value from eventBus.on() as the unsubscribe function
        const unsubscribeFaktur = eventBus.on(DATA_EVENTS.FAKTUR_UPDATED, refreshDataCallback);
        const unsubscribeAnyData = eventBus.on(DATA_EVENTS.ANY_DATA_UPDATED, refreshDataCallback);

        return () => {
            // Call the unsubscribe functions
            unsubscribeFaktur();
            unsubscribeAnyData();
        };
    }, [refreshDataCallback]);

    const handleEdit = async (record: FakturType) => {
        try {
            const currentFaktur = await fetchFakturById(record.id);
            if (currentFaktur) {
                setCurrentRecord(currentFaktur as FakturType);
                setIsEditModalVisible(true);
            }
        } catch (err) {
            const error = err as Error;
            message.error('Gagal mengambil data faktur: ' + (error.message || 'Unknown error'));
        }
    };

    const handleViewDetail = async (record: FakturType) => {
        navigate(`/dashboard/faktur/${record.id}`);
    };

    const handleDelete = async (id: string) => {
        confirm({
            title: 'Konfirmasi Penghapusan',
            icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
            content: (
                <div>
                    <p>Apakah Anda yakin ingin menghapus faktur ini?</p>
                    <Alert
                        message="Peringatan: Tindakan ini tidak dapat dibatalkan"
                        type="error"
                        showIcon
                        style={{ marginTop: '16px' }}
                    />
                </div>
            ),
            okText: 'Ya, Hapus',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
                try {
                    await deleteFaktur(id);
                    message.success('Faktur berhasil dihapus!');
                    // No need to call refreshData here, it will be triggered by the event
                } catch (err) {
                    const error = err as Error;
                    console.error('Error deleting faktur:', error);
                    message.error(error.message || 'Gagal menghapus faktur!');
                }
            },
        });
    };

    const handleMultipleDelete = async () => {
        setDeleteLoading(true);
        try {
            // Process deletions sequentially to ensure all are handled
            for (const id of selectedRowKeys) {
                await deleteFaktur(id.toString());
            }

            message.success(`${selectedRowKeys.length} faktur berhasil dihapus!`);
            setSelectedRowKeys([]);
            setSelectedItems([]);
            setIsDeleteModalVisible(false);
            // Refresh data will be triggered by event
        } catch (err) {
            const error = err as Error;
            message.error('Gagal menghapus beberapa faktur: ' + (error.message || 'Unknown error'));
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setSubmitting(true);
        try {
            await axios.post(`${BASE_URL}api/faktur`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
            });

            message.success('Faktur berhasil ditambahkan!');
            setIsModalVisible(false);

            // Emit events to notify other components - this will trigger refreshData via the subscription
            eventBus.emit(DATA_EVENTS.FAKTUR_UPDATED);
            eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);
        } catch (err) {
            const error = err as any;
            message.error(
                'Gagal menambahkan faktur: ' +
                (error.response?.data?.message || error.message)
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (formData: FormData) => {
        if (!currentRecord?.id) return;

        setSubmitting(true);
        try {
            await updateFaktur(currentRecord.id, formData);
            message.success('Faktur berhasil diperbarui!');
            setIsEditModalVisible(false);
            // No need to call refreshData here, it will be triggered by the event
        } catch (err) {
            const error = err as Error;
            message.error(
                'Gagal memperbarui faktur: ' + (error.message || 'Unknown error')
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Helper function for type checking
    const isSearchableValue = (value: unknown): value is string => {
        return typeof value === 'string' || typeof value === 'number';
    };

    const fakturData = data.paginatedData || [];

    const handleFilterChange = (field: string, value: any) => {
        const newFilters = { ...filters };

        if (value === null || value === undefined || value === '') {
            delete newFilters[field];
        } else {
            newFilters[field] = value;
        }

        setFilters(newFilters);
    };

    // Debugging log
    console.log("Faktur Data Sebelum Filter:", fakturData);
    console.log("Filters:", filters);
    console.log("Search Text:", searchText);

    const filteredData = fakturData.filter((item: any) => {
        for (const [field, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null && value !== '') {
                if (field === 'jumlah_pengeluaran') {
                    if (Number(item[field]) !== Number(value)) {
                        return false;
                    }
                } else if (field === 'tanggal') {
                    if (Array.isArray(value) && value.length === 2) {
                        const itemDate = dayjs(item[field]);
                        const startDate = dayjs(value[0]).startOf('day');
                        const endDate = dayjs(value[1]).endOf('day');

                        if (!itemDate.isSameOrAfter(startDate) || !itemDate.isSameOrBefore(endDate)) {
                            return false;
                        }
                    }
                } else if (typeof item[field] === 'string' && typeof value === 'string') {
                    if (!item[field].toLowerCase().includes(value.toLowerCase())) {
                        return false;
                    }
                } else if (item[field] !== value) {
                    return false;
                }
            }
        }

        if (searchText) {
            const matchesSearch = Object.values(item).some((val) => {
                if (isSearchableValue(val)) {
                    return val.toString().toLowerCase().includes(searchText.toLowerCase());
                }
                return false;
            });

            if (!matchesSearch) {
                return false;
            }
        }

        return true;
    });

    console.log("Filtered Data:", filteredData);

    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys: React.Key[], selectedRows: FakturType[]) => {
            setSelectedRowKeys(selectedKeys);
            setSelectedItems(selectedRows);
        },
    };


    if (loading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return (
            <div>
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                />
                <Button onClick={refreshData}>Coba lagi</Button>
            </div>
        );
    }

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: '15%',
            ellipsis: true,
            filterDropdown: ({ confirm: confirmFilter }: any) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Cari berdasarkan ID"
                        value={filters.id || ''}
                        onChange={e => handleFilterChange('id', e.target.value)}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirmFilter()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Filter
                        </Button>
                        <Button
                            onClick={() => {
                                handleFilterChange('id', '');
                                confirmFilter();
                            }}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered: boolean) => (
                <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
        },
        {
            title: 'Tanggal',
            dataIndex: 'tanggal',
            key: 'tanggal',
            width: '15%',
            render: (text: string) => dayjs(text).format('DD MMM YYYY HH:mm'),
            filterDropdown: ({ confirm: confirmFilter }: any) => (
                <div style={{ padding: 8 }}>
                    <DatePicker.RangePicker
                        value={filters.tanggal || null}
                        onChange={(dates) => handleFilterChange('tanggal', dates)}
                        style={{ marginBottom: 8, display: 'block', width: '100%' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirmFilter()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Filter
                        </Button>
                        <Button
                            onClick={() => {
                                handleFilterChange('tanggal', null);
                                confirmFilter();
                            }}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered: boolean) => (
                <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
        },
        {
            title: 'Deskripsi',
            dataIndex: 'deskripsi',
            key: 'deskripsi',
            width: '20%',
            ellipsis: true,
            filterDropdown: ({ confirm: confirmFilter }: any) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Cari deskripsi"
                        value={filters.deskripsi || ''}
                        onChange={e => handleFilterChange('deskripsi', e.target.value)}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirmFilter()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >

                            Filter
                        </Button>
                        <Button
                            onClick={() => {
                                handleFilterChange('deskripsi', '');
                                confirmFilter();
                            }}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered: boolean) => (
                <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
        },
        {
            title: 'Jumlah Pengeluaran',
            dataIndex: 'jumlah_pengeluaran',
            key: 'jumlah_pengeluaran',
            width: '15%',
            render: (text: number) => `Rp ${formatToIDR(text)}`,
            filterDropdown: ({ confirm: confirmFilter }: any) => (
                <div style={{ padding: 8 }}>
                    <InputNumber
                        placeholder="Masukkan jumlah"
                        value={filters.jumlah_pengeluaran || null}
                        onChange={val => handleFilterChange('jumlah_pengeluaran', val)}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                        formatter={(value) =>
                            value ? `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
                        }
                        parser={(value) =>
                            value ? Number(value.replace(/Rp\s?|(\.)/g, '')) || 0 : 0
                        }
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirmFilter()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Filter
                        </Button>
                        <Button
                            onClick={() => {
                                handleFilterChange('jumlah_pengeluaran', null);
                                confirmFilter();
                            }}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered: boolean) => (
                <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
        },
        {
            title: 'Metode Pembayaran',
            dataIndex: 'metode_pembayaran',
            key: 'metode_pembayaran',
            width: '15%',
            render: (text: string) => {
                const methodMap: Record<string, string> = {
                    'cash': 'Cash',
                    'transfer': 'Transfer Bank',
                    'qris': 'QRIS',
                    'kartu_kredit': 'Kartu Kredit',
                    'kartu_debit': 'Kartu Debit'
                };
                return methodMap[text] || text;
            },
            filterDropdown: ({ confirm: confirmFilter }: any) => (
                <div style={{ padding: 8 }}>
                    <Select
                        placeholder="Pilih metode"
                        value={filters.metode_pembayaran || undefined}
                        onChange={val => handleFilterChange('metode_pembayaran', val)}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                        allowClear
                    >
                        <Option value="cash">Cash</Option>
                        <Option value="transfer">Transfer Bank</Option>
                        <Option value="qris">QRIS</Option>
                        <Option value="kartu_kredit">Kartu Kredit</Option>
                        <Option value="kartu_debit">Kartu Debit</Option>
                    </Select>
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirmFilter()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Filter
                        </Button>
                        <Button
                            onClick={() => {
                                handleFilterChange('metode_pembayaran', undefined);
                                confirmFilter();
                            }}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered: boolean) => (
                <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
        },
        {
            title: 'Status Pembayaran',
            dataIndex: 'status_pembayaran',
            key: 'status_pembayaran',
            width: '15%',
            render: (text: string) => {
                let color = '';
                let displayText = '';

                switch (text) {
                    case 'lunas':
                        color = 'green';
                        displayText = 'Lunas';
                        break;
                    case 'belum_lunas':
                        color = 'volcano';
                        displayText = 'Belum Lunas';
                        break;
                    case 'sebagian':
                        color = 'gold';
                        displayText = 'Dibayar Sebagian';
                        break;
                    case 'dibatalkan':
                        color = 'red';
                        displayText = 'Dibatalkan';
                        break;
                    default:
                        color = 'blue';
                        displayText = text;
                }

                return <Tag color={color}>{displayText}</Tag>;
            },
            filterDropdown: ({ confirm: confirmFilter }: any) => (
                <div style={{ padding: 8 }}>
                    <Select
                        placeholder="Pilih status"
                        value={filters.status_pembayaran || undefined}
                        onChange={val => handleFilterChange('status_pembayaran', val)}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                        allowClear
                    >
                        <Option value="lunas">Lunas</Option>
                        <Option value="belum_lunas">Belum Lunas</Option>
                        <Option value="sebagian">Dibayar Sebagian</Option>
                        <Option value="dibatalkan">Dibatalkan</Option>
                    </Select>
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirmFilter()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Filter
                        </Button>
                        <Button
                            onClick={() => {
                                handleFilterChange('status_pembayaran', undefined);
                                confirmFilter();
                            }}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered: boolean) => (
                <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
        },
        {
            title: 'Aksi',
            key: 'action',
            width: '15%',
            render: (_: any, record: FakturType) => (
                <Space size="small">
                    <Tooltip title="Lihat Detail">
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(record)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            type="default"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Hapus">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.id)}
                            size="small"
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];
    { console.log("Render Table, Data Length:", filteredData.length) }


    return (
        <Content style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <Card
            >
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <Title level={4} style={{ margin: 0 }}>
                        <DollarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                        Faktur
                        <Badge
                            count={fakturData.length}
                            showZero
                            style={{ backgroundColor: '#1890ff', fontSize: '14px', left: '5px' }}
                        />
                    </Title>
                    <Space>
                        <Input
                            placeholder="Cari faktur..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: '250px' }}
                            allowClear
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsModalVisible(true)}
                        >
                            Tambah Faktur

                        </Button>
                        <Tooltip title="Refresh Data">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={refreshDataCallback}
                            />
                        </Tooltip>
                    </Space>
                </div>

                {selectedRowKeys.length > 0 && (
                    <Alert
                        message={
                            <Space>
                                <span>
                                    <Text strong>{selectedRowKeys.length}</Text> faktur dipilih
                                </span>
                                <Button
                                    danger
                                    type="primary"
                                    size="small"
                                    onClick={() => setIsDeleteModalVisible(true)}
                                >
                                    Hapus yang dipilih
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => setSelectedRowKeys([])}
                                >
                                    Batal
                                </Button>
                            </Space>
                        }
                        type="info"
                        style={{ marginBottom: '16px' }}
                    />
                )}

                {filteredData.length === 0 ? (
                    <Table
                        columns={columns}
                        dataSource={filteredData || []}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        locale={{
                            emptyText: Object.keys(filters).length > 0 || searchText
                                ? "Tidak ada data yang sesuai dengan filter"
                                : "Belum ada data faktur"
                        }}
                        rowSelection={rowSelection}
                    />
                ) : (
                    <Table
                        columns={columns}
                        dataSource={filteredData || []}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        locale={{ emptyText: "Tidak ada data yang sesuai dengan filter" }}
                    />
                )}
            </Card>

            <FakturForm
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onSubmit={handleSubmit}
                submitting={submitting}
            />

            <FakturForm
                visible={isEditModalVisible}
                onCancel={() => setIsEditModalVisible(false)}
                onSubmit={handleUpdate}
                submitting={submitting}
                initialValues={currentRecord}
                isEdit={true}
            />

            <DeleteConfirmationModal
                visible={isDeleteModalVisible}
                onCancel={() => setIsDeleteModalVisible(false)}
                onConfirm={handleMultipleDelete}
                selectedItems={selectedItems}
                loading={deleteLoading}
            />
        </Content>
    );
};

export default Faktur;