import { createRoot } from "react-dom/client";
import { App } from "./App";

// Debug: Check if root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
  throw new Error("Root element with id 'root' not found in HTML");
}

console.log("✅ Root element found, rendering App...");

try {
  const root = createRoot(rootElement);
  root.render(<App />);
  console.log("✅ App rendered successfully");
} catch (error) {
  console.error("❌ Error rendering App:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: monospace;">
      <h1>Error Loading App</h1>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
      <p>Check the browser console for more details.</p>
    </div>
  `;
}
