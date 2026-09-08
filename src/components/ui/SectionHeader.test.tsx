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

  it("見出しは下から上へのフェード、罫線は伸びるアニメーションを持つ", () => {
    const { container, rerender } = render(<SectionHeader title="FAQ" />);
    expect(screen.getByRole("heading", { name: "FAQ" })).toHaveClass(
      "reveal-up",
    );
    let lines = container.querySelectorAll(".reveal-line");
    expect(lines).toHaveLength(1);
    expect(lines[0]).not.toHaveClass("reveal-line-rtl");

    // VIEW ALL はリンク自身の transition-colors と競合しないよう外側の span でフェードする
    rerender(<SectionHeader title="NEWS" viewAllHref="/news" />);
    const viewAll = screen.getByRole("link", { name: /VIEW\sALL/ });
    expect(viewAll).not.toHaveClass("reveal-up");
    expect(viewAll.parentElement).toHaveClass("reveal-up");

    // center は左右 2 本。左の罫線は見出し側（右端）から伸びる
    rerender(<SectionHeader title="FAQ" align="center" />);
    lines = container.querySelectorAll(".reveal-line");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveClass("reveal-line-rtl");
    expect(lines[1]).not.toHaveClass("reveal-line-rtl");
  });

  it("size=lg 指定時は見出しを一回り大きくする", () => {
    const { rerender } = render(<SectionHeader title="FAQ" />);
    expect(screen.getByRole("heading", { name: "FAQ" })).toHaveClass("text-sm");

    rerender(<SectionHeader title="FAQ" size="lg" />);
    expect(screen.getByRole("heading", { name: "FAQ" })).toHaveClass(
      "md:text-lg",
    );
  });
});
