import { Toaster as Sonner } from "sonner"

// Notely is dark-only, so the theme is fixed instead of read from next-themes
const Toaster = ({
  ...props
}) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          // Important: Sonner's injected [data-button] styles otherwise win on specificity
          actionButton:
            "!bg-primary !text-primary-foreground !font-semibold hover:!bg-primary/90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster }
