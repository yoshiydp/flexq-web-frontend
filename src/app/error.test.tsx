import { fireEvent, render, screen } from "@testing-library/react";
import ErrorPage from "./error";

describe("ErrorPage", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("エラー画面とトップへのリンクを表示する", () => {
    render(<ErrorPage error={new Error("boom")} retry={jest.fn()} />);
    expect(screen.getByTestId("error-page")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "PAGE COULD NOT BE LOADED" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "BACK TO TOP" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("再読み込みで retry を呼ぶ", () => {
    const retry = jest.fn();
    render(<ErrorPage error={new Error("boom")} retry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("受け取ったエラーをコンソールに記録する", () => {
    const error = new Error("boom");
    render(<ErrorPage error={error} retry={jest.fn()} />);
    expect(console.error).toHaveBeenCalledWith(error);
  });
});
