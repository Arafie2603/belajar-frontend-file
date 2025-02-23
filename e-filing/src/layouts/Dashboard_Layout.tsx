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
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
    const [selectedKey, setSelectedKey] = useState('3');
    const { isAuthenticated, isLoading, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const {
        token: { colorBgContainer },
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
            'files': '8'
        };
        if (path && pathToKey[path]) {
            setSelectedKey(pathToKey[path]);
        }
    }, [location]);

    if (isLoading) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%',
                    width: '100%' 
                }}>
                    <Spin size="large" />
                </div>
            </Layout>
        );
    }

    const handleLogout = async () => {
        try {
            await logout();
            message.success('Berhasil logout');
            navigate('/');
        } catch (error) {
            message.error('Gagal logout');
        }
    };

    const getMenuItems = (navigate: (path: string) => void): MenuItem[] => [
        getItem('Dashboard', '1', <DesktopOutlined />, undefined, () => navigate('/dashboard')),
        getItem('Data Transaksi', 'sub1', <UserOutlined />, [
            getItem('Surat Masuk', '2', undefined, undefined, () => navigate('/dashboard/surat-masuk')),
            getItem('Surat Keluar', '3', undefined, undefined, () => navigate('/dashboard/surat-keluar')),
            getItem('Notulen', '4', undefined, undefined, () => navigate('/dashboard/notulen')),
            getItem('Faktur', '5', undefined, undefined, () => navigate('/dashboard/faktur')),
        ]),
        getItem('Team', 'sub2', <TeamOutlined />, [
            getItem('Team 1', '6', undefined, undefined, () => navigate('/dashboard/team-1')),
            getItem('Team 2', '7', undefined, undefined, () => navigate('/dashboard/team-2')),
        ]),
        getItem('Files', '8', <FileOutlined />, undefined, () => navigate('/dashboard/files')),
    ];

    if (!isAuthenticated) {
        return null;
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div className="demo-logo-vertical" />
                <Menu 
                    theme="dark" 
                    selectedKeys={[selectedKey]}
                    mode="inline" 
                    items={getMenuItems(navigate)} 
                />
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