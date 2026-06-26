import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { Users, Building, FileText, Hospital, UserCheck, Bell } from 'lucide-react';

const StatCard = ({ title, value, icon, loading }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm flex items-center">
        <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            {loading ? <Loader2 className="animate-spin text-gray-400 mt-1" size={20} /> : <p className="text-2xl font-bold text-gray-900">{value}</p>}
        </div>
    </div>
);

const AdminStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const response = await base44.functions.invoke('getAdminStats', {});
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching stats:", error);
                setStats(null); // Set to null on error
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);
    
    const statItems = [
        { title: "Personas (CRIS)", key: "personas", icon: <Users size={20}/> },
        { title: "Reportes de Daño", key: "reportesDano", icon: <Building size={20}/> },
        { title: "Solicitudes de Info", key: "solicitudes", icon: <FileText size={20}/> },
        { title: "Puntos de Ayuda", key: "puntosAyuda", icon: <Hospital size={20}/> },
        { title: "Personas Encontradas", key: "encontrados", icon: <UserCheck size={20}/> },
        { title: "Alertas Familiares", key: "alertas", icon: <Bell size={20}/> },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {statItems.map(item => (
                <StatCard 
                    key={item.key}
                    title={item.title} 
                    value={stats ? stats[item.key] : 0}
                    icon={item.icon}
                    loading={loading}
                />
            ))}
        </div>
    );
};

export default AdminStats;