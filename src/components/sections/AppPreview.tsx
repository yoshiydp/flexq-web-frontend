"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SectionBackground from "@/components/ui/SectionBackground";
import SectionHeader from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import type { AppScreen } from "@/types/content";

type Props = {
  heading: string;
  screens: AppScreen[];
};

/**
 * モック内のスクリーンの比率。
 *
 * 収録に使っている iPhone 17 Pro の論理解像度は 402x874 だが、上端 62pt
 * （セーフエリア = 時計・Dynamic Island・通信/バッテリー表示）は見せたくないため、
 * その分を除いた 402x812 を枠の比率にする。素材側は 402x874 のままなので、
 * object-cover + object-bottom で上端 62pt だけが枠外に押し出されて隠れる
 * （動画を作り直さずに済み、下端は 1px も欠けない）。
 *
 * 収録端末を変えるときはここだけ直せば PC / SP のモックすべてに反映される。
 */
const SCREEN_ASPECT = "aspect-[402/812]";

/**
 * PC カルーセルの寸法（px）。1 コマの送り幅（stride）を JS で計算するため、
 * 枠のサイズは Tailwind のクラスではなくここの定数を style で当てる。
 *
 * アクティブな 1 台だけ PC_ACTIVE_SCALE 倍に拡大する。transform はレイアウトを
 * 動かさないので、拡大しても隣の台やキャプションに重ならないよう
 * 「隙間（PC_GAP）」と「行の高さ（PC_ROW_H）」を拡大後のサイズから逆算しておく。
 */
const PC_ITEM_W = 220;
const PC_FRAME_PADDING = 9;
const PC_FRAME_BORDER = 1;
const PC_ACTIVE_SCALE = 1.3;
/** スクリーンの縦横比（ステータスバーを除いた 402x812） */
const SCREEN_RATIO = 812 / 402;
/** 枠の高さ = スクリーンの高さ + 上下の padding / border */
const PC_FRAME_H =
  (PC_ITEM_W - (PC_FRAME_PADDING + PC_FRAME_BORDER) * 2) * SCREEN_RATIO +
  (PC_FRAME_PADDING + PC_FRAME_BORDER) * 2;
/** 拡大した 1 台がちょうど収まる行の高さ。キャプションの位置は全台で揃う */
const PC_ROW_H = Math.ceil(PC_FRAME_H * PC_ACTIVE_SCALE);
/** 拡大したぶん左右にはみ出す量 + 見た目の余白 */
const PC_GAP = Math.ceil((PC_ITEM_W * (PC_ACTIVE_SCALE - 1)) / 2) + 26;
const PC_STRIDE = PC_ITEM_W + PC_GAP;
/**
 * アクティブな台のゴールドのグロー（box-shadow の blur）。
 * 拡大した枠は行の上端いっぱいまで伸びるため、この分の余白を
 * カルーセル（overflow-hidden）の上下に足さないとグローが切れる。
 */
const PC_GLOW_BLUR = 50;
const PC_GLOW_MARGIN = 12;
/** 左右の見切れを徐々に透明にするマスク（中央 3 台ぶんは不透明のまま残す） */
const PC_EDGE_FADE =
  "linear-gradient(to right, transparent 0, #000 14%, #000 86%, transparent 100%)";
/** 自動送りの間隔と、1 コマ送るアニメーションの長さ（ms）・イージング */
const PC_INTERVAL_MS = 6000;
const PC_TRANSITION_MS = 700;
const PC_EASING = "cubic-bezier(.22,1,.36,1)";
/** ループ用に同じ並びを何組ぶん描画するか（左右を埋めるため 3 組） */
const PC_LOOP_COPIES = 3;

/** フォンモック内のスクリーン。素材がない間はプレースホルダー面を表示する。 */
function Screen({
  screen,
  radiusClassName,
}: {
  screen: AppScreen;
  radiusClassName: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden bg-muted",
        SCREEN_ASPECT,
        radiusClassName,
      )}
    >
      {screen.videoBasePath ? (
        // 画面収録（public/preview/）。音声はなく、ループ再生し続ける。
        // object-bottom で下端を基準に合わせ、はみ出す上端（ステータスバー）を隠す
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={screen.imageUrl ?? undefined}
          aria-label={screen.caption}
          className="size-full object-cover object-bottom"
        >
          <source src={`${screen.videoBasePath}.webm`} type="video/webm" />
          <source src={`${screen.videoBasePath}.mp4`} type="video/mp4" />
        </video>
      ) : (
        screen.imageUrl && (
          // CMS（Strapi）から供給される実機スクリーンショット
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={screen.imageUrl}
            alt={screen.caption}
            loading="lazy"
            className="size-full object-cover object-bottom"
          />
        )
      )}
    </div>
  );
}

