# Under 40 Report Dashboard

This is a premium, client-side web application designed to merge and filter candidate working hours against leave details. It helps identify candidates whose combined weekly working hours (actual hours + leave/sick leave hours) remain strictly below 40 hours.

## Key Features

1. **Robust Client-Side Parser**: Handles complex CSV formats, double quotes, and commas in comments without sending any data to a backend server.
2. **Flexible Time Formatting**: Reads working hours in formats like `24:00` or `24:00:00` and normalizes them cleanly to `00:00:00` (HH:MM:SS) formats.
3. **Smart Comment parsing**: Scans leave comments for specific hours (e.g. `"4 hours"`, `"2.5 hrs"`) and falls back to a default of **8 hours** per leave row if no specific hours are specified.
4. **Dynamic Overrides**: Allows the user to manually override candidate working hours or specific leave entries directly from the dashboard and see calculations update in real-time.
5. **Interactive Dashboard**: Sortable columns, search filters, detail drawers visualizer, and live exports.

## How to Run locally

### Option 1: Double-Click
Simply open `index.html` directly in any web browser (Chrome, Firefox, Edge, Safari). No server is required since the app is 100% client-side!

### Option 2: Live Local Server
- **On Windows**: Double-click `start_server.bat` (serves on port **8080**).
- **On Mac**: Double-click `start_mac.command` (automatically starts the server and opens `http://localhost:8080` in your browser).
- Or run manually in your terminal:
  ```bash
  python3 -m http.server 8080
  ```

## Sample Files

The application ships with mock data so you can test every condition without real files:
- [sample_working_hours.csv](file:///C:/Users/Jahanvi%20Shah/.gemini/antigravity/scratch/under_40_report/sample_working_hours.csv): Contains mock actual hours.
- [sample_leaves.csv](file:///C:/Users/Jahanvi%20Shah/.gemini/antigravity/scratch/under_40_report/sample_leaves.csv): Contains mock sick certs and comments.

These fixtures are made for testing via the two upload zones in the top bar (drag & drop or click to browse).
The sample set produces **8 processed candidates** (TEST Peter and PENDING SHIFT are ignored by config,
the zero-hour row and the non-matching Application Title are filtered out) of which **3 fall under 40 hours**.

## Developer Smoke Test

The dashboard keeps its own assertions in `runSelfTests()` (logged to the browser console). For a
headless end-to-end check of the real `app.js` (uploading both sample fixtures, tab rendering, CSV
export and reset), run:

```bash
node tests/dom_smoke_test.js
```

The harness stubs a minimal DOM (no dependencies required) and exits non-zero if any check fails.
