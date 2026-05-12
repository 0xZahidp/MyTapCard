import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type PasswordFieldProps = React.ComponentProps<typeof Input> & {
  containerClassName?: string;
};

export function PasswordField({ className, containerClassName, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className={cn("relative", containerClassName)}>
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-11", className)} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
