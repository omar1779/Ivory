"use client";

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection, 
  $createParagraphNode,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
} from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createQuoteNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { $setBlocksType } from '@lexical/selection';
import { useCallback, useEffect, useState } from 'react';
import { 
  Heading1, 
  Heading2, 
  Heading3, 
  Quote, 
  Code, 
  List, 
  ListOrdered,
  Type,
} from 'lucide-react';

interface SlashCommand {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  onSelect: () => void;
}

export default function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const commands: SlashCommand[] = [
    {
      key: 'paragraph',
      label: 'Text',
      description: 'Just start writing with plain text.',
      icon: <Type size={16} />,
      keywords: ['text', 'paragraph', 'p'],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createParagraphNode());
          }
        });
      }
    },
    {
      key: 'h1',
      label: 'Heading 1',
      description: 'Big section heading.',
      icon: <Heading1 size={16} />,
      keywords: ['heading', 'h1', 'title', 'big'],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h1'));
          }
        });
      }
    },
    {
      key: 'h2',
      label: 'Heading 2',
      description: 'Medium section heading.',
      icon: <Heading2 size={16} />,
      keywords: ['heading', 'h2', 'subtitle'],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h2'));
          }
        });
      }
    },
    {
      key: 'h3',
      label: 'Heading 3',
      description: 'Small section heading.',
      icon: <Heading3 size={16} />,
      keywords: ['heading', 'h3', 'subheading'],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createHeadingNode('h3'));
          }
        });
      }
    },
    {
      key: 'quote',
      label: 'Quote',
      description: 'Capture a quote.',
      icon: <Quote size={16} />,
      keywords: ['quote', 'blockquote', 'citation'],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createQuoteNode());
          }
        });
      }
    },
    {
      key: 'code',
      label: 'Code',
      description: 'Capture a code snippet.',
      icon: <Code size={16} />,
      keywords: ['code', 'codeblock', 'snippet'],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createCodeNode());
          }
        });
      }
    },
    {
      key: 'bullet',
      label: 'Bulleted list',
      description: 'Create a simple bulleted list.',
      icon: <List size={16} />,
      keywords: ['list', 'bullet', 'unordered'],
      onSelect: () => {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      }
    },
    {
      key: 'number',
      label: 'Numbered list',
      description: 'Create a list with numbering.',
      icon: <ListOrdered size={16} />,
      keywords: ['list', 'number', 'numbered', 'ordered'],
      onSelect: () => {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      }
    }
  ];

  const filteredCommands = commands.filter(command =>
    command.keywords.some(keyword => 
      keyword.toLowerCase().includes(searchTerm.toLowerCase())
    ) || command.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return false;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return true;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return true;
      case 'Enter':
      case 'Tab':
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].onSelect();
          setIsOpen(false);
          setSearchTerm('');
          setSelectedIndex(0);
        }
        return true;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setSelectedIndex(0);
        return true;
      default:
        return false;
    }
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => event ? handleKeyDown(event) : false,
      COMMAND_PRIORITY_LOW
    );
  }, [editor, handleKeyDown]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => event ? handleKeyDown(event) : false,
      COMMAND_PRIORITY_LOW
    );
  }, [editor, handleKeyDown]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => event ? handleKeyDown(event) : false,
      COMMAND_PRIORITY_LOW
    );
  }, [editor, handleKeyDown]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => event ? handleKeyDown(event) : false,
      COMMAND_PRIORITY_LOW
    );
  }, [editor, handleKeyDown]);

  useEffect(() => {
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      (event) => event ? handleKeyDown(event) : false,
      COMMAND_PRIORITY_LOW
    );
  }, [editor, handleKeyDown]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const text = anchorNode.getTextContent();
          
          // Check if we should show slash menu
          const slashIndex = text.lastIndexOf('/');
          if (slashIndex !== -1 && slashIndex === text.length - 1) {
            // Just typed a slash at the end
            setIsOpen(true);
            setSearchTerm('');
            setSelectedIndex(0);
            
            // Get cursor position for menu placement
            const domSelection = window.getSelection();
            if (domSelection && domSelection.rangeCount > 0) {
              const range = domSelection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              setPosition({ x: rect.left, y: rect.bottom + 5 });
            }
          } else if (slashIndex !== -1 && slashIndex < text.length - 1) {
            // Typing after slash
            const searchText = text.substring(slashIndex + 1);
            setSearchTerm(searchText);
            setSelectedIndex(0);
          } else if (isOpen && !text.includes('/')) {
            // No slash found, close menu
            setIsOpen(false);
            setSearchTerm('');
            setSelectedIndex(0);
          }
        }
      });
    });
  }, [editor, isOpen]);

  if (!isOpen || filteredCommands.length === 0) {
    return null;
  }

  return (
    <div 
      className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-72 overflow-y-auto z-50 min-w-[250px] max-w-[90vw] md:min-w-[280px]"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000,
      }}
    >
      <div className="p-1">
        {filteredCommands.map((command, index) => (
          <div
            key={command.key}
            className={`flex items-center p-2 md:p-3 rounded-md cursor-pointer transition-colors duration-150 gap-2 md:gap-3 ${
              index === selectedIndex 
                ? 'bg-slate-700' 
                : 'hover:bg-slate-700'
            }`}
            onClick={() => {
              command.onSelect();
              setIsOpen(false);
              setSearchTerm('');
              setSelectedIndex(0);
            }}
          >
            <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 bg-slate-600 rounded-md text-slate-200 flex-shrink-0">
              {command.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 mb-0.5">{command.label}</div>
              <div className="text-xs text-slate-400 line-clamp-2">{command.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
