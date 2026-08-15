import { render, screen } from "@testing-library/react";
import FlexQLogo from "./FlexQLogo";

describe("FlexQLogo", () => {
  it("アクセシブルな FlexQ ロゴとして描画される", () => {
    render(<FlexQLogo />);
    expect(screen.getByRole("img", { name: "FlexQ" })).toBeInTheDocument();
  });

  it("className を SVG 要素へ引き継ぐ", () => {
    render(<FlexQLogo className="text-primary h-10" />);
    expect(screen.getByRole("img", { name: "FlexQ" })).toHaveClass(
      "text-primary",
      "h-10",
    );
  });
});
