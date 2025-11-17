import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./input";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "date", "file"],
    },
    disabled: {
      control: "boolean",
    },
    placeholder: {
      control: "text",
    },
  },
  args: {
    placeholder: "Enter text...",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default text input
 */
export const Text: Story = {
  args: {
    type: "text",
    placeholder: "Enter text...",
  },
};

/**
 * Email input field
 */
export const Email: Story = {
  args: {
    type: "email",
    placeholder: "Enter email address...",
  },
};

/**
 * Password input field
 */
export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password...",
  },
};

/**
 * Number input field
 */
export const Number: Story = {
  args: {
    type: "number",
    placeholder: "Enter number...",
  },
};

/**
 * Date input field
 */
export const Date: Story = {
  args: {
    type: "date",
  },
};

/**
 * File upload input
 */
export const File: Story = {
  args: {
    type: "file",
  },
};

/**
 * Disabled input
 */
export const Disabled: Story = {
  args: {
    type: "text",
    placeholder: "Disabled input",
    disabled: true,
  },
};

/**
 * Input with value
 */
export const WithValue: Story = {
  args: {
    type: "text",
    defaultValue: "Pre-filled value",
  },
};

/**
 * Form-like inputs
 */
export const FormInputs: Story = {
  render: () => (
    <form
      style={{
        width: "400px",
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
        <Input type="text" placeholder="John Doe" />
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
        <Input type="email" placeholder="john@example.com" />
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
          Password
        </label>
        <Input type="password" placeholder="••••••••" />
      </div>
    </form>
  ),
};

/**
 * Search input
 */
export const Search: Story = {
  args: {
    type: "text",
    placeholder: "Search posts, campaigns...",
  },
};

/**
 * Input states
 */
export const States: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-lg)",
        width: "400px",
      }}
    >
      <div>
        <label
          style={{
            fontSize: "var(--font-size-body-sm)",
            color: "var(--color-muted)",
            marginBottom: "var(--spacing-sm)",
            display: "block",
          }}
        >
          Normal
        </label>
        <Input type="text" placeholder="Normal input" />
      </div>
      <div>
        <label
          style={{
            fontSize: "var(--font-size-body-sm)",
            color: "var(--color-muted)",
            marginBottom: "var(--spacing-sm)",
            display: "block",
          }}
        >
          Disabled
        </label>
        <Input type="text" placeholder="Disabled input" disabled />
      </div>
      <div>
        <label
          style={{
            fontSize: "var(--font-size-body-sm)",
            color: "var(--color-muted)",
            marginBottom: "var(--spacing-sm)",
            display: "block",
          }}
        >
          With Value
        </label>
        <Input type="text" defaultValue="Pre-filled value" />
      </div>
    </div>
  ),
};
