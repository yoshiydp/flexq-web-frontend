/**
 * 慣性スクロール（Lenis / SmoothScroll）への窓口。
 *
 * Lenis のインスタンスは SmoothScroll の中に閉じているため、他のコンポーネントからは
 * イベント経由で依頼する。慣性が残っている最中のネイティブスクロール
 * （scrollIntoView / window.scrollTo）は次のフレームで Lenis に上書きされるので、
 * プログラムからスクロールする前に stopScrollInertia() を呼ぶ。
 */
export const STOP_INERTIA_EVENT = "flexq:stop-scroll-inertia";

export function stopScrollInertia(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STOP_INERTIA_EVENT));
}
