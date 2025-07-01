import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Mail, MapPin, Search, Calendar, Tag, Edit, Shield, RefreshCw, Trash2, CheckSquare, Square, Download, CalendarPlus, Bell, PhoneCall, User, MessageSquare, FileText, History } from "lucide-react";
import { useUserRole } from "@/components/UserRoleProvider";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@/types/client";
import { clientStore } from "@/store/clientStore";
import { EditClientModal } from "./EditClientModal";
import { BulkActionsToolbar } from "./BulkActionsToolbar";
import { exportClientsToCSV } from "@/utils/csvExport";
import { ClientEventModal } from "./calendar/ClientEventModal";
import { QuickReminderModal } from "./calendar/QuickReminderModal";
import { CallPreparationModal } from "./CallPreparationModal";
import { CallOutcomeModal } from "./CallOutcomeModal";
import { callStore } from "@/store/callStore";
import { CallLog } from "@/types/call";
import { TwilioCallModal } from "./TwilioCallModal";
import { EmailModal } from "./EmailModal";
import { DialerModal } from "./DialerModal";
import { DetailedLeadView } from "./DetailedLeadView";
import { useTwilioStore } from "@/hooks/useTwilioStore";
import { SmsModal } from "./SmsModal";
import { BulkSmsModal } from "./BulkSmsModal";
import { TagsNotesModal } from "./TagsNotesModal";
import { AdvancedFilters, FilterState } from "./AdvancedFilters";
import { CommunicationPanel } from "./CommunicationPanel";

