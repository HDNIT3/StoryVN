"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import uploadService from "@/features/upload/services/upload.service";
import { forumContentClass, resolveForumUrl, safeForumUrl, sanitizeForumHtml } from "./ForumContent";

export interface ForumEditorHandle { prepare: () => Promise<string>; unlock: () => void }
type LocalImage = { file: File; uploaded?: string };

function Icon({ children }: { children: string }) {
  const paths: Record<string, string> = {
    "↶": "M9 5 4 10l5 5M4 10h10a6 6 0 0 1 0 12",
    "↷": "m15 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12",
    "•": "M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1",
    "1.": "M10 6h11M10 12h11M10 18h11M3 4h1v5M3 13c3-2 4 1 0 4h3",
    "❝": "M4 6h6v7H4zm10 0h6v7h-6zM10 13c0 4-2 5-5 5m15-5c0 4-2 5-5 5",
    "↗": "m10 14 4-4m-6 6-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m4 0 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0",
    "▧": "M3 3h18v18H3zM3 17l6-6 4 4 3-3 5 5M7 7h1",
    "＋": "M3 5h12v14H3zM3 16l4-4 4 4M19 3v8m-4-4h8",
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mx-auto h-5 w-5"><path d={paths[children]} /></svg>;
}

export function ForumEditor({ initialHtml, disabled, editorRef }: {
  initialHtml: string; disabled: boolean; editorRef: Ref<ForumEditorHandle>;
}) {
  const images = useRef(new Map<string, LocalImage>());
  const fileInput = useRef<HTMLInputElement>(null);
  const preparing = useRef(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [insertMode, setInsertMode] = useState<"image" | "link" | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ code: false, codeBlock: false, heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: false, protocols: ["http", "https"], isAllowedUri: safeForumUrl } }), Image.configure({ allowBase64: false }), TextAlign.configure({ types: ["heading", "paragraph"] })],
    content: "",
    editorProps: {
      attributes: { class: `${forumContentClass} min-h-72 px-5 py-4 outline-none`, role: "textbox", "aria-label": "Nội dung bài viết", "aria-multiline": "true" },
      transformPastedHTML: html => sanitizeForumHtml(html),
      handleDrop: (_view, event) => { if (event.dataTransfer?.files.length) { event.preventDefault(); return true; } return false; },
      handlePaste: (_view, event) => { if (event.clipboardData?.files.length) { event.preventDefault(); return true; } return false; },
    },
  });
  useEffect(() => { if (editor) editor.commands.setContent(sanitizeForumHtml(initialHtml)); }, [editor, initialHtml]);
  useEffect(() => { editor?.setEditable(!disabled); }, [editor, disabled]);
  useEffect(() => { const entries = images.current; return () => { entries.forEach((_image, blob) => URL.revokeObjectURL(blob)); entries.clear(); }; }, []);
  const state = useEditorState({ editor, selector: ({ editor: current }) => ({ html: current?.getHTML() || "", bold: current?.isActive("bold"), italic: current?.isActive("italic"), underline: current?.isActive("underline") }) });

  useImperativeHandle(editorRef, () => ({
    unlock() { editor?.setEditable(true); },
    async prepare() {
      if (!editor || preparing.current) throw new Error("Trình soạn thảo chưa sẵn sàng.");
      preparing.current = true;
      editor.setEditable(false);
      setError("");
      try {
        const container = document.createElement("div");
        container.innerHTML = sanitizeForumHtml(editor.getHTML(), new Set(images.current.keys()));
        const nodes = [...container.querySelectorAll("img")];
        const active = new Set(nodes.map(node => node.getAttribute("src") || "").filter(src => images.current.has(src)));
        if (active.size > 3) throw new Error("Mỗi lần lưu chỉ được tải tối đa 3 ảnh từ thiết bị.");
        if (!container.textContent?.trim() && !nodes.length) throw new Error("Vui lòng nhập nội dung hoặc thêm hình ảnh.");
        if (container.innerHTML.length > 20000) throw new Error("Nội dung định dạng vượt quá 20.000 ký tự. Vui lòng rút gọn bài viết.");
        for (const blob of active) {
          const image = images.current.get(blob)!;
          if (!image.uploaded) {
            try {
              const result = await uploadService.uploadImage(image.file, "forum");
              if (!result.success || !safeForumUrl(result.data.url)) throw new Error("Địa chỉ ảnh trả về không hợp lệ.");
              image.uploaded = resolveForumUrl(result.data.url);
            } catch (cause) {
              const message = cause && typeof cause === "object" && "message" in cause ? String(cause.message) : "Không thể tải ảnh.";
              throw new Error(`Không thể tải ảnh: ${message} Hệ thống giới hạn 3 ảnh/phút; nếu hết lượt, chờ ít nhất 1 phút rồi lưu lại. Nội dung và các ảnh đã tải thành công được giữ nguyên.`);
            }
          }
          nodes.filter(node => node.getAttribute("src") === blob).forEach(node => node.setAttribute("src", image.uploaded!));
        }
        const html = sanitizeForumHtml(container.innerHTML);
        if (html.length > 20000) throw new Error("Nội dung định dạng vượt quá 20.000 ký tự. Vui lòng rút gọn bài viết.");
        return html;
      } finally { preparing.current = false; }
    },
  }));

  function selectFiles(files: FileList | null) {
    if (!editor || disabled || !files) return;
    setError("");
    const selected = [...files];
    const active = new Set<string>();
    editor.state.doc.descendants(node => { if (node.type.name === "image" && images.current.has(node.attrs.src)) active.add(node.attrs.src); });
    if (active.size + selected.length > 3) { setError("Chỉ được chọn tối đa 3 ảnh từ thiết bị trong mỗi lần lưu. Xóa bớt ảnh trước khi chọn thêm."); return; }
    if (selected.some(file => !["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"].includes(file.type.toLowerCase()) || file.size > 5 * 1024 * 1024)) { setError("Chỉ chấp nhận JPG, PNG, WEBP, GIF; mỗi ảnh tối đa 5MB."); return; }
    const nodes = selected.map(file => { const blob = URL.createObjectURL(file); images.current.set(blob, { file }); return { type: "image", attrs: { src: blob, alt: file.name } }; });
    editor.chain().focus().insertContent(nodes).run();
  }

  const toolClass = "min-h-10 min-w-10 rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-sky-100 hover:text-sky-800 disabled:opacity-40 aria-pressed:bg-sky-100 aria-pressed:text-sky-800";
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
    <div role="toolbar" aria-label="Định dạng văn bản" className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
      <button type="button" title="Hoàn tác" aria-label="Hoàn tác" className={toolClass} disabled={disabled || !editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}><Icon>↶</Icon></button>
      <button type="button" title="Làm lại" aria-label="Làm lại" className={toolClass} disabled={disabled || !editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}><Icon>↷</Icon></button>
      <button type="button" title="In đậm" className={`${toolClass} font-bold`} disabled={disabled || !editor} aria-label="In đậm" aria-pressed={state?.bold} onClick={() => editor?.chain().focus().toggleBold().run()}>B</button>
      <button type="button" title="In nghiêng" className={`${toolClass} italic`} disabled={disabled || !editor} aria-label="In nghiêng" aria-pressed={state?.italic} onClick={() => editor?.chain().focus().toggleItalic().run()}>I</button>
      <button type="button" title="Gạch chân" className={`${toolClass} underline`} disabled={disabled || !editor} aria-label="Gạch chân" aria-pressed={state?.underline} onClick={() => editor?.chain().focus().toggleUnderline().run()}>U</button>
      <select aria-label="Kiểu đoạn văn" disabled={disabled || !editor} value={editor?.isActive("heading", { level: 2 }) ? "2" : editor?.isActive("heading", { level: 3 }) ? "3" : "p"} className={`${toolClass} max-w-36 border border-slate-200 bg-white`} onChange={event => event.target.value === "p" ? editor?.chain().focus().setParagraph().run() : editor?.chain().focus().setHeading({ level: Number(event.target.value) as 2 | 3 }).run()}><option value="p">Đoạn văn</option><option value="2">Tiêu đề 2</option><option value="3">Tiêu đề 3</option></select>
      {([
        ["Danh sách", () => editor?.chain().focus().toggleBulletList().run(), "bulletList"],
        ["Đánh số", () => editor?.chain().focus().toggleOrderedList().run(), "orderedList"],
        ["Trích dẫn", () => editor?.chain().focus().toggleBlockquote().run(), "blockquote"],
      ] as const).map(([label, action, active]) => <button key={label} type="button" title={label} aria-label={label} className={toolClass} disabled={disabled || !editor} aria-pressed={editor?.isActive(active)} onClick={action}>{active === "bulletList" ? <Icon>•</Icon> : active === "orderedList" ? <Icon>1.</Icon> : <Icon>❝</Icon>}</button>)}
      <select aria-label="Căn lề" className={`${toolClass} border border-slate-200 bg-white`} disabled={disabled || !editor} value={["left", "center", "right", "justify"].find(value => editor?.isActive({ textAlign: value })) || "left"} onChange={event => editor?.chain().focus().setTextAlign(event.target.value).run()}><option value="left">Căn trái</option><option value="center">Căn giữa</option><option value="right">Căn phải</option><option value="justify">Căn đều</option></select>
       <button type="button" title="Liên kết" aria-label="Chèn liên kết" className={toolClass} disabled={disabled || !editor} onClick={() => { setInsertMode("link"); setUrl(editor?.getAttributes("link").href || ""); setError(""); }}><Icon>↗</Icon></button>
       <button type="button" title="Ảnh từ URL" aria-label="Chèn ảnh từ URL" className={toolClass} disabled={disabled || !editor} onClick={() => { setInsertMode("image"); setUrl(""); setError(""); }}><Icon>▧</Icon></button>
       <button type="button" title="Chọn ảnh từ thiết bị" aria-label="Chọn ảnh từ thiết bị" className={`${toolClass} text-sky-700`} disabled={disabled || !editor} onClick={() => fileInput.current?.click()}><Icon>＋</Icon></button>
      <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={disabled} onChange={event => { selectFiles(event.target.files); event.target.value = ""; }} />
    </div>
    {insertMode && <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-sky-50 p-3">
      <input aria-label={insertMode === "image" ? "Địa chỉ ảnh" : "Địa chỉ liên kết"} placeholder="https://… hoặc /uploads/…" value={url} disabled={disabled} onChange={event => setUrl(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
      <button type="button" disabled={disabled} className={toolClass} onClick={() => {
        if (!safeForumUrl(url.trim())) { setError("Dùng URL http://, https:// hoặc đường dẫn /uploads/ hợp lệ."); return; }
        const href = resolveForumUrl(url.trim());
        if (insertMode === "image") editor?.chain().focus().setImage({ src: href }).run();
        else if (editor?.state.selection.empty && !editor.isActive("link")) editor.chain().focus().insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href, target: "_blank" } }] }).run();
        else editor?.chain().focus().extendMarkRange("link").setLink({ href, target: "_blank" }).run();
        setInsertMode(null); setError("");
      }}>Chèn</button>
      {insertMode === "link" && <button type="button" disabled={disabled} className={toolClass} onClick={() => { editor?.chain().focus().extendMarkRange("link").unsetLink().run(); setInsertMode(null); }}>Gỡ liên kết</button>}
      <button type="button" disabled={disabled} className={toolClass} onClick={() => setInsertMode(null)}>Đóng</button>
    </div>}
    <EditorContent editor={editor} />
    <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500"><span>JPG, PNG, WEBP, GIF · Tối đa 5MB/ảnh, 3 ảnh/lần lưu</span><span>Dung lượng nội dung: {Math.ceil((state?.html.length || 0) / 20000 * 100)}%</span></div>
    <p className="px-4 pb-3 text-xs text-slate-500">Ảnh từ thiết bị chỉ được tải lên khi bạn đăng hoặc lưu bài viết.</p>
    {error && <p role="alert" className="px-4 pb-3 text-sm text-rose-700">{error}</p>}
  </div>;
}
