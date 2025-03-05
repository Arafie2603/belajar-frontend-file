/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
    DatePicker,
    Select,
    Divider,
    Tag,
    Badge
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    InboxOutlined,
    FileTextOutlined,
    SearchOutlined,
    FileProtectOutlined,
    UserOutlined,
    ReloadOutlined,
    ExclamationCircleOutlined,
    FilterOutlined
} from '@ant-design/icons';
import { UploadProps } from 'antd';
import { useNotulenCache } from '../hooks/useNotulenCache';
import { useAuth } from '../hooks/useAuth';
import { eventBus, DATA_EVENTS } from '../utils/eventBus';
import LoadingSkeleton from '../components/LoadingSkeleton';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { ColumnType } from 'antd/es/table';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;
const { TextArea } = Input;
const { Option } = Select;

// Add the missing UserType interface
interface UserType {
    id: string;
    name: string;
    email?: string;
    role?: string;
}

interface User {
    id: string;
    name: string;
    email?: string; // Tidak ada di response, buat opsional
    role: string;
    fakultas: string;
    prodi: string;
    foto?: string;
    alamat?: string;
    jabatan?: string;
    no_telp?: string;
}


interface Participant {
    id?: string;
    name: string;
    type: 'registered' | 'custom';
}
// type FilterState = Partial<{
//     status: string;
//     date: Dayjs | null;
//     judul: string;
//     lokasi: string;
//     tanggal_rapat: string;
//     pemimpin_rapat: string;
// }>;
interface NotulenType {
    id: string;
    judul: string;
    tanggal: string;
    lokasi: string;
    pemimpin_rapat: string;
    peserta: string;
    peserta_list?: Participant[];
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

// Export component for React Fast Refresh
export const NotulenForm: React.FC<FormProps> = ({
    visible,
    onCancel,
    onSubmit,
    submitting,
    initialValues = null,
    isEdit = false
}) => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<any[]>([]);
    const [users, setUsers] = useState<UserType[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [customParticipants, setCustomParticipants] = useState<string[]>([]);
    const [customParticipantInput, setCustomParticipantInput] = useState('');
    const [loading, setLoading] = useState(false);
    const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api-efiling.vercel.app/';


    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                return;
            }

            console.log('Fetching users from:', `${BASE_URL}api/users`);

            const response = await axios.get(`${BASE_URL}api/users`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Users API response:', response.data);

            if (response.data?.data?.paginatedData && Array.isArray(response.data.data.paginatedData)) {
                const userData: User[] = response.data.data.paginatedData.map((user: any): User => ({
                    id: user.id,
                    name: user.nama,
                    role: user.role,
                    fakultas: user.fakultas,
                    prodi: user.prodi,
                    foto: user.foto || "",
                    alamat: user.alamat || "",
                    jabatan: user.jabatan || "",
                    no_telp: user.no_telp || ""
                }));
                setUsers(userData);
            } else {
                console.error('Unexpected API response format:', response.data);
                setUsers([]);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            if (axios.isAxiosError(error)) {
                console.error('Response:', error.response?.data);
                console.error('Status:', error.response?.status);
            }
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [BASE_URL]);


    useEffect(() => {
        if (visible) {
            fetchUsers();
            form.resetFields();

            if (initialValues) {
                console.log('Modal opened, fetching users...');
                fetchUsers();

                form.resetFields();

                if (initialValues.peserta) {
                    try {
                        const parsedParticipants = JSON.parse(initialValues.peserta);
                        if (Array.isArray(parsedParticipants)) {
                            const userIds = parsedParticipants
                                .filter(p => typeof p === 'object' && p.type === 'registered')
                                .map(p => typeof p === 'object' && p.id ? p.id : '');

                            setSelectedUsers(userIds.filter(id => id !== ''));

                            const customParts = parsedParticipants
                                .filter(p => typeof p === 'object' && p.type === 'custom')
                                .map(p => typeof p === 'object' && p.name ? p.name : '');

                            setCustomParticipants(customParts.filter(name => name !== ''));
                        } else {
                            setCustomParticipants(initialValues.peserta.split('\n').filter(p => p.trim()));
                        }
                    } catch (error) {
                        console.error('JSON Parsing Error:', error);
                        setCustomParticipants(initialValues.peserta.split('\n').filter(p => p.trim()));
                    }
                }

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
                setSelectedUsers([]);
                setCustomParticipants([]);
                setFileList([]);
            }
        }
    }, [visible, initialValues, form, fetchUsers]);

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
                Modal.error({
                    title: "Format Tidak Didukung",
                    content: "Hanya mendukung file PDF, Word, dan gambar!"
                });
                return Upload.LIST_IGNORE;
            }

