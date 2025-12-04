import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Plus, Star, ArrowRight, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  upi_id: string | null;
  currency: string;
  is_verified: boolean | null;
  country_code: string;
}

const QuickContacts = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    upiId: "",
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('recipients')
        .select('id, name, upi_id, currency, is_verified, country_code')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.upiId) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase.from('recipients').insert({
        user_id: session.user.id,
        name: newContact.name,
        upi_id: newContact.upiId,
        currency: 'INR',
        country_code: 'IN',
      });

      if (error) throw error;

      toast.success("Contact added!");
      setNewContact({ name: "", upiId: "" });
      setDialogOpen(false);
      loadContacts();
    } catch (error: any) {
      toast.error(error.message || "Failed to add contact");
    }
  };

  const handlePayContact = (contact: Contact) => {
    navigate('/scan-pay', { 
      state: { 
        prefillContact: {
          recipientId: contact.upi_id,
          recipientName: contact.name,
          currency: contact.currency,
        }
      }
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomGradient = (name: string) => {
    const gradients = [
      'from-cyan-500 to-blue-500',
      'from-violet-500 to-purple-500',
      'from-rose-500 to-pink-500',
      'from-amber-500 to-orange-500',
      'from-emerald-500 to-teal-500',
      'from-fuchsia-500 to-pink-500',
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Quick Pay</h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[60px]">
              <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
              <div className="w-10 h-3 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Quick Pay</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/contacts')}
          className="text-xs"
        >
          View All
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add Contact Button */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center gap-2 min-w-[60px] group">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-all">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Add New</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="John Doe"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>UPI ID / Phone</Label>
                <Input
                  placeholder="name@upi or +91xxxxxxxxxx"
                  value={newContact.upiId}
                  onChange={(e) => setNewContact(prev => ({ ...prev, upiId: e.target.value }))}
                />
              </div>
              <Button onClick={addContact} className="w-full">
                Add Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Contact List */}
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => handlePayContact(contact)}
            className="flex flex-col items-center gap-2 min-w-[60px] group"
          >
            <Avatar className="w-12 h-12 ring-2 ring-transparent group-hover:ring-primary transition-all">
              <AvatarFallback className={`bg-gradient-to-br ${getRandomGradient(contact.name)} text-white text-sm font-medium`}>
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium truncate max-w-[60px]">
                {contact.name.split(' ')[0]}
              </span>
              {contact.is_verified && (
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              )}
            </div>
          </button>
        ))}

        {/* Empty State */}
        {contacts.length === 0 && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="text-sm">No contacts yet. Add one!</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default QuickContacts;