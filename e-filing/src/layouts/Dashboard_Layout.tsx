import React, { useState, useEffect } from 'react';
import {
    DesktopOutlined,
    FileOutlined,
    TeamOutlined,
    UserOutlined,
    LogoutOutlined,
    BellOutlined,
    SettingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MailOutlined,
    FileTextOutlined,
    DollarOutlined,
    FileSearchOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import {
    Layout,
    Menu,
    theme,
    Button,
    Flex,
    message,
    Avatar,
    Badge,
    Dropdown,
    Typography,
} from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const { Header, Footer, Sider, Content } = Layout;
const { Title, Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
    onClick?: MenuProps['onClick'],
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
        onClick,
    } as MenuItem;
}

const DashboardLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [selectedKey, setSelectedKey] = useState('3');
    const { isAuthenticated, isLoading, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const {
        token: { colorBgContainer, colorPrimary, borderRadiusLG },
    } = theme.useToken();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/');
        } else if (!isLoading && isAuthenticated && location.pathname === '/dashboard') {
            navigate('/dashboard');
        }
    }, [isAuthenticated, isLoading, navigate, location.pathname]);

    useEffect(() => {
        const path = location.pathname.split('/').pop();
        const pathToKey: { [key: string]: string } = {
            'dashboard': '1',
            'surat-masuk': '2',
            'surat-keluar': '3',
            'notulen': '4',
            'faktur': '5',
            'team-1': '6',
            'team-2': '7',
            'files': '8',
            'profile': '9'
        };
        if (path && pathToKey[path]) {
            setSelectedKey(pathToKey[path]);
        }
    }, [location]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-4 border-t-transparent border-r-indigo-400 border-b-transparent border-l-transparent rounded-full animate-spin animation-delay-150"></div>
                    <div className="absolute inset-4 border-4 border-t-transparent border-r-transparent border-b-indigo-200 border-l-transparent rounded-full animate-spin animation-delay-300"></div>
                </div>
                <p className="mt-6 text-indigo-800 font-medium animate-pulse">Memuat data surat...</p>
            </div>
        );
    }

    const handleLogout = async () => {
        try {
            await logout();
            message.success('Berhasil logout');
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            message.error('Gagal logout');
        }
    };


    const getMenuItems = (navigate: (path: string) => void): MenuItem[] => [
        getItem('Dashboard', '1', <DesktopOutlined />, undefined, () => navigate('/dashboard')),
        getItem('Data Transaksi', 'sub1', <FileSearchOutlined />, [
            getItem('Surat Masuk', '2', <MailOutlined style={{ color: '#52c41a' }} />, undefined, () => navigate('/dashboard/surat-masuk')),
            getItem('Surat Keluar', '3', <MailOutlined style={{ color: '#1890ff' }} />, undefined, () => navigate('/dashboard/surat-keluar')),
            getItem('Notulen', '4', <FileTextOutlined style={{ color: '#722ed1' }} />, undefined, () => navigate('/dashboard/notulen')),
            getItem('Faktur', '5', <DollarOutlined style={{ color: '#fa541c' }} />, undefined, () => navigate('/dashboard/faktur')),
        ]),
        getItem('Team', 'sub2', <TeamOutlined />, [
            getItem('Team 1', '6', undefined, undefined, () => navigate('#')),
            getItem('Team 2', '7', undefined, undefined, () => navigate('#')),
        ]),
        getItem('Files', '8', <FileOutlined />, undefined, () => navigate('#')),
    ];

    const userMenuItems: MenuProps['items'] = [
        {
            key: '1',
            label: 'Profile',
            icon: <UserOutlined />,
            onClick: () => navigate('/dashboard/profile'),
        },
        {
            key: '2',
            label: 'Settings',
            icon: <SettingOutlined />,
            onClick: () => navigate('#'),
        },
        {
            type: 'divider',
        },
        {
            key: '3',
            label: 'Logout',
            icon: <LogoutOutlined />,
            onClick: handleLogout,
        },
    ];

    if (!isAuthenticated) {
        return null;
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                style={{
                    boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)',
                    background: '#001529'
                }}
                width={260}
                breakpoint="lg"
                collapsedWidth={80}
                trigger={null}
            >
                <div style={{
                    height: '64px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '0' : '0 16px',
                    color: '#fff',
                    backgroundColor: '#002140'
                }}>
                    {collapsed ? (
                        <FileTextOutlined style={{ fontSize: '24px' }} />
                    ) : (
                        <Title level={4} style={{ color: '#fff', margin: 0 }}>E-Filing System</Title>
                    )}
                </div>
                <Menu
                    theme="dark"
                    selectedKeys={[selectedKey]}
                    mode="inline"
                    items={getMenuItems(navigate)}
                    style={{ borderRight: 0 }}
                />
            </Sider>
            <Layout>
                <Header style={{
                    padding: '0 16px',
                    background: colorBgContainer,
                    boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '64px'
                }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: '16px', width: 64, height: 64 }}
                    />
                    <Flex align="center" gap="middle">
                        <Badge count={5}>
                            <Button shape="circle" icon={<BellOutlined />} />
                        </Badge>
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                            <Button type="text" style={{ height: '48px', padding: '0 8px' }}>
                                <Flex align="center" gap="small">
                                    <Avatar
                                        style={{ backgroundColor: colorPrimary }}
                                        icon={<UserOutlined />}
                                    />
                                    {!collapsed && (
                                        <div style={{ lineHeight: 1.2 }}>
                                            <div style={{ fontWeight: 'bold' }}>Aralasia</div>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>user</Text>
                                        </div>
                                    )}
                                </Flex>
                            </Button>
                        </Dropdown>
                    </Flex>
                </Header>
                <Content style={{
                    margin: '16px',
                    padding: 0,
                    minHeight: 280,
                    borderRadius: borderRadiusLG,
                    overflowY: 'auto'
                }}>
                    <Outlet />
                </Content>
                <Footer style={{
                    textAlign: 'center',
                    padding: '16px',
                    backgroundColor: colorBgContainer,
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)'
                }}>
                    E-Filing ©{new Date().getFullYear()} Created by LAB ICT
                </Footer>
            </Layout>
        </Layout>
    );
};

export default DashboardLayout;