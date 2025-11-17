import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "ghost",
        "link",
        "success",
        "warning",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: {
      control: "boolean",
    },
  },
  args: {
    children: "Click me",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default primary button
 */
export const Primary: Story = {
  args: {
    variant: "default",
    size: "default",
    children: "Primary Button",
  },
};

/**
 * Secondary button with lighter background
 */
export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Button",
  },
};

/**
 * Destructive/Error button
 */
export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Delete",
  },
};

/**
 * Outlined button with border
 */
export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline Button",
  },
};

/**
 * Ghost button with no visible background
 */
export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Button",
  },
};

/**
 * Link-style button
 */
export const Link: Story = {
  args: {
    variant: "link",
    children: "Link Button",
  },
};

/**
 * Success button for confirmations
 */
export const Success: Story = {
  args: {
    variant: "success",
    children: "Approve",
  },
};

/**
 * Warning button for alerts
 */
export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Warning",
  },
};

/**
 * Small button size
 */
export const Small: Story = {
  args: {
    size: "sm",
    children: "Small",
  },
};

/**
 * Large button size
 */
export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};

/**
 * Icon button (square)
 */
export const Icon: Story = {
  args: {
    size: "icon",
    children: "🔍",
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button",
  },
};

/**
 * All variants showcase
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="success">Success</Button>
        <Button variant="warning">Warning</Button>
      </div>
    </div>
  ),
};

/**
 * Button with icon (simulated)
 */
export const WithIcon: Story = {
  args: {
    children: "✨ Generate",
  },
};
