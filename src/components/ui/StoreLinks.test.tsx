import { render, screen } from "@testing-library/react";
import StoreLinks from "./StoreLinks";

describe("StoreLinks", () => {
  it("App Store / Google Play の公式バッジを表示する", () => {
    render(<StoreLinks appStoreUrl={null} googlePlayUrl={null} />);
    expect(screen.getByRole("link", { name: /App Store/ })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Google Play/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("App Store からダウンロード"),
    ).toHaveAttribute("src", "/badges/app-store-ja.svg");
    expect(screen.getByAltText("Google Play で手に入れよう")).toHaveAttribute(
      "src",
      "/badges/google-play-ja.png",
    );
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

  it("既定は横並びで、幅が足りないときだけ折り返す（stacked 時は縦積み）", () => {
    const { container, rerender } = render(
      <StoreLinks appStoreUrl={null} googlePlayUrl={null} />,
    );
    expect(container.firstChild).toHaveClass("flex-row", "flex-wrap");
    expect(container.firstChild).not.toHaveClass("flex-col");

    rerender(<StoreLinks appStoreUrl={null} googlePlayUrl={null} stacked />);
    expect(container.firstChild).toHaveClass("flex-col", "w-full");
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
});
