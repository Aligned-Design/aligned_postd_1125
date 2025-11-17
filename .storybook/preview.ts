import type { Preview } from "@storybook/react";
import "../client/global.css";

/**
 * Storybook Preview Configuration
 *
 * Configures light/dark theme support using design tokens
 * All stories inherit the global CSS variables automatically
 */

const preview: Preview = {
  parameters: {
    layout: "centered",
    docs: {
      autodocs: true,
    },
  },
};

export default preview;
