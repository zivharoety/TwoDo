import { Link, useLocation } from 'react-router-dom';
import { List, Users, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { hapticFeedback } from '../utils/haptics';

export function BottomNav() {
    const location = useLocation();
    const currentPath = location.pathname;

    const navItems = [
        { path: '/', label: 'My List', icon: List },
        { path: '/shared', label: 'Shared', icon: Users },
        { path: '/history', label: 'History', icon: History },
    ];

    return (
        <nav className="navbar">
            {navItems.map((item) => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => !isActive && hapticFeedback.light()}
                        style={{
                            textDecoration: 'none',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <motion.div
                            whileTap={{ scale: 0.85 }}
                            whileHover={{ scale: 1.05 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                opacity: isActive ? 1 : 0.6,
                                transition: 'opacity 0.3s ease'
                            }}
                        >
                            <Icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 2}
                                style={{
                                    color: isActive ? 'var(--primary)' : 'inherit',
                                    filter: isActive ? 'drop-shadow(0 0 8px var(--primary-glow))' : 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                            <span style={{
                                fontWeight: isActive ? 700 : 400,
                                fontSize: '0.75rem',
                                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                transition: 'all 0.3s ease'
                            }}>
                                {item.label}
                            </span>
                        </motion.div>

                        {isActive && (
                            <motion.div
                                layoutId="nav-indicator"
                                style={{
                                    position: 'absolute',
                                    top: -10,
                                    width: '20px',
                                    height: '2px',
                                    background: 'var(--primary)',
                                    borderRadius: '2px',
                                    boxShadow: '0 0 10px var(--primary)'
                                }}
                            />
                        )}

                        {isActive && (
                            <motion.div
                                layoutId="nav-glow"
                                style={{
                                    position: 'absolute',
                                    bottom: -15,
                                    width: '50px',
                                    height: '50px',
                                    background: 'var(--primary)',
                                    filter: 'blur(25px)',
                                    opacity: 0.4,
                                    borderRadius: '50%',
                                    zIndex: -1
                                }}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
