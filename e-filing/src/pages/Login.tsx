import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Types
const API_URL = 'http://localhost:3000';
interface LoginFormValues {
  nomor_identitas: string;
  password: string;
  remember?: boolean;
}

interface LoginFormValues {
  nomor_identitas: string;
  password: string;
  remember?: boolean;
}


const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post(`${API_URL}/api/users/login`, {
        nomor_identitas: values.nomor_identitas,
        password: values.password
      });

      if (response.data.status === 200) {
        // Store the JWT token
        localStorage.setItem('token', response.data.data.token);
        
        // Store user data if needed
        localStorage.setItem('user', JSON.stringify(response.data.data.user));

        // Set up axios default headers for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;

        // Redirect to dashboard or home page
        navigate('/surat-masuk');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred during login. Please try again.');
      }
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <p className ="text-3xl font-extrabold">
      Welcome to E-Filing
    </p>
  );
};

export default Login;