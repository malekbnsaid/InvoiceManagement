import * as React from "react"
import type { ReactNode, ForwardedRef } from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "../../lib/utils"

const Tabs = TabsPrimitive.Root

type TabsListProps = {
  className?: string;
  children?: ReactNode;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  function TabsList({ className, children, ...props }: TabsListProps, ref: ForwardedRef<HTMLDivElement>) {
    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
    )
  }
)
TabsList.displayName = TabsPrimitive.List.displayName

type TabsTriggerProps = {
  className?: string;
  children?: ReactNode;
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  function TabsTrigger({ className, children, ...props }: TabsTriggerProps, ref: ForwardedRef<HTMLButtonElement>) {
    return (
      <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.Trigger>
    )
  }
)
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

type TabsContentProps = {
  className?: string;
  children?: ReactNode;
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  function TabsContent({ className, children, ...props }: TabsContentProps, ref: ForwardedRef<HTMLDivElement>) {
    return (
      <TabsPrimitive.Content
        ref={ref}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.Content>
    )
  }
)
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent } 