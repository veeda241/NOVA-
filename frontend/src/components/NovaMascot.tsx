import { Heart, Sparkles } from "lucide-react";

interface NovaMascotProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export const NovaMascot = ({ size = "md", animated = true }: NovaMascotProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${animated ? "animate-float" : ""}`}>
      {/* Main mascot circle with gradient */}
      <div className="absolute inset-0 gradient-primary rounded-full shadow-glow flex items-center justify-center">
        <Heart className="w-1/2 h-1/2 text-white fill-white" />
      </div>
      
      {/* Sparkle effects */}
      {animated && (
        <>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-accent animate-pulse-glow" />
          <Sparkles className="absolute -bottom-1 -left-1 w-4 h-4 text-primary-glow animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
        </>
      )}
    </div>
  );
};