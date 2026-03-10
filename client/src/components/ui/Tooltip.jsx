import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export function Tooltip({ children, content, side = "top" }) {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            style={{
              background: "var(--bg-overlay)",
              border: "1px solid var(--border-default)",
              borderRadius: "8px",
              padding: "6px 10px",
              fontSize: "12px",
              color: "var(--text-secondary)",
              boxShadow: "var(--shadow-md)",
              fontFamily: "var(--font-body)",
              zIndex: 9999,
            }}
          >
            {content}
            <TooltipPrimitive.Arrow
              style={{ fill: "var(--border-default)" }}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
