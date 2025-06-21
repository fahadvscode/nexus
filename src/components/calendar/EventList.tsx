
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface EventListProps {
  selectedDate: Date;
}

const mockEvents = [
  {
    id: 1,
    title: "Client Consultation",
    description: "Initial consultation with new client",
    date: new Date(),
    startTime: "14:00",
    endTime: "15:00",
    location: "Office Room 1",
    attendees: ["John Doe", "Jane Smith"],
    type: "meeting",
    status: "upcoming"
  },
  {
    id: 2,
    title: "Team Standup",
    description: "Daily team synchronization",
    date: new Date(),
    startTime: "09:00",
    endTime: "09:30",
    location: "Conference Room",
    attendees: ["Team Alpha"],
    type: "meeting",
    status: "completed"
  },
  {
    id: 3,
    title: "Product Demo",
    description: "Demonstrate new features to stakeholders",
    date: new Date(Date.now() + 86400000), // Tomorrow
    startTime: "16:00",
    endTime: "17:00",
    location: "Virtual Meeting",
    attendees: ["Client Team"],
    type: "presentation",
    status: "upcoming"
  }
];

export const EventList = ({ selectedDate }: EventListProps) => {
  const [events] = useState(mockEvents);

  const filteredEvents = events.filter(event => 
    format(event.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-purple-100 text-purple-800';
      case 'presentation': return 'bg-orange-100 text-orange-800';
      case 'call': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Events for {format(selectedDate, 'MMMM d, yyyy')}</span>
        </CardTitle>
        <CardDescription>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} scheduled
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No events scheduled for this date</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                      <Badge className={getTypeColor(event.type)}>
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{event.startTime} - {event.endTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{event.attendees.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
