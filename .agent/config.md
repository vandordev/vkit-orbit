# Configuration

YAML modules are loaded per runtime. Server credentials remain in server
schemas and are never exposed to Vite. `VITE_REALTIME_URL` is the only browser
origin. Realtime API keys/URLs are paired and partial configuration fails fast.
