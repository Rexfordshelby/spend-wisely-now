import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Plus, Search, User, Send, Star, 
  Trash2, Edit2, Phone, Globe, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  upi_id: string | null;
  currency: string;
  is_verified: boolean | null;
  country_code: string;
  bank_name: string | null;
  account_number: string | null;
}

const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR', flag: '🇵🇰' },
  { code: 'US', name: 'USA', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'UK', currency: 'GBP', flag: '🇬🇧' },
  { code: 'AE', name: 'UAE', currency: 'AED', flag: '🇦🇪' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'CN', name: 'China', currency: 'CNY', flag: '🇨🇳' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
];

const Contacts = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    upiId: "",
    countryCode: "IN",
    bankName: "",
    accountNumber: "",
  });

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredContacts(
        contacts.filter(c => 
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.upi_id?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchTerm, contacts]);

  const loadContacts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('recipients')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const saveContact = async () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const country = COUNTRIES.find(c => c.code === formData.countryCode);
      
      const contactData = {
        user_id: session.user.id,
        name: formData.name,
        upi_id: formData.upiId || null,
        country_code: formData.countryCode,
        currency: country?.currency || 'USD',
        bank_name: formData.bankName || null,
        account_number: formData.accountNumber || null,
      };

      if (editContact) {
        const { error } = await supabase
          .from('recipients')
          .update(contactData)
          .eq('id', editContact.id);
        if (error) throw error;
        toast.success("Contact updated!");
      } else {
        const { error } = await supabase
          .from('recipients')
          .insert(contactData);
        if (error) throw error;
        toast.success("Contact added!");
      }

      resetForm();
      loadContacts();
    } catch (error: any) {
      toast.error(error.message || "Failed to save contact");
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recipients')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("Contact deleted");
      loadContacts();
    } catch (error: any) {
      toast.error("Failed to delete contact");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      upiId: "",
      countryCode: "IN",
      bankName: "",
      accountNumber: "",
    });
    setEditContact(null);
    setDialogOpen(false);
  };

  const openEditDialog = (contact: Contact) => {
    setEditContact(contact);
    setFormData({
      name: contact.name,
      upiId: contact.upi_id || "",
      countryCode: contact.country_code,
      bankName: contact.bank_name || "",
      accountNumber: contact.account_number || "",
    });
    setDialogOpen(true);
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
    ];
    return gradients[name.charCodeAt(0) % gradients.length];
  };

  const getCountryFlag = (code: string) => {
    return COUNTRIES.find(c => c.code === code)?.flag || '🌍';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer h-12 w-32 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-8">
      <div className="container mx-auto p-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Contacts</h1>
            <p className="text-sm text-muted-foreground">{contacts.length} saved contacts</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button size="icon">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={formData.countryCode}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                            <span className="text-muted-foreground">({country.currency})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>UPI ID / Phone / Wallet</Label>
                  <Input
                    placeholder="name@upi or +91xxxxxxxxxx"
                    value={formData.upiId}
                    onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank Name (Optional)</Label>
                  <Input
                    placeholder="State Bank"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number (Optional)</Label>
                  <Input
                    placeholder="XXXX XXXX XXXX"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  />
                </div>
                <Button onClick={saveContact} className="w-full">
                  {editContact ? 'Update Contact' : 'Add Contact'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Contact List */}
        <div className="space-y-3">
          {filteredContacts.length === 0 ? (
            <Card className="p-8 text-center">
              <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No contacts found' : 'No contacts yet. Add one!'}
              </p>
            </Card>
          ) : (
            filteredContacts.map((contact) => (
              <Card key={contact.id} className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className={`bg-gradient-to-br ${getRandomGradient(contact.name)} text-white font-medium`}>
                      {getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{contact.name}</span>
                      {contact.is_verified && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-lg">{getCountryFlag(contact.country_code)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {contact.upi_id || contact.account_number || 'No payment info'}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {contact.currency}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePayContact(contact)}
                      className="text-primary"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(contact)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteContact(contact.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Contacts;