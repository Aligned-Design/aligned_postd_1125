import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Button } from "./button";

describe("Button Component", () => {
  it("renders default variant correctly", () => {
    const { container } = render(<Button variant="default">Click me</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders secondary variant correctly", () => {
    const { container } = render(
      <Button variant="secondary">Secondary</Button>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders destructive variant correctly", () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders outline variant correctly", () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders ghost variant correctly", () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders link variant correctly", () => {
    const { container } = render(<Button variant="link">Link</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders success variant correctly", () => {
    const { container } = render(<Button variant="success">Approve</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders warning variant correctly", () => {
    const { container } = render(<Button variant="warning">Warning</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders small size correctly", () => {
    const { container } = render(<Button size="sm">Small</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders large size correctly", () => {
    const { container } = render(<Button size="lg">Large</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders icon size correctly", () => {
    const { container } = render(<Button size="icon">🔍</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders disabled state correctly", () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("applies className prop correctly", () => {
    const { container } = render(
      <Button className="custom-class">Custom</Button>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
