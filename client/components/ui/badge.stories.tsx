import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
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
        "success",
        "warning",
        "info",
      ],
    },
  },
  args: {
    children: "Badge",
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default badge (primary)
 */
export const Default: Story = {
  args: {
    variant: "default",
    children: "New",
  },
};

/**
 * Secondary badge
 */
export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Draft",
  },
};

/**
 * Success badge for approved/published states
 */
export const Success: Story = {
  args: {
    variant: "success",
    children: "Published",
  },
};

/**
 * Warning badge for pending states
 */
export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Pending",
  },
};

/**
 * Destructive badge for error states
 */
export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Failed",
  },
};

/**
 * Info badge
 */
export const Info: Story = {
  args: {
    variant: "info",
    children: "Info",
  },
};

/**
 * Outline badge
 */
export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Optional",
  },
};

/**
 * Multiple badges in a row (status showcase)
 */
export const StatusShowcase: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <Badge variant="default">New</Badge>
      <Badge variant="success">Approved</Badge>
      <Badge variant="warning">Pending</Badge>
      <Badge variant="destructive">Error</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="outline">Optional</Badge>
    </div>
  ),
};

/**
 * Badges with content
 */
export const WithContent: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Badge variant="success">LinkedIn</Badge>
        <span style={{ fontSize: "var(--font-size-body)" }}>
          Published to LinkedIn
        </span>
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Badge variant="warning">Instagram</Badge>
        <span style={{ fontSize: "var(--font-size-body)" }}>
          Scheduled for tomorrow
        </span>
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Badge variant="destructive">Twitter</Badge>
        <span style={{ fontSize: "var(--font-size-body)" }}>
          Failed to publish
        </span>
      </div>
    </div>
  ),
};

/**
 * Badges in different sizes (text variations)
 */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <Badge
          variant="default"
          style={{ fontSize: "var(--font-size-body-sm)" }}
        >
          Small
        </Badge>
        <Badge variant="default">Default</Badge>
        <Badge variant="default" style={{ fontSize: "var(--font-size-body)" }}>
          Large
        </Badge>
      </div>
    </div>
  ),
};

/**
 * Badge combinations (post status with platform)
 */
export const PostStatus: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "300px",
      }}
    >
      <div>
        <p
          style={{
            fontSize: "var(--font-size-body-sm)",
            marginBottom: "8px",
            color: "var(--color-muted)",
          }}
        >
          Post Status
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <Badge variant="warning">Pending Review</Badge>
          <Badge variant="secondary">Draft</Badge>
        </div>
      </div>
      <div>
        <p
          style={{
            fontSize: "var(--font-size-body-sm)",
            marginBottom: "8px",
            color: "var(--color-muted)",
          }}
        >
          Platforms
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Badge variant="info">LinkedIn</Badge>
          <Badge variant="info">Instagram</Badge>
          <Badge variant="info">Twitter</Badge>
        </div>
      </div>
    </div>
  ),
};
