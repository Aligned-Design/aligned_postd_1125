// Re-export shared types for backward compatibility
export type {
  CanvasItem,
  CanvasItemType,
  ShapeType,
  DesignFormat,
  FormatPreset,
} from "@shared/creative-studio";
// FORMAT_PRESETS is a value, not a type - export separately
export { FORMAT_PRESETS } from "@shared/creative-studio";

export type StartMode = "ai" | "template" | "scratch";

// Re-export CreativeStudioDesign as Design for backward compatibility
import type { CreativeStudioDesign } from "@shared/creative-studio";

export interface Design extends CreativeStudioDesign {
  // Additional client-side only properties
  // Scheduling and publishing (not persisted to API)
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledPlatforms?: string[];
  autoPublish?: boolean;
  lastSaveAction?: "saveToLibrary" | "saveAsDraft" | "saveCreateVariant" | "sendToQueue" | "sendPublishNow" | "sendMultiplePlatforms" | "schedule" | "scheduleAutoPublish" | "viewCalendar" | "download";
}

export interface CreativeStudioState {
  design: Design | null;
  selectedItemId: string | null;
  startMode: StartMode | null;
  zoom: number;
  isDragging: boolean;
  showBrandKit: boolean;
  showAdvisor: boolean;
  history: Design[];
  historyIndex: number;
}

export interface DesignAsset {
  id: string;
  type: "logo" | "color" | "font" | "image";
  name?: string;
  value: string | { color: string; name: string } | { fontFamily: string; fontUrl?: string };
  brandId: string;
  category?: string;
}

// Start mode options
export const START_MODE_OPTIONS = [
  { id: "ai", label: "Start from AI", description: "Let AI generate designs based on your brand", icon: "✨" },
  { id: "template", label: "Start from Template", description: "Choose from pre-designed templates", icon: "📋" },
  { id: "scratch", label: "Start from Scratch", description: "Create a design from a blank canvas", icon: "⚪" },
] as const;

// Initial design template
import type { CanvasItem } from "@shared/creative-studio";

export const createInitialDesign = (format: DesignFormat, brandId: string, campaignId?: string): Design => {
  const preset = FORMAT_PRESETS[format];
  const backgroundItem: CanvasItem = {
    id: "bg-1",
    type: "background",
    x: 0,
    y: 0,
    width: preset.width,
    height: preset.height,
    rotation: 0,
    zIndex: 0,
    backgroundType: "solid",
    backgroundColor: "#ffffff",
  };
  
  return {
    id: `design-${Date.now()}`,
    name: `Untitled Design`,
    format,
    width: preset.width,
    height: preset.height,
    brandId,
    campaignId,
    items: [backgroundItem],
    backgroundColor: "#ffffff",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    savedToLibrary: false,
  };
};

// Undo/Redo helpers
export const pushToHistory = (state: CreativeStudioState, design: Design): CreativeStudioState => {
  return {
    ...state,
    history: [...state.history.slice(0, state.historyIndex + 1), design],
    historyIndex: state.historyIndex + 1,
    design,
  };
};

export const undo = (state: CreativeStudioState): CreativeStudioState => {
  if (state.historyIndex <= 0) return state;
  const newIndex = state.historyIndex - 1;
  return {
    ...state,
    historyIndex: newIndex,
    design: state.history[newIndex],
  };
};

export const redo = (state: CreativeStudioState): CreativeStudioState => {
  if (state.historyIndex >= state.history.length - 1) return state;
  const newIndex = state.historyIndex + 1;
  return {
    ...state,
    historyIndex: newIndex,
    design: state.history[newIndex],
  };
};
