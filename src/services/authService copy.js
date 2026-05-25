import api from '../api/api';

export async function login(email, password) {

  const response = await api.post(
    '/login',
    {
      email,
      password,
    }
  );

  return response.data;

}

export async function logout() {

  const response =
    await api.post('/logout');

  return response.data;

}