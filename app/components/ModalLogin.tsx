"use client"

import {ChangeEvent, FormEvent, useState} from "react";
import pb from "@/app/lib/pb";
import PillButton from "@/app/components/PillButton";
import {ClientResponseError} from "pocketbase";
import {useIsLogin} from "@/app/providers/LoginProvider";

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

export default function ModalLogin() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');

    const {isOnLogin, setIsOnLogin} = useIsLogin();

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
            setEmail("");
            setDisplayName("");
            setPassword("");
            setPasswordConfirm("");
            setIsOnLogin(false);
        } catch (err: any) {
            console.error(err);
            if (isLogin) setPassword("");

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

    if (!isOnLogin) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-10">
            <button className="fixed inset-0 bg-black opacity-40" onClick={() => setIsOnLogin(false)}/>
            <div className="bg-white p-8 border-white rounded-2xl shadow-2xl min-w-md z-10">
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