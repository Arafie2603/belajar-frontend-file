/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
    DesktopOutlined,
    FileOutlined,
    TeamOutlined,
    UserOutlined,
    LogoutOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, theme, Button, Flex, message, Spin } from 'antd';
import { Outlet, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth'; // Sesuaikan path

const { Header, Footer, Sider } = Layout;

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
    const { isAuthenticated, isLoading, logout } = useAuth();
    const navigate = useNavigate();
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleLogout = async () => {
        try {
            await logout();
            message.success('Berhasil logout');
            navigate('/');
        } catch (error) {
            message.error('Gagal logout');
        }
    };

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    const getMenuItems = (navigate: (path: string) => void): MenuItem[] => [
        getItem('Dashboard', '1', <DesktopOutlined />, undefined, () => navigate('/dashboard')),
        getItem('Data Transaksi', 'sub1', <UserOutlined />, [
            getItem('Surat Masuk', '2', undefined, undefined, () => navigate('surat-masuk')),
            getItem('Surat Keluar', '3', undefined, undefined, () => navigate('surat-keluar')),
            getItem('Notulen', '4'),
            getItem('Faktur', '5'),
        ]),
        getItem('Team', 'sub2', <TeamOutlined />, [
            getItem('Team 1', '6'),
            getItem('Team 2', '7'),
        ]),
        getItem('Files', '8', <FileOutlined />),
    ];

    if (!isAuthenticated) {
        return null;
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div className="demo-logo-vertical" />
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={getMenuItems(navigate)} />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }}>
                    <Flex
                        style={{ padding: 0, width: '100%', height: '100%' }}
                        wrap
                        gap="middle"
                        justify='flex-end'
                        align='center'
                    >
                        <Button
                            danger
                            icon={<LogoutOutlined />}
                            style={{ marginRight: '20px' }}
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </Flex>
                </Header>
                <Outlet />
                <Footer style={{ textAlign: 'center' }}>
                    E-Filing ©{new Date().getFullYear()} Created by LAB ICT
                </Footer>
            </Layout>
        </Layout>
    );
};

export default DashboardLayout;