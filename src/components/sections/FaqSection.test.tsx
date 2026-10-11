import { fireEvent, render, screen } from "@testing-library/react";
import FaqSection from "./FaqSection";

const faqs = [
  { question: "質問1", answer: "回答1" },
  {
    question: "質問2",
    answer: "回答2",
    link: { href: "/contact", label: "お問い合わせフォームへ" },
  },
];

describe("FaqSection", () => {
  it("初期状態は全て閉じていて、回答は HTML に含めたまま inert にする", () => {
    render(<FaqSection heading="FAQ" faqs={faqs} />);

    for (const button of screen.getAllByRole("button")) {
      expect(button).toHaveAttribute("aria-expanded", "false");
    }
    const panel = document.getElementById(
      screen.getByRole("button", { name: /質問1/ }).getAttribute(
        "aria-controls",
      )!,
    );
    expect(panel).toHaveTextContent("回答1");
    expect(panel).toHaveAttribute("inert");
  });

  it("質問を押すと開閉し、他の項目には影響しない", () => {
    render(<FaqSection heading="FAQ" faqs={faqs} />);
    const first = screen.getByRole("button", { name: /質問1/ });
    const second = screen.getByRole("button", { name: /質問2/ });

    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(second).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("region", { name: /質問1/ }),
    ).not.toHaveAttribute("inert");

    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "false");
  });

  it("link を持つ項目だけ回答の下にリンクを描画する", () => {
    render(<FaqSection heading="FAQ" faqs={faqs} />);

    const links = screen.getAllByRole("link", { hidden: true });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent("お問い合わせフォームへ");
    expect(links[0]).toHaveAttribute("href", "/contact");
    expect(links[0].closest("li")).toHaveTextContent("質問2");
  });
});
