"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useState, useRef } from 'react';
import { 
  Undo, 
  Redo, 
  Bold, 
  Italic, 
  Underline, 
  Quote, 
  List, 
  ListOrdered
} from 'lucide-react';
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import {
  $setBlocksType,
} from "@lexical/selection";

const LowPriority = 1;

const blockTypeToBlockName = {
  bullet: 'Bullet List',
  check: 'Check List', 
  code: 'Code Block',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  number: 'Numbered List',
  paragraph: 'Normal',
  quote: 'Quote',
};

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text formatting states
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      
      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const listType = 'getListType' in element && typeof element.getListType === 'function' ? element.getListType() : 'bullet';
          setBlockType(listType === 'number' ? 'number' : 'bullet');
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as string);
          } else {
            setBlockType('paragraph');
          }
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        $updateToolbar();
      });
    });
  }, [editor, $updateToolbar]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        $updateToolbar();
        return false;
      },
      LowPriority
    );
  }, [editor, $updateToolbar]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      LowPriority
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      LowPriority
    );
  }, [editor]);

  // Formatting functions
  const formatText = useCallback((format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  }, [editor]);

  const formatHeading = useCallback((headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  }, [blockType, editor]);

  const formatQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (blockType === 'quote') {
          // Si ya es quote, convertir a párrafo normal
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          // Si no es quote, convertir a quote
          $setBlocksType(selection, () => $createQuoteNode());
        }
      }
    });
  }, [blockType, editor]);

  const formatParagraph = useCallback(() => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  }, [blockType, editor]);

  const formatBulletList = useCallback(() => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  }, [blockType, editor]);

  const formatNumberedList = useCallback(() => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  }, [blockType, editor]);

  return (
    <div className="flex items-center gap-1 md:gap-2 p-2 md:p-3 bg-slate-800 border-b border-slate-700 text-slate-200" ref={toolbarRef}>
      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          disabled={!canUndo}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          className={`flex items-center justify-center p-1.5 md:p-2 transition-all duration-150 min-w-[28px] min-h-[28px] md:min-w-[32px] md:min-h-[32px] ${!canUndo ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
          aria-label="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          disabled={!canRedo}
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          className={`flex items-center justify-center p-1.5 md:p-2 transition-all duration-150 min-w-[28px] min-h-[28px] md:min-w-[32px] md:min-h-[32px] ${!canRedo ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
          aria-label="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-slate-600 mx-1" />

      {/* Block Type Selector */}
      <div className="flex items-center">
        <select 
          className="bg-slate-700 border border-slate-600 rounded-md text-slate-200 px-2 py-1 text-xs md:px-3 md:py-1.5 md:text-sm cursor-pointer outline-none transition-all duration-150 hover:bg-slate-600 hover:border-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-w-[90px] max-w-[120px] md:min-w-[120px] md:max-w-none"
          value={blockType}
          onChange={(e) => {
            const value = e.target.value;
            switch (value) {
              case 'paragraph':
                formatParagraph();
                break;
              case 'h1':
                formatHeading('h1');
                break;
              case 'h2':
                formatHeading('h2');
                break;
              case 'h3':
                formatHeading('h3');
                break;
              case 'quote':
                formatQuote();
                break;
              case 'bullet':
                formatBulletList();
                break;
              case 'number':
                formatNumberedList();
                break;
            }
          }}
        >
          <option value="paragraph" className="bg-slate-800 text-slate-200">Normal</option>
          <option value="h1" className="bg-slate-800 text-slate-200">Heading 1</option>
          <option value="h2" className="bg-slate-800 text-slate-200">Heading 2</option>
          <option value="h3" className="bg-slate-800 text-slate-200">Heading 3</option>
          <option value="quote" className="bg-slate-800 text-slate-200">Quote</option>
          <option value="bullet" className="bg-slate-800 text-slate-200">Bullet List</option>
          <option value="number" className="bg-slate-800 text-slate-200">Numbered List</option>
        </select>
      </div>

      <div className="w-px h-6 bg-slate-600 mx-1" />

      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => formatText('bold')}
          className={`flex items-center justify-center p-1.5 md:p-2 rounded-md transition-all duration-150 min-w-[28px] min-h-[28px] md:min-w-[32px] md:min-h-[32px] ${
            isBold 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          }`}
          aria-label="Bold"
        >
          <Bold size={14} className="md:w-4 md:h-4" />
        </button>
        <button
          onClick={() => formatText('italic')}
          className={`flex items-center justify-center p-1.5 md:p-2 rounded-md transition-all duration-150 min-w-[28px] min-h-[28px] md:min-w-[32px] md:min-h-[32px] ${
            isItalic 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          }`}
          aria-label="Italic"
        >
          <Italic size={14} className="md:w-4 md:h-4" />
        </button>
        <button
          onClick={() => formatText('underline')}
          className={`flex items-center justify-center p-1.5 md:p-2 rounded-md transition-all duration-150 min-w-[28px] min-h-[28px] md:min-w-[32px] md:min-h-[32px] ${
            isUnderline 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          }`}
          aria-label="Underline"
        >
          <Underline size={14} className="md:w-4 md:h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-slate-600 mx-1" />

      {/* Quick Block Types */}
      <div className="flex items-center gap-1">
        <button
          onClick={formatQuote}
          className={`flex items-center justify-center p-1.5 md:p-2 rounded-md transition-all duration-150 min-w-[28px] min-h-[28px] md:min-w-[32px] md:min-h-[32px] ${
            blockType === 'quote' 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          }`}
          aria-label="Quote"
        >
          <Quote size={14} className="md:w-4 md:h-4" />
        </button>
      </div>

      <div className="w-px h-6 bg-slate-600 mx-1" />

      {/* Lists */}
      <div className="flex items-center gap-1">
        <button
          onClick={formatBulletList}
          className={`flex items-center justify-center p-1.5 md:p-2 rounded-md transition-all duration-150 min-w-[28px] min-h-[28px] md:min-w-[32px] md:min-h-[32px] ${
            blockType === 'bullet' 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          }`}
          aria-label="Bullet List"
        >
          <List size={14} className="md:w-4 md:h-4" />
        </button>
        <button
          onClick={formatNumberedList}
          className={`flex items-center justify-center p-1.5 md:p-2 rounded-md transition-all duration-150 min-w-[28px] min-h-[28px] md:min-w-[32px] md:min-h-[32px] ${
            blockType === 'number' 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
          }`}
          aria-label="Numbered List"
        >
          <ListOrdered size={14} className="md:w-4 md:h-4" />
        </button>
      </div>
    </div>
  );
}
