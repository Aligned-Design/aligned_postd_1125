import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic dialog example
 */
export const Basic: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description goes here</DialogDescription>
          </DialogHeader>
          <div style={{ padding: "var(--spacing-md)" }}>
            <p>This is the dialog content area.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  },
};

/**
 * Confirmation dialog
 */
export const Confirmation: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">Delete Item</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              item.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter
            style={{
              display: "flex",
              gap: "var(--spacing-md)",
              justifyContent: "flex-end",
              marginTop: "var(--spacing-lg)",
            }}
          >
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

/**
 * Form dialog
 */
export const Form: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Edit Profile</Button>
        </DialogTrigger>
        <DialogContent style={{ maxWidth: "500px" }}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile information
            </DialogDescription>
          </DialogHeader>
          <div
            style={{
              padding: "var(--spacing-md)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "var(--font-size-label)",
                  fontWeight: "var(--font-weight-semibold)",
                  display: "block",
                  marginBottom: "var(--spacing-sm)",
                }}
              >
                Name
              </label>
              <input
                type="text"
                defaultValue="John Doe"
                style={{
                  width: "100%",
                  padding: "var(--spacing-sm) var(--spacing-md)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "var(--font-size-label)",
                  fontWeight: "var(--font-weight-semibold)",
                  display: "block",
                  marginBottom: "var(--spacing-sm)",
                }}
              >
                Email
              </label>
              <input
                type="email"
                defaultValue="john@example.com"
                style={{
                  width: "100%",
                  padding: "var(--spacing-sm) var(--spacing-md)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                }}
              />
            </div>
          </div>
          <DialogFooter
            style={{
              display: "flex",
              gap: "var(--spacing-md)",
              justifyContent: "flex-end",
              marginTop: "var(--spacing-lg)",
            }}
          >
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

/**
 * Alert dialog
 */
export const Alert: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="warning">Show Alert</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ Warning</DialogTitle>
            <DialogDescription>
              This post is pending approval. Review it before publishing.
            </DialogDescription>
          </DialogHeader>
          <div
            style={{
              padding: "var(--spacing-md)",
              backgroundColor: "var(--color-warning)" + "20",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p style={{ fontSize: "var(--font-size-body-sm)" }}>
              The post content may need adjustments based on brand guidelines.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Dismiss
            </Button>
            <Button onClick={() => setOpen(false)}>Review Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

/**
 * Long content dialog
 */
export const LongContent: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>View Terms</Button>
        </DialogTrigger>
        <DialogContent style={{ maxHeight: "80vh", overflow: "auto" }}>
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <div style={{ padding: "var(--spacing-md)" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <p
                key={i}
                style={{
                  marginBottom: "var(--spacing-md)",
                  lineHeight: "var(--line-height-relaxed)",
                }}
              >
                This is a sample of the terms and conditions document. The
                dialog properly handles long content with scrolling. Lorem ipsum
                dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua.
              </p>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>I Agree</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
};

/**
 * Multiple actions dialog
 */
export const MultipleActions: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Post Actions</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What would you like to do?</DialogTitle>
          </DialogHeader>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
              padding: "var(--spacing-md)",
            }}
          >
            <Button variant="outline" style={{ justifyContent: "flex-start" }}>
              ✏️ Edit Post
            </Button>
            <Button variant="outline" style={{ justifyContent: "flex-start" }}>
              👀 Preview
            </Button>
            <Button variant="outline" style={{ justifyContent: "flex-start" }}>
              📅 Reschedule
            </Button>
            <Button variant="outline" style={{ justifyContent: "flex-start" }}>
              🗑️ Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  },
};
