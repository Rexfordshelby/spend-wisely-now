import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "./ui/button";
import { Download, Share2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface QRGeneratorProps {
  username: string;
  amount?: number;
  currency: string;
}

const QRGenerator = ({ username, amount, currency }: QRGeneratorProps) => {
  const [qrData, setQrData] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-upi-qr', {
          body: { username, amount, currency }
        });

        if (error) throw error;
        setQrData(data.qrData);
      } catch (error) {
        console.error('Error generating QR:', error);
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [username, amount, currency]);

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
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pay me via World Vault',
          text: `Scan this QR code to pay ${username}@worldvault`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (loading) {
    return <Skeleton className="w-64 h-64 mx-auto" />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-8 rounded-2xl mx-auto w-fit">
        <QRCodeSVG id="qr-code" value={qrData} size={256} level="H" />
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">{username}@worldvault</p>
        {amount && (
          <p className="text-2xl font-bold">{amount} {currency}</p>
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