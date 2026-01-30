import { forwardRef, useCallback } from "react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Tiptap UI ---
import type { UseHorizontalRuleConfig } from "@/components/tiptap-ui/horizontal-rule-button"
import { useHorizontalRule } from "@/components/tiptap-ui/horizontal-rule-button"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"

type IconProps = React.SVGProps<SVGSVGElement>
type IconComponent = ({ className, ...props }: IconProps) => React.ReactElement

export interface HorizontalRuleButtonProps
  extends Omit<ButtonProps, "type">,
    UseHorizontalRuleConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
  /**
   * Optional custom icon component to render instead of the default.
   */
  icon?: React.MemoExoticComponent<IconComponent> | React.FC<IconProps>
}

/**
 * Button component for inserting horizontal rules in a Tiptap editor.
 */
export const HorizontalRuleButton = forwardRef<
  HTMLButtonElement,
  HorizontalRuleButtonProps
>(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      onInserted,
      onClick,
      icon: CustomIcon,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const { isVisible, canInsert, handleInsert, label, Icon } =
      useHorizontalRule({
        editor,
        hideWhenUnavailable,
        onInserted,
      })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleInsert()
      },
      [handleInsert, onClick]
    )

    if (!isVisible) {
      return null
    }

    const RenderIcon = CustomIcon ?? Icon

    return (
      <Button
        type="button"
        data-style="ghost"
        role="button"
        tabIndex={-1}
        disabled={!canInsert}
        data-disabled={!canInsert}
        aria-label={label}
        tooltip={label}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <RenderIcon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
          </>
        )}
      </Button>
    )
  }
)

HorizontalRuleButton.displayName = "HorizontalRuleButton"
