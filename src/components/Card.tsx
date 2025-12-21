import { Link } from "react-router-dom";

export default function Card({
  title,
  img,
  to,
}: {
  title: string;
  img: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="bg-white border rounded-lg shadow-sm hover:shadow transition p-4 flex flex-col gap-3"
    >
      <div className="text-lg font-semibold text-gray-900">{title}</div>
      <img
        src={img}
        alt={title}
        className="w-full h-48 object-cover rounded border"
      />
      <div className="text-sm text-blue-600">Abrir →</div>
    </Link>
  );
}
