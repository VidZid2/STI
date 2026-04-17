import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminRouteGuardProps {
    children: React.ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const verify = async () => {
            if (!supabase) {
                navigate('/admin-login', { replace: true });
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/admin-login', { replace: true });
                return;
            }

            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (userData?.role !== 'admin') {
                await supabase.auth.signOut();
                navigate('/admin-login', { replace: true });
                return;
            }

            setChecking(false);
        };

        verify();
    }, [navigate]);

    if (checking) {
        return (
            <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
