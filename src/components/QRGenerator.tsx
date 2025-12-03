import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "./ui/button";
import { Download, Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface QRGeneratorProps {
  username: string;
  amount?: number;
  currency: string;
}

const QRGenerator = ({ username, amount, currency }: QRGeneratorProps) => {
  const [copied, setCopied] = useState(false);
  
  // Generate QR data client-side (no edge function needed)
  const generateQRData = () => {
    const upiId = `${username}@worldvault`;
    
    if (currency === 'INR') {
      // UPI format for INR
      return `upi://pay?pa=${upiId}&pn=${username}&cu=INR${amount ? `&am=${amount}` : ''}`;
    } else {
      // World Vault custom format for other currencies
      const data = btoa(JSON.stringify({
        recipientId: upiId,
        recipientName: username,
        amount,
        currency,
      }));
      return `worldvault://${data}`;
    }
  };

  const qrData = generateQRData();
  const upiId = `${username}@worldvault`;

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

      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button variant="outline" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default QRGenerator;