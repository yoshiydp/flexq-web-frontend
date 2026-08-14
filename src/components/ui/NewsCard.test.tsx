import { render, screen } from "@testing-library/react";
import type { NewsItem } from "@/types/content";
import NewsCard from "./NewsCard";

const baseItem: NewsItem = {
  id: 1,
  title: "FlexQ の配信を開始しました",
  category: "RELEASE",
  date: "2026.06.28",
  excerpt: "App Store / Google Play にて配信を開始。",
  thumbnailUrl: "http://localhost:1337/uploads/thumb.jpg",
  href: "/news/launch",
};

describe("NewsCard", () => {
  it("タイトル・カテゴリ・日付・抜粋・リンク先を表示する", () => {
    render(<NewsCard item={baseItem} />);
    expect(
      screen.getByText("FlexQ の配信を開始しました"),
    ).toBeInTheDocument();
    expect(screen.getByText("RELEASE")).toBeInTheDocument();
    expect(screen.getByText("2026.06.28")).toBeInTheDocument();
    expect(
      screen.getByText("App Store / Google Play にて配信を開始。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/news/launch");
  });

  it("カテゴリ・抜粋・サムネイルが null でも落ちない", () => {
    render(
      <NewsCard
        item={{
          ...baseItem,
          category: null,
          excerpt: null,
          thumbnailUrl: null,
        }}
      />,
    );
    expect(
      screen.getByText("FlexQ の配信を開始しました"),
    ).toBeInTheDocument();
    expect(screen.queryByText("RELEASE")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
