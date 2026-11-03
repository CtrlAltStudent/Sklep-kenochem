import {
  AirVent, AppWindow, Armchair, AudioWaveform, Bath, Beaker, Brush, Bug, Building, Building2, Car, ChefHat, CircleDot, Citrus, CloudRain, Coffee, Cog, Disc3, Droplet, Droplets,
  Eraser, Fan, FlaskConical, Flame, Flower, Flower2, Frame, Fuel, Gauge, Gem, Hand, HardHat, House, Layers, Leaf, Lightbulb, Package, Paintbrush, PaintRoller, Pipette, Scroll, Shapes,
  ShieldCheck, ShieldPlus, Shirt, ShowerHead, Snowflake, Sofa, Sparkles, SprayCan, Sun, TestTubeDiagonal, Tractor, Trees, Truck, Waves, Wind, Wrench,
  type LucideProps,
} from "lucide-react";
import type { IconName } from "@/lib/data";

const icons: Record<IconName, React.ComponentType<LucideProps>> = {
  AirVent, AppWindow, Armchair, AudioWaveform, Bath, Beaker, Brush, Bug, Building, Building2, Car, ChefHat, CircleDot, Citrus, CloudRain, Coffee, Cog, Disc3, Droplet, Droplets,
  Eraser, Fan, FlaskConical, Flame, Flower, Flower2, Frame, Fuel, Gauge, Gem, Hand, HardHat, House, Layers, Leaf, Lightbulb, Package, Paintbrush, PaintRoller, Pipette, Scroll, Shapes,
  ShieldCheck, ShieldPlus, Shirt, ShowerHead, Snowflake, Sofa, Sparkles, SprayCan, Sun, TestTubeDiagonal, Tractor, Trees, Truck, Waves, Wind, Wrench,
};

// Konturowa ikonka kategorii/podkategorii
export function CatIcon({ name, className = "h-5 w-5", strokeWidth = 1.6 }: { name: IconName; className?: string; strokeWidth?: number }) {
  const Icon = icons[name] ?? Shapes;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
