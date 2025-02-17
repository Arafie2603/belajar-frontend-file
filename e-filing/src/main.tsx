import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React, { Suspense } from 'react'
import './index.css'
import AppRoutes from './route/routes'
import { RouterProvider } from 'react-router-dom'



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={AppRoutes} />
    </Suspense>
  </StrictMode>,
)
