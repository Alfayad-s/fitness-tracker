"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  BrainCog,
  FileText,
  FolderCode,
  Globe,
  Mic,
  Paperclip,
  Square,
  StopCircle,
  X,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export type PromptBoxTheme = "dark" | "light";

const promptBoxThemes = {
  dark: {
    textarea:
      "text-gray-100 placeholder:text-gray-400",
    tooltip:
      "border-[#333333] bg-[#1F2023] text-white",
    dialogContent: "border-[#333333] bg-[#1F2023]",
    dialogClose: "bg-[#2E3033]/80 hover:bg-[#2E3033]",
    dialogCloseIcon: "text-gray-200 hover:text-white",
    dialogTitle: "text-gray-100",
    buttonDefault: "bg-white text-black hover:bg-white/80",
    buttonOutline: "border-[#444444] hover:bg-[#3A3A40]",
    buttonGhost: "hover:bg-[#3A3A40]",
    voiceTime: "text-white/80",
    voiceBar: "bg-white/50",
    imageDialogBg: "bg-[#1F2023]",
    promptShell:
      "border-[#444444] bg-[#1F2023] shadow-[0_8px_30px_rgba(0,0,0,0.24)]",
    iconMuted: "text-[#9CA3AF] hover:text-[#D1D5DB]",
    iconHoverBg: "hover:bg-gray-600/30",
    sendBtnFilled: "bg-white text-[#1F2023] hover:bg-white/80",
    sendBtnEmpty:
      "bg-transparent text-[#9CA3AF] hover:bg-gray-600/30 hover:text-[#D1D5DB]",
    sendIconOnFilled: "fill-[#1F2023] text-[#1F2023]",
    sendIconMic: "text-[#1F2023]",
    modeInactive: "text-[#9CA3AF] hover:text-[#D1D5DB]",
  },
  light: {
    textarea:
      "text-neutral-900 placeholder:text-neutral-400",
    tooltip:
      "border-neutral-200 bg-white text-neutral-900 shadow-md",
    dialogContent: "border-neutral-200 bg-white",
    dialogClose: "bg-neutral-100 hover:bg-neutral-200",
    dialogCloseIcon: "text-neutral-600 hover:text-neutral-900",
    dialogTitle: "text-neutral-900",
    buttonDefault: "bg-neutral-900 text-white hover:bg-neutral-800",
    buttonOutline: "border-neutral-300 hover:bg-neutral-100",
    buttonGhost: "hover:bg-neutral-100",
    voiceTime: "text-neutral-600",
    voiceBar: "bg-neutral-400/60",
    imageDialogBg: "bg-white",
    promptShell:
      "border-neutral-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]",
    iconMuted: "text-neutral-500 hover:text-neutral-700",
    iconHoverBg: "hover:bg-neutral-100",
    sendBtnFilled: "bg-neutral-900 text-white hover:bg-neutral-800",
    sendBtnEmpty:
      "bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700",
    sendIconOnFilled: "fill-white text-white",
    sendIconMic: "text-neutral-600",
    modeInactive: "text-neutral-500 hover:text-neutral-700",
  },
} as const;

const PromptBoxThemeContext = React.createContext<PromptBoxTheme>("dark");

function usePromptBoxTheme() {
  return promptBoxThemes[React.useContext(PromptBoxThemeContext)];
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const theme = usePromptBoxTheme();
    return (
      <textarea
        className={cn(
          "flex min-h-[44px] w-full resize-none rounded-md border-none bg-transparent px-3 py-2.5 text-base focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
          theme.textarea,
          className,
        )}
        ref={ref}
        rows={1}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => {
  const theme = usePromptBoxTheme();
  return (
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        theme.tooltip,
        className,
      )}
      {...props}
    />
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const theme = usePromptBoxTheme();
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[90vw] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border p-0 shadow-xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 md:max-w-[800px]",
          theme.dialogContent,
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            "absolute right-4 top-4 z-10 rounded-full p-2 transition-all",
            theme.dialogClose,
          )}
        >
          <X className={cn("h-5 w-5", theme.dialogCloseIcon)} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  const theme = usePromptBoxTheme();
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        theme.dialogTitle,
        className,
      )}
      {...props}
    />
  );
});
DialogTitle.displayName = DialogPrimitive.Title.displayName;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const theme = usePromptBoxTheme();
    const variantClasses = {
      default: theme.buttonDefault,
      outline: cn("border bg-transparent", theme.buttonOutline),
      ghost: cn("bg-transparent", theme.buttonGhost),
    };
    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6",
      icon: "aspect-[1/1] h-8 w-8 rounded-full",
    };
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

