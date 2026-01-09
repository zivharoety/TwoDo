import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Mail, Search, Heart, UserMinus, Settings } from 'lucide-react';

interface PartnerPageProps {
    onBack?: () => void;
}

export function PartnerPage({ onBack }: PartnerPageProps) {
    const { user } = useAuth();
    const [searchEmail, setSearchEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPartnerInfo, setShowPartnerInfo] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleLinkPartner = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchEmail) return;

        setLoading(true);
        setMessage(null);

        try {
            const { data, error } = await supabase.rpc('link_partner_by_email', {
                partner_email: searchEmail.toLowerCase().trim()
            });

            if (error) throw error;

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Something went wrong' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    // If already linked, but we aren't showing the "Management" UI yet, 
    // we show a simple "Partner Settings" button.
    // However, the user wants the "Partner" tab gone and discovery show on the "Shared" tab.
    // So if NOT linked, we show the Discovery UI.
    // If LINKED, the "Shared" tab will show tasks, and we might want a small button to unlink.

    if (user.partner_id && !showPartnerInfo) {
        return (
            <div style={{ padding: '0 0.5rem', marginBottom: '1rem' }}>
                <button
                    onClick={() => setShowPartnerInfo(true)}
                    className="glass-panel"
                    style={{
                        width: '100%',
                        padding: '0.8rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                            src={user.partner?.avatar_url}
                            alt={user.partner?.name}
                            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                        />
                        <span>Linked with <strong>{user.partner?.name}</strong></span>
                    </div>
                    <Settings size={16} />
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '0 0.5rem', maxWidth: onBack ? 'none' : '500px', margin: onBack ? '0' : '0 auto' }}>
            {onBack && (
                <button onClick={onBack} className="btn-ghost" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg>
                    Back
                </button>
            )}

            {!user.partner_id ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel"
                    style={{ padding: '2rem', textAlign: 'center' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(var(--primary-rgb), 0.1)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Search size={32} style={{ color: 'var(--primary)' }} />
                        </div>
                    </div>
                    <h3>Sync with Partner</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                        Enter your partner's email address to link your accounts and start sharing tasks.
                    </p>

                    <form onSubmit={handleLinkPartner} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                            <input
                                type="email"
                                placeholder="partner@email.com"
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                className="glass-panel"
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem 0.8rem 2.5rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: 'white'
                                }}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '1rem' }}
                        >
                            {loading ? 'Searching...' : 'Link Partner'}
                        </button>
                    </form>

                    {message && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                marginTop: '1.5rem',
                                color: message.type === 'success' ? '#4ade80' : '#f87171',
                                fontSize: '0.9rem'
                            }}
                        >
                            {message.text}
                        </motion.p>
                    )}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel"
                    style={{ padding: '2rem', textAlign: 'center', marginBottom: '2rem' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-1rem', marginRight: '-1rem' }}>
                        <button onClick={() => setShowPartnerInfo(false)} className="btn-ghost" style={{ padding: '0.5rem' }}>✕</button>
                    </div>

                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
                        <img
                            src={user.partner?.avatar_url}
                            alt={user.partner?.name}
                            style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--primary)' }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: '5px',
                            right: '5px',
                            background: 'var(--bg-card)',
                            borderRadius: '50%',
                            padding: '5px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
                        }}>
                            <Heart size={20} fill="var(--primary)" color="var(--primary)" />
                        </div>
                    </div>

                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{user.partner?.name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                        {user.partner?.email}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            className="btn-secondary"
                            style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.6, fontSize: '0.9rem' }}
                            onClick={async () => {
                                if (confirm('Are you sure you want to unlink? This will disconnect your shared tasks.')) {
                                    await supabase.rpc('unlink_partner');
                                    window.location.reload();
                                }
                            }}
                        >
                            <UserMinus size={16} />
                            Unlink Partner
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
