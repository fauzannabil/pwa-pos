import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { login } from '../services/authService';

import useAuthStore from '../stores/authStore';

export default function LoginPage() {

  const navigate = useNavigate();

  const authLogin =
    useAuthStore((state) => state.login);

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function handleLogin(e) {

    e.preventDefault();

    setLoading(true);

    try {

      const response =
        await login(email, password);

      authLogin(
        response.token,
        response.user
      );

        localStorage.setItem('token', response.token);
        localStorage.setItem('user',JSON.stringify(response.user));

        navigate('/');

    } catch (error) {

      console.log(error);

      alert('Login failed');

    } finally {

      setLoading(false);

    }

  }

  return (

    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-gray-100
      "
    >

      <form
        onSubmit={handleLogin}
        className="
          bg-white
          p-8
          rounded-2xl
          shadow-lg
          w-full
          max-w-md
        "
      >

        <h1
          className="
            text-3xl
            font-bold
            mb-6
            text-center
          "
        >
          POS LOGIN
        </h1>

        <div className="mb-4">

          <label className="block mb-1">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="
              w-full
              border
              rounded-lg
              p-3
            "
            required
          />

        </div>

        <div className="mb-6">

          <label className="block mb-1">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="
              w-full
              border
              rounded-lg
              p-3
            "
            required
          />

        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            bg-blue-500
            text-white
            py-3
            rounded-lg
            disabled:bg-gray-400
          "
        >

          {
            loading
              ? 'Loading...'
              : 'Login'
          }

        </button>

      </form>

    </div>

  );

}