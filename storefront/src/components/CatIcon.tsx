import {
  AirVent, AppWindow, Armchair, AudioWaveform, Bath, Brush, Bug, Building, Building2, Car, ChefHat, Cog, Disc3, Droplet, Droplets,
  Eraser, Fan, FlaskConical, Flame, Flower2, Frame, Fuel, Hand, HardHat, House, Layers, PaintRoller, Pipette, Scroll, Shapes,
  ShieldCheck, ShieldPlus, Shirt, ShowerHead, Sofa, Sparkles, SprayCan, TestTubeDiagonal, Tractor, Trees, Truck, Wind, Wrench,
  type LucideProps,
} from "lucide-react";
import type { IconName } from "@/lib/data";

const icons: Record<IconName, React.ComponentType<LucideProps>> = {
  AirVent, AppWindow, Armchair, AudioWaveform, Bath, Brush, Bug, Building, Building2, Car, ChefHat, Cog, Disc3, Droplet, Droplets,
  Eraser, Fan, FlaskConical, Flame, Flower2, Frame, Fuel, Hand, HardHat, House, Layers, PaintRoller, Pipette, Scroll, Shapes,
  ShieldCheck, ShieldPlus, Shirt, ShowerHead, Sofa, Sparkles, SprayCan, TestTubeDiagonal, Tractor, Trees, Truck, Wind, Wrench,
};

// Konturowa ikonka kategorii/podkategorii
export function CatIcon({ name, className = "h-5 w-5", strokeWidth = 1.6 }: { name: IconName; className?: string; strokeWidth?: number }) {
  const Icon = icons[name] ?? Shapes;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
