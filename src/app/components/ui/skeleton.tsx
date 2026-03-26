import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl", className)}
      {...props}
    />
  );
}

export { Skeleton };
