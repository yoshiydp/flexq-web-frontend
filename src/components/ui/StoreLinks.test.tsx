import { render, screen } from "@testing-library/react";
import StoreLinks from "./StoreLinks";

describe("StoreLinks", () => {
  it("App Store / Google Play の 2 ボタンを表示する", () => {
    render(<StoreLinks appStoreUrl={null} googlePlayUrl={null} />);
    expect(screen.getByRole("link", { name: /App Store/ })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Google Play/ }),
    ).toBeInTheDocument();
  });

  it("URL 未設定時はダウンロード CTA アンカーへフォールバックする", () => {
    render(<StoreLinks appStoreUrl={null} googlePlayUrl={null} />);
    expect(screen.getByRole("link", { name: /App Store/ })).toHaveAttribute(
      "href",
      "/#download",
    );
  });

  it("CMS 由来の空文字 URL もフォールバック扱いにする", () => {
    render(<StoreLinks appStoreUrl="" googlePlayUrl="  " />);
    const appStore = screen.getByRole("link", { name: /App Store/ });
    expect(appStore).toHaveAttribute("href", "/#download");
    expect(appStore).not.toHaveAttribute("target");
    expect(screen.getByRole("link", { name: /Google Play/ })).toHaveAttribute(
      "href",
      "/#download",
    );
  });

  it("URL 設定時は外部リンクとして開く", () => {
    render(
      <StoreLinks
        appStoreUrl="https://apps.apple.com/app/flexq"
        googlePlayUrl={null}
      />,
    );
    const appStore = screen.getByRole("link", { name: /App Store/ });
    expect(appStore).toHaveAttribute("href", "https://apps.apple.com/app/flexq");
    expect(appStore).toHaveAttribute("target", "_blank");
    expect(appStore).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("mixed バリアントは App Store = gold / Google Play = outline になる", () => {
    render(
      <StoreLinks appStoreUrl={null} googlePlayUrl={null} variant="mixed" />,
    );
    expect(screen.getByRole("link", { name: /App Store/ })).toHaveClass(
      "bg-primary",
    );
    expect(screen.getByRole("link", { name: /Google Play/ })).toHaveClass(
      "border-primary",
    );
  });
});