interface VoiceRecorderProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: (duration: number) => void;
  visualizerBars?: number;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isRecording,
  onStartRecording,
  onStopRecording,
  visualizerBars = 32,
}) => {
  const theme = usePromptBoxTheme();
  const [time, setTime] = React.useState(0);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (isRecording) {
      onStartRecording();
      timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onStopRecording(time);
      setTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, time, onStartRecording, onStopRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center py-3 transition-all duration-300",
        isRecording ? "opacity-100" : "h-0 opacity-0",
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <span className={cn("font-mono text-sm", theme.voiceTime)}>
          {formatTime(time)}
        </span>
      </div>
      <div className="flex h-10 w-full items-center justify-center gap-0.5 px-4">
        {[...Array(visualizerBars)].map((_, i) => (
          <div
            key={i}
            className={cn("w-0.5 animate-pulse rounded-full", theme.voiceBar)}
            style={{
              height: `${Math.max(15, Math.random() * 100)}%`,
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface ImageViewDialogProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageViewDialog: React.FC<ImageViewDialogProps> = ({ imageUrl, onClose }) => {
  const theme = usePromptBoxTheme();
  if (!imageUrl) return null;
  return (
    <Dialog open={!!imageUrl} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] border-none bg-transparent p-0 shadow-none md:max-w-[800px]">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn(
            "relative overflow-hidden rounded-2xl shadow-2xl",
            theme.imageDialogBg,
          )}
        >
          <img
            src={imageUrl}
            alt="Full preview"
            className="max-h-[80vh] w-full rounded-2xl object-contain"
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

interface PromptInputContextType {
  isLoading: boolean;
  value: string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
}

const PromptInputContext = React.createContext<PromptInputContextType>({
  isLoading: false,
  value: "",
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
});

function usePromptInput() {
  const context = React.useContext(PromptInputContext);
  if (!context) throw new Error("usePromptInput must be used within a PromptInput");
  return context;
}

interface PromptInputProps {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const PromptInput = React.forwardRef<HTMLDivElement, PromptInputProps>(
  (
    {
      className,
      isLoading = false,
      maxHeight = 240,
      value,
      onValueChange,
      onSubmit,
      children,
      disabled = false,
      onDragOver,
      onDragLeave,
      onDrop,
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(value || "");
    const handleChange = (newValue: string) => {
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };
    return (
      <TooltipProvider>
        <PromptInputContext.Provider
          value={{
            isLoading,
            value: value ?? internalValue,
            setValue: onValueChange ?? handleChange,
            maxHeight,
            onSubmit,
            disabled,
          }}
        >
          <div
            ref={ref}
            className={cn(
              "rounded-3xl border p-2 transition-all duration-300",
              isLoading && "border-red-500/70",
              className,
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            {children}
          </div>
        </PromptInputContext.Provider>
      </TooltipProvider>
    );
  },
);
PromptInput.displayName = "PromptInput";

interface PromptInputTextareaProps {
  disableAutosize?: boolean;
  placeholder?: string;
}

const PromptInputTextarea: React.FC<
  PromptInputTextareaProps & React.ComponentProps<typeof Textarea>
> = ({ className, onKeyDown, disableAutosize = false, placeholder, ...props }) => {
  const { value, setValue, maxHeight, onSubmit, disabled } = usePromptInput();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (disableAutosize || !textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      typeof maxHeight === "number"
        ? `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        : `min(${textareaRef.current.scrollHeight}px, ${maxHeight})`;
  }, [value, maxHeight, disableAutosize]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn("text-base", className)}
      disabled={disabled}
      placeholder={placeholder}
      {...props}
    />
  );
};

const PromptInputActions: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={cn("flex items-center gap-2", className)} {...props}>
    {children}
  </div>
);

interface PromptInputActionProps extends React.ComponentProps<typeof Tooltip> {
  tooltip: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const PromptInputAction: React.FC<PromptInputActionProps> = ({
  tooltip,
  children,
  className,
  side = "top",
  ...props
}) => {
  const { disabled } = usePromptInput();
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild disabled={disabled}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

const CustomDivider: React.FC = () => (
  <div className="relative mx-1 h-6 w-[1.5px]">
    <div
      className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-[#9b87f5]/70 to-transparent"
      style={{
        clipPath:
          "polygon(0% 0%, 100% 0%, 100% 40%, 140% 50%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, -40% 50%, 0% 40%)",
      }}
    />
  </div>
);

interface ModeToggleButtonProps {
  active: boolean;
  onClick: () => void;
  activeClass: string;
  icon: React.ReactNode;
  label: string;
}

const ModeToggleButton: React.FC<ModeToggleButtonProps> = ({
  active,
  onClick,
  activeClass,
  icon,
  label,
}) => {
  const theme = usePromptBoxTheme();
  return (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex h-8 items-center gap-1 rounded-full border px-2 py-1 transition-all",
      active
        ? activeClass
        : cn("border-transparent bg-transparent", theme.modeInactive),
    )}
  >
    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
      <motion.div
        animate={{ rotate: active ? 360 : 0, scale: active ? 1.1 : 1 }}
        whileHover={{
          rotate: active ? 360 : 15,
          scale: 1.1,
          transition: { type: "spring", stiffness: 300, damping: 10 },
        }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
      >
        {icon}
      </motion.div>
    </div>
    <AnimatePresence>
      {active && (
        <motion.span
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 overflow-hidden whitespace-nowrap text-xs"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
  </button>
  );
};

export interface PromptInputBoxProps {
  onSend?: (message: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  theme?: PromptBoxTheme;
}

export const PromptInputBox = React.forwardRef<HTMLDivElement, PromptInputBoxProps>(
  (
    {
      onSend = () => {},
      isLoading = false,
      placeholder = "Type your message here...",
      className,
      theme = "dark",
    },
    ref,
  ) => {
    const themeStyles = promptBoxThemes[theme];
    const [input, setInput] = React.useState("");
    const [files, setFiles] = React.useState<File[]>([]);
    const [filePreviews, setFilePreviews] = React.useState<Record<string, string>>({});
    const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    const [isRecording, setIsRecording] = React.useState(false);
    const [showSearch, setShowSearch] = React.useState(false);
    const [showThink, setShowThink] = React.useState(false);
    const [showCanvas, setShowCanvas] = React.useState(false);
    const uploadInputRef = React.useRef<HTMLInputElement>(null);
    const promptBoxRef = React.useRef<HTMLDivElement>(null);

    const isImageFile = (file: File) => file.type.startsWith("image/");
    const isPdfFile = (file: File) => file.type === "application/pdf";
    const isBmaUploadFile = (file: File) => isImageFile(file) || isPdfFile(file);

    const processFile = React.useCallback((file: File) => {
      if (!isBmaUploadFile(file)) return;
      const maxSize = isPdfFile(file) ? 10 * 1024 * 1024 : 4 * 1024 * 1024;
      if (file.size > maxSize) return;
      setFiles([file]);
      if (isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = (e) =>
          setFilePreviews({ [file.name]: e.target?.result as string });
        reader.readAsDataURL(file);
      } else {
        setFilePreviews({});
      }
    }, []);

    const handleDragOver = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDragLeave = React.useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleDrop = React.useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const dropped = Array.from(e.dataTransfer.files);
        const uploadFiles = dropped.filter((file) => isBmaUploadFile(file));
        if (uploadFiles.length > 0) processFile(uploadFiles[0]);
      },
      [processFile],
    );

    const handleRemoveFile = (index: number) => {
      const fileToRemove = files[index];
      if (fileToRemove && filePreviews[fileToRemove.name]) setFilePreviews({});
      setFiles([]);
    };

    const handlePaste = React.useCallback(
      (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              processFile(file);
              break;
            }
          }
        }
      },
      [processFile],
    );

    React.useEffect(() => {
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }, [handlePaste]);

    const handleSubmit = () => {
      if (input.trim() || files.length > 0) {
        let messagePrefix = "";
        if (showSearch) messagePrefix = "[Search: ";
        else if (showThink) messagePrefix = "[Think: ";
        else if (showCanvas) messagePrefix = "[Canvas: ";
        const formattedInput = messagePrefix ? `${messagePrefix}${input}]` : input;
        onSend(formattedInput, files);
        setInput("");
        setFiles([]);
        setFilePreviews({});
      }
    };

    const handleStartRecording = () => undefined;

    const handleStopRecording = (duration: number) => {
      setIsRecording(false);
      onSend(`[Voice message - ${duration} seconds]`, []);
    };

    const hasContent = input.trim() !== "" || files.length > 0;

    const toggleSearch = () => {
      setShowSearch((prev) => !prev);
      setShowThink(false);
    };

    const toggleThink = () => {
      setShowThink((prev) => !prev);
      setShowSearch(false);
    };

    return (
      <PromptBoxThemeContext.Provider value={theme}>
        <PromptInput
          value={input}
          onValueChange={setInput}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          className={cn(
            "w-full transition-all duration-300 ease-in-out",
            themeStyles.promptShell,
            isRecording && "border-red-500/70",
            className,
          )}
          disabled={isLoading || isRecording}
          ref={ref ?? promptBoxRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {files.length > 0 && !isRecording && (
            <div className="flex flex-wrap gap-2 p-0 pb-1 transition-all duration-300">
              {files.map((file, index) => (
                <div key={index} className="group relative">
                  {file.type.startsWith("image/") && filePreviews[file.name] ? (
                    <div
                      className="h-16 w-16 cursor-pointer overflow-hidden rounded-xl transition-all duration-300"
                      onClick={() => setSelectedImage(filePreviews[file.name])}
                    >
                      <img
                        src={filePreviews[file.name]}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}
                        className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : isPdfFile(file) ? (
                    <div className="flex max-w-[200px] items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                      <FileText className="size-5 shrink-0 text-neutral-600" />
                      <span className="truncate text-xs text-neutral-700">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="shrink-0 rounded-full p-0.5 hover:bg-neutral-200"
                        aria-label="Remove file"
                      >
                        <X className="h-3 w-3 text-neutral-600" />
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <div
            className={cn(
              "transition-all duration-300",
              isRecording ? "h-0 overflow-hidden opacity-0" : "opacity-100",
            )}
          >
            <PromptInputTextarea
              placeholder={
                showSearch
                  ? "Search the web..."
                  : showThink
                    ? "Think deeply..."
                    : showCanvas
                      ? "Create on canvas..."
                      : placeholder
              }
              className="text-base"
            />
          </div>

          {isRecording && (
            <VoiceRecorder
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
            />
          )}

          <PromptInputActions className="flex items-center justify-between gap-2 p-0 pt-2">
            <div
              className={cn(
                "flex items-center gap-1 transition-opacity duration-300",
                isRecording ? "invisible h-0 opacity-0" : "visible opacity-100",
              )}
            >
              <PromptInputAction tooltip="Upload BMA report (image or PDF)">
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className={cn(
                    "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors",
                    themeStyles.iconMuted,
                    themeStyles.iconHoverBg,
                  )}
                  disabled={isRecording}
                >
                  <Paperclip className="h-5 w-5 transition-colors" />
                  <input
                    ref={uploadInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        processFile(e.target.files[0]);
                      }
                      if (e.target) e.target.value = "";
                    }}
                    accept="image/*,application/pdf"
                  />
                </button>
              </PromptInputAction>

              <div className="flex items-center">
                <ModeToggleButton
                  active={showSearch}
                  onClick={toggleSearch}
                  activeClass="border-[#1EAEDB] bg-[#1EAEDB]/15 text-[#1EAEDB]"
                  icon={
                    <Globe
                      className={cn("h-4 w-4", showSearch ? "text-[#1EAEDB]" : "text-inherit")}
                    />
                  }
                  label="Search"
                />
                <CustomDivider />
                <ModeToggleButton
                  active={showThink}
                  onClick={toggleThink}
                  activeClass="border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#8B5CF6]"
                  icon={
                    <BrainCog
                      className={cn("h-4 w-4", showThink ? "text-[#8B5CF6]" : "text-inherit")}
                    />
                  }
                  label="Think"
                />
                <CustomDivider />
                <ModeToggleButton
                  active={showCanvas}
                  onClick={() => setShowCanvas((prev) => !prev)}
                  activeClass="border-[#F97316] bg-[#F97316]/15 text-[#F97316]"
                  icon={
                    <FolderCode
                      className={cn(
                        "h-4 w-4",
                        showCanvas ? "text-[#F97316]" : "text-inherit",
                      )}
                    />
                  }
                  label="Canvas"
                />
              </div>
            </div>

            <PromptInputAction
              tooltip={
                isLoading
                  ? "Stop generation"
                  : isRecording
                    ? "Stop recording"
                    : hasContent
                      ? "Send message"
                      : "Voice message"
              }
            >
              <Button
                variant="default"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all duration-200",
                  isRecording
                    ? cn(
                        "bg-transparent text-red-500 hover:text-red-400",
                        themeStyles.iconHoverBg,
                      )
                    : hasContent
                      ? themeStyles.sendBtnFilled
                      : themeStyles.sendBtnEmpty,
                )}
                onClick={() => {
                  if (isRecording) setIsRecording(false);
                  else if (hasContent) handleSubmit();
                  else setIsRecording(true);
                }}
                disabled={isLoading && !hasContent}
              >
                {isLoading ? (
                  <Square
                    className={cn(
                      "h-4 w-4 animate-pulse",
                      themeStyles.sendIconOnFilled,
                    )}
                  />
                ) : isRecording ? (
                  <StopCircle className="h-5 w-5 text-red-500" />
                ) : hasContent ? (
                  <ArrowUp
                    className={cn("h-4 w-4", themeStyles.sendIconOnFilled)}
                  />
                ) : (
                  <Mic
                    className={cn(
                      "h-5 w-5 transition-colors",
                      themeStyles.sendIconMic,
                    )}
                  />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>

        <ImageViewDialog
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      </PromptBoxThemeContext.Provider>
    );
  },
);
PromptInputBox.displayName = "PromptInputBox";
