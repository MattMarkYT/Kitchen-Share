'use client';
import { useState, FormEvent, ChangeEvent } from 'react';
import pb from '../lib/pb';
import { useRouter } from 'next/navigation';
import PillButton from '../components/PillButton';
import { ClientResponseError } from 'pocketbase';

const FormInput = ({ label, type, value, onChange }: { label: string, type: string, value: string, onChange: (e: ChangeEvent<HTMLInputElement>) => void }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            required
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        />
    </div>
);

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');

    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (!isLogin && password !== passwordConfirm) {
                setError('Passwords do not match!');
                return;
            }
            if (isLogin) {
                await pb.collection('users').authWithPassword(email, password);
            } else {
                await pb.collection('users').create({ email, displayName, password, passwordConfirm });
                await pb.collection('users').authWithPassword(email, password);
            }
            const record = pb.authStore.model;
            router.push(!record?.profileSetup ? `/profile/${record?.id}` : '/');
        } catch (err: any) {
            console.error(err);

            if (err instanceof ClientResponseError && err.response?.data) {
                const firstError = Object.values(err.response.data)[0] as any;
                if (firstError?.message) {
                    setError(firstError.message);
                    return;
                }
            }
            setError(err?.message || 'An error occurred.');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    {isLogin ? 'Login' : 'Register'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    {!isLogin && (
                        <FormInput label="Name" type="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    )}
                    <FormInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

                    {!isLogin && (
                        <FormInput label="Confirm Password" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
                    )}

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <PillButton type="submit" className="w-full mt-2">
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </PillButton>
                </form>

                <div className="mt-2 flex flex-col gap-4 pt-2">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <PillButton
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="w-full"
                    >
                        {isLogin ? 'Create an account' : 'Log in instead'}
                    </PillButton>
                </div>
                 
            </div>
        </div>
    );
}
