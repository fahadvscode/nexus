
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Bell, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const CalendarSettings = () => {
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("17:00");
  const [timezone, setTimezone] = useState("UTC-5");
  const [defaultEventDuration, setDefaultEventDuration] = useState("60");
  const [emailReminders, setEmailReminders] = useState(true);
  const [smsReminders, setSmsReminders] = useState(false);
  const [defaultReminderTime, setDefaultReminderTime] = useState("15min");
  const [weekStartsOn, setWeekStartsOn] = useState("monday");
  const [autoAcceptMeetings, setAutoAcceptMeetings] = useState(false);
  const { toast } = useToast();

  const handleSaveSettings = () => {
    // Save to localStorage for demo
    const settings = {
      workingHoursStart,
      workingHoursEnd,
      timezone,
      defaultEventDuration,
      emailReminders,
      smsReminders,
      defaultReminderTime,
      weekStartsOn,
      autoAcceptMeetings
    };
    localStorage.setItem('calendarSettings', JSON.stringify(settings));
    
    toast({
      title: "Settings Saved",
      description: "Calendar settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Calendar Settings</span>
          </CardTitle>
          <CardDescription>
            Configure your calendar preferences and working hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Working Hours</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={workingHoursStart}
                    onChange={(e) => setWorkingHoursStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={workingHoursEnd}
                    onChange={(e) => setWorkingHoursEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem value="UTC-7">Mountain Time (UTC-7)</SelectItem>
                    <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                    <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                    <SelectItem value="UTC+0">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weekStart">Week Starts On</Label>
                <Select value={weekStartsOn} onValueChange={setWeekStartsOn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications & Reminders</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailReminders">Email Reminders</Label>
                    <p className="text-sm text-gray-500">Send email notifications for upcoming events</p>
                  </div>
                  <Switch
                    id="emailReminders"
                    checked={emailReminders}
                    onCheckedChange={setEmailReminders}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsReminders">SMS Reminders</Label>
                    <p className="text-sm text-gray-500">Send text message notifications</p>
                  </div>
                  <Switch
                    id="smsReminders"
                    checked={smsReminders}
                    onCheckedChange={setSmsReminders}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultReminder">Default Reminder Time</Label>
                  <Select value={defaultReminderTime} onValueChange={setDefaultReminderTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reminder time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5min">5 minutes before</SelectItem>
                      <SelectItem value="15min">15 minutes before</SelectItem>
                      <SelectItem value="30min">30 minutes before</SelectItem>
                      <SelectItem value="1hour">1 hour before</SelectItem>
                      <SelectItem value="1day">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventDuration">Default Event Duration (minutes)</Label>
                  <Input
                    id="eventDuration"
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={defaultEventDuration}
                    onChange={(e) => setDefaultEventDuration(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoAccept">Auto-accept Meetings</Label>
                    <p className="text-sm text-gray-500">Automatically accept meeting invitations</p>
                  </div>
                  <Switch
                    id="autoAccept"
                    checked={autoAcceptMeetings}
                    onCheckedChange={setAutoAcceptMeetings}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveSettings}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
