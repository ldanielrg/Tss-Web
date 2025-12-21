import Card from "../components/Card";

export default function Parte1Home() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Ejemplo 1" img="/imagen/ejemplo1.png" to="/simulstat/parte1/opcion-1" />
      <Card title="Ejemplo 2" img="/imagen/ejemplo2.png" to="/simulstat/parte1/opcion-2" />
      <Card title="Problema 1" img="/imagen/problema1.png" to="/simulstat/parte1/opcion-3" />
      <Card title="Problema 2" img="/imagen/problema2.png" to="/simulstat/parte1/opcion-4" />
    </div>
  );
}
