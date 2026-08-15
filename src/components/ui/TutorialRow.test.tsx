import { render, screen } from "@testing-library/react";
import type { TutorialItem } from "@/types/content";
import TutorialRow, { DIFFICULTY_DISPLAY } from "./TutorialRow";

const baseTutorial: TutorialItem = {
  id: 1,
  order: "01",
  title: "はじめての FlexQ",
  difficulty: "beginner",
  href: "/tutorials/first-steps",
};

describe("TutorialRow", () => {
  it("連番・タイトル・リンク先を表示する", () => {
    render(<TutorialRow tutorial={baseTutorial} />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("はじめての FlexQ")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/tutorials/first-steps",
    );
  });

  it.each([
    ["beginner", "●○○", "BEGINNER"],
    ["intermediate", "●●○", "INTERMEDIATE"],
    ["advanced", "●●●", "ADVANCED"],
  ] as const)("難易度 %s を「%s %s」で表示する", (difficulty, dots, label) => {
    render(<TutorialRow tutorial={{ ...baseTutorial, difficulty }} />);
    expect(screen.getByText(dots)).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("難易度未設定ならバッジを表示しない", () => {
    render(<TutorialRow tutorial={{ ...baseTutorial, difficulty: null }} />);
    for (const { label } of Object.values(DIFFICULTY_DISPLAY)) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });
});
