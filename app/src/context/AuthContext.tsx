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
        let isMounted = true;

        const fetchProfile = async (userId: string, email?: string, metadata?: any) => {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (!isMounted) return;

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
                    console.warn('Profile not found, using fallback from auth metadata');
                    setUser({
                        id: userId,
                        name: metadata?.full_name || email?.split('@')[0] || 'User',
                        email: email || '',
                        avatar_url: metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                    });
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                if (isMounted) {
                    setUser({
                        id: userId,
                        name: email?.split('@')[0] || 'User',
                        email: email || '',
                        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                    });
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        // Listen for auth changes - this fires immediately with current session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change event:', event, !!session?.user);

            if (session?.user) {
                await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
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
