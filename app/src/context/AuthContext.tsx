import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth initialization logic follows...

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check current session
        const fetchProfile = async (userId: string, email?: string, metadata?: any) => {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profile) {
                let partnerData = undefined;
                if (profile.partner_id) {
                    const { data: partnerProfile } = await supabase
                        .from('profiles')
                        .select('full_name, avatar_url, email')
                        .eq('id', profile.partner_id)
                        .single();

                    if (partnerProfile) {
                        partnerData = {
                            name: partnerProfile.full_name,
                            avatar_url: partnerProfile.avatar_url,
                            email: partnerProfile.email
                        };
                    }
                }

                setUser({
                    id: userId,
                    name: profile.full_name || email?.split('@')[0] || 'User',
                    email: profile.email || email || '',
                    avatar_url: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                    partner_id: profile.partner_id,
                    partner: partnerData
                });
            } else {
                // Fallback: If profile doesn't exist yet (e.g. trigger delay), use auth metadata
                console.warn('Profile not found, using fallback from auth metadata', error);
                setUser({
                    id: userId,
                    name: metadata?.full_name || email?.split('@')[0] || 'User',
                    email: email || '',
                    avatar_url: metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                });
            }
        };

        const initAuth = async () => {
            console.log('Starting Auth Initialization...');
            const timeout = setTimeout(() => {
                console.warn('Auth init timed out after 5s');
                setLoading(false);
            }, 5000);

            try {
                const { data, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) {
                    console.error('Session fetching error:', sessionError);
                }

                if (data?.session?.user) {
                    console.log('Session found for user:', data.session.user.id);
                    await fetchProfile(data.session.user.id, data.session.user.email, data.session.user.user_metadata);
                } else {
                    console.log('No active session found.');
                }
            } catch (error) {
                console.error('Fatal Auth init error:', error);
            } finally {
                console.log('Auth Initialization Finished.');
                clearTimeout(timeout);
                setLoading(false);
            }
        };

        initAuth();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) console.error('Sign in error:', error.message);
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, signInWithGoogle, signOut, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
