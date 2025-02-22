import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Layout, 
  theme, 
  Spin, 
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
  Upload
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
import { useNavigate } from 'react-router-dom';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;

interface DataType {
  key: string;
  nomorSurat: string;
  tanggalSurat: string;
  perihal: string;
  tujuanSurat: string;
  organisasi: string;
  pengirim: string;
  penerima: string;
}

interface InputFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: unknown) => void;
}

const InputForm: React.FC<InputFormProps> = ({ visible, onCancel, onSubmit }) => {
  const [form] = Form.useForm();

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    action: 'https://belajar-backend-ten.vercel.app/api/surat-keluar',
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>Input Surat Masuk Baru</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSubmit(values);
          form.resetFields();
        }}
      >
        <Form.Item
          name="nomorSurat"
          label="Nomor Surat"
          rules={[{ required: true, message: 'Mohon masukkan nomor surat!' }]}
        >
          <Input prefix={<FileTextOutlined />} placeholder="Masukkan nomor surat" />
        </Form.Item>

        <Form.Item
          name="tanggalSurat"
          label="Tanggal Surat"
          rules={[{ required: true, message: 'Mohon pilih tanggal surat!' }]}
        >
          <DatePicker style={{ width: '100%' }} />
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
          name="tujuanSurat"
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
          name="scanSurat"
          label="Scan Surat"
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

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Batal</Button>
            <Button type="primary" htmlType="submit">
              Simpan
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const SuratMasuk: React.FC = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState('');

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        'https://belajar-backend-ten.vercel.app/api/surat-masuk'
      );

      if (response.status === 200 && response.data.data.paginatedData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedData: DataType[] = response.data.data.paginatedData.map((item: any) => ({
          key: item.no_surat_masuk,
          organisasi: item.organisasi,
          nomorSurat: item.no_surat_masuk,
          tanggalSurat: new Date(item.tanggal).toLocaleDateString('id-ID'),
          perihal: item.perihal,
          tujuanSurat: item.tujuan,
          pengirim: item.pengirim,
          penerima: item.penerima
        }));
        setData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Gagal memuat data surat masuk');
    } finally {
      setLoading(false);
    }
  };

  const handleDetail = (record: DataType) => {
    navigate(`/dashboard/surat-masuk/${record.nomorSurat}`);
  };

  const handleDelete = (nomorSurat: string) => {
    Modal.confirm({
      title: 'Konfirmasi Penghapusan',
      content: 'Apakah Anda yakin ingin menghapus surat ini?',
      okText: 'Ya, Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await axios.delete(
            `https://belajar-backend-ten.vercel.app/api/surat-masuk/${nomorSurat}`
          );
          message.success('Surat berhasil dihapus!');
          fetchData();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          message.error('Gagal menghapus surat!');
        }
      },
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (values: any) => {
    try {
      const formData = {
        ...values,
        tanggal: dayjs(values.tanggalSurat).format('YYYY-MM-DD'),
      };

      await axios.post('https://belajar-backend-ten.vercel.app/api/surat-masuk', formData);
      message.success('Surat berhasil ditambahkan!');
      setIsModalVisible(false);
      fetchData();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      message.error('Gagal menambahkan surat!');
    }
  };

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      val.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const columns = [
    {
      title: 'Nomor Surat',
      dataIndex: 'nomorSurat',
      key: 'nomorSurat',
      align: 'center' as const,
    },
    {
      title: 'Organisasi',
      dataIndex: 'organisasi',
      key: 'organisasi',
      align: 'center' as const,
    },
    {
      title: 'Tanggal Surat',
      dataIndex: 'tanggalSurat',
      key: 'tanggalSurat',
      align: 'center' as const,
    },
    {
      title: 'Perihal',
      dataIndex: 'perihal',
      key: 'perihal',
      align: 'center' as const,
    },
    {
      title: 'Tujuan Surat',
      key: 'tujuanSurat',
      dataIndex: 'tujuanSurat',
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
              onClick={() => handleDetail(record)}
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
              onClick={() => handleDelete(record.key)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ margin: '16px' }}>
      <Card bordered={false} className="shadow-sm">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              Surat Masuk
            </Title>
            <Text type="secondary">Kelola semua surat masuk Anda di sini</Text>
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
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <Text style={{ display: 'block', marginTop: 16 }}>Memuat data surat...</Text>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={{ 
              pageSize: 5,
              showTotal: (total, range) => `${range[0]}-${range[1]} dari ${total} surat`
            }}
            bordered
            style={{ backgroundColor: colorBgContainer, borderRadius: borderRadiusLG }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>

      <InputForm
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSubmit={handleSubmit}
      />
    </Content>
  );
};

export default SuratMasuk;