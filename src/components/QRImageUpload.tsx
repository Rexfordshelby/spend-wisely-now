import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ImagePlus, Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

interface QRImageUploadProps {
  onScan: (data: string) => void;
}

const QRImageUpload = ({ onScan }: QRImageUploadProps) => {
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setProcessing(true);
    setPreview(URL.createObjectURL(file));
    
    try {
      const html5QrCode = new Html5Qrcode("qr-reader-hidden");
      
      const result = await html5QrCode.scanFile(file, true);
      
      if (result) {
        toast.success("QR code detected!");
        onScan(result);
      } else {
        toast.error("No QR code found in image");
      }
      
      await html5QrCode.clear();
    } catch (error: any) {
      console.error("QR scan error:", error);
      toast.error("Could not find QR code in image. Try a clearer image.");
    } finally {
      setProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Max 10MB.");
      return;
    }
    
    processImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden element for QR processing */}
      <div id="qr-reader-hidden" style={{ display: 'none' }} />
      
      {/* Upload Area */}
      <Card
        className={`relative border-2 border-dashed transition-all ${
          processing ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={processing}
        />
        
        {preview ? (
          <div className="relative p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={(e) => {
                e.stopPropagation();
                clearPreview();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="flex items-center justify-center">
              <img
                src={preview}
                alt="QR Preview"
                className="max-h-48 rounded-lg object-contain"
              />
            </div>
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm">Scanning QR code...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <ImagePlus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Upload QR Image</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drop an image or click to select
            </p>
            <Button variant="outline" size="sm" disabled={processing}>
              <Upload className="w-4 h-4 mr-2" />
              Choose Image
            </Button>
          </div>
        )}
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        Supports JPG, PNG, GIF • Max 10MB
      </div>
    </div>
  );
};

export default QRImageUpload;