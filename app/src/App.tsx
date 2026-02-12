import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TaskProvider } from './context/TaskContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BottomNav } from './components/BottomNav';
import { TaskList } from './components/TaskList';
import { LoginPage } from './pages/Login';
import { PartnerPage } from './pages/Partner';
import { MilestoneCelebration } from './components/MilestoneCelebration';
import { motion, AnimatePresence } from 'framer-motion';

function AnimatedRoutes() {
    const location = useLocation();
    const { user } = useAuth();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{ width: '100%' }}
            >
                <Routes location={location}>
                    <Route
                        path="/"
                        element={
                            <>

                                <TaskList
                                    title="My List"
                                    filter={t =>
                                        t.status !== 'completed' && (
                                            (t.visibility === 'private' && t.creator_id === user?.id) ||
                                            (t.assignee_id === user?.id)
                                        )
                                    }
                                    showNudge={false}
                                    isMyList={true}
                                />
                            </>
                        }
                    />

                    <Route
                        path="/shared"
                        element={
                            <>
                                <PartnerPage />
                                {user?.partner_id && (
                                    <TaskList
                                        title="Shared Tasks"
                                        filter={t => t.visibility === 'shared' && t.status !== 'completed'}
                                        showNudge={true}
                                    />
                                )}
                            </>
                        }
                    />

                    <Route
                        path="/history"
                        element={
                            <TaskList
                                title="History"
                                filter={t => t.status === 'completed'}
                                showNudge={false}
                            />
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </motion.div>
        </AnimatePresence>
    );
}

function AppContent() {
    const { user, loading } = useAuth();
    console.log('AppContent render - loading:', loading, 'user:', user?.id);

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#0f0c29',
                color: 'white',
                gap: '1rem'
            }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>TwoDo</div>
                <div style={{ opacity: 0.6 }}>Loading...</div>
            </div>
        );
    }

    return (
        <Router>
            {!user ? (
                <Routes>
                    <Route path="*" element={<LoginPage />} />
                </Routes>
            ) : (
                <div className="app-container">
                    <MilestoneCelebration />
                    {/* Header Area */}
                    <header style={{ padding: '2rem 1rem 1rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 className="text-gradient" style={{ margin: 0, fontSize: '2rem' }}>TwoDo</h1>
                        </div>
                        <div className="glass-panel" style={{ padding: '0.5rem', borderRadius: '50%' }}>
                            <img src={user.avatar_url} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        </div>
                    </header>

                    <main className="content-area">
                        <AnimatedRoutes />
                    </main>

                    <BottomNav />
                </div>
            )}
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <TaskProvider>
                <AppContent />
            </TaskProvider>
        </AuthProvider>
    )
}

export default App
