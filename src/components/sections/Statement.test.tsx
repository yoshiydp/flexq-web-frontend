import { render, screen } from "@testing-library/react";
import Statement from "./Statement";

describe("Statement", () => {
  it("見出しの改行位置ごとに inline-block のセグメントを描画する", () => {
    render(
      <Statement
        statement={{
          kicker: "WRITE / RECORD / PLAY",
          heading: "一瞬で名曲を\n生み出すために",
          body: "本文",
        }}
      />,
    );

    const heading = screen.getByRole("heading", { level: 2 });
    const segments = heading.querySelectorAll("span");
    expect(segments).toHaveLength(2);
    expect(segments[0]).toHaveTextContent("一瞬で名曲を");
    expect(segments[1]).toHaveTextContent("生み出すために");
    segments.forEach((s) => expect(s).toHaveClass("inline-block"));
  });
});