/**
 * PC カルーセルの 1 台ぶん。幅は stride と揃える必要があるため px 固定にする。
 *
 * animated=false はループの巻き戻しフレーム。このとき台側のトランジションも
 * 止めないと、巻き戻し先で新しくアクティブになる台が 1.0 → 1.3 に拡大する
 * アニメーションを始めてしまい、「先頭から始まり直した」ように見える
 */
function PcPhoneItem({
  screen,
  active,
  animated,
}: {
  screen: AppScreen;
  active: boolean;
  animated: boolean;
}) {
  const transition = animated
    ? `transform ${PC_TRANSITION_MS}ms ${PC_EASING}, border-color ${PC_TRANSITION_MS}ms ${PC_EASING}, box-shadow ${PC_TRANSITION_MS}ms ${PC_EASING}`
    : "none";
  return (
    <figure
      className="m-0 flex shrink-0 flex-col items-center gap-[18px]"
      style={{ width: PC_ITEM_W }}
    >
      {/* 枠は下端で揃え、拡大は上方向にだけ伸ばす（transform-origin: bottom）。
          こうすると全台の下端が同じ高さに来るので、キャプションが台の位置に
          そのまま追従する。箱の高さは拡大後のぶんを先に確保しておく */}
      <div
        className="flex w-full items-end justify-center"
        style={{ height: PC_ROW_H }}
      >
        <div
          className={cn(
            "box-border w-full rounded-[34px] border bg-[#111111] p-[9px]",
            active
              ? "border-primary shadow-[0_0_50px_rgba(255,215,0,.18),0_24px_70px_rgba(0,0,0,.65)]"
              : "border-border shadow-[0_20px_60px_rgba(0,0,0,.6)]",
          )}
          // 拡大とスライドの終わりを揃えるため、トラックと同じ長さ・同じイージングにする
          style={{
            transform: `scale(${active ? PC_ACTIVE_SCALE : 1})`,
            transformOrigin: "bottom center",
            transition,
          }}
        >
          <Screen screen={screen} radiusClassName="rounded-[26px]" />
        </div>
      </div>
      <figcaption
        className={cn(
          "font-mono text-[11px] tracking-[.3em]",
          active ? "text-primary" : "text-muted-foreground",
        )}
        style={{
          transition: animated
            ? `color ${PC_TRANSITION_MS}ms ${PC_EASING}`
            : "none",
        }}
      >
        {screen.caption}
      </figcaption>
    </figure>
  );
}

/**
 * アプリ画面プレビュー。
 * 768px 以上: 自動カルーセル（右から左へ 1 台ずつ送り、中央のアクティブにゴールド枠）。
 * 768px 未満: 手動スワイプのピーク型カルーセル（scroll-snap + ドットインジケーター）。
 */
