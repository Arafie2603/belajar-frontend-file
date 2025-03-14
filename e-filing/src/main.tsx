import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'styled-components';
import './index.css';
import LoadingOverlay from './components/LoadingOverlay';
import App from './App'; // Import App.tsx

// Tema default (bisa dikustomisasi)
const theme = {
  primaryColor: '#1890ff',
  secondaryColor: '#52c41a',
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <Suspense fallback={<LoadingOverlay isLoading={true} />}>
        <App /> {/* Gunakan App.tsx sebagai entry point utama */}
      </Suspense>
    </ThemeProvider>
  </StrictMode>
);
