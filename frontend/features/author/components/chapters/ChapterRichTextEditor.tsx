"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

interface ChapterRichTextEditorProps {
  content: string;
  onChange: (html: string, wordCount: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChapterRichTextEditor({
  content,
  onChange,
  placeholder = "Bắt đầu viết nội dung chương truyện tại đây...",
  disabled = false,
}: ChapterRichTextEditorProps) {
  const normalizedPlaceholder = placeholder.normalize("NFC");

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: normalizedPlaceholder,
        emptyEditorClass:
          "is-editor-empty before:content-[attr(data-placeholder)] before:text-slate-400 before:float-left before:pointer-events-none before:h-0 font-sans",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "outline-none focus:outline-none focus-visible:outline-none min-h-[360px] font-sans text-slate-800 text-base leading-relaxed",
        style:
          "font-family: var(--font-be-vietnam-pro), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;",
      },
    },
    content: (content || "").normalize("NFC"),
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const text = currentEditor.getText();
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      onChange(html, wordCount);
    },
  });

  // Sync content when prop changes externally (e.g. initial fetch)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      if (editor.getText().trim() === "" && content) {
        editor.commands.setContent(content.normalize("NFC"));
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="w-full min-h-[360px] bg-white border border-slate-300 rounded-none p-6 animate-pulse flex items-center justify-center text-slate-400 text-sm font-sans">
        Đang khởi động trình soạn thảo...
      </div>
    );
  }

  const rawText = editor.getText();
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
  const charCount = rawText.length;

  return (
    <div className="w-full bg-white border border-slate-300 rounded-none shadow-none flex flex-col focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-200 transition">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 text-slate-700 select-none">
        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-2.5 py-1 text-xs font-semibold rounded-none transition ${
            editor.isActive("paragraph")
              ? "bg-sky-600 text-white"
              : "hover:bg-slate-200/70"
          }`}
          title="Đoạn văn"
        >
          Đoạn văn
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2.5 py-1 text-xs font-semibold rounded-none transition ${
            editor.isActive("heading", { level: 2 })
              ? "bg-sky-600 text-white"
              : "hover:bg-slate-200/70"
          }`}
          title="Tiêu đề lớn"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2.5 py-1 text-xs font-semibold rounded-none transition ${
            editor.isActive("heading", { level: 3 })
              ? "bg-sky-600 text-white"
              : "hover:bg-slate-200/70"
          }`}
          title="Tiêu đề vừa"
        >
          H3
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Text Formats */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded-none text-sm font-bold transition ${
            editor.isActive("bold")
              ? "bg-sky-600 text-white"
              : "hover:bg-slate-200/70"
          }`}
          title="In đậm (Ctrl+B)"
        >
          B
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded-none text-sm italic transition ${
            editor.isActive("italic")
              ? "bg-sky-600 text-white"
              : "hover:bg-slate-200/70"
          }`}
          title="In nghiêng (Ctrl+I)"
        >
          I
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-2 py-1 rounded-none text-sm underline transition ${
            editor.isActive("underline")
              ? "bg-sky-600 text-white"
              : "hover:bg-slate-200/70"
          }`}
          title="Gạch chân (Ctrl+U)"
        >
          U
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded-none text-sm line-through transition ${
            editor.isActive("strike")
              ? "bg-sky-600 text-white"
              : "hover:bg-slate-200/70"
          }`}
          title="Gạch ngang"
        >
          S
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Lists & Quotes */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-none transition ${
            editor.isActive("bulletList")
              ? "bg-sky-600 text-white"
              : "hover:bg-slate-200/70"
          }`}
          title="Danh sách dấu chấm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-none transition ${
            editor.isActive("orderedList")
              ? "bg-sky-600 text-white"
              : "hover:bg-slate-200/70"
          }`}
          title="Danh sách số"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-none transition ${
            editor.isActive("blockquote")
              ? "bg-sky-600 text-white"
              : "hover:bg-slate-200/70"
          }`}
          title="Trích dẫn"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-2 py-1 rounded-none hover:bg-slate-200/70 transition"
          title="Đường phân cách ngang"
        >
          ―
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-none hover:bg-slate-200/70 disabled:opacity-30 transition"
          title="Hoàn tác (Ctrl+Z)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-none hover:bg-slate-200/70 disabled:opacity-30 transition"
          title="Làm lại (Ctrl+Y)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v2m15-7l-6 6m6-6l-6-6" />
          </svg>
        </button>

        <div
          className={`ml-auto text-xs px-2 select-none flex items-center gap-1.5 font-medium transition ${
            wordCount > 2500
              ? "text-rose-600 font-bold"
              : wordCount > 2200
              ? "text-amber-600"
              : "text-slate-500"
          }`}
        >
          <span>
            {wordCount.toLocaleString()} / 2.500 từ
          </span>
          {wordCount > 2500 && (
            <span className="text-[11px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 font-bold">
              Vượt quá 2.500 từ
            </span>
          )}
        </div>
      </div>

      {/* Editor Content Surface */}
      <div
        className="p-5 sm:p-6 min-h-[380px] lg:min-h-[460px] bg-white cursor-text font-sans text-slate-800 text-base leading-relaxed overflow-y-auto"
        style={{
          fontFamily:
            "var(--font-be-vietnam-pro), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} className="outline-none focus:outline-none" />
      </div>
    </div>
  );
}
