import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useMiniTimer } from '@/contexts/MiniTimerContext';

export const AdminMiniTimerSettings: React.FC = () => {
  const {
    showMiniTimer,
    position,
    size,
    opacity,
    autoHide,
    autoHideDelay,
    setShowMiniTimer,
    setPosition,
    setSize,
    setOpacity,
    setAutoHide,
    setAutoHideDelay
  } = useMiniTimer();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mini-Timer Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-mini-timer">Enable Mini-Timer</Label>
          <Switch
            id="enable-mini-timer"
            checked={showMiniTimer}
            onCheckedChange={setShowMiniTimer}
          />
        </div>

        <div className="space-y-2">
          <Label>Position</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
              <SelectItem value="top-left">Top Left</SelectItem>
              <SelectItem value="top-right">Top Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Size</Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Opacity: {Math.round(opacity * 100)}%</Label>
          <Slider
            value={[opacity]}
            onValueChange={([value]) => setOpacity(value)}
            min={0.3}
            max={1}
            step={0.1}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-hide">Auto-hide when inactive</Label>
          <Switch
            id="auto-hide"
            checked={autoHide}
            onCheckedChange={setAutoHide}
          />
        </div>

        {autoHide && (
          <div className="space-y-2">
            <Label>Auto-hide delay: {autoHideDelay / 1000}s</Label>
            <Slider
              value={[autoHideDelay]}
              onValueChange={([value]) => setAutoHideDelay(value)}
              min={1000}
              max={10000}
              step={1000}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};