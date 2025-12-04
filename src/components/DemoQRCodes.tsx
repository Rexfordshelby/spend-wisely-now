import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Coffee, ShoppingCart, Fuel, Film, Utensils, Plane, Smartphone, Zap, Globe, Banknote } from "lucide-react";

interface DemoQRCodesProps {
  onSelect: (qrData: string, merchant: { name: string; amount?: number }) => void;
}

const INDIA_MERCHANTS = [
  { id: 'coffee@paytm', name: 'Starbucks', icon: Coffee, amount: 350, color: 'text-amber-500', currency: 'INR' },
  { id: 'grocery@ybl', name: 'BigBasket', icon: ShoppingCart, amount: 1200, color: 'text-green-500', currency: 'INR' },
  { id: 'fuel@axisbank', name: 'HP Petrol', icon: Fuel, amount: 2000, color: 'text-orange-500', currency: 'INR' },
  { id: 'movie@okicici', name: 'PVR Cinema', icon: Film, amount: 500, color: 'text-purple-500', currency: 'INR' },
  { id: 'food@upi', name: 'Swiggy', icon: Utensils, amount: 450, color: 'text-red-500', currency: 'INR' },
  { id: 'travel@paytm', name: 'MakeMyTrip', icon: Plane, amount: 5000, color: 'text-blue-500', currency: 'INR' },
];

const PAKISTAN_MERCHANTS = [
  { id: '+923001234567', name: 'EasyPaisa Shop', icon: Smartphone, amount: 500, color: 'text-green-600', currency: 'PKR', type: 'easypaisa' },
  { id: '+923211234567', name: 'JazzCash Store', icon: Banknote, amount: 1000, color: 'text-red-600', currency: 'PKR', type: 'jazzcash' },
  { id: '+923331234567', name: 'Foodpanda PK', icon: Utensils, amount: 800, color: 'text-pink-500', currency: 'PKR', type: 'easypaisa' },
  { id: '+923451234567', name: 'Daraz', icon: ShoppingCart, amount: 2500, color: 'text-orange-500', currency: 'PKR', type: 'jazzcash' },
];

const GLOBAL_MERCHANTS = [
  { id: 'alipay_merchant_001', name: 'Alipay Shop', icon: Globe, amount: 50, color: 'text-blue-500', currency: 'CNY', type: 'alipay' },
  { id: 'wechat_merchant_001', name: 'WeChat Store', icon: Smartphone, amount: 88, color: 'text-green-500', currency: 'CNY', type: 'wechatpay' },
  { id: '+254712345678', name: 'M-Pesa Kenya', icon: Banknote, amount: 500, color: 'text-green-600', currency: 'KES', type: 'mpesa' },
  { id: 'merchant@paypal', name: 'PayPal Shop', icon: Globe, amount: 25, color: 'text-blue-600', currency: 'USD', type: 'paypal' },
];

const getCurrencySymbol = (currency: string) => {
  const symbols: Record<string, string> = {
    INR: '₹', PKR: 'Rs.', CNY: '¥', USD: '$', KES: 'KSh', EUR: '€', GBP: '£'
  };
  return symbols[currency] || currency;
};

const DemoQRCodes = ({ onSelect }: DemoQRCodesProps) => {
  const generateQRData = (merchant: typeof INDIA_MERCHANTS[0] | typeof PAKISTAN_MERCHANTS[0] | typeof GLOBAL_MERCHANTS[0]) => {
    const type = 'type' in merchant ? merchant.type : 'upi';
    
    switch (type) {
      case 'easypaisa':
        return `easypaisa://pay?phone=${merchant.id}&amount=${merchant.amount}&name=${merchant.name}`;
      case 'jazzcash':
        return `jazzcash://pay?phone=${merchant.id}&amount=${merchant.amount}&name=${merchant.name}`;
      case 'alipay':
        return `https://qr.alipay.com/${merchant.id}?amount=${merchant.amount}`;
      case 'wechatpay':
        return `wxp://${merchant.id}?amount=${merchant.amount}`;
      case 'mpesa':
        return `mpesa://pay?phone=${merchant.id}&amount=${merchant.amount}`;
      case 'paypal':
        return `https://paypal.me/${merchant.id}/${merchant.amount}`;
      default:
        return `upi://pay?pa=${merchant.id}&pn=${encodeURIComponent(merchant.name)}&cu=${merchant.currency}&am=${merchant.amount}`;
    }
  };

  const renderMerchantGrid = (merchants: typeof INDIA_MERCHANTS | typeof PAKISTAN_MERCHANTS | typeof GLOBAL_MERCHANTS) => (
    <div className="grid grid-cols-2 gap-3">
      {merchants.map((merchant) => {
        const Icon = merchant.icon;
        const qrData = generateQRData(merchant);
        
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
                <p className="text-xs text-muted-foreground">
                  {getCurrencySymbol(merchant.currency)}{merchant.amount}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-semibold text-lg">Demo Merchants</h3>
        <p className="text-sm text-muted-foreground">Tap to simulate a payment</p>
      </div>

      <Tabs defaultValue="india" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="india">🇮🇳 India</TabsTrigger>
          <TabsTrigger value="pakistan">🇵🇰 Pakistan</TabsTrigger>
          <TabsTrigger value="global">🌍 Global</TabsTrigger>
        </TabsList>

        <TabsContent value="india">
          {renderMerchantGrid(INDIA_MERCHANTS)}
        </TabsContent>

        <TabsContent value="pakistan">
          {renderMerchantGrid(PAKISTAN_MERCHANTS)}
        </TabsContent>

        <TabsContent value="global">
          {renderMerchantGrid(GLOBAL_MERCHANTS)}
        </TabsContent>
      </Tabs>

      {/* Show a sample QR code */}
      <Card className="p-4 mt-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">Or scan this demo QR with another device</p>
          <div className="bg-white p-4 rounded-lg inline-block mx-auto">
            <QRCodeSVG 
              value="upi://pay?pa=demo@worldvault&pn=Demo%20Payment&cu=INR&am=100" 
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
