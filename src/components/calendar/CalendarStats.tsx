
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, CheckCircle } from "lucide-react";

export const CalendarStats = () => {
  const stats = [
    {
      title: "Today's Events",
      value: "3",
      description: "Scheduled for today",
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "This Week",
      value: "12",
      description: "Events this week",
      icon: Clock,
      color: "text-green-600"
    },
    {
      title: "Attendees",
      value: "24",
      description: "People involved",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Completed",
      value: "8",
      description: "Events completed",
      icon: CheckCircle,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
