import React, { useState } from 'react';
import {
    DesktopOutlined,
    FileOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, theme } from 'antd';
import {  Outlet, useNavigate } from 'react-router';

const { Header, Footer, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

// type SubMenuItem = Required<MenuProps>['items'][number];

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

const DashboardLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const navigate = useNavigate()

    return (
        // <div>asdcvasda</div>
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div className="demo-logo-vertical" />
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline" items={getMenuItems(navigate)} />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }} />
                <Outlet />
                <Footer style={{ textAlign: 'center' }}>
                    E-Filing ©{new Date().getFullYear()} Created by LAB ICT
                </Footer>
            </Layout>
        </Layout>
    );
};

export default DashboardLayout;