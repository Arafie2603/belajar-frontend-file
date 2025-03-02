import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

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
      const BASE_URL = import.meta.env.VITE_BASE_URL || "https://api-efiling.vercel.app/";

      const response = await axios.post(`${BASE_URL}api/users/login`, {
        nomor_identitas: values.nomor_identitas,
        password: values.password
      });

      if (!response.data || !response.data.data || !response.data.data.token) {
        throw new Error('Token is missing in response');
      }

      const token = response.data.data.token;
      await login(token);
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(`Login gagal: ${err.response?.data?.message || 'Terjadi kesalahan'}`);
      } else {
        setError((err as Error).message || 'Terjadi kesalahan pada server');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header Section with Decorative Wave */}
          <div className="relative bg-indigo-600 p-8 text-center">
            <svg className="absolute left-0 bottom-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
              <path fill="white" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,229.3C672,235,768,213,864,186.7C960,160,1056,128,1152,128C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
            <motion.h2 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-white text-3xl font-bold mb-1"
            >
              Welcome Back
            </motion.h2>
            <p className="text-blue-100 mb-16">Sign in to continue to your account</p>
          </div>

          <div className="p-8">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-4 rounded-lg bg-red-50 border border-red-100"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd"></path>
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </motion.div>
            )}

            <form 
              className="space-y-6" 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                onFinish({
                  nomor_identitas: formData.get('nomor_identitas') as string,
                  password: formData.get('password') as string,
                  remember: formData.get('remember') === 'true'
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="nomor-identitas" className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Identitas
                  </label>
                  <motion.div 
                    whileFocus={{ scale: 1.01 }}
                    className="relative"
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="nomor-identitas"
                      name="nomor_identitas"
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      placeholder="Masukkan nomor identitas Anda"
                    />
                  </motion.div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <motion.div 
                    whileFocus={{ scale: 1.01 }}
                    className="relative"
                  >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      placeholder="Masukkan password Anda"
                    />
                  </motion.div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    value="true"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 transition">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Sign in'
                  )}
                </motion.button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <motion.a 
                    href="/register" 
                    whileHover={{ scale: 1.05 }}
                    className="font-medium text-indigo-600 hover:text-indigo-500 transition"
                  >
                    Register here
                  </motion.a>
                </p>
              </div>
            </form>
          </div>

          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              ©2025 Created by LAB ICT
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;