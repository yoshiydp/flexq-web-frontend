import { render, screen } from "@testing-library/react";
import WaveformLoader from "./WaveformLoader";

describe("WaveformLoader", () => {
  it("読み込み中ステータスとして描画される", () => {
    render(<WaveformLoader />);
    expect(
      screen.getByRole("status", { name: "読み込み中" }),
    ).toBeInTheDocument();
    expect(screen.getByText("LOADING")).toBeInTheDocument();
  });
});
