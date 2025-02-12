import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/Dashboard_Layout';
import SuratMasuk from '../pages/SuratMasuk';
import Login from '../pages/Login';

// Lazy load pages
const SuratKeluar = lazy(() => import('../pages/SuratKeluar'));

const AppRoutes = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/",
        element: <DashboardLayout />,
        children: [
            {
                index: true,
                element: <Navigate to="/surat-masuk" replace />,
            },
            {
                path: "surat-keluar",
                element: <SuratKeluar />,
            },
            {
                path: "surat-masuk",
                element: <SuratMasuk />,
            }
        ]
    }
])
export default AppRoutes;