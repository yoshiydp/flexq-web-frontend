/**
 * @jest-environment node
 */
import {
  buildLedgerTitle,
  createNotionLedger,
  formatReceivedAt,
  isNotionLedgerConfigured,
} from "./contactNotion";

const pagesCreate = jest.fn();
const pagesUpdate = jest.fn();
const uploadsCreate = jest.fn();
const uploadsSend = jest.fn();
jest.mock("@notionhq/client", () => ({
  Client: jest.fn(function (this: Record<string, unknown>) {
    this.pages = { create: pagesCreate, update: pagesUpdate };
    this.fileUploads = { create: uploadsCreate, send: uploadsSend };
  }),
}));

const ENV = { NOTION_TOKEN: "secret", NOTION_CONTACT_DATA_SOURCE_ID: "ds-1" };
const VALUES = {
  subject: "機能の要望" as const,
  email: "user@example.com",
  message: "1 行目\n\n3 行目",
};
const ATTACHMENT = {
  filename: "shot.png",
  contentType: "image/png",
  content: Buffer.from([0x89, 0x50]),
};

beforeEach(() => {
  jest.clearAllMocks();
  pagesCreate.mockResolvedValue({ id: "page-1", url: "https://notion.so/page-1" });
  pagesUpdate.mockResolvedValue({});
  uploadsCreate.mockResolvedValue({ id: "upload-1" });
  uploadsSend.mockResolvedValue({});
});

describe("isNotionLedgerConfigured / createNotionLedger", () => {
  it("トークンと data source ID が揃っているときだけ有効", () => {
    expect(isNotionLedgerConfigured({})).toBe(false);
    expect(isNotionLedgerConfigured({ NOTION_TOKEN: "x" })).toBe(false);
    expect(isNotionLedgerConfigured(ENV)).toBe(true);
    expect(createNotionLedger({})).toBeNull();
    expect(createNotionLedger(ENV)).not.toBeNull();
  });
});

describe("formatReceivedAt / buildLedgerTitle", () => {
  it("JST で整形し、件名は目的 + 受信日時", () => {
    const at = new Date("2026-10-03T05:04:00Z");
    expect(formatReceivedAt(at)).toBe("2026-10-03 14:04");
    expect(buildLedgerTitle(VALUES, at)).toBe("機能の要望 2026-10-03 14:04");
  });
});

describe("ContactLedger.record", () => {
  it("添付をアップロードしてから、プロパティと本文を付けてページを作る", async () => {
    const ledger = createNotionLedger(ENV)!;
    const at = new Date("2026-10-03T05:04:00Z");
    const entry = await ledger.record(VALUES, [ATTACHMENT], at);

    expect(uploadsCreate).toHaveBeenCalledWith({
      mode: "single_part",
      filename: "shot.png",
      content_type: "image/png",
    });
    expect(uploadsSend).toHaveBeenCalledWith(
      expect.objectContaining({ file_upload_id: "upload-1" }),
    );

    const args = pagesCreate.mock.calls[0][0];
    expect(args.parent).toEqual({ type: "data_source_id", data_source_id: "ds-1" });
    expect(args.properties["件名"].title[0].text.content).toBe("機能の要望 2026-10-03 14:04");
    expect(args.properties["ステータス"].select.name).toBe("新着");
    expect(args.properties["目的"].select.name).toBe("機能の要望");
    expect(args.properties["メールアドレス"].email).toBe("user@example.com");
    expect(args.properties["お問い合わせ内容"].rich_text[0].text.content).toBe(VALUES.message);
    expect(args.properties["添付ファイル"].files).toEqual([
      { type: "file_upload", file_upload: { id: "upload-1" }, name: "shot.png" },
    ]);
    expect(args.properties["受信日時"].date.start).toBe(at.toISOString());
    expect(args.properties["控えメール未達"].checkbox).toBe(false);
    // 本文: 見出し + 改行を保った 1 段落
    expect(args.children).toHaveLength(2);
    expect(args.children[1].paragraph.rich_text[0].text.content).toBe(VALUES.message);

    expect(entry).toEqual({ pageId: "page-1", url: "https://notion.so/page-1" });
  });

  it("改行が多い本文でもブロック数は増えない（Notion の 100 ブロック上限対策）", async () => {
    const message = Array(150).fill("x").join("\n");
    await createNotionLedger(ENV)!.record({ ...VALUES, message }, [], new Date());
    expect(pagesCreate.mock.calls[0][0].children).toHaveLength(2);
  });

  it("markSenderMailFailed はチェックボックスを ON にする", async () => {
    await createNotionLedger(ENV)!.markSenderMailFailed("page-1");
    expect(pagesUpdate).toHaveBeenCalledWith({
      page_id: "page-1",
      properties: { "控えメール未達": { checkbox: true } },
    });
  });
});
