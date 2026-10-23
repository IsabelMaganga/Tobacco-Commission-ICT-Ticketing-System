// 'use client';

// import { useState, FormEvent } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { useAuth } from '@/context/AuthContext';
// import Button from '@/components/ui/Button';

// export default function RegisterPage() {
//   const { register } = useAuth();
//   const router = useRouter();
//   const [form, setForm] = useState({
//     name: '',
//     email: '',
//     password: '',
//     password_confirmation: '',
//     department: '',
//     phone: '',
//   });
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
//     setForm({ ...form, [k]: e.target.value });

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);
//     try {
//       await register(form);
//       router.push('/dashboard');
//     } catch (err: any) {
//       const errors = err.response?.data?.errors;
//       const first = errors ? Object.values(errors)[0] : null;
//       setError(
//         (Array.isArray(first) ? first[0] : first) ||
//           err.response?.data?.message ||
//           'Registration failed.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const field = (label: string, key: keyof typeof form, type = 'text', required = false) => (
//     <div>
//       <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
//       <input
//         type={type}
//         required={required}
//         value={form[key]}
//         onChange={set(key)}
//         className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
//       />
//     </div>
//   );

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
//       <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
//         <div className="text-center mb-8">
//           <h1 className="text-2xl font-bold text-emerald-700">Create Account</h1>
//           <p className="text-sm text-gray-500 mt-1">TIMS — Tobacco ICT Support</p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           {field('Full name', 'name', 'text', true)}
//           {field('Email', 'email', 'email', true)}
//           {field('Department', 'department')}
//           {field('Phone', 'phone')}
//           {field('Password', 'password', 'password', true)}
//           {field('Confirm password', 'password_confirmation', 'password', true)}

//           {error && (
//             <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
//               {error}
//             </div>
//           )}

//           <Button type="submit" loading={loading} className="w-full">
//             Create account
//           </Button>
//         </form>

//         <p className="text-center text-sm text-gray-600 mt-6">
//           Already have an account?{' '}
//           <Link href="/login" className="text-emerald-600 hover:underline">
//             Sign in
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }