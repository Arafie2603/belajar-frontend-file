import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import DashboardLayout from '../layouts/Dashboard_Layout';
import Login from '../pages/Login';


const SuratKeluar = lazy(() => import('../pages/SuratKeluar'));
const SuratMasuk = lazy(() => import('../pages/SuratMasuk'));
const PagePDF = lazy(() => import('../pages/TemplatePDF'));
const DetailSuratMasuk = lazy(() => import('../pages/DetailSuratMasuk'));

const AppRoutes = createBrowserRouter([
    {
        path: '/',
        element: <Login />,
    },
    {
        path: 'generate-pdf',
        element: <PagePDF />,
    },
    {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
            {
                path: 'surat-keluar',
                element: <SuratKeluar />,
            },
            {
                path: 'surat-masuk',
                element: <SuratMasuk />,
            },
            {
                path: 'surat-masuk/:no_surat_masuk',
                element: <DetailSuratMasuk />,
            },
        ],
    },
]);

export default AppRoutes;
