/**
 * public/flexq-logo.svg の「Q」を切り出してファビコンを生成する（WEB-7）。
 *
 *   node scripts/generate-favicon.mjs
 *
 * 出力（いずれも App Router のファイル規約で <link> が自動出力される）:
 * - src/app/icon.svg        … 角丸の紫背景 + ゴールドの Q（主要ブラウザのタブ）
 * - src/app/favicon.ico     … 上と同じ絵柄の 16 / 32 / 48px（SVG 非対応環境・/favicon.ico 直参照・検索結果）
 * - src/app/apple-icon.png  … 180px・角丸なし（iOS が自前でマスクする）
 *
 * ロゴ全体（FlexQ）は 16〜32px で線が潰れて読めないため、Q だけを使う。
 * 背景はアプリアイコンと同じ紫（globals.css の --purple-mid）。
 * ロゴを差し替えたら再実行すること。sharp は Next.js の依存として入っているものを使う。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOGO = path.join(ROOT, "public/flexq-logo.svg");
const APP_DIR = path.join(ROOT, "src/app");

const BACKGROUND = "#6C3483";
const ICO_SIZES = [16, 32, 48];
const APPLE_ICON_SIZE = 180;

/** ロゴ内の Q のパス（パスの並びは Q / x / e / l / F で、Q は先頭） */
function extractQPath() {
  const svg = fs.readFileSync(LOGO, "utf8");
  const paths = svg.match(/<path\b[^>]*?\/?>/g) ?? [];
  const q = paths.find((p) => p.includes('d="M209.172'));
  if (!q) throw new Error("flexq-logo.svg から Q のパスが見つからない");
  return q.replace(/\s*\/?>$/, "/>");
}

/** Q の外接矩形をロゴの座標系で測る */
async function measure(qPath) {
  const scale = 10;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${218 * scale}" height="${93 * scale}" viewBox="0 0 218 93">${qPath}</svg>`;
  const { info } = await sharp(Buffer.from(svg))
    .trim({ threshold: 1 })
    .toBuffer({ resolveWithObject: true });
  return {
    x: -info.trimOffsetLeft / scale,
    y: -info.trimOffsetTop / scale,
    w: info.width / scale,
    h: info.height / scale,
  };
}

/** 100x100 の正方形の中央に Q を置いた SVG。padding は余白（%）、radius は角丸 */
function iconSvg(qPath, box, { padding, radius }) {
  const inner = 100 - padding * 2;
  const k = inner / Math.max(box.w, box.h);
  const tx = padding + (inner - box.w * k) / 2 - box.x * k;
  const ty = padding + (inner - box.h * k) / 2 - box.y * k;
  const rx = radius ? ` rx="${radius}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100"${rx} fill="${BACKGROUND}"/><g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})">${qPath}</g></svg>\n`;
}

function rasterize(svg, size) {
  return sharp(Buffer.from(svg), { density: 1200 }).resize(size, size).png();
}

/** PNG を格納した ICO（Windows Vista 以降・全主要ブラウザが読める） */
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // 1 = アイコン
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4); // カラープレーン
    entry.writeUInt16LE(32, 6); // ビット深度
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const qPath = extractQPath();
const box = await measure(qPath);

const rounded = iconSvg(qPath, box, { padding: 12, radius: 22 });
fs.writeFileSync(path.join(APP_DIR, "icon.svg"), rounded);

const icoPngs = await Promise.all(
  ICO_SIZES.map(async (size) => ({
    size,
    data: await rasterize(rounded, size).toBuffer(),
  })),
);
fs.writeFileSync(path.join(APP_DIR, "favicon.ico"), buildIco(icoPngs));

const square = iconSvg(qPath, box, { padding: 18, radius: 0 });
await rasterize(square, APPLE_ICON_SIZE)
  .flatten({ background: BACKGROUND })
  .toFile(path.join(APP_DIR, "apple-icon.png"));

console.log("generated: src/app/icon.svg, src/app/favicon.ico, src/app/apple-icon.png");
