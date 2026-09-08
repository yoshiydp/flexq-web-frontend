import { act, render, screen, waitFor } from "@testing-library/react";
import Reveal from "./Reveal";

type IOCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

/** IntersectionObserver のモック（発火はテスト側から trigger で行う） */
function mockIntersectionObserver() {
  let callback: IOCallback | null = null;
  const disconnect = jest.fn();
  const observe = jest.fn();
  const options: IntersectionObserverInit[] = [];
  class MockIO {
    constructor(cb: IOCallback, init?: IntersectionObserverInit) {
      callback = cb;
      if (init) options.push(init);
    }
    observe = observe;
    disconnect = disconnect;
    unobserve = jest.fn();
  }
  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: MockIO,
  });
  return {
    observe,
    disconnect,
    options,
    trigger: (entry: Partial<IntersectionObserverEntry>) =>
      act(() => callback?.([entry])),
  };
}

describe("Reveal", () => {
  const original = window.IntersectionObserver;

  afterEach(() => {
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: original,
    });
  });

  it("IntersectionObserver が無い環境では即時に表示する", async () => {
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: undefined,
    });
    render(<Reveal className="reveal-up">content</Reveal>);
    await waitFor(() =>
      expect(screen.getByText("content")).toHaveClass("reveal", "is-revealed"),
    );
  });

  it("画面内に入るまでは非表示のままで、入ったら is-revealed を付ける", () => {
    const io = mockIntersectionObserver();
    render(
      <Reveal className="reveal-up" delay={120}>
        content
      </Reveal>,
    );
    const el = screen.getByText("content");
    expect(io.observe).toHaveBeenCalledWith(el);
    expect(el).not.toHaveClass("is-revealed");
    expect(el).toHaveStyle({ "--reveal-delay": "120ms" });

    io.trigger({
      isIntersecting: false,
      boundingClientRect: { bottom: 1200 } as DOMRectReadOnly,
    });
    expect(el).not.toHaveClass("is-revealed");

    io.trigger({
      isIntersecting: true,
      boundingClientRect: { bottom: 500 } as DOMRectReadOnly,
    });
    expect(el).toHaveClass("is-revealed");
    expect(el).toHaveAttribute("data-revealed");
    // 一度表示したら監視を止める
    expect(io.disconnect).toHaveBeenCalled();
  });

  it("発火位置はビューポート高さの 15% を px で指定し、リサイズで作り直す", () => {
    const io = mockIntersectionObserver();
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 600,
    });
    render(<Reveal>content</Reveal>);
    expect(io.options.at(-1)).toEqual({
      rootMargin: "0px 0px -90px 0px",
      threshold: 0,
    });

    window.innerHeight = 1000;
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(io.disconnect).toHaveBeenCalledTimes(1);
    expect(io.options.at(-1)?.rootMargin).toBe("0px 0px -150px 0px");
    expect(io.observe).toHaveBeenCalledTimes(2);
  });

  it("リロード時に既に画面より上にある要素は即時に表示する", () => {
    const io = mockIntersectionObserver();
    render(<Reveal>content</Reveal>);
    io.trigger({
      isIntersecting: false,
      boundingClientRect: { bottom: -40 } as DOMRectReadOnly,
    });
    expect(screen.getByText("content")).toHaveClass("is-revealed");
  });

  it("子孫にフォーカスが当たったらトランジションなしで即時に表示する", () => {
    const io = mockIntersectionObserver();
    render(
      <Reveal className="reveal-up" delay={300}>
        <button type="button">open</button>
      </Reveal>,
    );
    const el = screen.getByText("open").parentElement!;
    expect(el).not.toHaveClass("is-revealed");

    act(() => {
      screen.getByRole("button").focus();
    });
    expect(el).toHaveClass("is-revealed", "is-revealed-instant");
    // 監視も止める
    expect(io.disconnect).toHaveBeenCalled();
  });

  it("スクロールで表示が始まった後のフォーカスも即時表示に切り替える", () => {
    const io = mockIntersectionObserver();
    render(
      <Reveal className="reveal-up">
        <button type="button">open</button>
      </Reveal>,
    );
    const el = screen.getByText("open").parentElement!;
    io.trigger({
      isIntersecting: true,
      boundingClientRect: { bottom: 500 } as DOMRectReadOnly,
    });
    expect(el).toHaveClass("is-revealed");
    expect(el).not.toHaveClass("is-revealed-instant");

    act(() => {
      screen.getByRole("button").focus();
    });
    expect(el).toHaveClass("is-revealed-instant");
  });

  it("as で要素種別を変えられる", () => {
    mockIntersectionObserver();
    render(<Reveal as="span">content</Reveal>);
    expect(screen.getByText("content").tagName).toBe("SPAN");
  });
});
