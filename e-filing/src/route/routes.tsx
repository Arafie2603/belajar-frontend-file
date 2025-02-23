import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import DashboardLayout from '../layouts/Dashboard_Layout';
import Login from '../pages/Login';

const SuratKeluar = lazy(() => import('../pages/SuratKeluar'));
const SuratMasuk = lazy(() => import('../pages/SuratMasuk'));
const Notulen  = lazy(() => import ('../pages/Notulen'))

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
            },
            {
                path: "notulen",
                element: <Notulen />,
            }
        ]
    },
])
export default AppRoutes;