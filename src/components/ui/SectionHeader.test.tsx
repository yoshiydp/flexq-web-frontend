import { render, screen } from "@testing-library/react";
import SectionHeader from "./SectionHeader";

describe("SectionHeader", () => {
  it("見出しを表示する", () => {
    render(<SectionHeader title="FEATURES" />);
    expect(
      screen.getByRole("heading", { name: "FEATURES" }),
    ).toBeInTheDocument();
  });

  it("viewAllHref 指定時のみ VIEW ALL リンクを表示する", () => {
    const { rerender } = render(<SectionHeader title="NEWS" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    rerender(<SectionHeader title="NEWS" viewAllHref="/news" />);
    // リンクテキストは &nbsp; 区切りのため \s でマッチさせる
    expect(screen.getByRole("link", { name: /VIEW\sALL/ })).toHaveAttribute(
      "href",
      "/news",
    );
  });

  it("align=center 指定時は見出しを中央寄せにする", () => {
    render(<SectionHeader title="3 CORE FEATURES" align="center" />);
    expect(
      screen.getByRole("heading", { name: "3 CORE FEATURES" }),
    ).toHaveClass("text-center");
  });
});
