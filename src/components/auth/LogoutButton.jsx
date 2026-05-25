import { useNavigate } from 'react-router-dom';

import useAuthStore
  from '../../stores/authStore';

import {
  logout
} from '../../services/authService';

export default function LogoutButton() {

  const navigate = useNavigate();

  const authLogout =
    useAuthStore(
      (state) => state.logout
    );

  async function handleLogout() {

    try {

      await logout();

    } catch (error) {

      console.log(error);

    }

    authLogout();

    navigate('/login');

  }

  return (

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
      "
    >

      Logout

    </button>

  );

}