import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "./ui/button";
import { Download, Share2, Copy, Check, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface QRGeneratorProps {
  username: string;
  amount?: number;
  currency: string;
}

const QRGenerator = ({ username, amount, currency }: QRGeneratorProps) => {
  const [copied, setCopied] = useState(false);
  const [demoReceived, setDemoReceived] = useState(false);
  
  // Generate QR data that can be scanned by anyone
  const generateQRData = () => {
    const upiId = `${username}@worldvault`;
    
    // Create a universal format that works with our scanner
    const paymentData = {
      type: 'worldvault',
      recipientId: upiId,
      recipientName: username,
      amount: amount || null,
      currency,
      timestamp: Date.now()
    };
    
    if (currency === 'INR') {
      // UPI-compatible format for INR
      return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(username)}&cu=INR${amount ? `&am=${amount}` : ''}&tn=WorldVault`;
    } else {
      // World Vault universal format
      return `worldvault://pay?data=${btoa(JSON.stringify(paymentData))}`;
    }
  };

  const qrData = generateQRData();
  const upiId = `${username}@worldvault`;
  
  // Demo: Simulate receiving payment when someone scans
  const simulateReceive = async () => {
    setDemoReceived(true);
    toast.success(`Demo: Received ${currency === 'INR' ? '₹' : currency + ' '}${amount || 'any amount'} from a sender!`);
    
    // Add to wallet balance (demo)
    const { data: { user } } = await supabase.auth.getUser();
    if (user && amount) {
      const { data: wallet } = await supabase
        .from('multi_currency_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('currency', currency)
        .maybeSingle();
      
      if (wallet) {
        await supabase
          .from('multi_currency_wallets')
          .update({ balance: wallet.balance + amount })
          .eq('id', wallet.id);
      }
    }
    
    setTimeout(() => setDemoReceived(false), 3000);
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `worldvault-qr-${username}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR Code downloaded!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pay me via World Vault',
          text: `Scan this QR code to pay ${upiId}${amount ? ` - Amount: ${amount} ${currency}` : ''}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyId();
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-8 rounded-2xl mx-auto w-fit shadow-lg">
        <QRCodeSVG 
          id="qr-code" 
          value={qrData} 
          size={256} 
          level="H"
          includeMargin={true}
        />
      </div>

      <div className="text-center space-y-2">
        <button 
          onClick={handleCopyId}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 hover:bg-accent/20 transition-colors"
        >
          <span className="text-sm font-medium">{upiId}</span>
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
        {amount && (
          <p className="text-2xl font-bold">
            {currency === 'INR' ? '₹' : currency} {amount.toLocaleString()}
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        <Button variant="outline" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      {/* Demo Receive Button */}
      <div className="pt-4 border-t border-border/50">
        <Button 
          className="w-full" 
          variant={demoReceived ? "secondary" : "default"}
          onClick={simulateReceive}
          disabled={demoReceived}
        >
          <Smartphone className="w-4 h-4 mr-2" />
          {demoReceived ? 'Payment Received!' : 'Simulate Receive (Demo)'}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Tap to simulate someone scanning this QR code
        </p>
      </div>
    </div>
  );
};

export default QRGenerator;