export default function AppPreview({ heading, screens }: Props) {
  const count = screens.length;

  // ---- PC: 自動カルーセル -------------------------------------------------
  // 同じ並びを PC_LOOP_COPIES 組ぶん並べ、真ん中の組を起点に左へ送っていく。
  // 最後の組に入ったところで、アニメーションを切って 1 組ぶん戻すことで
  // 「右から左へ流れ続ける」見た目のままループさせる
  const loopScreens = Array.from({ length: PC_LOOP_COPIES }, () => screens).flat();
  const initialIndex =
    count + Math.max(0, screens.findIndex((s) => s.highlighted));
  const [pcIndex, setPcIndex] = useState(initialIndex);
  const [pcAnimated, setPcAnimated] = useState(true);

  useEffect(() => {
    if (count === 0) return;
    const timer = window.setInterval(() => {
      setPcAnimated(true);
      setPcIndex((i) => i + 1);
    }, PC_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  // 送りきったら、アニメーションなしで 1 組ぶん巻き戻す（見た目は変わらない）。
  // transitionend は子要素（枠の色・スケール）からも伝播してくるため、
  // トラック自身の transform が終わったときだけ処理する。
  //
  // 巻き戻しは「transition を切る」と「index を戻す」を必ず同じ描画で反映させること。
  // setPcIndex の updater の中で setPcAnimated を呼ぶと、その回の描画は
  // 巻き戻し前の pcAnimated（= true）で行われ、1 組ぶん逆走するアニメーションが
  // そのまま見えてしまう
  const handlePcTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (pcIndex < count * (PC_LOOP_COPIES - 1)) return;
      setPcAnimated(false);
      setPcIndex(pcIndex - count);
    },
    [count, pcIndex],
  );

  // 巻き戻した次のフレームでアニメーションを戻す（戻さないと以降が瞬間移動する）
  useEffect(() => {
    if (pcAnimated) return;
    const raf = window.requestAnimationFrame(() => setPcAnimated(true));
    return () => window.cancelAnimationFrame(raf);
  }, [pcAnimated]);

  // ---- SP: 手動スワイプ ---------------------------------------------------
  const trackRef = useRef<HTMLDivElement>(null);
  const [spIndex, setSpIndex] = useState(0);

  const strideOf = (el: HTMLElement) =>
    Math.min(el.clientWidth * 0.72, 300) + 16;

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const index = Math.max(
      0,
      Math.min(count - 1, Math.round(el.scrollLeft / strideOf(el))),
    );
    if (index !== spIndex) setSpIndex(index);
  };

  const scrollTo = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * strideOf(el), behavior: "smooth" });
  };

  return (
    <section
      id="preview"
      className="relative overflow-hidden bg-background px-[clamp(20px,5vw,48px)] pt-[clamp(72px,9vw,120px)] pb-[clamp(88px,11vw,140px)]"
    >
      <SectionBackground src="/bg-preview.png" darkOverlay />
      {/* 紫のパルスグロー */}
      <div className="animate-pulse-glow pointer-events-none absolute top-[55%] left-1/2 size-[900px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(108,52,131,.35)_0%,rgba(108,52,131,0)_60%)]" />

      <div className="relative mx-auto flex max-w-[1180px] flex-col gap-16">
        <SectionHeader title={heading} />

        {/* PC: 自動カルーセル */}
        <div
          className="relative hidden overflow-hidden md:block"
          aria-roledescription="carousel"
          style={{
            // 左右の見切れをハードな断ち切りにせず、端に向かって透明にする
            WebkitMaskImage: PC_EDGE_FADE,
            maskImage: PC_EDGE_FADE,
            // 上はアクティブな枠の真上からグローが出るため、blur ぶんの余白が要る。
            // 下は枠とキャプションの間隔（18px）とキャプション自身の高さが
            // 稼いでくれるので、その差分だけ足す
            paddingTop: PC_GLOW_BLUR + PC_GLOW_MARGIN,
            paddingBottom: PC_GLOW_MARGIN,
          }}
        >
          <div
            className="flex w-max will-change-transform"
            style={{
              marginLeft: "50%",
              gap: `${PC_GAP}px`,
              transform: `translateX(${-(pcIndex * PC_STRIDE + PC_ITEM_W / 2)}px)`,
              transition: pcAnimated
                ? `transform ${PC_TRANSITION_MS}ms ${PC_EASING}`
                : "none",
            }}
            onTransitionEnd={handlePcTransitionEnd}
          >
            {loopScreens.map((screen, index) => (
              <PcPhoneItem
                key={`${screen.caption}-${index}`}
                screen={screen}
                active={index === pcIndex}
                animated={pcAnimated}
              />
            ))}
          </div>
        </div>

        {/* SP: 手動スワイプのピーク型カルーセル */}
        <div className="flex flex-col gap-5 md:hidden">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="scrollbar-hide flex items-center gap-4 overflow-x-auto [scroll-snap-type:x_mandatory]"
          >
            {/* 先頭・末尾のスライドも中央で止めるためのスペーサー */}
            <span className="block flex-[0_0_calc(50%-min(36vw,150px)-16px)]" />
            {screens.map((screen, index) => (
              <figure
                key={screen.caption}
                className={cn(
                  "m-0 flex flex-[0_0_min(72vw,300px)] [scroll-snap-align:center] flex-col items-center gap-4 transition-opacity duration-300",
                  index === spIndex ? "opacity-100" : "opacity-40",
                )}
              >
                <div
                  className={cn(
                    "box-border w-full rounded-[40px] border bg-[#111111] p-[9px] transition-[border-color,box-shadow] duration-300",
                    index === spIndex
                      ? "border-primary shadow-[0_0_50px_rgba(255,215,0,.15),0_20px_60px_rgba(0,0,0,.6)]"
                      : "border-border shadow-[0_20px_60px_rgba(0,0,0,.6)]",
                  )}
                >
                  <Screen screen={screen} radiusClassName="rounded-[32px]" />
                </div>
                <figcaption
                  className={cn(
                    "font-mono text-[11px] tracking-[.3em] transition-colors duration-300",
                    index === spIndex ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {screen.caption}
                </figcaption>
              </figure>
            ))}
            <span className="block flex-[0_0_calc(50%-min(36vw,150px)-16px)]" />
          </div>

          {/* ドットインジケーター */}
          <div className="flex justify-center gap-1">
            {screens.map((screen, index) => (
              <button
                key={screen.caption}
                type="button"
                onClick={() => scrollTo(index)}
                aria-label={screen.caption}
                className="flex size-7 items-center justify-center"
              >
                <span
                  className={cn(
                    "block size-2 rounded-full transition-colors duration-300",
                    index === spIndex ? "bg-primary" : "bg-[#444444]",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
