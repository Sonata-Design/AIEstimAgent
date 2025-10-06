import { useEffect, useState } from "react";
import { Loader2, Brain, Scan, Layers, CheckCircle2, Sparkles, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisLoadingProps {
  stage?: 'uploading' | 'analyzing' | 'processing' | 'complete';
  className?: string;
}

const loadingStages = [
  {
    icon: Sparkles,
    title: "Preparing Image",
    description: "Optimizing your drawing for analysis...",
    color: "text-blue-500",
    duration: 2000,
  },
  {
    icon: Scan,
    title: "Scanning Drawing",
    description: "AI is detecting building elements...",
    color: "text-purple-500",
    duration: 3000,
  },
  {
    icon: Brain,
    title: "Analyzing Structures",
    description: "Identifying rooms, walls, and openings...",
    color: "text-pink-500",
    duration: 3000,
  },
  {
    icon: Layers,
    title: "Calculating Measurements",
    description: "Computing areas, perimeters, and dimensions...",
    color: "text-indigo-500",
    duration: 2500,
  },
  {
    icon: Target,
    title: "Finalizing Results",
    description: "Organizing takeoff data...",
    color: "text-cyan-500",
    duration: 2000,
  },
];

export function AnalysisLoading({ stage = 'analyzing', className }: AnalysisLoadingProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (stage !== 'analyzing') return;

    const currentStage = loadingStages[currentStageIndex];
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + (100 / (currentStage.duration / 100));
      });
    }, 100);

    const stageTimeout = setTimeout(() => {
      if (currentStageIndex < loadingStages.length - 1) {
        setCurrentStageIndex((prev) => prev + 1);
        setProgress(0);
      }
    }, currentStage.duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stageTimeout);
    };
  }, [currentStageIndex, stage]);

  const currentStage = loadingStages[currentStageIndex];
  const CurrentIcon = currentStage.icon;

  if (stage === 'complete') {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 space-y-4", className)}>
        <div className="relative">
          <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-500" />
          <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Analysis Complete!</h3>
          <p className="text-sm text-muted-foreground">Your takeoffs are ready to review</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 space-y-6", className)}>
      {/* Animated Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
        <div className={cn("relative p-6 rounded-full bg-background border-2 border-border", currentStage.color)}>
          <CurrentIcon className={cn("w-12 h-12 animate-pulse", currentStage.color)} />
        </div>
        <Zap className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
      </div>

      {/* Stage Information */}
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-xl font-semibold text-foreground animate-in fade-in duration-300">
          {currentStage.title}
        </h3>
        <p className="text-sm text-muted-foreground animate-in fade-in duration-500">
          {currentStage.description}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md space-y-2">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 ease-out rounded-full",
              "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            )}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Stage {currentStageIndex + 1} of {loadingStages.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="flex items-center gap-2">
        {loadingStages.map((stage, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index < currentStageIndex
                ? "bg-green-500 scale-110"
                : index === currentStageIndex
                ? "bg-blue-500 scale-125 animate-pulse"
                : "bg-secondary scale-100"
            )}
          />
        ))}
      </div>

      {/* Fun Fact or Tip */}
      <div className="mt-4 p-4 bg-secondary/50 rounded-lg max-w-md">
        <p className="text-xs text-muted-foreground text-center italic">
          💡 Tip: You can calibrate the scale using the ruler tool for more accurate measurements
        </p>
      </div>
    </div>
  );
}

// Compact version for button states
export function AnalysisLoadingButton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="animate-pulse">Analyzing...</span>
    </div>
  );
}
