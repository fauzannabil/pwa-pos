import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import PosPage from './pages/PosPage';
import LoginPage from './pages/LoginPage';

import ProtectedRoute from './components/auth/ProtectedRoute';

import { useEffect } from 'react';
import useAuthStore  from './stores/authStore';
import { me } from './services/authService';
import TransactionHistoryPage from './pages/TransactionHistoryPage';



export default function App() {

const authLogin =
  useAuthStore(
    (state) => state.login
  );

    useEffect(() => {

      async function loadUser() {

        const token =
          localStorage.getItem('token');

        if (!token) return;

        try {

          const user = await me();

          authLogin(token, user);

        } catch (error) {

          console.log(error);

        }

      }

      loadUser();

    }, []);


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

        {/* TRANSACTION HISTORY */}
        <Route
          path="/transactions"
          element={

            <ProtectedRoute>

              <TransactionHistoryPage />

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