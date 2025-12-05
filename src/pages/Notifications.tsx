import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, BellOff, Check, Trash2, DollarSign, Target, TrendingUp, AlertCircle, Gift, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'payment' | 'goal' | 'budget' | 'alert' | 'reward' | 'social';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'payment', title: 'Payment Received', message: 'You received ₹2,500 from John Doe', time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), read: false },
  { id: '2', type: 'budget', title: 'Budget Alert', message: "You've spent 80% of your daily budget", time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), read: false },
  { id: '3', type: 'goal', title: 'Goal Progress', message: "You're 75% towards your 'New Phone' goal!", time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), read: true },
  { id: '4', type: 'reward', title: 'Achievement Unlocked!', message: "You earned 'Saver Pro' badge - 500 XP", time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), read: true },
  { id: '5', type: 'alert', title: 'Bill Reminder', message: 'Netflix subscription due tomorrow - ₹649', time: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), read: true },
  { id: '6', type: 'social', title: 'Friend Update', message: 'Sarah achieved their savings goal!', time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true },
  { id: '7', type: 'payment', title: 'Payment Sent', message: 'You sent $50 to Mike for dinner', time: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), read: true },
];

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [settings, setSettings] = useState({
    payments: true,
    budgetAlerts: true,
    goalUpdates: true,
    socialActivity: true,
    promotions: false
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign className="w-5 h-5" />;
      case 'goal': return <Target className="w-5 h-5" />;
      case 'budget': return <TrendingUp className="w-5 h-5" />;
      case 'alert': return <AlertCircle className="w-5 h-5" />;
      case 'reward': return <Gift className="w-5 h-5" />;
      case 'social': return <Users className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-green-500/10 text-green-500';
      case 'goal': return 'bg-purple-500/10 text-purple-500';
      case 'budget': return 'bg-orange-500/10 text-orange-500';
      case 'alert': return 'bg-red-500/10 text-red-500';
      case 'reward': return 'bg-yellow-500/10 text-yellow-500';
      case 'social': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 pb-8">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
            </div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <Check className="w-4 h-4 mr-1" />
                Read All
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <Card className="mb-6 bg-card/80 backdrop-blur border-border/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment Notifications</span>
                <Switch checked={settings.payments} onCheckedChange={(v) => setSettings(s => ({ ...s, payments: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Budget Alerts</span>
                <Switch checked={settings.budgetAlerts} onCheckedChange={(v) => setSettings(s => ({ ...s, budgetAlerts: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Goal Updates</span>
                <Switch checked={settings.goalUpdates} onCheckedChange={(v) => setSettings(s => ({ ...s, goalUpdates: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Social Activity</span>
                <Switch checked={settings.socialActivity} onCheckedChange={(v) => setSettings(s => ({ ...s, socialActivity: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Promotions & Offers</span>
                <Switch checked={settings.promotions} onCheckedChange={(v) => setSettings(s => ({ ...s, promotions: v }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification List */}
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`bg-card/80 backdrop-blur border-border/50 cursor-pointer transition-all ${!notification.read ? 'border-l-4 border-l-primary' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getIconColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h4>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.time), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {notifications.length === 0 && (
          <Card className="p-8 text-center">
            <BellOff className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground">You're all caught up!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
