import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "./ui/button";
import { X, Camera, AlertCircle } from "lucide-react";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string>("");
  const [isStarting, setIsStarting] = useState(true);

  // Keep onScan ref updated without triggering effect
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        setIsStarting(true);
        
        // Clean up any existing scanner
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch (e) {
            // Ignore stop errors
          }
        }

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            console.log("QR Scanned:", decodedText);
            if (mounted) {
              // Stop scanner first
              scanner.stop().catch(console.error);
              // Then call the callback
              onScanRef.current(decodedText);
            }
          },
          () => {
            // Ignore continuous scan errors
          }
        );

        if (mounted) {
          setIsStarting(false);
        }
      } catch (err: any) {
        console.error("QR Scanner error:", err);
        if (mounted) {
          setIsStarting(false);
          if (err.name === "NotAllowedError") {
            setError("Camera permission denied. Please allow camera access.");
          } else if (err.name === "NotFoundError") {
            setError("No camera found on this device.");
          } else {
            setError("Failed to start camera. Please check permissions.");
          }
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []); // Empty deps - only run once

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="container mx-auto p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Scan QR Code</h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            {error ? (
              <div className="text-center p-8 border border-destructive rounded-lg space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
                <p className="text-destructive">{error}</p>
                <Button variant="outline" onClick={handleClose}>
                  Go Back
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {isStarting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                    <div className="text-center space-y-3">
                      <Camera className="w-12 h-12 mx-auto animate-pulse text-primary" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}
                <div 
                  id="qr-reader" 
                  className="rounded-xl overflow-hidden border-4 border-primary bg-black min-h-[300px]"
                />
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-muted-foreground mt-4 pb-4">
          <p>Position any payment QR code within the frame</p>
          <p className="text-xs mt-1">Supports UPI, PayTM, PhonePe, GPay & more</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
