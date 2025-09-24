# WebGL Gaussian Splat Viewer (Vite)

This project is a Vite-powered web application for viewing 3D Gaussian splats. It is a migration of the original static HTML/JS viewer to the Vite framework for improved development experience and performance.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the local server URL (usually http://localhost:5173) in your browser.

## Features
- Mouse, keyboard, touch, and gamepad controls for navigation
- Drag-and-drop support for .ply and cameras.json files
- Animated loading spinner and camera info display

## Project Structure
- `index.html` – Main HTML entry point
- `src/main.js` – Main JavaScript logic
- `style` is inlined in `index.html` for simplicity

## Notes
- All original UI and controls are preserved from the static version.
- For further customization, edit `src/main.js` and `index.html`.
