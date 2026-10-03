import { Fragment, useEffect } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Code, Heading2, Italic, List, ListOrdered, Minus, Quote, Strikethrough } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Toolbar groups. Tools with `isActive` are toggles that reflect the selection.
const TOOL_GROUPS = [
  [
    { label: "Bold", icon: Bold, run: (c) => c.toggleBold(), isActive: (e) => e.isActive("bold") },
    { label: "Italic", icon: Italic, run: (c) => c.toggleItalic(), isActive: (e) => e.isActive("italic") },
    { label: "Strikethrough", icon: Strikethrough, run: (c) => c.toggleStrike(), isActive: (e) => e.isActive("strike") },
  ],
  [
    { label: "Heading", icon: Heading2, run: (c) => c.toggleHeading({ level: 2 }), isActive: (e) => e.isActive("heading", { level: 2 }) },
    { label: "Bullet list", icon: List, run: (c) => c.toggleBulletList(), isActive: (e) => e.isActive("bulletList") },
    { label: "Numbered list", icon: ListOrdered, run: (c) => c.toggleOrderedList(), isActive: (e) => e.isActive("orderedList") },
  ],
  [
    { label: "Code block", icon: Code, run: (c) => c.toggleCodeBlock(), isActive: (e) => e.isActive("codeBlock") },
    { label: "Quote", icon: Quote, run: (c) => c.toggleBlockquote(), isActive: (e) => e.isActive("blockquote") },
    { label: "Divider", icon: Minus, run: (c) => c.setHorizontalRule() },
  ],
];

const ALL_TOOLS = TOOL_GROUPS.flat();

const RichTextEditor = ({ content, onChange, placeholder = "Start writing…", autofocus = false }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor text-base text-foreground outline-none",
      },
    },
  });

  // TipTap v3 doesn't re-render on every transaction, so subscribe to just the active states
  const active = useEditorState({
    editor,
    selector: ({ editor }) => (editor ? ALL_TOOLS.map((tool) => tool.isActive?.(editor) ?? false) : []),
  });

  // Focus once the editor exists. focus('end') places the cursor but defers the DOM
  // focus to the next animation frame, so focus the view directly as well.
  useEffect(() => {
    if (!autofocus || !editor) return;
    editor.commands.focus("end");
    editor.view.focus();
  }, [autofocus, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Sticks under the 56px app header while scrolling long notes */}
      <div
        role="toolbar"
        aria-label="Formatting"
        className="sticky top-14 z-20 -mx-1 flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-lg border bg-background/95 p-1 shadow-sm backdrop-blur"
      >
        {TOOL_GROUPS.map((group, groupIndex) => (
          <Fragment key={groupIndex}>
            {groupIndex > 0 && <Separator orientation="vertical" className="mx-1 h-5" />}
            {group.map((tool) => {
              const index = ALL_TOOLS.indexOf(tool);
              return (
                <Tooltip key={tool.label}>
                  <TooltipTrigger asChild>
                    <Toggle
                      size="sm"
                      aria-label={tool.label}
                      pressed={active?.[index] ?? false}
                      onPressedChange={() => tool.run(editor.chain().focus()).run()}
                      // Style from aria-pressed: the tooltip trigger overwrites the toggle's data-state
                      className="aria-pressed:bg-primary/15 aria-pressed:text-primary"
                    >
                      <tool.icon />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>{tool.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </Fragment>
        ))}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
