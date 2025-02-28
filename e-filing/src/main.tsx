import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Suspense } from 'react';
import { ThemeProvider } from 'styled-components';
import './index.css';
import AppRoutes from './route/routes';
import { RouterProvider } from 'react-router-dom';
import LoadingOverlay from './components/LoadingOverlay';

// Tema default (bisa dikustomisasi)
const theme = {
  primaryColor: '#1890ff',
  secondaryColor: '#52c41a',
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <Suspense fallback={<LoadingOverlay isLoading={true}/>}>
        <RouterProvider router={AppRoutes} />
      </Suspense>
    </ThemeProvider>
  </StrictMode>
);
