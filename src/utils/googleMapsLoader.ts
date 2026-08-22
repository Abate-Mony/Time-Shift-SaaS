// Loads the Google Maps JavaScript API once and exposes google.maps.importLibrary.
// The Places API (New) REST endpoints block direct browser fetch() via CORS —
// Google only supports client-side address autocomplete through this SDK.
declare global {
    interface Window {
        google?: any;
    }
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

let loadPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        const callbackName = "__initGoogleMaps";
        (window as any)[callbackName] = () => resolve();

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=weekly&callback=${callbackName}&loading=async`;
        script.async = true;
        script.onerror = () => reject(new Error("Failed to load the Google Maps JavaScript API"));
        document.head.appendChild(script);
    });
}

export async function loadPlacesLibrary() {
    if (!API_KEY) {
        throw new Error("VITE_GOOGLE_MAPS_API_KEY is not set");
    }

    if (!window.google?.maps) {
        loadPromise ??= loadScript();
        await loadPromise;
    }

    return window.google.maps.importLibrary("places") as Promise<{
        AutocompleteSuggestion: any;
        AutocompleteSessionToken: any;
    }>;
}
