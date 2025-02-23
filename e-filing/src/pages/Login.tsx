import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

interface LoginValues {
  nomor_identitas: string;
  password: string;
  remember: boolean;
}


interface LoginValues {
  nomor_identitas: string;
  password: string;
  remember: boolean;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginValues) => {
    try {
      setLoading(true);
      setError('');
      const BASE_URL = import.meta.env.VITE_BASE_URL || "https://belajar-backend-d3iolm3c5-arafie2603s-projects.vercel.app/";

      console.log('Attempting login with:', {
        nomor_identitas: values.nomor_identitas,
        remember: values.remember
      });

      const response = await axios.post(`${BASE_URL}api/users/login`, {
        nomor_identitas: values.nomor_identitas,
        password: values.password
      });

      console.log('Full API Response:', response);
      console.log('Response data structure:', {
        hasData: !!response.data,
        hasNestedData: !!response.data?.data,
        hasToken: !!response.data?.data?.token,
        tokenValue: response.data?.data?.token
      });

      if (!response.data) {
        throw new Error('Response data is empty');
      }

      if (!response.data.data) {
        throw new Error('Response data.data is empty');
      }

      if (!response.data.data.token) {
        throw new Error('Token is missing in response');
      }

      const token = response.data.data.token;
      console.log('Token found:', token.substring(0, 10) + '...');

      await login(token);
      console.log('Login successful, navigating...');
      navigate('/dashboard');
    } catch (err) {
      console.error('Detailed login error:', err);
      if (axios.isAxiosError(err)) {
        console.log('Axios error details:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message
        });

        setError(`Login gagal: ${err.response?.data?.message || 'Terjadi kesalahan'}`);
      } else {
        setError((err as Error).message || 'Terjadi kesalahan pada server');
      }
    } finally {
      setLoading(false);
    }
  };

  // Your existing JSX remains the same
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          onFinish({
            nomor_identitas: formData.get('nomor_identitas') as string,
            password: formData.get('password') as string,
            remember: formData.get('remember') === 'true'
          });
        }}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="nomor-identitas" className="sr-only">
                Nomor Identitas
              </label>
              <input
                id="nomor-identitas"
                name="nomor_identitas"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Nomor Identitas"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                value="true"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-500">
          ©2025 Created by LAB ICT
        </div>
      </div>
    </div>
  );
};

export default Login;