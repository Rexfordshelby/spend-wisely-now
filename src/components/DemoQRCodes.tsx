import { QRCodeSVG } from "qrcode.react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Coffee, ShoppingCart, Fuel, Film, Utensils, Plane, Smartphone, Zap } from "lucide-react";

interface DemoQRCodesProps {
  onSelect: (qrData: string, merchant: { name: string; amount?: number }) => void;
}

const DEMO_MERCHANTS = [
  { id: 'coffee@worldvault', name: 'Starbucks', icon: Coffee, amount: 350, color: 'text-amber-500' },
  { id: 'grocery@worldvault', name: 'BigBasket', icon: ShoppingCart, amount: 1200, color: 'text-green-500' },
  { id: 'fuel@worldvault', name: 'HP Petrol', icon: Fuel, amount: 2000, color: 'text-orange-500' },
  { id: 'movie@worldvault', name: 'PVR Cinema', icon: Film, amount: 500, color: 'text-purple-500' },
  { id: 'food@worldvault', name: 'Swiggy', icon: Utensils, amount: 450, color: 'text-red-500' },
  { id: 'travel@worldvault', name: 'MakeMyTrip', icon: Plane, amount: 5000, color: 'text-blue-500' },
  { id: 'mobile@worldvault', name: 'Airtel', icon: Smartphone, amount: 299, color: 'text-rose-500' },
  { id: 'electricity@worldvault', name: 'BESCOM', icon: Zap, amount: 1500, color: 'text-yellow-500' },
];

const DemoQRCodes = ({ onSelect }: DemoQRCodesProps) => {
  const generateQRData = (merchantId: string, amount?: number) => {
    // Generate UPI-style QR data
    return `upi://pay?pa=${merchantId}&pn=${merchantId.split('@')[0]}&cu=INR${amount ? `&am=${amount}` : ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-semibold text-lg">Demo Merchants</h3>
        <p className="text-sm text-muted-foreground">Tap to simulate a QR payment</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DEMO_MERCHANTS.map((merchant) => {
          const Icon = merchant.icon;
          const qrData = generateQRData(merchant.id, merchant.amount);
          
          return (
            <Card
              key={merchant.id}
              className="p-4 cursor-pointer hover:bg-accent/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => onSelect(qrData, { name: merchant.name, amount: merchant.amount })}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-3 rounded-full bg-background ${merchant.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{merchant.name}</p>
                  <p className="text-xs text-muted-foreground">₹{merchant.amount}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Show a sample QR code */}
      <Card className="p-4 mt-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Or scan this demo QR with another device</p>
          <div className="bg-white p-4 rounded-lg inline-block mx-auto">
            <QRCodeSVG 
              value={generateQRData('demo@worldvault', 100)} 
              size={120} 
              level="H"
            />
          </div>
          <p className="text-xs text-muted-foreground">Demo Payment - ₹100</p>
        </div>
      </Card>
    </div>
  );
};

export default DemoQRCodes;
