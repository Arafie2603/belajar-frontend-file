import { NotulenProvider } from './context/NotulenContext';
import { RouterProvider } from 'react-router-dom';
import AppRoutes from './route/routes';

function App() {
    return (
        <NotulenProvider>
            <RouterProvider router={AppRoutes} />
        </NotulenProvider>
    );
}

export default App;
