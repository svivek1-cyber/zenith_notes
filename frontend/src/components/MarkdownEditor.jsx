import React, { useEffect, useRef, useState } from "react";

const MarkdownEditor = ({ content, onChange }) => {
  const editorRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);

  const applyTextColor = (color) => {
    applyFormat("foreColor", color);
    setTextColorOpen(false);
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  // Handles text formatting (e.g., bold, italic)
  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    syncContent();
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRef.current) return;

    const range = selection.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      savedSelectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    const savedRange = savedSelectionRef.current;
    if (!selection || !savedRange) return;

    editorRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(savedRange);
  };

  // Handles image selection and inline insertion
  const handleImageInsert = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Image = event.target.result;
      restoreSelection();
      document.execCommand("insertImage", false, base64Image);
      syncContent();
    };
    reader.readAsDataURL(file);

    // Reset input so the same image can be uploaded again if needed
    e.target.value = null;
  };

  // Handles inserting a code block with optional selected text
  const insertCodeBlock = () => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString() : "";

    // Container with a wrapper and fallback text/character
    const codeBlockHtml = `
    <pre class="bg-gray-100 text-black p-4 rounded-md font-mono text-sm my-3 border border-gray-700 overflow-x-auto block"><code>${
      selectedText || "&#8203;"
    }</code></pre><p><br></p>
  `;

    document.execCommand("insertHTML", false, codeBlockHtml);

    if (editorRef.current) {
      editorRef.current.focus();
      syncContent();
    }
  };

  const handleAIAssistant = (prompt) => {
    // Implementation for AI assistant functionality
  };

  // Handles backspace behavior inside code blocks
  const handleKeyDown = (e) => {
    if (e.key === "Backspace") {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      // Find if the cursor is inside a <pre> block
      const preBlock =
        range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement?.closest("pre")
          : range.startContainer.closest("pre");

      if (preBlock) {
        // Check if the code block is empty or contains zero-width spaces/whitespace
        const textContent = preBlock.textContent.trim().replace(/\u8203/g, ""); // removes zero-width characters

        if (textContent === "" || textContent === "// Type your code here") {
          e.preventDefault(); // Stop default backspace behavior

          // Insert a clean paragraph so the cursor has a place to go
          const paragraph = document.createElement("p");
          paragraph.innerHTML = "<br>";
          preBlock.parentNode.insertBefore(paragraph, preBlock);

          // Remove the empty code block
          preBlock.remove();

          // Place cursor inside the newly created paragraph
          const newRange = document.createRange();
          newRange.setStart(paragraph, 0);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

          syncContent();
        }
      }
    }
  };

  // Handles list formatting and custom styles for ordered lists
  const handleListChange = (e) => {
    const value = e.target.value;
    if (!value) return;

    if (value === "ul") {
      applyFormat("insertUnorderedList");
    } else {
      // Apply ordered list standard command first
      applyFormat("insertOrderedList");

      // Apply custom numbering style if selected
      if (value !== "ol-decimal") {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          let node = selection.getRangeAt(0).startContainer;
          // Traverse up to find the wrapping <ol> tag
          while (node && node.nodeName !== "OL" && node !== editorRef.current) {
            node = node.parentNode;
          }
          if (node && node.nodeName === "OL") {
            const styleTypeMap = {
              "ol-alpha": "lower-alpha",
              "ol-roman": "lower-roman",
            };
            node.style.listStyleType = styleTypeMap[value] || "";
          }
        }
      }
    }

    e.target.value = ""; // Reset dropdown after selection
  };

  // Handles applying highlight color to selected text
  const applyHighlight = (color) => {
    // 'hiliteColor' works in standard browsers, fallback to 'backColor'
    const command = document.queryCommandSupported("hiliteColor")
      ? "hiliteColor"
      : "backColor";

    applyFormat(command, color);
    setHighlightOpen(false);
  };

  // Synchronizes the editable div with the React state variable
  const syncContent = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    // <div className="max-w-4xl mx-auto mt-8 border border-gray-300 rounded-md shadow-sm">
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-300 rounded-t-md sticky top-0 z-10">
        <select
          onChange={(e) => {
            if (e.target.value) {
              applyFormat("formatBlock", e.target.value);
              e.target.value = ""; // Reset dropdown after applying
            }
          }}
          defaultValue=""
          className="px-2 py-1 w-12 h-8.5 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition text-sm focus:outline-none"
          title="Text Format"
        >
          <option value="" disabled hidden>
            H
          </option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
          <option value="p">Paragraph</option>
        </select>
        <select
          onChange={handleListChange}
          defaultValue=""
          className="px-2 py-1 w-12 h-8.5 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition text-sm focus:outline-none"
          title="List Format"
        >
          <option value="" disabled hidden>
            ☰
          </option>
          <option value="ul">• • •</option>
          <option value="ol-decimal">1 2 3</option>
          <option value="ol-alpha">a b c</option>
          <option value="ol-roman">i &nbsp;ii &nbsp;iii</option>
        </select>
        <button
          onClick={insertCodeBlock}
          className="flex items-center px-2 py-1 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition"
          title="Code Block"
        >
          <span className="material-symbols-outlined text-[20px]">code</span>
        </button>
        |
        <button
          onClick={() => applyFormat("bold")}
          className="flex items-center px-2 py-1 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition"
          title="Bold"
        >
          <span className="material-symbols-outlined text-[20px]">
            format_bold
          </span>
        </button>
        <button
          onClick={() => applyFormat("italic")}
          className="flex items-center px-2 py-1 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition"
          title="Italic"
        >
          <span className="material-symbols-outlined text-[20px]">
            format_italic
          </span>
        </button>
        <button
          onClick={() => applyFormat("underline")}
          className="flex items-center px-2 py-1 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition"
          title="Underline"
        >
          <span className="material-symbols-outlined text-[20px]">
            format_underlined
          </span>
        </button>
        <button
          onClick={() => applyFormat("insertHorizontalRule")}
          className="flex items-center px-2 py-1 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition"
          title="Horizontal Rule"
        >
          <span className="material-symbols-outlined text-[20px]">
            horizontal_rule
          </span>
        </button>
        <button
          onClick={() => applyFormat("createLink", prompt("Enter the URL:"))}
          className="flex items-center px-2 py-1 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition"
          title="Insert Link"
        >
          <span className="material-symbols-outlined text-[20px]">link</span>
        </button>
        <div className="relative shrink-0">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setTextColorOpen((isOpen) => !isOpen)}
            className="flex items-center gap-1 px-2 py-1 h-8.5 text-gray-900 text-xl font-bold rounded cursor-pointer hover:bg-gray-200 transition"
            title="Text Color"
            aria-label="Text Color"
            aria-expanded={textColorOpen}
          >
            A
          </button>
          {textColorOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 grid grid-cols-3 gap-1 p-2 w-28 bg-white border border-gray-300 rounded-md shadow-lg">
              {/* Reset / Default Text Color */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyTextColor("black")}
                className="w-6 h-6 rounded-full border border-black/10 hover:scale-110 transition-transform bg-black"
                title="Default Color"
                aria-label="Default Color"
              />
              {/* Color Palette */}
              {["Red", "Orange", "Yellow", "Green", "Blue", "Purple"].map(
                (color) => (
                  <button
                    key={color}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyTextColor(color)}
                    className="w-6 h-6 rounded-full border border-black/10 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={`Text Color ${color}`}
                    aria-label={`Text Color ${color}`}
                  />
                ),
              )}
            </div>
          )}
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setHighlightOpen((isOpen) => !isOpen)}
            className="flex items-center gap-1 px-2 py-1 h-8.5 text-gray-900 text-2xl rounded cursor-pointer hover:bg-gray-200 transition"
            title="Highlight Color"
            aria-label="Highlight Color"
            aria-expanded={highlightOpen}
          >
            🖌
          </button>
          {highlightOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 grid grid-cols-3 gap-1 p-2 w-28 bg-white border border-gray-300 rounded-md shadow-lg">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyHighlight("transparent")}
                className="w-6 h-6 rounded-full border border-black/10 hover:scale-110 transition-transform "
              >
                ⃠
              </button>
              {["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa"].map(
                (color) => (
                  <button
                    key={color}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHighlight(color)}
                    className="w-6 h-6 rounded-full border border-black/10 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={`Highlight ${color}`}
                    aria-label={`Highlight ${color}`}
                  />
                ),
              )}
            </div>
          )}
        </div>
        {/* Image Upload Button */}
        <label
          onMouseDown={saveSelection}
          className="flex items-center px-2 py-1 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition"
          title="Insert Image"
        >
          <span className="material-symbols-outlined text-[20px]">image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageInsert}
          />
        </label>

        <button
          onClick={() => handleAIAssistant(prompt("How may i help you?"))}
          className="flex items-center px-2 py-1 text-gray-700 rounded cursor-pointer hover:bg-gray-200 transition"
          title="AI Suggestions"
        >
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={syncContent}
        onKeyDown={handleKeyDown}
        className="rich-text-editor min-h-75 p-4 focus:outline-none prose max-w-none"
        placeholder="Start typing here..."
      />
    </div>
  );
};

export default MarkdownEditor;
