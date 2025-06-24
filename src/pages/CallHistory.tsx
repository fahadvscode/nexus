import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Phone, Clock, Calendar, Tag, Search, Download, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useCallStore } from "@/hooks/useCallStore";
import { CallLog } from "@/types/call";
import { useToast } from "@/hooks/use-toast";

const CallHistory = () => {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const { getAllCalls, subscribeToUpdates, isSupabaseConnected } = useCallStore();

  const loadCalls = async () => {
    setIsLoading(true);
    try {
      const allCalls = await getAllCalls();
      setCalls(allCalls.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
    } catch (error) {
      console.error('Error loading calls:', error);
      toast({
        title: "Error",
        description: "Failed to load call history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
    
    const unsubscribe = subscribeToUpdates(() => {
      loadCalls();
    });
    
    return unsubscribe;
  }, []);

  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.phoneNumber.includes(searchTerm) ||
      call.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOutcome = outcomeFilter === "all" || call.outcome === outcomeFilter;
    
    return matchesSearch && matchesOutcome;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'connected': return 'bg-green-100 text-green-800 border-green-200';
      case 'voicemail': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'no-answer': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'busy': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Date', 'Client', 'Phone', 'Duration', 'Outcome', 'Notes'].join(','),
        ...filteredCalls.map(call => [
          call.startTime.toLocaleDateString(),
          call.clientName,
          call.phoneNumber,
          call.duration ? formatDuration(call.duration) : 'N/A',
          call.outcome,
          call.notes.replace(/"/g, '""')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `call_history_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: `${filteredCalls.length} call records exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export call history. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Call History</h1>
                <p className="text-sm text-gray-500">Track and analyze your call activity</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={loadCalls} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Call Log</span>
                  <Badge variant="secondary">{filteredCalls.length} calls</Badge>
                  {!isSupabaseConnected && (
                    <Badge variant="outline" className="text-xs">Local Storage</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Complete history of all your client calls
                </CardDescription>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200"
                />
              </div>
              
              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md bg-white text-sm"
              >
                <option value="all">All Outcomes</option>
                <option value="connected">Connected</option>
                <option value="voicemail">Voicemail</option>
                <option value="no-answer">No Answer</option>
                <option value="busy">Busy</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 mx-auto text-gray-300 mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading call history...</h3>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredCalls.map((call, index) => (
                  <div
                    key={call.id}
                    className={`p-6 border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                      index === filteredCalls.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-3 lg:space-y-0">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                              <Phone className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{call.clientName}</h3>
                              <p className="text-sm text-gray-500">{call.phoneNumber}</p>
                            </div>
                          </div>
                          
                          <Badge className={`${getOutcomeColor(call.outcome)} border text-xs font-medium`}>
                            {call.outcome.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{call.startTime.toLocaleString()}</span>
                          </div>
                          {call.duration && (
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatDuration(call.duration)}</span>
                            </div>
                          )}
                          {call.followUpRequired && (
                            <div className="flex items-center space-x-2">
                              <Tag className="h-4 w-4 text-amber-500" />
                              <span className="text-amber-600">Follow-up required</span>
                            </div>
                          )}
                        </div>

                        {call.notes && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700">{call.notes}</p>
                          </div>
                        )}

                        {call.tags.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Tag className="h-3 w-3 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                              {call.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredCalls.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <Phone className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No calls found</h3>
                    <p className="text-gray-500">Start making calls to see your history here</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CallHistory;
