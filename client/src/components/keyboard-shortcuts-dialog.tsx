import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Tools",
    shortcuts: [
      { keys: ["V"], description: "Select tool" },
      { keys: ["H"], description: "Pan tool" },
      { keys: ["R"], description: "Measure tool" },
      { keys: ["Esc"], description: "Deselect / Cancel" },
    ],
  },
  {
    title: "Editing",
    shortcuts: [
      { keys: ["Ctrl", "Z"], description: "Undo" },
      { keys: ["Ctrl", "Y"], description: "Redo" },
      { keys: ["Del"], description: "Delete selected" },
      { keys: ["Shift", "Click"], description: "Add vertex to polygon" },
    ],
  },
  {
    title: "View",
    shortcuts: [
      { keys: ["Ctrl", "+"], description: "Zoom in" },
      { keys: ["Ctrl", "-"], description: "Zoom out" },
      { keys: ["Ctrl", "0"], description: "Fit to screen" },
      { keys: ["Space", "Drag"], description: "Pan view" },
      { keys: ["Ctrl", "L"], description: "Toggle right panel" },
    ],
  },
  {
    title: "Selection",
    shortcuts: [
      { keys: ["Ctrl", "A"], description: "Select all" },
      { keys: ["Ctrl", "Click"], description: "Multi-select vertices" },
      { keys: ["Shift", "Drag"], description: "Box select vertices" },
    ],
  },
  {
    title: "Help",
    shortcuts: [
      { keys: ["?"], description: "Show this dialog" },
    ],
  },
];

interface KeyboardShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Handle keyboard shortcut to open dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Open on "?" key (Shift + /)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync with external control
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h3 className="font-semibold text-sm text-foreground border-b pb-2">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="text-muted-foreground flex-1">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center">
                          <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded shadow-sm">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">?</kbd> anytime to show this dialog
            </p>
            <Button onClick={() => handleOpenChange(false)}>
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export a trigger button component
export function KeyboardShortcutsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Keyboard className="w-4 h-4" />
        Shortcuts
      </Button>
      <KeyboardShortcutsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
