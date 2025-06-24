
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Phone, Trash2, Settings, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhoneNumber {
  id: string;
  number: string;
  friendlyName: string;
  capabilities: string[];
  status: "active" | "inactive";
  purchaseDate: string;
}

export const PhoneNumberManager = () => {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([
    {
      id: "PN1",
      number: "+1 (555) 123-4567",
      friendlyName: "Main Sales Line",
      capabilities: ["Voice", "SMS"],
      status: "active",
      purchaseDate: "2024-01-15",
    },
    {
      id: "PN2",
      number: "+1 (555) 987-6543",
      friendlyName: "Support Line",
      capabilities: ["Voice"],
      status: "active",
      purchaseDate: "2024-02-01",
    },
  ]);
  const [newNumber, setNewNumber] = useState("");
  const [newFriendlyName, setNewFriendlyName] = useState("");
  const { toast } = useToast();

  const handleAddNumber = () => {
    if (!newNumber || !newFriendlyName) {
      toast({
        title: "Missing Information",
        description: "Please provide both phone number and friendly name.",
        variant: "destructive",
      });
      return;
    }

    const newPhoneNumber: PhoneNumber = {
      id: `PN${phoneNumbers.length + 1}`,
      number: newNumber,
      friendlyName: newFriendlyName,
      capabilities: ["Voice", "SMS"],
      status: "active",
      purchaseDate: new Date().toISOString().split('T')[0],
    };

    setPhoneNumbers([...phoneNumbers, newPhoneNumber]);
    setNewNumber("");
    setNewFriendlyName("");

    toast({
      title: "Phone Number Added",
      description: `${newNumber} has been added successfully.`,
    });
  };

  const handleRemoveNumber = (id: string) => {
    setPhoneNumbers(phoneNumbers.filter(num => num.id !== id));
    toast({
      title: "Phone Number Removed",
      description: "The phone number has been removed from your account.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Phone Numbers</span>
          </CardTitle>
          <CardDescription>
            Manage your Twilio phone numbers for making calls and sending SMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="new-number">Phone Number</Label>
              <Input
                id="new-number"
                placeholder="+1 (555) 000-0000"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="friendly-name">Friendly Name</Label>
              <Input
                id="friendly-name"
                placeholder="e.g., Sales Line"
                value={newFriendlyName}
                onChange={(e) => setNewFriendlyName(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleAddNumber} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Phone Number
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Phone Numbers</CardTitle>
          <CardDescription>
            {phoneNumbers.length} phone number(s) configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Capabilities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phoneNumbers.map((phoneNumber) => (
                <TableRow key={phoneNumber.id}>
                  <TableCell className="font-medium">
                    {phoneNumber.number}
                  </TableCell>
                  <TableCell>{phoneNumber.friendlyName}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {phoneNumber.capabilities.map((cap) => (
                        <Badge key={cap} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={phoneNumber.status === "active" ? "default" : "secondary"}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {phoneNumber.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{phoneNumber.purchaseDate}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveNumber(phoneNumber.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
