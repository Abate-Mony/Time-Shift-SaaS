import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { loadPlacesLibrary } from "@/utils/googleMapsLoader";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

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

interface Suggestion {
    id: string;
    label: string;
    prediction: any;
}

interface SearchLocationProps {
    onSelect: (location: LocationResult) => void;
    defaultQuery?: string;
}

export default function SearchLocation({
    onSelect,
    defaultQuery = "",
}: SearchLocationProps) {
    const [query, setQuery] = useState(defaultQuery);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const debounceRef = useRef<number>(0);
    // Groups an autocomplete search + the place it resolves to into one
    // billing session, reset once a place is picked (per Google's guidance).
    const sessionTokenRef = useRef<any>(null);

    useEffect(() => {
        if (!GOOGLE_MAPS_API_KEY) return;
        if (query.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        clearTimeout(debounceRef.current);

        debounceRef.current = window.setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);

                const { AutocompleteSuggestion, AutocompleteSessionToken } = await loadPlacesLibrary();
                sessionTokenRef.current ??= new AutocompleteSessionToken();

                const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
                    input: query,
                    sessionToken: sessionTokenRef.current,
                    includedRegionCodes: ["gb"],
                });

                setSuggestions(
                    (results ?? [])
                        .filter((r: any) => r.placePrediction)
                        .map((r: any) => ({
                            id: r.placePrediction.placeId,
                            label: r.placePrediction.text.text,
                            prediction: r.placePrediction,
                        }))
                );
            } catch (err) {
                console.error(err);
                setError("Couldn't search addresses right now.");
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(debounceRef.current);
    }, [query]);

    const resolveSuggestion = async (suggestion: Suggestion) => {
        try {
            setResolvingId(suggestion.id);
            setError(null);

            const place = suggestion.prediction.toPlace();
            await place.fetchFields({
                fields: ["addressComponents", "formattedAddress", "location"],
            });

            const components: any[] = place.addressComponents ?? [];
            const find = (type: string) =>
                components.find((c) => c.types.includes(type))?.longText ?? "";

            const city = find("postal_town") || find("locality");
            const postcode = find("postal_code");
            // UK postcode "outward code" (e.g. "LS9" out of "LS9 8AB") — precise
            // enough to be useful, general enough not to pin the exact building.
            const postcodeArea = postcode.split(" ")[0] || "";
            const region = find("administrative_area_level_2") || find("administrative_area_level_1");
            const country = find("country") || "United Kingdom";

            const location: LocationResult = {
                id: suggestion.id,
                // Shown to every worker browsing this job, including on Open
                // Shifts before anyone's actually assigned — deliberately NOT the
                // street number/name (that's `address`, only used for directions
                // once a worker is assigned). Chain never falls through to
                // suggestion.label/formattedAddress — those are street-level, and
                // Google doesn't always return postal_town/locality/postal_code
                // (e.g. some POI results), so that fallback would leak the exact
                // address right back. region/country are effectively always
                // present on a resolved place, so this can't bottom out unsafe.
                siteName: [city, postcodeArea].filter(Boolean).join(" ") || region || country,
                address: place.formattedAddress ?? suggestion.label,
                city,
                postcode,
                country,
                lat: place.location?.lat() ?? 0,
                lng: place.location?.lng() ?? 0,
            };

            onSelect(location);
            setQuery(suggestion.label);
            setSuggestions([]);
            // A place was resolved — this session is done, start a fresh one next search
            sessionTokenRef.current = null;
        } catch (err) {
            console.error(err);
            setError("Couldn't resolve that address. Try again.");
        } finally {
            setResolvingId(null);
        }
    };

    return (
        <div className="relative w-full">
            <Input
                className="w-full rounded-lg border p-3"
                placeholder="Search postcode or address..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                name="location"
            />
            {!GOOGLE_MAPS_API_KEY && (
                <p className="mt-2 text-xs text-amber-600">
                    Address lookup isn't configured yet — set VITE_GOOGLE_MAPS_API_KEY.
                </p>
            )}

            {loading && (
                <div className="mt-2 text-sm text-gray-500">
                    Searching...
                </div>
            )}

            {error && (
                <div className="mt-2 text-sm text-red-500">
                    {error}
                </div>
            )}

            {suggestions.length > 0 && (
                <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-lg border bg-white shadow-lg">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion.id}
                            type="button"
                            disabled={resolvingId !== null}
                            className="block w-full border-b p-3 text-left hover:bg-gray-100 disabled:opacity-60 disabled:cursor-wait"
                            onClick={() => resolveSuggestion(suggestion)}
                        >
                            <div className="font-medium">
                                {suggestion.label}
                            </div>
                            {resolvingId === suggestion.id && (
                                <div className="text-xs text-gray-400 mt-0.5">Resolving…</div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
