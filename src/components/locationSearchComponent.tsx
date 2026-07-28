import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";

interface LocationResult {
    id: string;
    siteName: string;
    address: string;
    city: string;
    postcode: string;
    country: string;
    lat: number;
    lng: number;
}

interface SearchLocationProps {
    onSelect: (location: LocationResult) => void;
}

export default function SearchLocation({
    onSelect,
}: SearchLocationProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<LocationResult[]>([]);
    const [loading, setLoading] = useState(false);

    const debounceRef = useRef<number>(0);

    useEffect(() => {
        if (query.trim().length < 3) {
            setResults([]);
            return;
        }

        clearTimeout(debounceRef.current);

        debounceRef.current = window.setTimeout(async () => {
            try {
                setLoading(true);

                const res = await fetch(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
                );

                const data = await res.json();
                const locations: LocationResult[] = data.features.map((item: any, index: number) => {
                    const p = item.properties;

                    return {
                        id: String(p.osm_id ?? index),
                        siteName: p.name ?? p.street ?? "",
                        address: [p.housenumber, p.street].filter(Boolean).join(" "),
                        city: p.city ?? p.county ?? "",
                        postcode: p.postcode ?? "",
                        country: p.country ?? "",
                        lat: item.geometry.coordinates[1],
                        lng: item.geometry.coordinates[0],
                    };
                });
                console.log(locations)

                setResults(locations);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(debounceRef.current);
    }, [query]);

    return (
        <div className="relative w-full">
            <Input
                className="w-full rounded-lg border p-3"
                placeholder="Search postcode, address or location..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                name="location"
            />

            {loading && (
                <div className="mt-2 text-sm text-gray-500">
                    Searching...
                </div>
            )}

            {results.length > 0 && (
                <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-lg border bg-white shadow-lg">
                    {results.map((location) => (
                        <button
                            key={location.id}
                            type="button"
                            className="block w-full border-b p-3 text-left hover:bg-gray-100"
                            onClick={() => {
                                onSelect(location);
                                setQuery(location.siteName);
                                setResults([]);
                            }}
                        >
                            <div className="font-medium">
                                {location.siteName}
                            </div>

                            <div className="text-sm text-gray-600">
                                {location.address}
                            </div>

                            <div className="text-xs text-gray-500">
                                {location.city} {location.postcode}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}