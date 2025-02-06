import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React, { Suspense } from 'react'
import './index.css'
// import Login from './pages/Login'
import AppRoutes from './route/routes'
import { RouterProvider } from 'react-router-dom'
// import App from './App.tsx'
// import Home from './pages/Home.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={AppRoutes} />
    </Suspense>
  </StrictMode>,
)
