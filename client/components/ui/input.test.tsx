import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Input } from "./input";

describe("Input Component", () => {
  it("renders text input correctly", () => {
    const { container } = render(<Input type="text" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders with placeholder correctly", () => {
    const { container } = render(
      <Input type="text" placeholder="Enter text..." />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders email input correctly", () => {
    const { container } = render(<Input type="email" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders password input correctly", () => {
    const { container } = render(<Input type="password" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders number input correctly", () => {
    const { container } = render(<Input type="number" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders date input correctly", () => {
    const { container } = render(<Input type="date" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders file input correctly", () => {
    const { container } = render(<Input type="file" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders with default value correctly", () => {
    const { container } = render(
      <Input type="text" defaultValue="Pre-filled" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders disabled input correctly", () => {
    const { container } = render(<Input type="text" disabled />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders disabled with value correctly", () => {
    const { container } = render(
      <Input type="text" defaultValue="Disabled value" disabled />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("applies className correctly", () => {
    const { container } = render(
      <Input type="text" className="custom-class" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders with aria attributes", () => {
    const { container } = render(
      <Input type="text" aria-label="Username" aria-describedby="help-text" />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
