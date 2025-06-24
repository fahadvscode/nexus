import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Calendar, TrendingUp } from "lucide-react";
import { clientStore } from "@/store/clientStore";
import { CallStatsCard } from "./CallStatsCard";

export const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    newThisMonth: 0,
    upcomingEvents: 0,
  });

  useEffect(() => {
    const fetchClients = async () => {
      const clients = await clientStore.getAllClients();
      if (clients) {
        const activeClients = clients.filter(client => client.status === 'active').length;
        
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newThisMonth = clients.filter(client => new Date(client.created_at) >= thisMonth).length;

        setStats({
          totalClients: clients.length,
          activeClients,
          newThisMonth,
          upcomingEvents: 3, // Mock data for now
        });
      }
    };

    fetchClients();

    const handleClientsUpdate = () => fetchClients();
    window.addEventListener('clientsUpdated', handleClientsUpdate);

    return () => {
      window.removeEventListener('clientsUpdated', handleClientsUpdate);
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalClients}</div>
          <p className="text-xs text-muted-foreground">
            {stats.activeClients} active
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">New This Month</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.newThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            +{Math.round((stats.newThisMonth / stats.totalClients) * 100)}% from last month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
          <p className="text-xs text-muted-foreground">
            Next 7 days
          </p>
        </CardContent>
      </Card>

      {/* Call Stats Card spans 2 columns */}
      <div className="lg:col-span-2">
        <CallStatsCard />
      </div>
    </div>
  );
};
