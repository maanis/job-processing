import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authenticate } from '@/services/api';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: JSX.Element;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [status, setStatus] = useState<'loading' | 'ok' | 'redirect'>('loading');
    const [redirectTo, setRedirectTo] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setStatus('redirect');
            return;
        }

        let mounted = true;

        (async () => {
            try {
                const res = await authenticate();
                if (!mounted) return;

                if (res && res.authenticated) {
                    // Optionally update local user info
                    if (res.client) {
                        localStorage.setItem('user', JSON.stringify(res.client));
                        if (res.client.role) localStorage.setItem('role', res.client.role);
                    }

                    const role = res.client?.role || localStorage.getItem('role');
                    const path = location.pathname || window.location.pathname;

                    // Admins should not be sent to user dashboard
                    if (role === 'admin' && (path === '/dashboard' || path === '/failed-rows')) {
                        setRedirectTo('/admin/dashboard');
                        setStatus('ok');
                        return;
                    }

                    // Non-admins should not access admin routes
                    if (role !== 'admin' && path.startsWith('/admin')) {
                        setRedirectTo('/dashboard');
                        setStatus('ok');
                        return;
                    }

                    setStatus('ok');
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('role');
                    setStatus('redirect');
                }
            } catch (err) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                setStatus('redirect');
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    if (status === 'loading') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">Checking authentication…</div>
                </div>
            </div>
        );
    }
    if (status === 'redirect') return <Navigate to="/login" replace />;
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return children;
}
