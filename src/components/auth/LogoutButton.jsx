import { useNavigate } from 'react-router-dom';

import useAuthStore
  from '../../stores/authStore';
import { useState } from 'react';
import useCartStore
  from '../../stores/cartStore';

export default function LogoutButton() {

  const navigate = useNavigate();

  const authLogout =
    useAuthStore(
      (state) => state.logout
    );

  const resetCartScope =
    useCartStore(
      (state) => state.resetCartScope
    );

  const [errorMessage, setErrorMessage] =
    useState('');

  async function handleLogout() {

    try {

      setErrorMessage('');

      await authLogout();

      resetCartScope();

      navigate('/login');

    } catch (error) {

      setErrorMessage(
        error?.message ||
          'Logout gagal. Pastikan data offline sudah tersinkron.'
      );

    }

  }

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:items-end">

    <button
      onClick={handleLogout}
      className="
        bg-red-500
        hover:bg-red-600
        text-white
        px-3
        py-2
        rounded-lg
        text-sm
        font-bold
      "
    >

      Logout

    </button>

    {errorMessage && (
      <div className="max-w-xs rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-right text-xs font-medium text-red-700 shadow-sm">
        {errorMessage}
      </div>
    )}

    </div>

  );

}
