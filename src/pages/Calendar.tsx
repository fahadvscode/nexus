
import { useState } from "react";
import { Calendar as CalendarIcon, Plus, Clock, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { AddEventModal } from "@/components/calendar/AddEventModal";
import { EventList } from "@/components/calendar/EventList";
import { CalendarStats } from "@/components/calendar/CalendarStats";

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <CalendarIcon className="h-7 w-7" />
                  <span>Calendar</span>
                </h1>
                <p className="text-sm text-gray-500">Manage appointments and reminders</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Calendar Settings
                </Button>
              </Link>
              <Button onClick={() => setShowAddEvent(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <CalendarStats />
            <EventList selectedDate={selectedDate} />
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Date</CardTitle>
                <CardDescription>Choose a date to view events</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Upcoming Reminders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Client Meeting</p>
                      <p className="text-xs text-gray-500">Today at 2:00 PM</p>
                    </div>
                    <Badge variant="secondary">30 min</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Follow-up Call</p>
                      <p className="text-xs text-gray-500">Tomorrow at 10:00 AM</p>
                    </div>
                    <Badge variant="secondary">15 min</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AddEventModal 
        open={showAddEvent} 
        onOpenChange={setShowAddEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default CalendarPage;
