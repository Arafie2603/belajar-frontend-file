import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import DashboardLayout from '../layouts/dashboard_layout';
import SuratMasuk from '../pages/SuratMasuk';

// Lazy load pages
// const Login = lazy(() => import('../pages/Login'));
const SuratKeluar = lazy(() => import('../pages/SuratKeluar'));

const AppRoutes = createBrowserRouter([
    {
        path: "/",
        element: <DashboardLayout />,
        children: [
            {
                path: "/surat-keluar",
                element: <SuratKeluar />,
            },
            {
                path: "/surat-masuk",
                element: <SuratMasuk />,
            },
        ]
    }
])
export default AppRoutes;
