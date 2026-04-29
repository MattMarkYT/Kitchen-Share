"use client"

import {ChangeEvent, FormEvent, useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import pb from "@/app/lib/pb";
import {ClientResponseError} from "pocketbase";
import {useIsLogin} from "@/app/providers/LoginProvider";
import {Mail, Lock, Eye, EyeOff, UtensilsCrossed, User} from "lucide-react";

const IconInput = ({
                       icon,
                       rightElement,
                       ...inputProps
                   }: {
    icon: React.ReactNode;
    rightElement?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="relative flex items-center">
        <span className="absolute left-3 text-gray-400">{icon}</span>
        <input
            {...inputProps}
            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
        />
        {rightElement && (
            <span className="absolute right-3 text-gray-400">{rightElement}</span>
        )}
    </div>
);

export default function ModalLogin() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const {isOnLogin, setIsOnLogin} = useIsLogin();
    const router = useRouter();

    const closeModal = useCallback(() => {
        setIsOnLogin(false);
        setIsLogin(true);
        setEmail('');
        setDisplayName('');
        setPassword('');
        setPasswordConfirm('');
        setShowPassword(false);
        setShowPasswordConfirm(false);
        setError('');
        setLoading(false);
    }, [setIsOnLogin]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [closeModal]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (loading) return;
        if (!isLogin && password !== passwordConfirm) {
            setError('Passwords do not match!');
            return;
        }
        setLoading(true);

        try {
            if (isLogin) {
                await pb.collection('users').authWithPassword(email, password);
            } else {
                await pb.collection('users').create({ email, displayName, password, passwordConfirm });
                await pb.collection('users').authWithPassword(email, password);
            }
            const record = pb.authStore.record;
            closeModal();
            router.push(record && !record.profileSetup ? `/profile/${record.id}` : '/');
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof ClientResponseError && err.response?.data) {
                const entries = Object.entries(err.response.data);
                if (entries.length > 0) {
                    const [field, firstError] = entries[0] as [string, { message?: string }];
                    if (firstError?.message) {
                        const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);
                        setError(`${fieldLabel}: ${firstError.message}`);
                        return;
                    }
                }
            }
            setError((err as Error)?.message || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setEmail('');
        setDisplayName('');
        setPassword('');
        setPasswordConfirm('');
        setShowPassword(false);
        setShowPasswordConfirm(false);
    };

    if (!isOnLogin) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="fixed inset-0 bg-black/50"
                onClick={closeModal}
            />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 z-10">

                {/* Branding */}
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-orange-500 rounded-2xl p-3 mb-3">
                        <UtensilsCrossed className="text-white" size={28} />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Neighborhood Eats</span>
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">
                    {isLogin ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-sm text-gray-500 text-center mb-6">
                    {isLogin
                        ? 'Log in to continue discovering great food.'
                        : 'Join us and start sharing great food.'}
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <IconInput
                        icon={<Mail size={16} />}
                        type="email"
                        placeholder="Email address"
                        required
                        value={email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    />

                    {!isLogin && (
                        <IconInput
                            icon={<User size={16} />}
                            type="text"
                            placeholder="Display name"
                            required
                            value={displayName}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                        />
                    )}

                    <IconInput
                        icon={<Lock size={16} />}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        rightElement={
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="focus:outline-none cursor-pointer"
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        }
                    />

                    {!isLogin && (
                        <IconInput
                            icon={<Lock size={16} />}
                            type={showPasswordConfirm ? 'text' : 'password'}
                            placeholder="Confirm password"
                            required
                            value={passwordConfirm}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPasswordConfirm(e.target.value)}
                            rightElement={
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirm(v => !v)}
                                    className="focus:outline-none cursor-pointer"
                                    tabIndex={-1}
                                    aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
                                >
                                    {showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            }
                        />
                    )}

                    {isLogin && (
                        <div className="text-right">
                            <button type="button" className="text-xs text-orange-500 hover:text-orange-600 font-medium cursor-pointer">
                                Forgot password?
                            </button>
                        </div>
                    )}

                    {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 mt-1 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? (isLogin ? 'Logging in…' : 'Creating account…') : (isLogin ? 'Log In' : 'Create Account')}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Switch mode */}
                <p className="text-center text-sm text-gray-500">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        type="button"
                        onClick={switchMode}
                        className="text-orange-500 hover:text-orange-600 font-semibold cursor-pointer"
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
}