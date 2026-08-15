import { render, screen } from "@testing-library/react";
import LegalDocument, {
  type LegalSection,
} from "@/components/ui/LegalDocument";

const SECTIONS: LegalSection[] = [
  {
    title: "第1条（収集する情報）",
    paragraphs: ["当方は、以下の情報を収集します。"],
    items: ["メールアドレス", "ユーザー名"],
  },
  {
    title: "第2条（お問い合わせ）",
    paragraphs: ["以下の連絡先までお願いします。"],
    email: "contact@example.com",
  },
];

describe("LegalDocument", () => {
  beforeEach(() => {
    render(
      <LegalDocument
        lead="本ポリシーは情報の取り扱いを定めるものです。"
        sections={SECTIONS}
        enactedDate="2026年8月15日"
      />,
    );
  });

  it("前文・条項見出し・箇条書きを表示する", () => {
    expect(
      screen.getByText("本ポリシーは情報の取り扱いを定めるものです。"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "第1条（収集する情報）" }),
    ).toBeInTheDocument();
    expect(screen.getByText("メールアドレス")).toBeInTheDocument();
  });

  it("連絡先メールを mailto リンクとして表示する", () => {
    expect(
      screen.getByRole("link", { name: "contact@example.com" }),
    ).toHaveAttribute("href", "mailto:contact@example.com");
  });

  it("制定日とトップへ戻るリンクを表示する", () => {
    expect(screen.getByText(/制定日: 2026年8月15日/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /トップへ戻る/ })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
