import Link from "next/link";
import Card from "./Card";

interface CategoryCardProps {
  name: string;
  icon?: string;
  index?: number;
}

export default function CategoryCard({ name, icon, index = 0 }: CategoryCardProps) {
  const icons: Record<string, string> = {
    chairs: "🪑",
    tables: "🍽️",
    cooling: "❄️",
    tents: "⛺",
    sound: "🔊",
    lighting: "💡",
    covers: "✨",
    stage: "🎭",
  };

  return (
    <Link href={`/customer/category/${name.toLowerCase()}`}>
      <Card hover className="cursor-pointer text-center py-8 md:py-10 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 animate-fade-in-up group hover:animate-float" style={{animationDelay: `${index * 0.1}s`}}>
        <div className="text-6xl md:text-7xl mb-4 md:mb-5 group-hover:scale-125 transition-transform duration-300">{icons[name.toLowerCase()] || "🎉"}</div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900 capitalize mb-2 group-hover:text-purple-600 transition-colors duration-300">{name}</h3>
        <p className="text-gray-700 text-sm font-medium">Browse {name}</p>
      </Card>
    </Link>
  );
}