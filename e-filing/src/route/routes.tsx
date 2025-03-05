import { lazy, Suspense, ReactNode } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import DashboardLayout from '../layouts/Dashboard_Layout';
import Login from '../pages/LoginPage';
import DetailSuratKeluar from '../pages/DetailSuratKeluar';
import LoadingOverlay from '../components/LoadingOverlay';

// Lazy loaded components
const Dashboard = lazy(() => import('../pages/DashboardPage'));
const SuratKeluar = lazy(() => import('../pages/SuratKeluarPage'));
const SuratMasuk = lazy(() => import('../pages/SuratMasukPage'));
const DetailSuratMasuk = lazy(() => import('../pages/DetailSuratMasuk'));
const Faktur = lazy(() => import('../pages/FakturPage'));
const Notulen = lazy(() => import('../pages/NotulenPage'));
const DetailNotulen = lazy(() => import('../pages/DetailNotulen'));
const Register = lazy(() => import('../pages/RegisterPage'));
const DetailFaktur = lazy(() => import('../pages/DetailFakturPage'));

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
        path: '/register',
        element: (
            <SuspenseWrapper>
                <Register />
            </SuspenseWrapper>
        )
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
            },
            {
                path: 'faktur',
                element: (
                    <SuspenseWrapper>
                        <Faktur />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'faktur/:id',
                element: (
                    <SuspenseWrapper>
                        <DetailFaktur />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'notulen',
                element: (
                    <SuspenseWrapper>
                        <Notulen />
                    </SuspenseWrapper>
                )
            },
            {
                path: 'notulen/:id',
                element: (
                    <SuspenseWrapper>
                        <DetailNotulen />
                    </SuspenseWrapper>
                )
            },
        ]
    }
];

const AppRoutes = createBrowserRouter(routes);

export { SuspenseWrapper };
export default AppRoutes;
