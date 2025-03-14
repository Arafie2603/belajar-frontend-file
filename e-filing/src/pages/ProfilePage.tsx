import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Avatar,
    Typography,
    Tabs,
    Form,
    Input,
    Button,
    Divider,
    Badge,
    Space,
    Descriptions,
    message,
    Skeleton,
    Upload
} from 'antd';
import {
    UserOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    EditOutlined,
    LockOutlined,
    IdcardOutlined,
    BankOutlined,
    BookOutlined,
    UploadOutlined,
    TeamOutlined,
    SaveOutlined,
    CameraOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Define interfaces for the data structures
interface UserData {
    nama: string;
    nomor_identitas: string;
    fakultas: string;
    prodi: string;
    alamat: string;
    jabatan: string;
    no_telp: string;
    role: string;
    foto?: string;
}

interface ProfileFormValues {
    nama: string;
    nomor_identitas: string;
    fakultas: string;
    prodi: string;
    alamat: string;
    jabatan: string;
    no_telp: string;
}

interface PasswordFormValues {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const UserProfile: React.FC = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [editing, setEditing] = useState<boolean>(false);
    const [form] = Form.useForm<ProfileFormValues>();
    const [activeTab, setActiveTab] = useState<string>('1');
    const [passwordForm] = Form.useForm<PasswordFormValues>();

    const fetchUserProfile = async (): Promise<void> => {
        try {
            setLoading(true);
            const response = await axios.get('https://api-efiling.vercel.app/api/users/profile');
            setUserData(response.data.data);
            if (response.data.data) {
                form.setFieldsValue({
                    nama: response.data.data.nama,
                    nomor_identitas: response.data.data.nomor_identitas,
                    fakultas: response.data.data.fakultas,
                    prodi: response.data.data.prodi,
                    alamat: response.data.data.alamat,
                    jabatan: response.data.data.jabatan,
                    no_telp: response.data.data.no_telp,
                });
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            message.error('Gagal memuat data profil');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps

    const handleEditProfile = (): void => {
        setEditing(true);
    };

    const handleCancelEdit = (): void => {
        if (userData) {
            form.setFieldsValue({
                nama: userData.nama,
                nomor_identitas: userData.nomor_identitas,
                fakultas: userData.fakultas,
                prodi: userData.prodi,
                alamat: userData.alamat,
                jabatan: userData.jabatan,
                no_telp: userData.no_telp,
            });
        }
        setEditing(false);
    };

    const handleUpdateProfile = async (values: ProfileFormValues): Promise<void> => {
        try {
            setLoading(true);
            // This would be the actual API call in production
            // await axios.put('https://api-efiling.vercel.app/api/users/profile', values);

            // For demo purposes, update locally
            if (userData) {
                setUserData({
                    ...userData,
                    ...values
                });
            }

            message.success('Profil berhasil diperbarui');
            setEditing(false);
            setLoading(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            message.error('Gagal memperbarui profil');
            setLoading(false);
        }
    };

    const handlePasswordChange = async (values: PasswordFormValues): Promise<void> => {
        try {
            await axios.patch('https://api-efiling.vercel.app/api/users/change-password', values);

            message.success('Password berhasil diubah');
            passwordForm.resetFields();
        } catch (error) {
            console.error('Error changing password:', error);
            message.warning(`Fitur Ini belum tersedia😌, maaf atas ketidaknyamanannya`);
        }
    };

    if (loading && !userData) {
        return (
            <Card style={{ margin: '24px', borderRadius: '12px' }} className="profile-card">
                <Skeleton avatar active paragraph={{ rows: 8 }} />
            </Card>
        );
    }

    const getAvatarColor = (name: string): string => {
        const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#f56a00'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    if (!userData) {
        return (
            <Card style={{ margin: '24px', borderRadius: '12px' }} className="profile-card">
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <Text>Failed to load user data. Please try again.</Text>
                    <Button type="primary" onClick={fetchUserProfile} style={{ marginTop: '10px' }}>
                        Retry
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card
                        className="profile-card"
                        style={{
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                        }}
                        bodyStyle={{ padding: 0 }}
                    >
                        <div style={{
                            background: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
                            padding: '32px 24px',
                            textAlign: 'center'
                        }}>
                            <Badge
                                count={
                                    <Avatar
                                        icon={<CameraOutlined />}
                                        size={24}
                                        style={{ background: '#1890ff', cursor: 'pointer' }}
                                    />
                                }
                                offset={[-8, 80]}
                            >
                                <Avatar
                                    size={100}
                                    style={{
                                        backgroundColor: getAvatarColor(userData.nama),
                                        border: '4px solid white'
                                    }}
                                    src={userData.foto || null}
                                >
                                    {userData.foto ? null : userData.nama.charAt(0).toUpperCase()}
                                </Avatar>
                            </Badge>
                            <Title level={4} style={{ color: 'white', marginTop: '16px', marginBottom: '4px' }}>
                                {userData.nama}
                            </Title>
                            <Text style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                                {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                            </Text>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <Descriptions column={1} labelStyle={{ fontWeight: '500' }} contentStyle={{ color: '#666' }}>
                                <Descriptions.Item
                                    label={<Space><IdcardOutlined /> Nomor ID</Space>}
                                    style={{ paddingBottom: '16px' }}
                                >
                                    {userData.nomor_identitas}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={<Space><PhoneOutlined /> Telepon</Space>}
                                    style={{ paddingBottom: '16px' }}
                                >
                                    {userData.no_telp}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={<Space><BankOutlined /> Fakultas</Space>}
                                    style={{ paddingBottom: '16px' }}
                                >
                                    {userData.fakultas}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={<Space><BookOutlined /> Program Studi</Space>}
                                    style={{ paddingBottom: '16px' }}
                                >
                                    {userData.prodi}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={<Space><TeamOutlined /> Jabatan</Space>}
                                    style={{ paddingBottom: '16px' }}
                                >
                                    {userData.jabatan}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={<Space><EnvironmentOutlined /> Alamat</Space>}
                                >
                                    {userData.alamat}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            minHeight: '680px'
                        }}
                    >
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            tabBarStyle={{ marginBottom: '24px' }}
                        >
                            <TabPane tab="Edit Profil" key="1">
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleUpdateProfile}
                                    initialValues={{
                                        nama: userData.nama,
                                        nomor_identitas: userData.nomor_identitas,
                                        fakultas: userData.fakultas,
                                        prodi: userData.prodi,
                                        alamat: userData.alamat,
                                        jabatan: userData.jabatan,
                                        no_telp: userData.no_telp,
                                    }}
                                >
                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="nama"
                                                label="Nama Lengkap"
                                                rules={[{ required: true, message: 'Masukkan nama lengkap' }]}
                                            >
                                                <Input prefix={<UserOutlined />} placeholder="Nama Lengkap" readOnly={!editing} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="nomor_identitas"
                                                label="Nomor Identitas"
                                                rules={[{ required: true, message: 'Masukkan nomor identitas' }]}
                                            >
                                                <Input prefix={<IdcardOutlined />} placeholder="Nomor Identitas" readOnly />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="fakultas"
                                                label="Fakultas"
                                                rules={[{ required: true, message: 'Masukkan fakultas' }]}
                                            >
                                                <Input prefix={<BankOutlined />} placeholder="Fakultas" readOnly={!editing} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="prodi"
                                                label="Program Studi"
                                                rules={[{ required: true, message: 'Masukkan program studi' }]}
                                            >
                                                <Input prefix={<BookOutlined />} placeholder="Program Studi" readOnly={!editing} />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="jabatan"
                                                label="Jabatan"
                                                rules={[{ required: true, message: 'Masukkan jabatan' }]}
                                            >
                                                <Input prefix={<TeamOutlined />} placeholder="Jabatan" readOnly={!editing} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="no_telp"
                                                label="Nomor Telepon"
                                                rules={[{ required: true, message: 'Masukkan nomor telepon' }]}
                                            >
                                                <Input prefix={<PhoneOutlined />} placeholder="Nomor Telepon" readOnly={!editing} />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item
                                        name="alamat"
                                        label="Alamat"
                                        rules={[{ required: true, message: 'Masukkan alamat' }]}
                                    >
                                        <Input.TextArea
                                            rows={4}
                                            placeholder="Alamat Lengkap"
                                            readOnly={!editing}
                                            style={{ resize: 'none' }}
                                        />
                                    </Form.Item>

                                    <Form.Item>
                                        <Row gutter={8} justify="end">
                                            {!editing ? (
                                                <Col>
                                                    <Button
                                                        type="primary"
                                                        icon={<EditOutlined />}
                                                        onClick={handleEditProfile}
                                                    >
                                                        Edit Profil
                                                    </Button>
                                                </Col>
                                            ) : (
                                                <>
                                                    <Col>
                                                        <Button onClick={handleCancelEdit}>
                                                            Batal
                                                        </Button>
                                                    </Col>
                                                    <Col>
                                                        <Button
                                                            type="primary"
                                                            htmlType="submit"
                                                            icon={<SaveOutlined />}
                                                            loading={loading}>
                                                            Simpan
                                                        </Button>
                                                    </Col>
                                                </>
                                            )}
                                        </Row>
                                    </Form.Item>
                                </Form>
                            </TabPane>
                            <TabPane tab="Ganti Password" key="2">
                                <Form
                                    form={passwordForm}
                                    layout="vertical"
                                    onFinish={handlePasswordChange}
                                >
                                    <Form.Item
                                        name="currentPassword"
                                        label="Password Saat Ini"
                                        rules={[
                                            { required: true, message: 'Masukkan password saat ini' },
                                            { min: 6, message: 'Password minimal 6 karakter' }
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined />}
                                            placeholder="Password Saat Ini"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="newPassword"
                                        label="Password Baru"
                                        rules={[
                                            { required: true, message: 'Masukkan password baru' },
                                            { min: 6, message: 'Password minimal 6 karakter' }
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined />}
                                            placeholder="Password Baru"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="confirmPassword"
                                        label="Konfirmasi Password"
                                        dependencies={['newPassword']}
                                        rules={[
                                            { required: true, message: 'Konfirmasi password baru' },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('newPassword') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Password tidak cocok'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined />}
                                            placeholder="Konfirmasi Password"
                                        />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            style={{ width: '100%' }}
                                            icon={<LockOutlined />}
                                        >
                                            Ganti Password
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </TabPane>
                            <TabPane tab="Foto Profil" key="3">
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <Avatar
                                        size={150}
                                        src={userData.foto || null}
                                        style={{
                                            backgroundColor: getAvatarColor(userData.nama),
                                            margin: '0 auto 20px',
                                            display: 'block',
                                            border: '1px solid #eee'
                                        }}
                                    >
                                        {userData.foto ? null : userData.nama.charAt(0).toUpperCase()}
                                    </Avatar>

                                    <Upload
                                        name="avatar"
                                        listType="picture-card"
                                        className="avatar-uploader"
                                        showUploadList={false}
                                        action="https://api-efiling.vercel.app/api/users/update-photo"
                                        headers={{
                                            authorization: `Bearer ${localStorage.getItem('token')}`
                                        }}
                                        beforeUpload={(file) => {
                                            const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                                            if (!isJpgOrPng) {
                                                message.error('Hanya bisa upload file JPG/PNG!');
                                            }
                                            const isLt2M = file.size / 1024 / 1024 < 2;
                                            if (!isLt2M) {
                                                message.error('Ukuran gambar harus kurang dari 2MB!');
                                            }
                                            return isJpgOrPng && isLt2M;
                                        }}
                                        onChange={(info) => {
                                            if (info.file.status === 'done') {
                                                message.success(`${info.file.name} berhasil diupload`);
                                                // Refresh user data
                                                fetchUserProfile();
                                            } else if (info.file.status === 'error') {
                                                message.warning(`Fitur Ini belum tersedia😌, maaf atas ketidaknyamanannya`);
                                            }
                                        }}
                                    >
                                        <div>
                                            <UploadOutlined style={{ fontSize: 24 }} />
                                            <div style={{ marginTop: 8 }}>Upload</div>
                                        </div>
                                    </Upload>

                                    <Divider />

                                    <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
                                        <Title level={5}>Panduan Foto Profil</Title>
                                        <ul style={{ padding: '0 0 0 20px' }}>
                                            <li>Gunakan foto formal dengan latar belakang polos</li>
                                            <li>Posisi wajah menghadap ke depan</li>
                                            <li>Tidak menggunakan filter atau efek</li>
                                            <li>Format file: JPG atau PNG</li>
                                            <li>Ukuran maksimal: 2MB</li>
                                        </ul>
                                    </div>
                                </div>
                            </TabPane>
                        </Tabs>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col xs={24}>
                    <Card
                        title="Aktivitas Terakhir"
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        <Skeleton loading={loading} active paragraph={{ rows: 4 }}>
                            <div style={{ padding: '16px 0' }}>
                                <Text type="secondary">Saat ini tidak ada aktivitas terbaru untuk ditampilkan.</Text>
                            </div>
                        </Skeleton>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default UserProfile;