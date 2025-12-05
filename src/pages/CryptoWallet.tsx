import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Send, ArrowDownLeft, TrendingUp, TrendingDown, RefreshCw, Copy, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  value: number;
  change24h: number;
  icon: string;
  address: string;
}

const DEMO_CRYPTO: CryptoAsset[] = [
  { id: '1', symbol: 'BTC', name: 'Bitcoin', balance: 0.0245, value: 2456.78, change24h: 2.34, icon: '₿', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
  { id: '2', symbol: 'ETH', name: 'Ethereum', balance: 0.85, value: 1923.45, change24h: -1.23, icon: 'Ξ', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8bEf8' },
  { id: '3', symbol: 'USDT', name: 'Tether', balance: 500.00, value: 500.00, change24h: 0.01, icon: '₮', address: 'TJYeasypSqM7a5HJkpCNdkC7fJvfPvPyNw' },
  { id: '4', symbol: 'SOL', name: 'Solana', balance: 12.5, value: 1875.00, change24h: 5.67, icon: '◎', address: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV' },
  { id: '5', symbol: 'DOGE', name: 'Dogecoin', balance: 1500, value: 150.00, change24h: -3.45, icon: 'Ð', address: 'DRSqEwcnJX3GZWH9Twtwk8D5ewqdJziwy' },
];

export default function CryptoWallet() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<CryptoAsset[]>(DEMO_CRYPTO);
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);
  const totalChange = assets.reduce((sum, a) => sum + (a.value * a.change24h / 100), 0);
  const changePercent = (totalChange / (totalValue - totalChange)) * 100;

  const handleSend = () => {
    if (!sendAddress || !sendAmount || !selectedAsset) {
      toast.error('Please fill all fields');
      return;
    }
    toast.success(`Sent ${sendAmount} ${selectedAsset.symbol} to ${sendAddress.slice(0, 8)}...`);
    setSendDialogOpen(false);
    setSendAddress('');
    setSendAmount('');
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 pb-8">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Crypto Wallet</h1>
            <p className="text-sm text-muted-foreground">Manage your digital assets</p>
          </div>
        </div>

        {/* Portfolio Summary */}
        <Card className="mb-6 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/20">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-1">Total Portfolio</p>
            <div className="flex items-end gap-3">
              <h2 className="text-4xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              <div className={`flex items-center gap-1 text-sm ${changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button className="flex-1" onClick={() => { setSelectedAsset(assets[0]); setReceiveDialogOpen(true); }}>
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Receive
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => { setSelectedAsset(assets[0]); setSendDialogOpen(true); }}>
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
              <Button variant="outline" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assets List */}
        <div className="space-y-3">
          <h3 className="font-semibold mb-3">Your Assets</h3>
          {assets.map((asset) => (
            <Card 
              key={asset.id} 
              className="bg-card/80 backdrop-blur border-border/50 cursor-pointer hover:bg-card/90 transition-colors"
              onClick={() => setSelectedAsset(asset)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center text-2xl font-bold">
                      {asset.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{asset.name}</h4>
                      <p className="text-sm text-muted-foreground">{asset.balance.toLocaleString()} {asset.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className={`text-sm ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Asset Button */}
        <Button variant="outline" className="w-full mt-6 h-12 border-dashed">
          <Plus className="w-4 h-4 mr-2" />
          Add New Asset
        </Button>
      </div>

      {/* Send Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send {selectedAsset?.symbol}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Tabs defaultValue={selectedAsset?.symbol || 'BTC'} onValueChange={(v) => setSelectedAsset(assets.find(a => a.symbol === v) || null)}>
              <TabsList className="w-full">
                {assets.slice(0, 4).map(a => (
                  <TabsTrigger key={a.symbol} value={a.symbol} className="flex-1">{a.symbol}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div>
              <label className="text-sm text-muted-foreground">Recipient Address</label>
              <Input 
                value={sendAddress} 
                onChange={(e) => setSendAddress(e.target.value)} 
                placeholder="Enter wallet address"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Amount</label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={sendAmount} 
                  onChange={(e) => setSendAmount(e.target.value)} 
                  placeholder="0.00"
                />
                <Button variant="outline" onClick={() => setSendAmount(selectedAsset?.balance.toString() || '')}>Max</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available: {selectedAsset?.balance.toLocaleString()} {selectedAsset?.symbol}
              </p>
            </div>
            <Button className="w-full" onClick={handleSend}>
              <Send className="w-4 h-4 mr-2" />
              Send {selectedAsset?.symbol}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive {selectedAsset?.symbol}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Tabs defaultValue={selectedAsset?.symbol || 'BTC'} onValueChange={(v) => setSelectedAsset(assets.find(a => a.symbol === v) || null)}>
              <TabsList className="w-full">
                {assets.slice(0, 4).map(a => (
                  <TabsTrigger key={a.symbol} value={a.symbol} className="flex-1">{a.symbol}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            
            <div className="flex justify-center p-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={selectedAsset?.address || ''} size={200} />
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{selectedAsset?.name} Address</p>
              <div className="flex items-center gap-2">
                <code className="text-xs flex-1 break-all">{selectedAsset?.address}</code>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => copyAddress(selectedAsset?.address || '')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Only send {selectedAsset?.symbol} to this address. Sending other assets may result in permanent loss.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
