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
    Image
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    InboxOutlined,
    FileTextOutlined,
    SearchOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { UploadProps } from 'antd';
import { useFakturCache } from '../hooks/useFakturCache';
import { useAuth } from '../hooks/useAuth';
import { eventBus, DATA_EVENTS } from '../utils/eventBus';
import FakturSkeleton from '../components/FakturSkeleton';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

interface FakturType {
    id: string;
    bukti_pembayaran: string;
    deskripsi: string;
}


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
                formData.append(key, value);
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
                    rules={[{ required: true, message: 'Mohon isi deskripsi faktur!' }]}
                >
                    <TextArea rows={4} placeholder="Masukkan deskripsi faktur" />
                </Form.Item>

                <Form.Item
                    name="bukti_pembayaran"
                    label="Bukti Pembayaran"
                    rules={[{ required: !isEdit, message: 'Mohon unggah bukti pembayaran!' }]}
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

const FakturDetailModal: React.FC<{
    visible: boolean;
    onCancel: () => void;
    record: FakturType | null;
}> = ({ visible, onCancel, record }) => {
    if (!record) return null;

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarOutlined style={{ color: '#1890ff' }} />
                    <span>Detail Faktur</span>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="close" onClick={onCancel}>
                    Tutup
                </Button>
            ]}
            width={700}
        >
            <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px' }}>
                    <strong>ID:</strong> {record.id}
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <strong>Deskripsi:</strong>
                    <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{record.deskripsi}</p>
                </div>
                <div>
                    <strong>Bukti Pembayaran:</strong>
                    <div style={{ marginTop: '12px' }}>
                        {record.bukti_pembayaran && (
                            record.bukti_pembayaran.toLowerCase().endsWith('.pdf') ? (
                                <a href={record.bukti_pembayaran} target="_blank" rel="noopener noreferrer">
                                    <Button type="primary" icon={<FileTextOutlined />}>
                                        Lihat PDF
                                    </Button>
                                </a>
                            ) : (
                                <Image
                                    src={record.bukti_pembayaran}
                                    alt="Bukti Pembayaran"
                                    style={{ maxWidth: '100%' }}
                                />
                            )
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const Faktur: React.FC = () => {
    const { isAuthenticated, token } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<FakturType | null>(null);
    const [searchText, setSearchText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api-efiling.vercel.app/';
    // const navigate = useNavigate();

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
        try {
            const currentFaktur = await fetchFakturById(record.id);
            if (currentFaktur) {
                setCurrentRecord(currentFaktur as FakturType);
                setIsDetailModalVisible(true);
            }
        } catch (err) {
            const error = err as Error;
            message.error('Gagal mengambil data faktur: ' + (error.message || 'Unknown error'));
        }
    };

    const handleDelete = async (id: string) => {
        Modal.confirm({
            title: 'Konfirmasi Penghapusan',
            content: 'Apakah Anda yakin ingin menghapus faktur ini?',
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

    const filteredData = fakturData.filter((item: any) => {
        return Object.values(item).some((val) => {
            if (isSearchableValue(val)) {
                return val.toString().toLowerCase().includes(searchText.toLowerCase());
            }
            return false;
        });
    });

    if (loading) {
        return <FakturSkeleton />;
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
            align: 'center' as const,
            ellipsis: true,
        },
        {
            title: 'Deskripsi',
            dataIndex: 'deskripsi',
            key: 'deskripsi',
            align: 'center' as const,
            ellipsis: true,
        },
        {
            title: 'Aksi',
            key: 'aksi',
            align: 'center' as const,
            render: (_: unknown, record: FakturType) => (
                <Space>
                    <Tooltip title="Lihat Detail">
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Hapus">
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.id)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Content style={{ margin: '16px' }}>
            <Card className="shadow-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <Title level={2} style={{ margin: 0 }}>
                            <DollarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            Faktur
                            <span style={{
                                fontSize: '16px',
                                backgroundColor: '#1890ff',
                                color: 'white',
                                borderRadius: '12px',
                                padding: '2px 10px',
                                marginLeft: '12px',
                                display: 'inline-block',
                                verticalAlign: 'middle'
                            }}>
                                {fakturData.length}
                            </span>
                        </Title>
                        <Text type="secondary">Kelola semua faktur pembayaran Anda di sini</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalVisible(true)}
                        size="large"
                    >
                        Tambah Faktur
                    </Button>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Cari faktur..."
                        prefix={<SearchOutlined />}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        allowClear
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} faktur`,
                        showSizeChanger: true,
                        showQuickJumper: true,
                    }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* Create Form Modal */}
            <FakturForm
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onSubmit={handleSubmit}
                submitting={submitting}
            />

            {/* Edit Form Modal */}
            <FakturForm
                visible={isEditModalVisible}
                onCancel={() => {
                    setIsEditModalVisible(false);
                    setCurrentRecord(null);
                }}
                onSubmit={handleUpdate}
                submitting={submitting}
                initialValues={currentRecord}
                isEdit={true}
            />

            {/* Detail Modal */}
            <FakturDetailModal
                visible={isDetailModalVisible}
                onCancel={() => {
                    setIsDetailModalVisible(false);
                    setCurrentRecord(null);
                }}
                record={currentRecord}
            />
        </Content>
    );
};

export default Faktur;