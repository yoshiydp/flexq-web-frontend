import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  /** public/ 配下の背景画像（将来ムービー化する際は poster に転用する） */
  src: string;
  /** 背景画像の不透明度クラス（デザイン既定: opacity-85） */
  imageOpacityClassName?: string;
  /**
   * 実写ムービー想定セクション（Features / AppPreview）用の暗幕オーバーレイ。
   * 可読性確保のため実写背景では必須。
   */
  darkOverlay?: boolean;
};

/**
 * セクションの絶対配置背景レイヤー。
 * 現状は静止画プレースホルダー。本番ムービーへ差し替える際は、このコンポーネント内で
 * <video autoPlay muted loop playsInline poster={src}> に置き換える
 * （prefers-reduced-motion / SP 回線時は poster 静止画へフォールバックさせる）。
 * 親セクションには position: relative + overflow: hidden が必要。
 */
export default function SectionBackground({
  src,
  imageOpacityClassName = "opacity-85",
  darkOverlay = false,
}: Props) {
  return (
    <>
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        className={cn(
          "pointer-events-none object-cover",
          imageOpacityClassName,
        )}
      />
      {darkOverlay && (
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(13,13,13,.7)_0%,rgba(13,13,13,.5)_45%,rgba(13,13,13,.78)_100%)]" />
      )}
    </>
  );
}
