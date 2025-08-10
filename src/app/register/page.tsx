
'use client';

import AuthForm from '@/components/AuthForm';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  const handleRegister = async (username: string, password: any) => {
    try {
      await axios.post('http://localhost:8000/api/register/', { username, password });
      router.push('/login');
    } catch (error) {
      console.error('Error registering:', error);
    }
  };

  return <AuthForm title="Register" buttonText="Register" onSubmit={handleRegister} />;
}
