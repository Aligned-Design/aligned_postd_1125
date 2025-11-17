import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

describe("Card Components", () => {
  it("renders Card component correctly", () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders CardHeader correctly", () => {
    const { container } = render(
      <Card>
        <CardHeader>Header content</CardHeader>
      </Card>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders CardTitle correctly", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders CardDescription correctly", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description text</CardDescription>
        </CardHeader>
      </Card>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders CardContent correctly", () => {
    const { container } = render(
      <Card>
        <CardContent>Content area</CardContent>
      </Card>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders CardFooter correctly", () => {
    const { container } = render(
      <Card>
        <CardFooter>Footer content</CardFooter>
      </Card>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders complete card structure correctly", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content goes here</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>,
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it("applies className to Card", () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toMatchSnapshot();
  });
});
