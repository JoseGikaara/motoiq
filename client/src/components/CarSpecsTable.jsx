import { CarFront, Fuel, Gauge, Settings2, Palette } from "lucide-react";

export function parseCarSpecs(specsString) {
  if (!specsString) return {};
  try {
    const val = JSON.parse(specsString);
    return typeof val === "object" && val !== null ? val : {};
  } catch {
    return { notes: specsString };
  }
}

export default function CarSpecsTable({ car, specsString, className = "" }) {
  const specs = parseCarSpecs(specsString);

  const hasGridItems =
    car?.mileage != null || car?.color || specs.bodyType || specs.fuelType || specs.transmission;

  return (
    <div className={className}>
      {hasGridItems && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-300">
          {car?.mileage != null && (
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-gray-400" />
              <span>{car.mileage.toLocaleString()} km</span>
            </div>
          )}
          {car?.color && (
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-gray-400" />
              <span>{car.color}</span>
            </div>
          )}
          {specs.bodyType && (
            <div className="flex items-center gap-2">
              <CarFront className="w-4 h-4 text-gray-400" />
              <span>{specs.bodyType}</span>
            </div>
          )}
          {specs.fuelType && (
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-gray-400" />
              <span>{specs.fuelType}</span>
            </div>
          )}
          {specs.transmission && (
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-gray-400" />
              <span>{specs.transmission}</span>
            </div>
          )}
        </div>
      )}
      {specs.notes && (
        <div className="mt-4 text-sm text-gray-300">
          <p className="font-semibold text-white mb-1">Highlights</p>
          <p className="whitespace-pre-wrap text-gray-300">{specs.notes}</p>
        </div>
      )}
    </div>
  );
}

