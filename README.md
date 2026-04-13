# CrowdFlow X Lite - Smart Stadium AI Assistant

Welcome to **CrowdFlow X**, a next-generation AI-powered smart stadium assistant built to conquer the chaos of live event crowd management.

## Chosen Vertical
**Smart Cities / Event Management & Entertainment**
We focused on this vertical because managing massive localized population spikes (50,000+ people exiting simultaneously) requires immediate, dynamic logic to prevent stampedes and ensure public safety.

## Approach and Logic
Our system works by ingesting massive amounts of simulated telemetry data from various stadium checkpoints (gates, food stalls). The backend acts as a physics simulator, shifting wait times and density levels dynamically every few seconds, factoring in artificial spikes (e.g., "Halftime Rush" or "Emergency Clearances").

We utilize **Prompt Chaining via Google Gemini**: instead of just feeding the AI a prompt, we inject the literal real-time JSON dictionary of stadium wait-times and active alerts directly into the Gemini context window before every query. This forces the AI to make strictly logical, data-driven comparisons ("Gate 2 is faster than Gate 1") rather than hallucinating generic answers.

## How the Solution Works
1. **Auto-Location**: The frontend uses `navigator.geolocation` paired with backend **Haversine Distance matching** to automatically sync you to the nearest active stadium in India.
2. **Telemetry Dashboard**: Users view live metrics of their venue, powered by a FastAPI Python backend ticking in real-time.
3. **AI Chat Intelligence**: Users can tap "Best exit?" or type free-form queries. The **Google Gemini API** digests the live stadium context alongside the user's GPS and returns the mathematically optimized navigational route.
4. **Organizer View**: Staff have a top-down view to trigger emergency states globally or dispatch teams to severe hotspots.

## Google Services Integration
- **Google Gemini (Vertex/GenAI)**: Deployed as the core logical brain powering the `AIAssistant.tsx` component, evaluating live physics simulations accurately.
- **Google Maps API**: Deployed within `MapContainer.tsx` with dynamic pin-drops using React Google Maps to render spatial layout data on stylized dark-mode maps.

## Assumptions Made
- We assume crowd telemetry (turnstile spins, camera density) can be successfully piped into our `DataEngine` JSON schema in a real-world scenario.
- User indoor GPS mapping relies on approximate Wi-Fi/Bluetooth beacon triangulation (simulated via drop-down).

## Evaluation Focus Areas
- **Code Quality**: Built using React/Next.js with clean Tailwind v4 semantic CSS variables (`@theme`). The Python FastAPI backend uses strict separation of physics logic and API endpoints. 
- **Security**: Strict `.env` parsing for `GEMINI_API_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` prevents credential leakage. CORS middleware securely scopes the backend.
- **Efficiency**: Haversine algorithms quickly handle geospatial match processing. Next.js natively handles optimized static serving.
- **Accessibility**: A fully flexible **Semantic Light & Dark Mode** workflow implemented natively across all dashboards to respect system theme preferences and improve readability in harsh stadium lighting.
- **Testing**: Python endpoints handle dynamic fallback resilience gracefully (falling back to Narendra Modi stadium if geo-location matching goes out-of-bounds).
