import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Square, ScanLine } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface ProductNutriments {
  energy_kcal_100g?: number;
  fat_100g?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  proteins_100g?: number;
  salt_100g?: number;
}

interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_front_url?: string;
  nutriments?: ProductNutriments;
}

export const BarcodeScannerExperiment: React.FC = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState<string>('');
  const [product, setProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    const getDevices = async () => {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = all.filter((d) => d.kind === 'videoinput');
        // Filter out devices with empty or undefined deviceIds to prevent Select crashes
        const validDevices = videoInputs.filter((d) => d.deviceId && d.deviceId.trim() !== '');
        setDevices(validDevices);
        if (validDevices.length > 0) {
          setSelectedDeviceId(validDevices[0].deviceId);
        }
      } catch (e) {
        console.error('Failed to enumerate devices', e);
      }
    };
    getDevices();

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) return;
    try {
      setError(null);
      setProduct(null);
      setBarcode('');
      setScanning(true);
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }
      // Stop any previous scanning session before starting a new one
      controlsRef.current?.stop();
      controlsRef.current = await readerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            setBarcode(text);
            fetchProduct(text);
            stopScanning();
          }
        }
      );
    } catch (e) {
      console.error('Error starting scanner', e);
      toast({ title: 'Camera error', description: 'Could not access camera.', variant: 'destructive' });
      setScanning(false);
    }
  };

  const stopScanning = () => {
    try {
      controlsRef.current?.stop();
      controlsRef.current = null;
      setScanning(false);
    } catch {}
  };

  const fetchProduct = async (code: string) => {
    setLoadingProduct(true);
    setError(null);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
      const json = await res.json();
      if (json.status === 1 && json.product) {
        setProduct(json.product as OpenFoodFactsProduct);
      } else {
        setProduct(null);
        setError('Product not found in Open Food Facts');
      }
    } catch (e) {
      console.error('Open Food Facts error', e);
      setError('Failed to fetch from Open Food Facts');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleManualLookup = () => {
    if (!manualCode.trim()) return;
    setBarcode(manualCode.trim());
    fetchProduct(manualCode.trim());
  };

  const kcal = product?.nutriments?.energy_kcal_100g;
  const carbs = product?.nutriments?.carbohydrates_100g;
  const protein = product?.nutriments?.proteins_100g;
  const fat = product?.nutriments?.fat_100g;

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-4 pt-6">
        <div className="flex gap-2">
          <Button onClick={startScanning} disabled={scanning} className="flex-1" variant="secondary">
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" /> Start scan
              </>
            )}
          </Button>
          {scanning && (
            <Button onClick={stopScanning} variant="outline">
              <Square className="w-4 h-4 mr-2" /> Stop
            </Button>
          )}
        </div>

        <div className="rounded-lg overflow-hidden border">
          <div className="relative">
            <video ref={videoRef} className="w-full max-h-[320px] object-cover bg-muted" autoPlay muted playsInline />
            {scanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <ScanLine className="w-10 h-10 text-primary animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {barcode && (
          <div className="space-y-2">
            <h4 className="text-base font-medium">Scanned: {barcode}</h4>
          </div>
        )}

        {loadingProduct && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching product…
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {product && (
          <div className="space-y-2">
            <h4 className="text-base font-medium">{product.product_name || 'Unknown product'}{product.brands ? ` · ${product.brands}` : ''}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div>
                <div className="text-muted-foreground">Calories</div>
                <div>{kcal != null ? `${Math.round(kcal)} kcal/100g` : '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Carbs</div>
                <div>{carbs != null ? `${carbs} g/100g` : '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Protein</div>
                <div>{protein != null ? `${protein} g/100g` : '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Fat</div>
                <div>{fat != null ? `${fat} g/100g` : '—'}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
