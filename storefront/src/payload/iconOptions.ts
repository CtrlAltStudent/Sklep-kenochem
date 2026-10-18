import type { IconName } from "@/lib/data";

// Ikony konturowe do wyboru dla kategorii (te same, co w sklepie – components/CatIcon.tsx)
const names: Record<IconName, string> = {
  Car: "Samochód", Droplets: "Krople", Bug: "Owad", Disc3: "Felga", AppWindow: "Szyba", Armchair: "Fotel", Sparkles: "Połysk",
  ShieldCheck: "Tarcza", ShowerHead: "Natrysk", FlaskConical: "Kolba", Cog: "Część / zębatka", SprayCan: "Spray", Fan: "Wentylator",
  Brush: "Szczotka", Eraser: "Ściągaczka", Layers: "Warstwy", PaintRoller: "Mop / wałek", Pipette: "Pipeta", HardHat: "Kask",
  Shapes: "Kształty", Building2: "Budynki", Building: "Budynek", ChefHat: "Czapka kucharza", Shirt: "Koszula", Sofa: "Sofa",
  Hand: "Dłoń", Scroll: "Rolka", House: "Dom", Bath: "Wanna", Trees: "Drzewa", Frame: "Rama / okno", Flower2: "Kwiat",
  Wind: "Wiatr", AirVent: "Kratka wentylacyjna", Flame: "Płomień", TestTubeDiagonal: "Probówka", Wrench: "Klucz",
  Droplet: "Kropla", Fuel: "Smar / paliwo", AudioWaveform: "Fale (ultradźwięki)", Tractor: "Traktor", ShieldPlus: "Tarcza z plusem",
};

export const iconOptions = Object.entries(names).map(([value, label]) => ({ value, label }));
