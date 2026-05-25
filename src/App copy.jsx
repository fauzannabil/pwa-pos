import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import PosPage from './pages/PosPage';
import LoginPage from './pages/LoginPage';

import ProtectedRoute
  from './components/auth/ProtectedRoute';

export default function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* POS */}
        <Route
          path="/"
          element={

            <ProtectedRoute>

              <PosPage />

            </ProtectedRoute>

          }
        />

        {/* Redirect unknown route */}
        <Route
          path="*"
          element={<Navigate to="/" />}
        />

      </Routes>

    </BrowserRouter>

  );

}