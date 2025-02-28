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
  DatePicker,
  Space,
  Tooltip,
  Upload,
  Alert,
  Select
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
  FileTextOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { UploadProps } from 'antd';
import CKEditorComponent from '../components/CKEditor';
import { useSuratCache } from '../hooks/useSuratKeluarCache';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { eventBus, DATA_EVENTS } from '../utils/eventBus';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;

interface DataType {
  id: string;
  surat_nomor: string;
  tanggal: string;
  tempat_surat: string;
  lampiran: string;
  isi_surat: string;
  penerima: string;
  pengirim: string;
  jabatan_pengirim: string;
  gambar: string;
  keterangan_gambar: string;
  sifat_surat: string;
  keterangan?: string;
  deskripsi?: string;
  kategori?: string;
}

interface FormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  submitting: boolean;
  initialValues?: DataType | null;
  isEdit?: boolean;
}

const SuratForm: React.FC<FormProps> = ({
  visible,
  onCancel,
  onSubmit,
  submitting,
  initialValues = null,
  isEdit = false
}) => {
  const [form] = Form.useForm();
  const [editorData, setEditorData] = useState('');
  const [fileList, setFileList] = useState<any[]>([]);

  // Reset form when modal visibility changes or initialValues change
  useEffect(() => {
    if (visible) {
      form.resetFields();

      if (initialValues) {
        // Format the date for DatePicker
        const formattedValues = {
          ...initialValues,
          tanggal: initialValues.tanggal ? dayjs(initialValues.tanggal, 'DD/MM/YYYY') : undefined
        };

        form.setFieldsValue(formattedValues);
        setEditorData(initialValues.isi_surat || '');

        // Set file list if there's an existing image
        if (initialValues.gambar) {
          setFileList([
            {
              uid: '-1',
              name: 'Current File',
              status: 'done',
              url: initialValues.gambar,
              thumbUrl: initialValues.gambar
            }
          ]);
        } else {
          setFileList([]);
        }
      } else {
        setEditorData('');
        setFileList([]);
      }
    }
  }, [visible, initialValues, form]);

  const uploadProps: UploadProps = {
    name: "gambar",
    multiple: false,
    accept: ".pdf,.jpg,.png",
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
      if (key === 'tanggal') {
        formData.append(key, value.format('YYYY-MM-DD'));
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    // Add editor content
    formData.append('isi_surat', editorData);

    // Add file if a new file has been selected
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append('gambar', fileList[0].originFileObj);
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
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>{isEdit ? 'Edit Surat Keluar' : 'Input Surat Keluar Baru'}</span>
        </div>
      }
      open={visible}
      onCancel={() => {
        form.resetFields();
        setEditorData('');
        setFileList([]);
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
          name="tanggal"
          label="Tanggal Surat"
          rules={[{ required: true, message: 'Mohon pilih tanggal surat!' }]}
        >
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          name="tempat_surat"
          label="Tempat Surat"
          rules={[{ required: true, message: 'Mohon isi tempat surat!' }]}
        >
          <Input placeholder="Masukkan tempat surat" />
        </Form.Item>

        <Form.Item
          name="lampiran"
          label="Lampiran"
          rules={[{ required: true, message: 'Mohon isi lampiran surat!' }]}
        >
          <Input placeholder="Masukkan lampiran surat" />
        </Form.Item>

        <Form.Item
          label="Isi Surat"
          required
        >
          <CKEditorComponent value={editorData} onChange={setEditorData} />
        </Form.Item>

        <Form.Item
          name="penerima"
          label="Penerima"
          rules={[{ required: true, message: 'Mohon isi penerima surat!' }]}
        >
          <Input placeholder="Masukkan penerima surat" />
        </Form.Item>

        <Form.Item
          name="pengirim"
          label="Pengirim"
          rules={[{ required: true, message: 'Mohon isi pengirim surat!' }]}
        >
          <Input placeholder="Masukkan pengirim surat" />
        </Form.Item>

        <Form.Item
          name="jabatan_pengirim"
          label="Jabatan Pengirim"
          rules={[{ required: true, message: 'Mohon isi jabatan pengirim surat!' }]}
        >
          <Input placeholder="Masukkan jabatan pengirim surat" />
        </Form.Item>

        <Form.Item
          name="gambar"
          label="Gambar"
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

        <Form.Item
          name="keterangan_gambar"
          label="Keterangan Gambar"
          rules={[{ required: true, message: 'Mohon isi keterangan gambar!' }]}
        >
          <Input placeholder="Masukkan keterangan gambar" />
        </Form.Item>

        <Form.Item
          name="sifat_surat"
          label="Sifat Surat"
          rules={[{ required: true, message: 'Mohon isi sifat surat!' }]}
        >
          <Input placeholder="Masukkan sifat surat" />
        </Form.Item>

        <Form.Item
          name="keterangan"
          label="Keterangan"
          rules={[{ required: true, message: 'Mohon pilih keterangan!' }]}
        >
          <Select placeholder="Pilih keterangan">
            <Select.Option value="H">H</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const SuratKeluar: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DataType | null>(null);
  const [searchText, setSearchText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api-efiling.vercel.app/';
  const navigate = useNavigate();

  const {
    data,
    loading,
    error,
    fetchSuratById,
    updateSurat,
    deleteSurat,
    refreshData
  } = useSuratCache(BASE_URL);

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
    const unsubscribeSuratKeluar = eventBus.on(DATA_EVENTS.SURAT_KELUAR_UPDATED, refreshDataCallback);
    const unsubscribeAnyData = eventBus.on(DATA_EVENTS.ANY_DATA_UPDATED, refreshDataCallback);

    return () => {
      // Call the unsubscribe functions
      unsubscribeSuratKeluar();
      unsubscribeAnyData();
    };
  }, [refreshDataCallback]);

  const handleEdit = async (record: DataType) => {
    try {
      const currentSurat = await fetchSuratById(record.id);
      if (currentSurat) {
        setCurrentRecord(currentSurat as DataType);
        setIsEditModalVisible(true);
      }
    } catch (err) {
      const error = err as Error;
      message.error('Gagal mengambil data surat: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Konfirmasi Penghapusan',
      content: 'Apakah Anda yakin ingin menghapus surat ini?',
      okText: 'Ya, Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await deleteSurat(id);
          message.success('Surat berhasil dihapus!');
          // No need to call refreshData here, it will be triggered by the event
        } catch (err) {
          const error = err as Error;
          console.error('Error deleting surat:', error);
          message.error(error.message || 'Gagal menghapus surat!');
        }
      },
    });
  };

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    try {
      await axios.post(`${BASE_URL}api/surat-keluar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
      });

      message.success('Surat keluar berhasil ditambahkan!');
      setIsModalVisible(false);

      // Emit events to notify other components - this will trigger refreshData via the subscription
      eventBus.emit(DATA_EVENTS.SURAT_KELUAR_UPDATED);
      eventBus.emit(DATA_EVENTS.ANY_DATA_UPDATED);
    } catch (err) {
      const error = err as any;
      message.error(
        'Gagal menambahkan surat keluar: ' +
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
      await updateSurat(currentRecord.id, formData);
      message.success('Surat keluar berhasil diperbarui!');
      setIsEditModalVisible(false);
      // No need to call refreshData here, it will be triggered by the event
    } catch (err) {
      const error = err as Error;
      message.error(
        'Gagal memperbarui surat keluar: ' + (error.message || 'Unknown error')
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Fungsi helper untuk type checking
  const isSearchableValue = (value: unknown): value is string => {
    return typeof value === 'string' || typeof value === 'number';
  };

  const filteredData = (data as DataType[]).filter((item) => {
    return Object.values(item).some((val) => {
      if (isSearchableValue(val)) {
        return val.toString().toLowerCase().includes(searchText.toLowerCase());
      }
      return false;
    });
  });

  if (loading) {
    return <div>Loading...</div>;
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
      title: 'Nomor Surat',
      dataIndex: 'surat_nomor',
      key: 'surat_nomor',
      align: 'center' as const,
    },
    {
      title: 'Tanggal Surat',
      dataIndex: 'tanggal',
      key: 'tanggal',
      align: 'center' as const,
    },
    {
      title: 'Pengirim',
      dataIndex: 'pengirim',
      key: 'pengirim',
      align: 'center' as const,
    },
    {
      title: 'Penerima',
      dataIndex: 'penerima',
      key: 'penerima',
      align: 'center' as const,
    },
    {
      title: 'Aksi',
      key: 'aksi',
      align: 'center' as const,
      render: (_: unknown, record: DataType) => (
        <Space>
          <Tooltip title="Lihat Detail">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/dashboard/surat-keluar/${record.id}`)}
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
              <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              Surat Keluar
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
                {data.length}
              </span>
            </Title>
            <Text type="secondary">Kelola semua surat keluar Anda di sini</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
            size="large"
          >
            Tambah Surat
          </Button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Cari surat..."
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
            showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} surat`,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Create Form Modal */}
      <SuratForm
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* Edit Form Modal */}
      <SuratForm
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
    </Content>
  );
};

export default SuratKeluar;