export const ClientTable = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [schedulingClient, setSchedulingClient] = useState<Client | null>(null);
  const [reminderClient, setReminderClient] = useState<Client | null>(null);
  const [emailingClient, setEmailingClient] = useState<Client | null>(null);
  const [smsClient, setSmsClient] = useState<Client | null>(null);
  const [showBulkSms, setShowBulkSms] = useState(false);
  const [showDialer, setShowDialer] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [tagsNotesClient, setTagsNotesClient] = useState<Client | null>(null);
  const [communicationClient, setCommunicationClient] = useState<Client | null>(null);
  
  // Advanced filtering state
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    statusFilter: "all",
    sourceFilter: "all",
    selectedTags: [],
    hasNotes: null,
    dateRange: { from: null, to: null }
  });
  const { 
    userRole, 
    blurEnabled, 
    isAdmin, 
    isImpersonating, 
    getCurrentOrganizationId,
    getActiveProfile 
  } = useUserRole();
  const { toast } = useToast();
  const { makeCall } = useTwilioStore();

  const shouldBlurInfo = !isAdmin() && blurEnabled;

  const [preparingCall, setPreparingCall] = useState<Client | null>(null);
  const [twilioCallData, setTwilioCallData] = useState<{
    clientId: string;
    clientName: string;
    phoneNumber: string;
    preparationNotes: string;
    createdBy: string;
  } | null>(null);
  const [showTwilioCall, setShowTwilioCall] = useState(false);

  const [currentCall, setCurrentCall] = useState<{
    clientId: string;
    clientName: string;
    phoneNumber: string;
    startTime: Date;
    preparationNotes: string;
  } | null>(null);
  const [showCallOutcome, setShowCallOutcome] = useState(false);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      let clientList: Client[] = [];
      
      if (isImpersonating) {
        // When impersonating, fetch clients for the specific organization
        const organizationId = getCurrentOrganizationId();
        if (organizationId) {
          console.log('🔍 Fetching clients for impersonated organization:', organizationId);
          clientList = await clientStore.getClientsForOrganization(organizationId);
        }
      } else {
        // Normal behavior - get all clients (respects user role automatically)
        console.log('🔍 Fetching clients for current user...');
        clientList = await clientStore.getAllClients();
      }
      
      console.log('📊 Fetched clients:', clientList.length, 'clients');
      console.log('📋 Client details:', clientList);
      
      setClients(clientList);
    } catch (error) {
      console.error('❌ Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [refreshKey]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nexus-crm-clients') {
        console.log('Client store updated, refreshing table...');
        fetchClients();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const handleCustomRefresh = () => {
      console.log('Custom refresh event received, refreshing table...');
      fetchClients();
    };
    
    window.addEventListener('clientsUpdated', handleCustomRefresh);

    const handleShowCallOutcome = (event: CustomEvent) => {
      const { callData } = event.detail;
      setCurrentCall(callData);
      setShowCallOutcome(true);
    };

    window.addEventListener('showCallOutcome', handleShowCallOutcome as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('clientsUpdated', handleCustomRefresh);
      window.removeEventListener('showCallOutcome', handleShowCallOutcome as EventListener);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setSelectedClients([]);
    toast({
      title: "Refreshed",
      description: "Client list has been updated.",
    });
  };

  const handleExportAll = () => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `all_clients_${timestamp}.csv`;
      
      exportClientsToCSV(filteredClients, filename);
      
      toast({
        title: "Export Complete",
        description: `${filteredClients.length} client${filteredClients.length !== 1 ? 's' : ''} exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export clients. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCall = (client: Client) => {
    // Always open the preparation modal before a call
    setPreparingCall(client);
  };

  const handleDirectDial = async (phoneNumber: string) => {
    console.log('Direct dial requested for:', phoneNumber);
    await makeCall({ phoneNumber });
  };

  const handleStartCall = (preparationNotes: string) => {
    if (!preparingCall) return;

    // Use Twilio for real calls
    const callData = {
      clientId: preparingCall.id,
      clientName: preparingCall.name,
      phoneNumber: preparingCall.phone,
      preparationNotes,
      createdBy: 'current-user', // In a real app, you would get this from your auth context
    };

    setTwilioCallData(callData);
    setShowTwilioCall(true);
    setPreparingCall(null);
  };

  const handleTwilioCallComplete = () => {
    setTwilioCallData(null);
    setShowTwilioCall(false);
    toast({
      title: "Call Completed",
      description: "Call has been logged successfully.",
    });
    fetchClients(); // Refresh the client list
  };

  const handleSaveCall = async (callLog: Omit<CallLog, 'id'>) => {
    try {
      await callStore.addCall(callLog);
      
      toast({
        title: "Call Logged",
        description: "Call details have been saved successfully.",
      });
      
      // Update client's last contact date
      const clients = await clientStore.getAllClients();
      const clientIndex = clients.findIndex(c => c.id === callLog.clientId);
      if (clientIndex !== -1) {
        clients[clientIndex].last_contact = new Date().toISOString();
        await clientStore.updateClient(callLog.clientId, { last_contact: new Date().toISOString() });
      }
      
      setCurrentCall(null);
      fetchClients(); // Refresh the client list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save call log. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmail = async (email: string, name: string, client: Client) => {
    setEmailingClient(client);
  };

  const handleStartDialer = () => {
    if (selectedClients.length === 0) {
      toast({
        title: "No Clients Selected",
        description: "Please select clients to start the dialer.",
        variant: "destructive",
      });
      return;
    }
    setShowDialer(true);
  };

  const handleSms = (client: Client) => {
    setSmsClient(client);
  };

  const handleBulkSms = () => {
    if (selectedClients.length === 0) {
      toast({
        title: "No Clients Selected",
        description: "Please select clients to send SMS to.",
        variant: "destructive",
      });
      return;
    }
    setShowBulkSms(true);
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(client => client.id));
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const filteredClients = clients
    .filter(client => {
      // Ensure tags is always an array
      const clientTags = client.tags || [];
      
      // Search term filter
      const matchesSearch = !filters.searchTerm || 
        client.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (client.email && client.email.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        clientTags.some(tag => tag.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        (client.notes && client.notes.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      
      // Status filter
      const matchesStatus = filters.statusFilter === "all" || client.status === filters.statusFilter;
      
      // Source filter
      const matchesSource = filters.sourceFilter === "all" || client.source === filters.sourceFilter;
      
      // Tags filter
      const matchesTags = filters.selectedTags.length === 0 || 
        filters.selectedTags.every(tag => clientTags.includes(tag));
      
      // Notes filter
      const matchesNotes = filters.hasNotes === null ||
        (filters.hasNotes === true && client.notes && client.notes.trim().length > 0) ||
        (filters.hasNotes === false && (!client.notes || client.notes.trim().length === 0));
      
      return matchesSearch && matchesStatus && matchesSource && matchesTags && matchesNotes;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "inactive": return "bg-gray-50 text-gray-700 border-gray-200";
      case "lead": return "bg-blue-50 text-blue-700 border-blue-200";
      case "potential": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const maskPhoneNumber = (phone: string) => {
    if (phone.length <= 4) return phone;
    return phone.slice(0, 3) + "***" + phone.slice(-2);
  };

  const getStatusSince = (client: Client) => {
    if (client.last_contact) {
      const lastContactDate = new Date(client.last_contact);
      return `since ${lastContactDate.toLocaleDateString()}`;
    }
    return `since ${new Date(client.created_at).toLocaleDateString()}`;
  };

  const timeSince = (date: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) {
      return `${diff} seconds ago`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)} minutes ago`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)} hours ago`;
    } else {
      return `${Math.floor(diff / 86400)} days ago`;
    }
  };

  return (
    <>
      <style>{`
        .contact-detail.blurred {
          filter: blur(4px);
          background-color: #f3f4f6;
          padding: 2px 8px;
          border-radius: 4px;
          user-select: none;
          pointer-events: none;
        }
      `}</style>
      
      {isAdmin && selectedClients.length > 0 && (
        <BulkActionsToolbar 
          selectedCount={selectedClients.length}
          selectedIds={selectedClients}
          onClearSelection={() => setSelectedClients([])}
          onRefresh={() => setRefreshKey(prev => prev + 1)}
        />
      )}
      
      <Card className="shadow-sm border border-gray-100">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-gray-900 flex items-center space-x-2">
                  <span>Client Directory</span>
                  <Badge variant="secondary" className="text-xs">
                    {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
                  </Badge>
                  {selectedClients.length > 0 && (
                    <Badge variant="default" className="text-xs bg-blue-600">
                      {selectedClients.length} selected
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Manage your client relationships</p>
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedClients.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartDialer}
                      className="hover:bg-green-50 hover:text-green-700"
                    >
                      <PhoneCall className="h-4 w-4 mr-1" />
                      Start Dialer ({selectedClients.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkSms}
                      className="hover:bg-blue-50 hover:text-blue-700"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Bulk SMS ({selectedClients.length})
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="hover:bg-gray-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                {isAdmin && filteredClients.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportAll}
                    className="hover:bg-green-50 hover:text-green-700"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export All
                  </Button>
                )}
                
                {!isAdmin && shouldBlurInfo && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-800 text-sm font-medium">Protected View</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableTags={[...new Set(clients.flatMap(client => (client.tags || [])))]}
            />
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 mx-auto text-gray-300 mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading clients...</h3>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Bulk Select Header */}
              {filteredClients.length > 0 && (
                <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <span className="text-sm text-gray-600 font-medium">
                      {selectedClients.length === filteredClients.length && filteredClients.length > 0
                        ? 'Deselect all'
                        : 'Select all'
                      }
                    </span>
                  </div>
                </div>
              )}

              {filteredClients.map((client, index) => (
                <div
                  key={client.id}
                  className={`p-6 border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                    index === filteredClients.length - 1 ? 'border-b-0' : ''
                  } ${selectedClients.includes(client.id) ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Selection Checkbox */}
                      <div className="pt-1">
                        <Checkbox
                          checked={selectedClients.includes(client.id)}
                          onCheckedChange={() => handleSelectClient(client.id)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </div>

                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-medium text-sm">
                              {client.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h3 
                                className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                                onClick={() => setViewingClient(client)}
                              >
                                {client.name}
                              </h3>
                              <span className="text-xs text-gray-500">{client.id}</span>
                            </div>
                          </div>
                          
                          <Badge className={`${getStatusColor(client.status)} border text-xs font-medium`}>
                            {client.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span className={`contact-detail ${shouldBlurInfo ? 'blurred' : ''}`}>
                              {client.email}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Phone className="h-4 w-4 text-green-500" />
                            <button
                              onClick={() => handleDirectDial(client.phone)}
                              className={`contact-detail ${shouldBlurInfo ? 'blurred' : ''} hover:underline cursor-pointer`}
                            >
                              {shouldBlurInfo ? maskPhoneNumber(client.phone) : client.phone}
                            </button>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600 md:col-span-2">
                            <MapPin className="h-4 w-4 text-red-500" />
                            <span className="truncate">{client.address}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center space-x-2">
                            <Tag className="h-3 w-3 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                              {(client.tags && client.tags.length > 0) ? (
                                client.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                                    {tag}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-400">No tags</span>
                              )}
                            </div>
                          </div>
                          
                          {client.notes && client.notes.trim().length > 0 && (
                            <div className="flex items-center space-x-1">
                              <FileText className="h-3 w-3 text-blue-500" />
                              <span className="text-xs text-blue-600 font-medium">Has notes</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Created {formatDate(new Date(client.created_at))}</span>
                            </div>
                            {client.last_contact && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Last contact {formatDate(new Date(client.last_contact))}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingClient(client)}
                        className="hover:bg-gray-50 hover:text-gray-700"
                      >
                        <User className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCall(client)}
                        className="flex items-center space-x-2 hover:bg-green-50 hover:text-green-700"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEmail(client.email, client.name, client)}
                        className="hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSms(client)}
                        className="hover:bg-orange-50 hover:text-orange-700"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        SMS
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTagsNotesClient(client)}
                        className="hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        <Tag className="h-4 w-4 mr-1" />
                        Tags
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCommunicationClient(client)}
                        className="hover:bg-teal-50 hover:text-teal-700"
                      >
                        <History className="h-4 w-4 mr-1" />
                        Comms
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSchedulingClient(client)}
                        className="hover:bg-purple-50 hover:text-purple-700"
                      >
                        <CalendarPlus className="h-4 w-4 mr-1" />
                        Schedule
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReminderClient(client)}
                        className="hover:bg-amber-50 hover:text-amber-700"
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        Remind
                      </Button>
                      
                      {isAdmin && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="hover:bg-gray-50"
                          onClick={() => setEditingClient(client)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredClients.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <EditClientModal
        open={!!editingClient}
        onOpenChange={(isOpen) => !isOpen && setEditingClient(null)}
        client={editingClient}
      />

      <ClientEventModal
        open={!!schedulingClient}
        onOpenChange={(isOpen) => !isOpen && setSchedulingClient(null)}
        client={schedulingClient}
      />

      <QuickReminderModal
        open={!!reminderClient}
        onOpenChange={(isOpen) => !isOpen && setReminderClient(null)}
        client={reminderClient}
      />

      <CallPreparationModal
        open={!!preparingCall}
        onOpenChange={(isOpen) => !isOpen && setPreparingCall(null)}
        client={preparingCall}
        onStartCall={handleStartCall}
      />

      <TwilioCallModal
        open={showTwilioCall}
        onOpenChange={setShowTwilioCall}
        callData={twilioCallData}
        onCallComplete={handleTwilioCallComplete}
      />

      <CallOutcomeModal
        open={showCallOutcome}
        onOpenChange={setShowCallOutcome}
        callData={currentCall}
        onSaveCall={handleSaveCall}
      />

      <EmailModal
        open={!!emailingClient}
        onOpenChange={(isOpen) => !isOpen && setEmailingClient(null)}
        client={emailingClient}
      />

      <DialerModal
        open={showDialer}
        onOpenChange={setShowDialer}
        selectedClientIds={selectedClients}
        clients={clients.filter(client => selectedClients.includes(client.id))}
        onCallComplete={handleTwilioCallComplete}
      />

      <DetailedLeadView
        open={!!viewingClient}
        onOpenChange={(isOpen) => !isOpen && setViewingClient(null)}
        client={viewingClient}
      />

      <SmsModal
        isOpen={!!smsClient}
        onClose={() => setSmsClient(null)}
        clientName={smsClient?.name}
        phoneNumber={smsClient?.phone}
        clientId={smsClient?.id}
      />

      <BulkSmsModal
        isOpen={showBulkSms}
        onClose={() => setShowBulkSms(false)}
        preSelectedClients={clients.filter(client => selectedClients.includes(client.id)).map(client => ({
          id: client.id,
          name: client.name,
          phone: client.phone,
          contact_name: client.name
        }))}
      />

      <TagsNotesModal
        isOpen={!!tagsNotesClient}
        onClose={() => setTagsNotesClient(null)}
        client={tagsNotesClient!}
        onUpdate={() => {
          fetchClients();
          setTagsNotesClient(null);
        }}
      />

      <CommunicationPanel
        open={!!communicationClient}
        onOpenChange={(isOpen) => !isOpen && setCommunicationClient(null)}
        client={communicationClient}
      />
    </>
  );
};

