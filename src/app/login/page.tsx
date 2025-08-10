
'use client';

import AuthForm from '@/components/AuthForm';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (username: string, password: any) => {
    try {
      const response = await axios.post('http://localhost:8000/api/token/', { username, password });
      localStorage.setItem('token', response.data.access);
      router.push('/');
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  return <AuthForm title="Login" buttonText="Login" onSubmit={handleLogin} />;
}
