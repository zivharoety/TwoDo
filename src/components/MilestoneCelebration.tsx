import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Heart, Star, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function MilestoneCelebration() {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [taskCount, setTaskCount] = useState(0);

    useEffect(() => {
        const handleCelebration = (e: any) => {
            console.log('Celebration event received:', e.detail);
            setTaskCount(e.detail.count);
            setIsVisible(true);

            // Initial confetti burst
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#ff2d55', '#fbbf24', '#34d399', '#6366f1']
            });

            // Delayed smaller bursts
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#6366f1', '#ff2d55']
                });
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#6366f1', '#ff2d55']
                });
            }, 500);
        };

        window.addEventListener('celebrate_milestone', handleCelebration);
        return () => window.removeEventListener('celebrate_milestone', handleCelebration);
    }, []);

    if (!user) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 2000,
                        background: 'radial-gradient(circle at center, rgba(30, 27, 75, 0.95) 0%, rgba(15, 12, 41, 0.98) 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        textAlign: 'center',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setIsVisible(false)}
                        style={{
                            position: 'absolute',
                            top: '2rem',
                            right: '2rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'grid',
                            placeItems: 'center',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </button>

                    {/* Animated Heart Centerpiece */}
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{
                            scale: [0, 1.2, 1],
                            rotate: [20, -5, 0]
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ position: 'relative', marginBottom: '2.5rem' }}
                    >
                        <div style={{
                            position: 'absolute',
                            inset: -40,
                            background: 'radial-gradient(circle at center, var(--primary) 0%, transparent 70%)',
                            opacity: 0.4,
                            filter: 'blur(20px)',
                            borderRadius: '50%'
                        }} />

                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                            }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <Heart size={120} fill="var(--primary)" color="var(--primary)" style={{ filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.6))' }} />
                        </motion.div>

                        {/* Floating Icons */}
                        <motion.div
                            animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            style={{ position: 'absolute', top: -20, right: -20 }}
                        >
                            <Star size={32} fill="#fbbf24" color="#fbbf24" style={{ filter: 'drop-shadow(0 0 10px #fbbf24)' }} />
                        </motion.div>

                        <motion.div
                            animate={{ y: [10, -10, 10], x: [5, -5, 5] }}
                            transition={{ repeat: Infinity, duration: 2.5 }}
                            style={{ position: 'absolute', bottom: 10, left: -40 }}
                        >
                            <Sparkles size={40} color="#34d399" style={{ filter: 'drop-shadow(0 0 10px #34d399)' }} />
                        </motion.div>
                    </motion.div>

                    {/* Text Content */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h1 className="text-gradient" style={{ fontSize: '3rem', margin: '0 0 0.5rem 0' }}>YOU'RE KILLIN' IT!</h1>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 400, color: 'rgba(255,255,255,0.9)', marginBottom: '2rem' }}>
                            {taskCount} Tasks Completed Together This Week!
                        </h2>
                    </motion.div>

                    {/* Couple Connection Display */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="glass-panel"
                        style={{
                            padding: '1.5rem 3rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '100px',
                            position: 'relative'
                        }}
                    >
                        <div style={{ position: 'relative' }}>
                            <img
                                src={user.avatar_url}
                                alt="You"
                                style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid white' }}
                            />
                            <span style={{ position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', opacity: 0.7 }}>You</span>
                        </div>

                        {/* Glowing Connection Line */}
                        <div style={{ position: 'relative', width: '60px', height: '4px' }}>
                            <div style={{ position: 'absolute', inset: 0, background: 'var(--primary)', borderRadius: '2px', opacity: 0.3 }} />
                            <motion.div
                                animate={{ left: ['-10%', '110%'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    width: '20px',
                                    height: '100%',
                                    background: 'white',
                                    borderRadius: '2px',
                                    filter: 'blur(2px) drop-shadow(0 0 5px var(--primary))'
                                }}
                            />
                        </div>

                        {user.partner && (
                            <div style={{ position: 'relative' }}>
                                <img
                                    src={user.partner.avatar_url}
                                    alt="Partner"
                                    style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid var(--primary)' }}
                                />
                                <span style={{ position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', opacity: 0.7 }}>{user.partner.name}</span>
                            </div>
                        )}
                    </motion.div>

                    {/* Call to Action */}
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                        onClick={() => setIsVisible(false)}
                        className="btn-primary"
                        style={{
                            marginTop: '4rem',
                            padding: '1rem 3rem',
                            fontSize: '1.1rem',
                            borderRadius: '100px',
                            boxShadow: '0 0 30px var(--primary-glow)'
                        }}
                    >
                        Keep it up! ✨
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
