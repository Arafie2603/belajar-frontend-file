import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/Dashboard_Layout';
import Login from '../pages/Login';

const SuratKeluar = lazy(() => import('../pages/SuratKeluar'));
const SuratMasuk = lazy(() => import('../pages/SuratMasuk'));

const AppRoutes = createBrowserRouter([
    {
        path:'/',
        element: <Login />,
    },
    {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
            {
                path: "surat-keluar",
                element: <SuratKeluar />,
            },
            {
                path: "surat-masuk",
                element: <SuratMasuk />,
            }
        ]
    },
])
export default AppRoutes;