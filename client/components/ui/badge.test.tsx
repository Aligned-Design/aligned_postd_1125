import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge Component", () => {
  it("renders default variant correctly", () => {
    const { container } = render(<Badge variant="default">New</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders secondary variant correctly", () => {
    const { container } = render(<Badge variant="secondary">Draft</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders destructive variant correctly", () => {
    const { container } = render(<Badge variant="destructive">Failed</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders outline variant correctly", () => {
    const { container } = render(<Badge variant="outline">Optional</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders success variant correctly", () => {
    const { container } = render(<Badge variant="success">Published</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders warning variant correctly", () => {
    const { container } = render(<Badge variant="warning">Pending</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders info variant correctly", () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders with children correctly", () => {
    const { container } = render(<Badge>Badge content</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("applies className correctly", () => {
    const { container } = render(
      <Badge className="custom-class">Custom</Badge>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders all variants in one test", () => {
    const { container } = render(
      <div>
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="info">Info</Badge>
      </div>,
    );
    expect(container).toMatchSnapshot();
  });
});
