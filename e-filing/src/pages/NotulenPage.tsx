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
    Image,
    DatePicker
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    InboxOutlined,
    FileTextOutlined,
    SearchOutlined,
    FileProtectOutlined
} from '@ant-design/icons';
import { UploadProps } from 'antd';
import { useNotulenCache } from '../hooks/useNotulenCache';
import { useAuth } from '../hooks/useAuth';
import { eventBus, DATA_EVENTS } from '../utils/eventBus';
import LoadingSkeleton from '../components/LoadingSkeleton';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;

interface NotulenType {
    id: string;
    judul: string;
    tanggal_rapat: string;
    lokasi: string;
    pemimpin_rapat: string;
    peserta: string;
    agenda: string;
    dokumen_lampiran: string;
    status: string;
    updated_by?: string;
    created_by?: string;
    user_id?: string;
}

interface FormProps {
    visible: boolean;
    onCancel: () => void;
    onSubmit: (values: any) => void;
    submitting: boolean;
    initialValues?: NotulenType | null;
    isEdit?: boolean;
}

const NotulenForm: React.FC<FormProps> = ({
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
                const formValues = {
                    ...initialValues,
                    tanggal_rapat: initialValues.tanggal_rapat ? dayjs(initialValues.tanggal_rapat) : null
                };
                form.setFieldsValue(formValues);

                // Set file list if there's an existing document
                if (initialValues.dokumen_lampiran) {
                    setFileList([
                        {
                            uid: '-1',
                            name: 'Current File',
                            status: 'done',
                            url: initialValues.dokumen_lampiran,
                            thumbUrl: initialValues.dokumen_lampiran
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
        name: "dokumen_lampiran",
        multiple: false,
        accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
        maxCount: 1,
        fileList: fileList,
        onChange(info) {
            setFileList(info.fileList);
        },
        beforeUpload: (file) => {
            const isValidType = file.type === "application/pdf" || 
                               file.type.startsWith("image/") || 
                               file.type.includes("word");
            const isValidSize = file.size / 1024 / 1024 < 5;

            if (!isValidType) {
                message.error("Hanya mendukung file PDF, Word, dan gambar!");
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

        // Format the date before adding to FormData
        const formattedValues = {
            ...values,
            tanggal_rapat: values.tanggal_rapat ? values.tanggal_rapat.format('YYYY-MM-DD') : ''
        };

        // Add all form values to FormData
        Object.entries(formattedValues).forEach(([key, value]: [string, any]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });

        // Add file if a new file has been selected
        if (fileList.length > 0 && fileList[0].originFileObj) {
            formData.append('dokumen_lampiran', fileList[0].originFileObj);
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
                    <FileProtectOutlined style={{ color: '#1890ff' }} />
                    <span>{isEdit ? 'Edit Notulen' : 'Input Notulen Baru'}</span>
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
                    name="judul"
                    label="Judul Rapat"
                    rules={[{ required: true, message: 'Mohon isi judul rapat!' }]}
                >
                    <Input placeholder="Masukkan judul rapat" />
                </Form.Item>

                <Form.Item
                    name="tanggal_rapat"
                    label="Tanggal Rapat"
                    rules={[{ required: true, message: 'Mohon pilih tanggal rapat!' }]}
                >
                    <DatePicker 
                        style={{ width: '100%' }} 
                        placeholder="Pilih tanggal rapat"
                        format="DD-MM-YYYY"
                    />
                </Form.Item>

                <Form.Item
                    name="lokasi"
                    label="Lokasi"
                    rules={[{ required: true, message: 'Mohon isi lokasi rapat!' }]}
                >
                    <Input placeholder="Masukkan lokasi rapat" />
                </Form.Item>

                <Form.Item
                    name="pemimpin_rapat"
                    label="Pemimpin Rapat"
                    rules={[{ required: true, message: 'Mohon isi pemimpin rapat!' }]}
                >
                    <Input placeholder="Masukkan nama pemimpin rapat" />
                </Form.Item>

                <Form.Item
                    name="peserta"
                    label="Peserta"
                    rules={[{ required: true, message: 'Mohon isi daftar peserta rapat!' }]}
                >
                    <TextArea rows={3} placeholder="Masukkan daftar peserta rapat" />
                </Form.Item>

                <Form.Item
                    name="agenda"
                    label="Agenda"
                    rules={[{ required: true, message: 'Mohon isi agenda rapat!' }]}
                >
                    <TextArea rows={4} placeholder="Masukkan agenda rapat" />
                </Form.Item>

                <Form.Item
                    name="status"
                    label="Status"
                    rules={[{ required: true, message: 'Mohon isi status notulen!' }]}
                >
                    <Input placeholder="Masukkan status notulen" />
                </Form.Item>

                <Form.Item
                    name="dokumen_lampiran"
                    label="Dokumen Lampiran"
                    rules={[{ required: !isEdit, message: 'Mohon unggah dokumen lampiran!' }]}
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
                            Mendukung file PDF, Word, atau gambar. Maksimal ukuran file 5MB.
                        </p>
                    </Dragger>
                </Form.Item>
            </Form>
        </Modal>
    );
};

const NotulenDetailModal: React.FC<{
    visible: boolean;
    onCancel: () => void;
    record: NotulenType | null;
}> = ({ visible, onCancel, record }) => {
    if (!record) return null;

    // Format the date for display
    const formattedDate = record.tanggal_rapat 
        ? dayjs(record.tanggal_rapat).format('DD MMMM YYYY')
        : '-';

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileProtectOutlined style={{ color: '#1890ff' }} />
                    <span>Detail Notulen</span>
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
                <div style={{ marginBottom: '8px' }}>
                    <strong>Judul:</strong> {record.judul}
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <strong>Tanggal Rapat:</strong> {formattedDate}
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <strong>Lokasi:</strong> {record.lokasi}
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <strong>Pemimpin Rapat:</strong> {record.pemimpin_rapat}
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <strong>Status:</strong> {record.status}
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <strong>Peserta:</strong>
                    <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{record.peserta}</p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <strong>Agenda:</strong>
                    <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{record.agenda}</p>
                </div>
                {record.created_by && (
                    <div style={{ marginBottom: '8px' }}>
                        <strong>Dibuat Oleh:</strong> {record.created_by}
                    </div>
                )}
                {record.updated_by && (
                    <div style={{ marginBottom: '8px' }}>
                        <strong>Diperbarui Oleh:</strong> {record.updated_by}
                    </div>
                )}
                <div>
                    <strong>Dokumen Lampiran:</strong>
                    <div style={{ marginTop: '12px' }}>
                        {record.dokumen_lampiran && (
                            record.dokumen_lampiran.toLowerCase().endsWith('.pdf') || 
                            record.dokumen_lampiran.toLowerCase().endsWith('.doc') || 
                            record.dokumen_lampiran.toLowerCase().endsWith('.docx') ? (
                                <a href={record.dokumen_lampiran} target="_blank" rel="noopener noreferrer">
                                    <Button type="primary" icon={<FileTextOutlined />}>
                                        Lihat Dokumen
                                    </Button>
                                </a>
                            ) : (
                                <Image
                                    src={record.dokumen_lampiran}
                                    alt="Dokumen Lampiran"
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

const Notulen: React.FC = () => {
    const { isAuthenticated, token } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<NotulenType | null>(null);
    const [searchText, setSearchText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api-efiling.vercel.app/';

    const {
        data,
        loading,
        error,
        fetchNotulenById,
        updateNotulen,
        deleteNotulen,
        refreshData
    } = useNotulenCache(BASE_URL);

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
        const unsubscribeNotulen = eventBus.on(DATA_EVENTS.NOTULEN_UPDATED, refreshDataCallback);
        const unsubscribeAnyData = eventBus.on(DATA_EVENTS.ANY_DATA_UPDATED, refreshDataCallback);

        return () => {
            // Call the unsubscribe functions
            unsubscribeNotulen();
            unsubscribeAnyData();
        };
    }, [refreshDataCallback]);

    const handleEdit = async (record: NotulenType) => {
        try {
            const currentNotulen = await fetchNotulenById(record.id);
            if (currentNotulen) {
                setCurrentRecord(currentNotulen as NotulenType);
                setIsEditModalVisible(true);
            }
        } catch (err) {
            const error = err as Error;
            message.error('Gagal mengambil data notulen: ' + (error.message || 'Unknown error'));
        }
    };

    const handleViewDetail = async (record: NotulenType) => {
        try {
            const currentNotulen = await fetchNotulenById(record.id);
            if (currentNotulen) {
                setCurrentRecord(currentNotulen as NotulenType);
                setIsDetailModalVisible(true);
            }
        } catch (err) {
            const error = err as Error;
            message.error('Gagal mengambil data notulen: ' + (error.message || 'Unknown error'));
        }
    };

    const handleDelete = async (id: string) => {
        Modal.confirm({
            title: 'Konfirmasi Penghapusan',
            content: 'Apakah Anda yakin ingin menghapus notulen ini?',
            okText: 'Ya, Hapus',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
                try {
                    await deleteNotulen(id);
                    message.success('Notulen berhasil dihapus!');
                    // No need to call refreshData here, it will be triggered by the event
                } catch (err) {
                    const error = err as Error;
                    console.error('Error deleting notulen:', error);
                    message.error(error.message || 'Gagal menghapus notulen!');
                }
            },
        });
    };

    const handleSubmit = async (formData: FormData) => {
        setSubmitting(true);
        try {
            await axios.post(`${BASE_URL}api/notulen`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                },
            });

            message.success('Notulen berhasil ditambahkan!');
            setIsModalVisible(false);

            // Emit events to notify other components - this will trigger refreshData via the subscription
            eventBus.emit(DATA_EVENTS.NOTULEN_UPDATED);
            eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);
        } catch (err) {
            const error = err as any;
            message.error(
                'Gagal menambahkan notulen: ' +
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
            await updateNotulen(currentRecord.id, formData);
            message.success('Notulen berhasil diperbarui!');
            setIsEditModalVisible(false);
            // No need to call refreshData here, it will be triggered by the event
        } catch (err) {
            const error = err as Error;
            message.error(
                'Gagal memperbarui notulen: ' + (error.message || 'Unknown error')
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Helper function for type checking
    const isSearchableValue = (value: unknown): value is string => {
        return typeof value === 'string' || typeof value === 'number';
    };

    const notulenData = data.paginatedData || [];

    const filteredData = notulenData.filter((item: any) => {
        return Object.values(item).some((val) => {
            if (isSearchableValue(val)) {
                return val.toString().toLowerCase().includes(searchText.toLowerCase());
            }
            return false;
        });
    });

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
            title: 'Judul',
            dataIndex: 'judul',
            key: 'judul',
            align: 'center' as const,
            ellipsis: true,
        },
        {
            title: 'Tanggal Rapat',
            dataIndex: 'tanggal_rapat',
            key: 'tanggal_rapat',
            align: 'center' as const,
            render: (date: string) => dayjs(date).format('DD/MM/YYYY')
        },
        {
            title: 'Lokasi',
            dataIndex: 'lokasi',
            key: 'lokasi',
            align: 'center' as const,
            ellipsis: true,
        },
        {
            title: 'Pemimpin Rapat',
            dataIndex: 'pemimpin_rapat',
            key: 'pemimpin_rapat',
            align: 'center' as const,
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center' as const,
        },
        {
            title: 'Aksi',
            key: 'aksi',
            align: 'center' as const,
            render: (_: unknown, record: NotulenType) => (
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
                            <FileProtectOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            Notulen
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
                                {notulenData.length}
                            </span>
                        </Title>
                        <Text type="secondary">Kelola semua notulen rapat Anda di sini</Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalVisible(true)}
                        size="large"
                    >
                        Tambah Notulen
                    </Button>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Cari notulen..."
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
                        showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} notulen`,
                        showSizeChanger: true,
                        showQuickJumper: true,
                    }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            {/* Create Form Modal */}
            <NotulenForm
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onSubmit={handleSubmit}
                submitting={submitting}
            />

            {/* Edit Form Modal */}
            <NotulenForm
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
            <NotulenDetailModal
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

export default Notulen;