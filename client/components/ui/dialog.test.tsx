import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";

describe("Dialog Components", () => {
  it("renders Dialog with trigger and content correctly", () => {
    const { container } = render(
      <Dialog open>
        <DialogTrigger asChild>
          <Button>Open</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    expect(container).toMatchSnapshot();
  });

  it("renders DialogHeader correctly", () => {
    const { container } = render(<DialogHeader>Header content</DialogHeader>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders DialogTitle correctly", () => {
    const { container } = render(<DialogTitle>Dialog Title</DialogTitle>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders DialogDescription correctly", () => {
    const { container } = render(
      <DialogDescription>Description text</DialogDescription>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders DialogFooter correctly", () => {
    const { container } = render(<DialogFooter>Footer content</DialogFooter>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders complete dialog structure correctly", () => {
    const { container } = render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Dialog</DialogTitle>
            <DialogDescription>
              With header, content, and footer
            </DialogDescription>
          </DialogHeader>
          <div>Dialog content area</div>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(container).toMatchSnapshot();
  });

  it("renders DialogContent with custom className", () => {
    const { container } = render(
      <Dialog open>
        <DialogContent className="custom-class">
          <DialogTitle>Custom Dialog</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(container).toMatchSnapshot();
  });

  it("renders DialogHeader with custom className", () => {
    const { container } = render(
      <DialogHeader className="custom-header">
        <DialogTitle>Title</DialogTitle>
        <DialogDescription>Description</DialogDescription>
      </DialogHeader>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders DialogFooter with button actions", () => {
    const { container } = render(
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button variant="default">Confirm</Button>
        <Button variant="destructive">Delete</Button>
      </DialogFooter>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
