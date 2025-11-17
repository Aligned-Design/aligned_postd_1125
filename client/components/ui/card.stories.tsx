import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Button } from "./button";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic card with header and content
 */
export const Basic: Story = {
  render: () => (
    <Card style={{ width: "400px" }}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card.</p>
      </CardContent>
    </Card>
  ),
};

/**
 * Card with full structure (header, content, footer)
 */
export const Complete: Story = {
  render: () => (
    <Card style={{ width: "400px" }}>
      <CardHeader>
        <CardTitle>Complete Card</CardTitle>
        <CardDescription>With header, content, and footer</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          This card demonstrates the full structure with all available sections.
          Use this for forms, confirmations, or detailed information displays.
        </p>
      </CardContent>
      <CardFooter style={{ display: "flex", gap: "8px" }}>
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Card with content only (no header/footer)
 */
export const ContentOnly: Story = {
  render: () => (
    <Card style={{ width: "400px" }}>
      <CardContent style={{ paddingTop: "var(--spacing-lg)" }}>
        <p>Simple content card without headers or footers.</p>
        <p
          style={{
            marginTop: "var(--spacing-md)",
            color: "var(--color-muted)",
          }}
        >
          Perfect for displaying simple information or stats.
        </p>
      </CardContent>
    </Card>
  ),
};

/**
 * Stats card layout
 */
export const Stats: Story = {
  render: () => (
    <Card style={{ width: "300px" }}>
      <CardHeader>
        <CardTitle style={{ fontSize: "var(--font-size-h2)" }}>1,234</CardTitle>
        <CardDescription>Total Users</CardDescription>
      </CardHeader>
      <CardContent>
        <p
          style={{
            fontSize: "var(--font-size-body-sm)",
            color: "var(--color-success)",
          }}
        >
          ↑ 12% from last month
        </p>
      </CardContent>
    </Card>
  ),
};

/**
 * Multiple cards in a grid
 */
export const Grid: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        width: "800px",
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Card 1</CardTitle>
        </CardHeader>
        <CardContent>Content for first card</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Card 2</CardTitle>
        </CardHeader>
        <CardContent>Content for second card</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Card 3</CardTitle>
        </CardHeader>
        <CardContent>Content for third card</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Card 4</CardTitle>
        </CardHeader>
        <CardContent>Content for fourth card</CardContent>
      </Card>
    </div>
  ),
};

/**
 * Card with long content
 */
export const LongContent: Story = {
  render: () => (
    <Card style={{ width: "400px" }}>
      <CardHeader>
        <CardTitle>Post Preview</CardTitle>
        <CardDescription>Review before publishing</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ marginBottom: "var(--spacing-md)" }}>
          This is a longer piece of content that demonstrates how the card
          handles text wrapping and multiple paragraphs. It shows proper spacing
          and typography.
        </p>
        <p
          style={{
            color: "var(--color-muted)",
            fontSize: "var(--font-size-body-sm)",
          }}
        >
          Created: November 25, 2025 at 3:45 PM
        </p>
      </CardContent>
      <CardFooter
        style={{ display: "flex", gap: "8px", justifyContent: "space-between" }}
      >
        <Button variant="outline">Edit</Button>
        <Button variant="success">Approve</Button>
      </CardFooter>
    </Card>
  ),
};
