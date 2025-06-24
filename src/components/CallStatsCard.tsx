
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, TrendingUp, Clock, Target } from "lucide-react";
import { useCallStore } from "@/hooks/useCallStore";
import { CallStats } from "@/types/call";

export const CallStatsCard = () => {
  const [stats, setStats] = useState<CallStats>({
    totalCalls: 0,
    connectedCalls: 0,
    averageDuration: 0,
    connectionRate: 0,
    callsToday: 0,
    callsThisWeek: 0,
    callsThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const { getCallStats, subscribeToUpdates, isSupabaseConnected } = useCallStore();

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const callStats = await getCallStats();
      setStats(callStats);
    } catch (error) {
      console.error('Error loading call stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    
    const unsubscribe = subscribeToUpdates(() => {
      loadStats();
    });
    
    return unsubscribe;
  }, []);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Call Analytics</CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg text-gray-500">Loading...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <span>Call Analytics</span>
          {!isSupabaseConnected && (
            <Badge variant="secondary" className="text-xs">Local</Badge>
          )}
        </CardTitle>
        <Phone className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.callsToday}</div>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.callsThisWeek}</div>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.callsThisMonth}</div>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm">Connection Rate</span>
              </div>
              <Badge variant="secondary">
                {stats.connectionRate.toFixed(1)}%
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Avg Duration</span>
              </div>
              <Badge variant="secondary">
                {formatDuration(stats.averageDuration)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Total Calls</span>
              </div>
              <Badge variant="secondary">
                {stats.totalCalls}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
