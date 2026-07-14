import Link from "next/link";
import Card from "./Card";

interface CategoryCardProps {
  name: string;
  icon?: string;
}

export default function CategoryCard({ name, icon }: CategoryCardProps) {
  const icons: Record<string, string> = {
    chairs: "🪑",
    tables: "🪑",
    cooling: "❄️",
    tents: "⛺",
    sound: "🔊",
    lighting: "💡",
  };

  return (
    <Link href={`/customer/category/${name.toLowerCase()}`}>
      <Card hover className="cursor-pointer text-center py-8">
        <div className="text-5xl mb-3">{icons[name.toLowerCase()] || "🎉"}</div>
        <h3 className="text-xl font-bold text-gray-800 capitalize">{name}</h3>
        <p className="text-gray-600 text-sm mt-1">Browse {name}</p>
      </Card>
    </Link>
  );
}