            if (!isValidSize) {
                Modal.error({
                    title: "Ukuran File Terlalu Besar",
                    content: "Ukuran file tidak boleh lebih dari 5MB!"
                });
                return Upload.LIST_IGNORE;
            }

            return false;
        },
    };

    const handleAddCustomParticipant = () => {
        if (customParticipantInput && !customParticipants.includes(customParticipantInput)) {
            setCustomParticipants([...customParticipants, customParticipantInput]);
            setCustomParticipantInput('');
        }
    };

    const handleRemoveCustomParticipant = (participant: string) => {
        setCustomParticipants(customParticipants.filter(p => p !== participant));
    };

    const handleRemoveSelectedUser = (userId: string) => {
        setSelectedUsers(selectedUsers.filter(id => id !== userId));
    };

    const handleSubmit = (values: any) => {
        const formData = new FormData();

        // Format the date before adding to FormData
        const formattedValues = {
            ...values,
            tanggal: values.tanggal ? values.tanggal.format('YYYY-MM-DD') : ''
        };

        // Create a structured participant list
        const participantsList = [
            // Add selected registered users
            ...selectedUsers.map(userId => {
                const user = users.find(u => u.id === userId);
                return { id: userId, name: user?.name, type: 'registered' };
            }),
            // Add custom participants
            ...customParticipants.map(name => ({ name, type: 'custom' }))
        ];

        // Create a formatted string for backward compatibility
        const participantsText = [
            // Add registered users names
            ...selectedUsers.map(userId => {
                const user = users.find(u => u.id === userId);
                return user ? user.name : '';
            }).filter(Boolean),
            // Add custom participants
            ...customParticipants
        ].join('\n');

        // Add all form values to FormData
        Object.entries(formattedValues).forEach(([key, value]: [string, any]) => {
            if (key !== 'peserta' && value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });

        // Add participants data in two formats
        formData.append('peserta', participantsText);
        formData.append('peserta_list', JSON.stringify(participantsList));

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
                setSelectedUsers([]);
                setCustomParticipants([]);
                onCancel();
            }}
            width={800}
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
                    name="tanggal"
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

                {/* Participants Section */}
                <Divider orientation="left">Peserta Rapat</Divider>

                <Form.Item
                    label="Pilih dari Pengguna Terdaftar"
                    help="Pilih satu atau lebih peserta dari pengguna yang terdaftar"
                >
                    <Select
                        mode="multiple"
                        placeholder={loading ? "Memuat data pengguna..." : "Pilih peserta"}
                        loading={loading}
                        style={{ width: '100%' }}
                        allowClear
                        value={selectedUsers}
                        onChange={(values) => setSelectedUsers(values)}
                        optionFilterProp="children"
                        notFoundContent={loading ? "Memuat data..." : "Tidak ada data pengguna"}
                    >
                        {Array.isArray(users) && users.length > 0 ? (
                            users.map(user => (
                                <Option key={user.id} value={user.id}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <UserOutlined style={{ marginRight: 8 }} />
                                        <span>{user.name}</span>
                                        {user.role && <Text type="secondary" style={{ marginLeft: 8 }}>({user.role})</Text>}
                                    </div>
                                </Option>
                            ))
                        ) : (
                            <Option disabled value="">Tidak ada pengguna tersedia</Option>
                        )}
                    </Select>
                    {users.length === 0 && !loading && (
                        <Alert
                            message="Tidak ada data pengguna"
                            description="Tidak dapat memuat data pengguna. Pastikan Anda memiliki koneksi internet yang stabil dan API berfungsi dengan baik."
                            type="warning"
                            showIcon
                            style={{ marginTop: 8 }}
                        />
                    )}
                </Form.Item>

                {/* Display selected users as Tags */}
                {selectedUsers.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>Pengguna yang dipilih:</Text>
                        <div style={{ marginTop: 8 }}>
                            {selectedUsers.map(userId => {
                                const user = users.find(u => u.id === userId);
                                return (
                                    <Tag
                                        key={userId}
                                        closable
                                        onClose={() => handleRemoveSelectedUser(userId)}
                                        style={{ marginBottom: 8 }}
                                        color="blue"
                                    >
                                        <UserOutlined style={{ marginRight: 4 }} />
                                        {user?.name || 'Unknown User'}
                                    </Tag>
                                );
                            })}
                        </div>
                    </div>
                )}

                <Form.Item
                    label="Tambah Peserta Lainnya"
                    help="Tambahkan peserta yang tidak terdaftar dalam sistem"
                >
                    <Space style={{ display: 'flex', marginBottom: 8 }}>
                        <Input
                            placeholder="Nama peserta"
                            value={customParticipantInput}
                            onChange={e => setCustomParticipantInput(e.target.value)}
                            onPressEnter={handleAddCustomParticipant}
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddCustomParticipant}
                        >
                            Tambah
                        </Button>
                    </Space>

                    {customParticipants.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                            <Text strong>Peserta tambahan:</Text>
                            <div style={{ marginTop: 8 }}>
                                {customParticipants.map((participant, index) => (
                                    <Tag
                                        key={index}
                                        closable
                                        onClose={() => handleRemoveCustomParticipant(participant)}
                                        style={{ marginBottom: 8 }}
                                        color="green"
                                    >
                                        {participant}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    )}
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
                    <Select placeholder="Pilih status notulen">
                        <Option value="pending">Pending</Option>
                        <Option value="dibatalkan">Dibatalkan</Option>
                        <Option value="disetujui">Disetujui</Option>
                    </Select>
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

const DeleteConfirmationModal: React.FC<{
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    selectedItems: NotulenType[];
    loading: boolean;
}> = ({ visible, onCancel, onConfirm, selectedItems, loading }) => (
    <Modal
        title="Konfirmasi Penghapusan"
        visible={visible}
        onCancel={onCancel}
        footer={[
            <Button key="back" onClick={onCancel}>
                Batal
            </Button>,
            <Button
                key="submit"
                type="primary"
                danger
                loading={loading}
                onClick={onConfirm}
            >
                Hapus
            </Button>
        ]}
    >
        <p>Apakah Anda yakin ingin menghapus {selectedItems.length} notulen?</p>
    </Modal>
);

const EnhancedDeleteConfirmationModal: React.FC<{
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    selectedItems: NotulenType[];
    loading: boolean;
}> = ({ visible, onCancel, onConfirm, selectedItems, loading }) => (
    <Modal
        title={
            <div style={{ display: 'flex', alignItems: 'center', color: '#ff4d4f' }}>
                <ExclamationCircleOutlined style={{ fontSize: '24px', marginRight: '10px' }} />
                Konfirmasi Penghapusan
            </div>
        }
        visible={visible}
        onCancel={onCancel}
        footer={[
            <Button key="back" onClick={onCancel}>
                Batalkan
            </Button>,
            <Button
                key="submit"
                type="primary"
                danger
                loading={loading}
                onClick={onConfirm}
                icon={<DeleteOutlined />}
            >
                Hapus ({selectedItems.length})
            </Button>
        ]}
        width={500}
    >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Alert
                message="Perhatian"
                description={`Anda akan menghapus ${selectedItems.length} notulen. Tindakan ini tidak dapat dibatalkan.`}
                type="warning"
                showIcon
            />

            <div>
                <Text strong>Detail Notulen yang Akan Dihapus:</Text>
                <ul style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedItems.map((item, index) => (
                        <li key={item.id}>
                            <Text type="secondary">
                                {index + 1}. {item.judul}
                                <Text type="secondary" style={{ marginLeft: '10px' }}>
                                    ({dayjs(item.tanggal).format('DD/MM/YYYY')})
                                </Text>
                            </Text>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </Modal>
);

export default function NotulenPage() {
    const { isAuthenticated, token } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<NotulenType | null>(null);
    const [searchText, setSearchText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api-efiling.vercel.app/';

    const [tableFilters, setTableFilters] = useState<Record<string, string[]>>({});

    const [filters] = useState<Record<string, any>>({});

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const navigate = useNavigate();

    const {
        data,
        loading,
        error,
        fetchNotulenById,
        updateNotulen,
        deleteNotulen,
        refreshData
    } = useNotulenCache(BASE_URL);

    const notulenData = useMemo(() =>
        data?.paginatedData || [],
        [data?.paginatedData]
    );

    const handleFilterChange = (field: string, value: (string | number)[], confirm: () => void) => {
        setTableFilters((prev) => {
            const newFilters = { ...prev };

            if (!value || value.length === 0) {
                delete newFilters[field];
            } else {
                // Pastikan value selalu array
                newFilters[field] = value as string[];
            }

            return newFilters;
        });

        confirm();
    };

    const handleClearFilters = (confirm: () => void) => {
        setTableFilters({});
        confirm(); // Konfirmasi agar tabel ter-refresh
    };


    const refreshDataCallback = useCallback(() => {
        refreshData();
    }, [refreshData]);

    const filteredData = useMemo(() => {
        let result = [...notulenData];

        if (filters.status) {
            result = result.filter(item => item.status === filters.status);
        }

        if (filters.date) {
            result = result.filter(item =>
                dayjs(item.tanggal).isSame(filters.date, 'day')
            );
        }

        if (searchText.trim() !== "") {
            const searchLower = searchText.toLowerCase();
            result = result.filter(item =>
                item.judul.toLowerCase().includes(searchLower) ||
                item.pemimpin_rapat.toLowerCase().includes(searchLower) ||
                item.lokasi.toLowerCase().includes(searchLower)
            );
        }

        return result;
    }, [notulenData, filters, searchText]);




    const selectedItems = useMemo(() =>
        filteredData.filter(item => selectedRowKeys.includes(item.id)),
        [filteredData, selectedRowKeys]
    );

    const handleMultipleDelete = async () => {
        setDeleteLoading(true);
        try {
            // Parallel deletion
            await Promise.all(selectedItems.map(item => deleteNotulen(item.id)));

            message.success(`${selectedItems.length} notulen berhasil dihapus!`);
            setSelectedRowKeys([]);
            setIsDeleteModalVisible(false);
        } catch (err) {
            const error = err as Error;
            message.error(`Gagal menghapus notulen: ${error.message || 'Unknown error'}`);
        } finally {
            setDeleteLoading(false);
        }
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys);
        }
    };



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

    const handleViewDetail = (record: NotulenType) => {
        navigate(`/dashboard/notulen/${record.id}`);
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


    if (loading) {
        return <LoadingSkeleton />;
    }

    if (loading) return <LoadingSkeleton />;
    if (error) return (
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
    const columns: ColumnType<NotulenType>[] = [
        // Perbaikan pada kolom Judul
        {
            title: 'Judul',
            dataIndex: 'judul',
            key: 'judul',
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                <div className="p-2">
                    <Input
                        placeholder="Cari judul"
                        value={selectedKeys[0]}
                        onChange={(e) =>
                            setSelectedKeys(e.target.value ? [e.target.value] : []) // Pastikan selalu array
                        }
                        onPressEnter={() => confirm()}
                        className="mb-2 block"
                    />
                    <Space>
                        <Button
                            onClick={() => {
                                // Konversi `selectedKeys` ke string[] sebelum dikirim
                                handleFilterChange("judul", selectedKeys.map(String), confirm);
                            }}
                            type="primary"
                            size="small"
                        >
                            Cari
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedKeys([]);
                                handleClearFilters(confirm);
                            }}
                            size="small"
                        >
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            onFilter: (value, record) =>
                record.judul.toLowerCase().includes(value.toString().toLowerCase()),
            // Pastikan filteredValue selalu array
            filteredValue: tableFilters['judul']?.length > 0 ? tableFilters['judul'] : null
        },
        {
            title: 'Tanggal Rapat',
            dataIndex: 'tanggal',
            key: 'tanggal',
            align: 'center',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <DatePicker
                        value={selectedKeys[0] ? dayjs(selectedKeys[0] as string) : null}
                        onChange={(date) => setSelectedKeys(date ? [date.format('YYYY-MM-DD')] : [])}
                        style={{ marginBottom: 8, display: 'block' }}
                        placeholder="Pilih tanggal"
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Cari
                        </Button>
                        <Button
                            onClick={() => clearFilters?.()}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered) => (
                <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
            onFilter: (value, record) => dayjs(record.tanggal).format('YYYY-MM-DD') === value,

            // ✅ Tambahkan Sorting ASC & DESC
            sorter: (a, b) => dayjs(a.tanggal).unix() - dayjs(b.tanggal).unix(),
            sortDirections: ['ascend', 'descend'], // Menentukan arah sorting
        },
        {
            title: 'Lokasi',
            dataIndex: 'lokasi',
            key: 'lokasi',
            align: 'center',
            ellipsis: true,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Cari lokasi"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Cari
                        </Button>
                        <Button
                            onClick={() => clearFilters?.()}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered) => (
                <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
            onFilter: (value, record) =>
                record.lokasi.toLowerCase().includes(value.toString().toLowerCase()),
        },
        {
            title: 'Pemimpin Rapat',
            dataIndex: 'pemimpin_rapat',
            key: 'pemimpin_rapat',
            align: 'center',
            ellipsis: true,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Cari pemimpin"
                        value={selectedKeys[0]}
                        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Cari
                        </Button>
                        <Button
                            onClick={() => clearFilters?.()}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered) => (
                <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
            onFilter: (value, record) =>
                record.pemimpin_rapat.toLowerCase().includes(value.toString().toLowerCase()),
        },
        // {
        //     title: 'Status',
        //     dataIndex: 'status',
        //     key: 'status',
        //     align: 'center',
        //     render: (status: string) => {
        //         const statusColors: Record<string, string> = {
        //             'draft': 'warning',
        //             'published': 'success',
        //             'archived': 'default'
        //         };
        //         return <Tag color={statusColors[status?.toLowerCase()] || 'processing'}>
        //             {status || 'Unknown'}
        //         </Tag>;
        //     },
        //     filters: [
        //         { text: 'Draft', value: 'draft' },
        //         { text: 'Published', value: 'published' },
        //         { text: 'Archived', value: 'archived' }
        //     ],
        //     onFilter: (value, record) => record.status === value,
        // },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: '15%',
            render: (text: string) => {
                const statusMap: Record<string, string> = {
                    'pending': 'Pending',
                    'dibatalkan': 'Dibatalkan',
                    'disetujui': 'Disetujui'
                };
                return statusMap[text] || text;
            },
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Select
                        placeholder="Pilih status"
                        value={selectedKeys[0] || undefined}
                        onChange={val => setSelectedKeys(val ? [val] : [])}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                        allowClear
                    >
                        <Option value="pending">Pending</Option>
                        <Option value="dibatalkan">Dibatalkan</Option>
                        <Option value="disetujui">Disetujui</Option>
                    </Select>
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            icon={<SearchOutlined />}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Filter
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedKeys([]);
                                clearFilters?.();
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
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Aksi',
            key: 'aksi',
            align: 'center',
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
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteSingle(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const handleDeleteSingle = (record: NotulenType) => {
        setSelectedRowKeys([record.id]);
        setIsDeleteModalVisible(true);
    };


    return (
        <Layout>
            <Content style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
                <Card>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <Title level={4} style={{ margin: 0 }}>
                            <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                            Notulen
                            <Badge
                                count={notulenData.length}
                                showZero
                                style={{ backgroundColor: '#1890ff', fontSize: '14px', left: '5px' }}
                            />
                        </Title>
                        <Space>
                            <Input
                                placeholder="Cari notulen..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                style={{ width: '250px' }}
                                allowClear
                            />
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => {
                                    setCurrentRecord(null);
                                    setIsModalVisible(true);
                                }}
                            >
                                Tambah Notulen
                            </Button>
                            <Tooltip title="Refresh Data">
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={refreshDataCallback}
                                />
                            </Tooltip>
                        </Space>
                    </div>

                    {selectedRowKeys && selectedRowKeys.length > 0 && (
                        <Alert
                            message={
                                <Space>
                                    <span>
                                        <Text strong>{selectedRowKeys.length}</Text> notulen dipilih
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

                    <Table
                        columns={columns}
                        dataSource={filteredData}
                        rowKey="id"
                        pagination={{
                            pageSize: 10,
                            showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} item`
                        }}
                        locale={{
                            emptyText: Object.keys(filters).length > 0 || searchText
                                ? "Tidak ada data yang sesuai dengan filter"
                                : "Belum ada data notulen"
                        }}
                        rowSelection={rowSelection}
                        scroll={{ x: 'max-content' }}
                        loading={loading}
                    />
                </Card>
                <EnhancedDeleteConfirmationModal
                    visible={isDeleteModalVisible}
                    onCancel={() => setIsDeleteModalVisible(false)}
                    onConfirm={handleMultipleDelete}
                    selectedItems={selectedItems}
                    loading={deleteLoading}
                />

                <NotulenForm
                    visible={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                />

                <NotulenForm
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
        </Layout>
    );
}