import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}
            >
                <div style={{ marginBottom: '2rem' }}>
                    <h1 className="text-gradient" style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>TwoDo</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Sync your life, <br /> one task at a time.
                    </p>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <button
                        className="btn-primary"
                        onClick={signInWithGoogle}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'white',
                            color: 'black',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.24h2.908c1.702-1.567 2.684-3.875 2.684-6.597z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.875.859-3.048.859-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9 3.59c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.159 6.656 3.59 9 3.59z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        By continuing, you simply agree to be organized.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
