import { useEffect, useState } from 'react';
import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../lib/api';

export default function VerifyEmailPage() {
    const auth = useAuthContext();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(token ? 'loading' : 'idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (token && status === 'loading') {
            // Pozivamo tvoj backend endpoint
            api.post('/auth/verify-email', { token })
                .then(() => {
                    setStatus('success');
                })
                .catch((err) => {
                    setStatus('error');
                    setMessage(err.response?.data?.message || 'Verification failed. Link might be expired.');
                });
        }
    }, [token, status]);

    if (!auth) return null;

    if (auth.user?.isVerified) return <Navigate to={'/browse'} />;

    return (
        <div
            style={{
                backgroundColor: '#07080d',
                color: '#f9f8ff',
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
            }}
        >
            <div
                style={{
                    maxWidth: '400px',
                    textAlign: 'center',
                    background: '#0c0e14',
                    padding: '40px',
                    borderRadius: '16px',
                    border: '1px solid #1e212b',
                }}
            >
                {status === 'loading' && (
                    <>
                        <h2 style={{ color: '#b5c8ff' }}>Verifying...</h2>
                        <p style={{ color: '#959ca3' }}>Please wait while we confirm your email.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <h2 style={{ color: '#b5c8ff' }}>Success! 🦆</h2>
                        <p style={{ color: '#959ca3' }}>Your email has been verified. You can now explore Duckflix.</p>
                        <Link
                            to="/login"
                            style={{
                                display: 'inline-block',
                                marginTop: '20px',
                                padding: '10px 20px',
                                backgroundColor: '#b5c8ff',
                                color: '#07080d',
                                textDecoration: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                            }}
                        >
                            Go to Login
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h2 style={{ color: '#ffb5b5' }}>Verification Failed</h2>
                        <p style={{ color: '#959ca3' }}>{message}</p>
                        <Link to="/resend-verification" style={{ display: 'inline-block', marginTop: '20px', color: '#b5c8ff' }}>
                            Resend verification link?
                        </Link>
                    </>
                )}

                {status === 'idle' && (
                    <>
                        <h2 style={{ color: '#b5c8ff' }}>Check your inbox</h2>
                        <p style={{ color: '#959ca3' }}>
                            We've sent a verification link to your email address. Please click it to continue.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
