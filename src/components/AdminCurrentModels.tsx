import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModelUsage {
  feature: string;
  model: string;
  type: "chat" | "image" | "audio" | "analysis";
}

const currentModels: ModelUsage[] = [
  { feature: "Voice Food Parsing", model: "gpt-4o-mini", type: "chat" },
  { feature: "Food Image Analysis", model: "gpt-4o-mini", type: "analysis" },
  { feature: "Text-to-Speech", model: "tts-1", type: "audio" },
  { feature: "Speech Transcription", model: "whisper-1", type: "audio" },
];

const getTypeColor = (type: ModelUsage["type"]) => {
  switch (type) {
    case "chat": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "image": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "audio": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "analysis": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

export function AdminCurrentModels() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Current OpenAI Models</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {currentModels.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex flex-col">
                <span className="font-medium text-sm">{item.feature}</span>
                <code className="text-xs text-muted-foreground font-mono">{item.model}</code>
              </div>
              <Badge 
                variant="secondary" 
                className={getTypeColor(item.type)}
              >
                {item.type}
              </Badge>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Cost Optimization:</strong> All AI features use gpt-4o-mini for optimal cost efficiency while maintaining accuracy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}