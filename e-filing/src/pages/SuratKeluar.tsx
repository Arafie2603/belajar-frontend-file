/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
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
  Badge,
  Upload,
  Alert
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
import { UploadProps, Select } from 'antd';
import CKEditorComponent from '../components/CKEditor';
import { useSuratCache } from '../hooks/useSuratCache';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';


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
}

interface InputFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  submitting: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ visible, onCancel, onSubmit, submitting }) => {
  const [form] = Form.useForm();
  const [editorData, setEditorData] = useState('');
  const [fileList, setFileList] = useState<any[]>([]);

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
    Object.entries(values).forEach(([key, value]: [string, any]) => {
      if (key === 'tanggal') {
        formData.append(key, value.format('YYYY-MM-DD'));
      } else {
        formData.append(key, value);
      }
    });

    formData.append('isi_surat', editorData);

    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append('gambar', fileList[0].originFileObj);
    }

    onSubmit(formData);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>Input Surat Keluar Baru</span>
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
          Simpan
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
          <DatePicker style={{ width: '100%' }} />
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
            <p className="ant-upload-text">Klik atau seret file ke area ini untuk mengunggah</p>
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

        <Form.Item
          name="deskripsi"
          label="Deskripsi"
          rules={[{ required: true, message: 'Mohon isi deskripsi surat!' }]}
        >
          <Input placeholder="Masukkan deskripsi surat" />
        </Form.Item>
        <Form.Item
          name="kategori"
          label="Kategori"
          rules={[{ required: true, message: 'Mohon isi kategori surat!' }]}
        >
          <Input placeholder="Masukkan kategori surat" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const SuratKeluar: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://api-efiling.vercel.app/';
  const navigate = useNavigate();


  const { data, loading, error, refreshData } = useSuratCache(BASE_URL);

  // Add authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login page
      window.location.href = '/';
    }
  }, [isAuthenticated]);


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

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Konfirmasi Penghapusan',
      content: 'Apakah Anda yakin ingin menghapus surat ini?',
      okText: 'Ya, Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await axios.delete(`${BASE_URL}api/surat-keluar/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          message.success('Surat berhasil dihapus!');
          refreshData(); // Use the cache refresh function
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          message.error('Gagal menghapus surat!');
        }
      },
    });
  };

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    try {
      const response = await axios.post(`${BASE_URL}api/surat-keluar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
      });

      if (response.status === 201 || response.status === 200) {
        message.success('Surat keluar berhasil ditambahkan!');
        setIsModalVisible(false);
        refreshData(); // Use the cache refresh function
      }
    } catch (error: any) {
      message.error(
        'Gagal menambahkan surat keluar: ' +
        (error.response?.data?.message || error.message)
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
              onClick={() => message.info('Fitur edit akan segera hadir!')}
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
            </Title>
            <Text type="secondary">Kelola semua surat keluar Anda di sini</Text>
          </div>
          <Badge count={data.length}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
              size="large"
            >
              Tambah Surat
            </Button>
          </Badge>
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

      <InputForm
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </Content>
  );
};

export default SuratKeluar;