import { lazy, Suspense, ReactNode } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import DashboardLayout from '../layouts/Dashboard_Layout';
import Login from '../pages/Login';
import DetailSuratKeluar from '../pages/DetailSuratKeluar';
import LoadingOverlay from '../components/LoadingOverlay';

// Lazy loaded components
const Dashboard = lazy(() => import('../pages/DashboardPage'));
const SuratKeluar = lazy(() => import('../pages/SuratKeluar'));
const SuratMasuk = lazy(() => import('../pages/SuratMasuk'));
const DetailSuratMasuk = lazy(() => import('../pages/DetailSuratMasuk'));

// Custom loading wrapper component
const SuspenseWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <Suspense fallback={<LoadingOverlay isLoading={true} />}>
        {children}
    </Suspense>
);

const routes: RouteObject[] = [
    {
        path: '/',
        element: <Login />
    },
    {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
            {
                index: true,
                element: (
                    <SuspenseWrapper>
                        <Dashboard />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'surat-keluar',
                element: (
                    <SuspenseWrapper>
                        <SuratKeluar />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'surat-masuk',
                element: (
                    <SuspenseWrapper>
                        <SuratMasuk />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'surat-masuk/:no_surat_masuk',
                element: (
                    <SuspenseWrapper>
                        <DetailSuratMasuk />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'surat-keluar/:id',
                element: (
                    <SuspenseWrapper>
                        <DetailSuratKeluar />
                    </SuspenseWrapper>
                )
            }
        ]
    }
];

const AppRoutes = createBrowserRouter(routes);

export { SuspenseWrapper };
export default AppRoutes;
