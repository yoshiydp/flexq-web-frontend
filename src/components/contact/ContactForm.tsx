"use client";

import { ChevronDown, Paperclip, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { issueContactToken, sendContact } from "@/app/contact/actions";
import {
  CONTACT_ATTACHMENT_ACCEPT,
  CONTACT_ATTACHMENT_MAX_FILES,
  CONTACT_ATTACHMENT_MAX_FILE_BYTES,
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_SUBJECTS,
  canProceedToConfirm,
  formatBytes,
  validateAttachments,
  validateContact,
} from "@/lib/contact";
import { CONTACT_EMAIL } from "@/lib/site";
import { stopScrollInertia } from "@/lib/smoothScroll";
import { cn } from "@/lib/utils";

type Step = "input" | "confirm" | "done";

const LABEL_CLASS =
  "flex items-center gap-3 font-mono text-[11px] tracking-[.25em] text-secondary-foreground";
const REQUIRED_BADGE_CLASS =
  "rounded-sm border border-primary/50 px-1.5 py-px text-[10px] tracking-[.15em] text-primary";
const OPTIONAL_BADGE_CLASS =
  "rounded-sm border border-border px-1.5 py-px text-[10px] tracking-[.15em] text-muted-foreground";
const NOTE_CLASS = "text-xs leading-[1.9] text-muted-foreground";
const FIELD_CLASS =
  "w-full rounded-lg border border-input/40 bg-card px-4 py-3 text-[15px] leading-[1.8] text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary";
const ERROR_CLASS = "text-sm leading-[1.8] text-destructive";

const PRIMARY_BUTTON_CLASS =
  "btn-sheen inline-flex min-w-[200px] items-center justify-center rounded-full bg-primary px-8 py-3.5 font-mono text-xs font-bold tracking-[.3em] text-primary-foreground transition-[opacity,transform] duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none motion-reduce:hover:translate-y-0";
const SECONDARY_BUTTON_CLASS =
  "inline-flex min-w-[200px] items-center justify-center rounded-full border border-border px-8 py-3.5 font-mono text-xs font-bold tracking-[.3em] text-secondary-foreground transition-colors duration-300 hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-35";

const STEP_LABELS: Record<Step, string> = {
  input: "入力フォーム",
  confirm: "入力内容の確認",
  done: "送信完了",
};

const NETWORK_ERROR =
  "通信に失敗しました。接続を確認のうえ、もう一度「送信する」を押してください。";

/** 同じファイルの二重追加を避けるためのキー */
const fileKey = (file: File) =>
  `${file.name}:${file.size}:${file.lastModified}`;

/**
 * お問い合わせフォーム: 入力 → 入力確認 → 送信完了 の 3 ステップ。
 * 送信は Server Action（sendContact）に委ね、フォーム側は状態遷移だけを持つ。
 *
 * スパム対策（判定はすべてサーバー側 / src/lib/contactGuard.ts）:
 * - 表示時に署名付きトークンを取得し、送信に添える（最小入力時間・有効期限の判定用）
 * - 画面に見えないハニーポット欄（website）を置く。人間は触らないため常に空
 */
export default function ContactForm() {
  const [step, setStep] = useState<Step>("input");
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [website, setWebsite] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subjectId = useId();
  const emailId = useId();
  const messageId = useId();
  const filesId = useId();
  const websiteId = useId();

  useEffect(() => {
    let cancelled = false;
    issueContactToken()
      .then((issued) => {
        if (!cancelled) setToken(issued);
      })
      .catch(() => {
        // 取得できなくても送信時に再取得するので、ここでは何もしない
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ステップが切り替わったら、新しい画面の先頭を表示してフォーカスも移す。
  // 入力画面の下端で「入力確認」を押すとスクロール位置がそのまま残り、SP では確認内容や
  // 完了メッセージが画面外になる。押したボタンが消えてフォーカスの行き場もなくなる
  const containerRef = useRef<HTMLDivElement>(null);
  const shownStepRef = useRef<Step>(step);
  useEffect(() => {
    if (shownStepRef.current === step) return;
    shownStepRef.current = step;
    const container = containerRef.current;
    if (!container) return;
    // 慣性スクロールが残っていると Lenis が次のフレームで位置を上書きするため、先に止める
    stopScrollInertia();
    container.focus({ preventScroll: true });
    // jsdom には scrollIntoView が無い
    container.scrollIntoView?.({ block: "start" });
  }, [step]);

  const canConfirm = canProceedToConfirm({ subject, email, message });

  const addFiles = (incoming: Iterable<File>) => {
    const known = new Set(files.map(fileKey));
    const merged = [
      ...files,
      ...Array.from(incoming).filter((f) => !known.has(fileKey(f))),
    ];
    const problem = validateAttachments(merged);
    if (problem) {
      setFileError(problem);
      return;
    }
    setFileError(null);
    setFiles(merged);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    // 同じファイルを削除 → 再選択できるよう input の値は毎回クリアする
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  };

  const removeFile = (target: File) => {
    setFiles((current) => current.filter((f) => f !== target));
    setFileError(null);
  };

  const handleConfirm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canConfirm) return;
    const validation = validateContact({ subject, email, message });
    if (!validation.ok) {
      setFieldErrors({ email: validation.errors.email });
      return;
    }
    setFieldErrors({});
    setError(null);
    setStep("confirm");
  };

  const handleSend = () => {
    setError(null);
    startTransition(async () => {
      try {
        // 表示時の取得に失敗していた場合はここで取り直す（最小入力時間の判定でいったん弾かれ得るが再送で通る）
        const submitToken = token ?? (await issueContactToken());
        if (token === null) setToken(submitToken);

        const formData = new FormData();
        formData.set("subject", subject);
        formData.set("email", email.trim());
        formData.set("message", message);
        formData.set("token", submitToken);
        formData.set("website", website);
        for (const file of files) formData.append("attachments", file);

        const result = await sendContact(formData);
        if (result.ok) {
          setStep("done");
        } else {
          setError(result.error);
        }
      } catch {
        // 通信断などで Server Action 自体が失敗した場合。入力内容は保持したまま再送できるようにする
        setError(NETWORK_ERROR);
      }
    });
  };

  const renderStep = () => {
    if (step === "done") {
      return (
        <section
          aria-live="polite"
          className="flex flex-col items-center gap-8 py-8 text-center"
        >
          <h2 className="text-[clamp(20px,3vw,26px)] font-semibold text-foreground">
            送信が完了しました
          </h2>
          <div className="flex max-w-[560px] flex-col gap-4 text-[15px] leading-[1.9] text-secondary-foreground [text-wrap:pretty]">
            <p>
              お問い合わせありがとうございます。内容を確認のうえ、必要に応じてご連絡いたします。
            </p>
            <p>
              ご入力いただいたメールアドレス（
              <span className="text-foreground">{email.trim()}</span>
              ）宛に受付完了のメールをお送りしました。届かない場合は、迷惑メールフォルダをご確認ください。
            </p>
          </div>
          <Link href="/" className={PRIMARY_BUTTON_CLASS}>
            トップに戻る
          </Link>
        </section>
      );
    }

    if (step === "confirm") {
      return (
        <section className="flex flex-col gap-10">
          <p className="text-[15px] leading-[1.9] text-secondary-foreground">
            以下の内容で送信します。よろしければ「送信する」を押してください。
          </p>

          <dl className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <dt className={LABEL_CLASS}>お問い合わせの目的</dt>
              <dd className="text-[15px] leading-[1.8] text-foreground">
                {subject}
              </dd>
            </div>
            <div className="flex flex-col gap-3">
              <dt className={LABEL_CLASS}>メールアドレス</dt>
              <dd className="text-[15px] leading-[1.8] break-all text-foreground">
                {email.trim()}
              </dd>
            </div>
            <div className="flex flex-col gap-3">
              <dt className={LABEL_CLASS}>お問い合わせ内容</dt>
              <dd className="rounded-lg border border-border bg-card px-4 py-3 text-[15px] leading-[1.9] whitespace-pre-wrap text-foreground">
                {message.trim()}
              </dd>
            </div>
            <div className="flex flex-col gap-3">
              <dt className={LABEL_CLASS}>添付ファイル</dt>
              <dd className="text-[15px] leading-[1.8] text-foreground">
                {files.length === 0 ? (
                  <span className="text-muted-foreground">なし</span>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {files.map((file) => (
                      <li
                        key={fileKey(file)}
                        className="flex items-center gap-2"
                      >
                        <Paperclip
                          aria-hidden
                          className="size-3.5 shrink-0 text-primary"
                        />
                        <span className="break-all">{file.name}</span>
                        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                          {formatBytes(file.size)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          </dl>

          {error && (
            <p role="alert" className={ERROR_CLASS}>
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep("input")}
              disabled={isPending}
              className={SECONDARY_BUTTON_CLASS}
            >
              修正する
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isPending}
              aria-busy={isPending}
              className={PRIMARY_BUTTON_CLASS}
            >
              {isPending ? "送信中…" : "送信する"}
            </button>
          </div>
        </section>
      );
    }

    return (
      <form
        onSubmit={handleConfirm}
        noValidate
        className="relative flex flex-col gap-10"
      >
        <p className="text-[15px] leading-[1.9] text-secondary-foreground [text-wrap:pretty]">
          FlexQ
          に関するご質問・不具合のご報告・ご要望などは、以下のフォームからお送りください。
        </p>

        {/* ハニーポット: 画面外に置き、支援技術・Tab 移動・オートフィルの対象からも外す。
          display:none だと一部の bot が入力対象から除外するため、位置で隠す */}
        <div
          aria-hidden="true"
          className="absolute top-0 -left-[9999px] h-px w-px overflow-hidden"
        >
          <label htmlFor={websiteId}>Website</label>
          <input
            id={websiteId}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3">
          <label htmlFor={subjectId} className={LABEL_CLASS}>
            お問い合わせの目的
            <span className={REQUIRED_BADGE_CLASS}>必須</span>
          </label>
          <div className="relative">
            <select
              id={subjectId}
              name="subject"
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className={cn(
                FIELD_CLASS,
                "cursor-pointer appearance-none pr-12",
                subject === "" && "text-muted-foreground",
              )}
            >
              <option value="" disabled>
                選択してください
              </option>
              {CONTACT_SUBJECTS.map((option) => (
                <option key={option} value={option} className="text-foreground">
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-primary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label htmlFor={emailId} className={LABEL_CLASS}>
            メールアドレス
            <span className={REQUIRED_BADGE_CLASS}>必須</span>
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (fieldErrors.email) setFieldErrors({});
            }}
            placeholder="example@flexqstudio.com"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={`${emailId}-note`}
            className={cn(
              FIELD_CLASS,
              fieldErrors.email && "border-destructive",
            )}
          />
          {fieldErrors.email && (
            <p role="alert" className={ERROR_CLASS}>
              {fieldErrors.email}
            </p>
          )}
          <p id={`${emailId}-note`} className={NOTE_CLASS}>
            受信可能なメールアドレスをご入力ください。受付完了のメールをこのアドレス宛にお送りします。ドメイン指定受信をされている場合は「flexqstudio.com」からのメールを受信できるよう設定してください。
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <label htmlFor={messageId} className={LABEL_CLASS}>
            お問い合わせ内容
            <span className={REQUIRED_BADGE_CLASS}>必須</span>
          </label>
          <textarea
            id={messageId}
            name="message"
            required
            rows={8}
            maxLength={CONTACT_MESSAGE_MAX_LENGTH}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="お問い合わせ内容をご記入ください"
            // 長文を入力したとき、欄内のホイール / トラックパッドスクロールを Lenis に奪わせない
            data-lenis-prevent-wheel
            className={cn(FIELD_CLASS, "resize-y")}
          />
          <p className="text-right font-mono text-[11px] tracking-[.1em] text-muted-foreground">
            {message.length} / {CONTACT_MESSAGE_MAX_LENGTH}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <span id={`${filesId}-label`} className={LABEL_CLASS}>
            添付ファイル
            <span className={OPTIONAL_BADGE_CLASS}>任意</span>
          </span>
          {/* 選択は button 経由で行い、input 自体は非表示にする（見た目をサイトに合わせるため） */}
          <input
            ref={fileInputRef}
            id={filesId}
            name="attachments"
            type="file"
            multiple
            accept={CONTACT_ATTACHMENT_ACCEPT}
            onChange={handleFileChange}
            className="sr-only"
            tabIndex={-1}
            aria-labelledby={`${filesId}-label`}
          />
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-input/40 bg-card px-4 py-6 text-center"
          >
            <Paperclip aria-hidden className="size-5 text-primary" />
            <p className="text-sm leading-[1.8] text-secondary-foreground">
              ここにファイルをドロップするか、ボタンから選択してください
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= CONTACT_ATTACHMENT_MAX_FILES}
              className={cn(SECONDARY_BUTTON_CLASS, "min-w-0 px-6 py-2.5")}
            >
              ファイルを選択
            </button>
          </div>
          {files.length > 0 && (
            <ul className="flex flex-col gap-2">
              {files.map((file) => (
                <li
                  key={fileKey(file)}
                  className="flex items-center gap-3 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground"
                >
                  <Paperclip
                    aria-hidden
                    className="size-3.5 shrink-0 text-primary"
                  />
                  <span className="min-w-0 flex-1 break-all">{file.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {formatBytes(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(file)}
                    aria-label={`${file.name} を削除`}
                    className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {fileError && (
            <p role="alert" className={ERROR_CLASS}>
              {fileError}
            </p>
          )}
          <p className={NOTE_CLASS}>
            PNG / JPG / PDF 形式、1 ファイル{" "}
            {formatBytes(CONTACT_ATTACHMENT_MAX_FILE_BYTES)} 以内、
            {CONTACT_ATTACHMENT_MAX_FILES} 件まで添付できます。
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            type="submit"
            disabled={!canConfirm}
            className={PRIMARY_BUTTON_CLASS}
          >
            入力確認
          </button>
          <p className="text-center text-xs leading-[1.9] text-muted-foreground">
            フォームをご利用いただけない場合は{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary underline underline-offset-4"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            まで直接ご連絡ください。
          </p>
        </div>
      </form>
    );
  };

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      role="group"
      aria-label={STEP_LABELS[step]}
      // ヘッダー（絶対配置）とセクション見出しの分だけ手前で止める
      className="scroll-mt-[clamp(120px,15vw,168px)] outline-none"
    >
      {renderStep()}
    </div>
  );
}
