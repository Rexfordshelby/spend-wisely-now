import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Scissors, Plus, X, Send, Users, Calculator } from "lucide-react";
import { toast } from "sonner";

interface Participant {
  id: string;
  name: string;
  share: number;
  paid: boolean;
}

const SplitBillCard = () => {
  const [open, setOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'You', share: 0, paid: true },
  ]);
  const [newName, setNewName] = useState("");
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');

  const addParticipant = () => {
    if (!newName.trim()) return;
    setParticipants(prev => [
      ...prev,
      { id: Date.now().toString(), name: newName, share: 0, paid: false }
    ]);
    setNewName("");
  };

  const removeParticipant = (id: string) => {
    if (id === '1') return; // Can't remove yourself
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const calculateSplit = () => {
    const amount = parseFloat(totalAmount);
    if (!amount || participants.length < 2) return;
    
    const equalShare = amount / participants.length;
    setParticipants(prev => prev.map(p => ({ ...p, share: equalShare })));
  };

  const updateShare = (id: string, share: number) => {
    setParticipants(prev => prev.map(p => 
      p.id === id ? { ...p, share } : p
    ));
  };

  const sendReminders = () => {
    const unpaid = participants.filter(p => !p.paid && p.id !== '1');
    if (unpaid.length === 0) {
      toast.success("Everyone has paid!");
      return;
    }
    toast.success(`Reminders sent to ${unpaid.length} people`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomColor = (name: string) => {
    const colors = [
      'bg-cyan-500',
      'bg-violet-500',
      'bg-rose-500',
      'bg-amber-500',
      'bg-emerald-500',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const totalShare = participants.reduce((sum, p) => sum + p.share, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="p-4 cursor-pointer hover:bg-accent/5 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-fuchsia-500/10">
              <Scissors className="w-5 h-5 text-fuchsia-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Split Bill</h3>
              <p className="text-sm text-muted-foreground">Divide expenses easily</p>
            </div>
            <Button variant="outline" size="sm">
              <Calculator className="w-4 h-4 mr-1" />
              Split
            </Button>
          </div>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Split Bill
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Total Amount */}
          <div className="space-y-2">
            <Label>Total Amount</Label>
            <Input
              type="number"
              placeholder="₹0.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="text-2xl font-bold h-14"
            />
          </div>

          {/* Participants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Split Between</Label>
              <div className="flex gap-2">
                <Button 
                  variant={splitType === 'equal' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => {
                    setSplitType('equal');
                    calculateSplit();
                  }}
                >
                  Equal
                </Button>
                <Button 
                  variant={splitType === 'custom' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSplitType('custom')}
                >
                  Custom
                </Button>
              </div>
            </div>

            {/* Add Participant */}
            <div className="flex gap-2">
              <Input
                placeholder="Add person's name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
              />
              <Button onClick={addParticipant} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Participant List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {participants.map((participant) => (
                <div 
                  key={participant.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={`${getRandomColor(participant.name)} text-white text-sm`}>
                      {getInitials(participant.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{participant.name}</div>
                    {splitType === 'custom' ? (
                      <Input
                        type="number"
                        placeholder="₹0.00"
                        value={participant.share || ''}
                        onChange={(e) => updateShare(participant.id, parseFloat(e.target.value) || 0)}
                        className="h-8 mt-1"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        ₹{participant.share.toFixed(2)}
                      </div>
                    )}
                  </div>
                  {participant.paid && (
                    <span className="text-xs text-green-500 font-medium">Paid</span>
                  )}
                  {participant.id !== '1' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParticipant(participant.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            {totalAmount && participants.length > 1 && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Total Split</span>
                  <span className="font-medium">₹{totalShare.toFixed(2)}</span>
                </div>
                {Math.abs(totalShare - parseFloat(totalAmount)) > 0.01 && (
                  <div className="text-xs text-destructive mt-1">
                    Difference: ₹{(parseFloat(totalAmount) - totalShare).toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={sendReminders}
              disabled={participants.length < 2}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Requests
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SplitBillCard;