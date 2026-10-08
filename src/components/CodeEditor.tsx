import { useEffect, useRef } from "react";
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";
import type { LanguageId } from "../data/types";
import { bracketMatching, defaultHighlightStyle, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { drawSelection, EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from "@codemirror/view";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  errorLine?: number;
  disabled?: boolean;
  language?: LanguageId;
};

const languageExtension = (language: LanguageId) => {
  if (language === "javascript") return javascript();
  if (language === "java") return java();
  if (language === "cpp") return cpp();
  if (language === "htmlcss") return html();
  return python();
};

export function CodeEditor({ value, onChange, errorLine, disabled = false, language = "python" }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!host.current) return;
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          EditorView.lineWrapping,
          EditorView.editable.of(!disabled),
          keymap.of([...defaultKeymap, ...closeBracketsKeymap, ...completionKeymap, indentWithTab]),
          languageExtension(language),
          bracketMatching(),
          closeBrackets(),
          indentOnInput(),
          autocompletion(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.theme({
            "&": { height: "100%", fontSize: "14px", backgroundColor: "transparent" },
            ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", padding: "12px 0" },
            ".cm-gutters": { backgroundColor: "transparent", color: "var(--editor-gutter)", border: "none" },
            ".cm-content": { caretColor: "var(--editor-caret)", minHeight: "190px" },
            ".cm-activeLine": { backgroundColor: "var(--editor-active)" },
            ".cm-error-line": { backgroundColor: "var(--editor-error-bg)", boxShadow: "inset 3px 0 0 var(--editor-error)" },
          }),
        ],
      }),
      parent: host.current,
    });
    viewRef.current = view;
    return () => view.destroy();
    // The editor deliberately re-initializes only when language mode or editability changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, disabled]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (value !== current) view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dom.querySelectorAll(".cm-error-line").forEach((line) => line.classList.remove("cm-error-line"));
    if (!errorLine) return;
    const line = view.dom.querySelector(`.cm-line:nth-child(${errorLine})`);
    line?.classList.add("cm-error-line");
  }, [errorLine]);

  const insertSymbol = (symbol: string) => {
    const view = viewRef.current;
    if (!view || disabled) return;
    const range = view.state.selection.main;
    view.dispatch({ changes: { from: range.from, to: range.to, insert: symbol }, selection: { anchor: range.from + symbol.length } });
    view.focus();
  };

  return (
    <div className="editor-shell">
      <div className="editor-host" ref={host} aria-label={`${language} code editor`} />
      <div className="symbol-bar" aria-label="Code symbols for mobile">
        {["(", ")", "[", "]", ":", "=", "+", "*", '"', "    "].map((symbol) => (
          <button key={symbol} type="button" onClick={() => insertSymbol(symbol)} aria-label={`Insert ${symbol === "    " ? "indent" : symbol}`}>
            {symbol === "    " ? "tab" : symbol}
          </button>
        ))}
      </div>
    </div>
  );
}