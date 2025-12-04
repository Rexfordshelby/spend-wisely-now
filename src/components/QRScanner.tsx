import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "./ui/button";
import { X, Camera, AlertCircle, RefreshCw } from "lucide-react";

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const [error, setError] = useState<string>("");
  const [isStarting, setIsStarting] = useState(true);
  const containerIdRef = useRef(`qr-reader-${Date.now()}`);

  useEffect(() => {
    let mounted = true;
    const containerId = containerIdRef.current;

    const startScanner = async () => {
      if (hasScannedRef.current) return;
      
      try {
        setIsStarting(true);
        setError("");

        // Wait for DOM element to be ready
        await new Promise(resolve => setTimeout(resolve, 100));

        const container = document.getElementById(containerId);
        if (!container || !mounted) return;

        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (hasScannedRef.current || !mounted) return;
            hasScannedRef.current = true;
            
            console.log("QR Scanned successfully:", decodedText);
            
            // Stop scanner before calling callback
            scanner.stop().catch(() => {});
            scannerRef.current = null;
            
            // Call onScan with slight delay to ensure cleanup
            setTimeout(() => {
              if (mounted) {
                onScan(decodedText);
              }
            }, 50);
          },
          () => {} // Ignore scan failures
        );

        if (mounted) {
          setIsStarting(false);
        }
      } catch (err: any) {
        console.error("QR Scanner error:", err);
        if (mounted) {
          setIsStarting(false);
          if (err.name === "NotAllowedError") {
            setError("Camera permission denied. Please allow camera access and try again.");
          } else if (err.name === "NotFoundError") {
            setError("No camera found on this device.");
          } else if (err.message?.includes("already scanning")) {
            // Scanner already running, ignore
          } else {
            setError("Failed to start camera. Please try again.");
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
  }, [onScan]);

  const handleClose = () => {
    hasScannedRef.current = true; // Prevent any further scans
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    onClose();
  };

  const handleRetry = () => {
    setError("");
    setIsStarting(true);
    hasScannedRef.current = false;
    
    // Remount by changing container id
    containerIdRef.current = `qr-reader-${Date.now()}`;
    
    // Force re-render
    window.location.reload();
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
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={handleRetry}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Go Back
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 relative">
                {isStarting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-xl">
                    <div className="text-center space-y-3">
                      <Camera className="w-12 h-12 mx-auto animate-pulse text-primary" />
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}
                <div 
                  id={containerIdRef.current}
                  className="rounded-xl overflow-hidden border-4 border-primary bg-black min-h-[300px]"
                />
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-muted-foreground mt-4 pb-4">
          <p className="font-medium">Position any payment QR code within the frame</p>
          <p className="text-xs mt-1">UPI • PayTM • PhonePe • GPay • EasyPaisa • JazzCash • Alipay • WeChat & more</p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
