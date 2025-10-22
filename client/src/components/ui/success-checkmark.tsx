import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessCheckmarkProps {
  className?: string;
  size?: number;
}

export function SuccessCheckmark({ className, size = 16 }: SuccessCheckmarkProps) {
  return (
    <div className={cn("inline-flex items-center justify-center", className)}>
      <div className="relative">
        {/* Animated circle background */}
        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
        
        {/* Checkmark icon */}
        <Check 
          className="relative text-green-600 animate-in zoom-in-50 duration-300" 
          style={{ width: size, height: size }}
        />
      </div>
    </div>
  );
}
