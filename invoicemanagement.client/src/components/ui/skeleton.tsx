import { cn } from "../../lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-700", className)}
      {...props}
    />
  )
}

// Skeleton variants for different components
const SkeletonVariants = {
  // Card skeleton
  card: "h-32 w-full",
  cardContent: "h-24 w-full",
  
  // Table skeleton
  tableRow: "h-16 w-full",
  tableCell: "h-4 w-full",
  
  // List skeleton
  listItem: "h-20 w-full",
  
  // Text skeleton
  text: "h-4 w-full",
  textSm: "h-3 w-3/4",
  textLg: "h-6 w-2/3",
  textXl: "h-8 w-1/2",
  
  // Avatar skeleton
  avatar: "h-8 w-8 rounded-full",
  avatarLg: "h-12 w-12 rounded-full",
  
  // Button skeleton
  button: "h-10 w-24",
  buttonSm: "h-8 w-16",
  buttonLg: "h-12 w-32",
  
  // Badge skeleton
  badge: "h-6 w-16 rounded-full",
  
  // Dashboard card skeleton
  dashboardCard: "h-32 w-full",
  
  // Project card skeleton
  projectCard: "h-48 w-full",
}

// Predefined skeleton components
export const SkeletonCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="space-y-3 p-6">
    <Skeleton className={cn(SkeletonVariants.textLg, className)} {...props} />
    <Skeleton className={cn(SkeletonVariants.text, className)} {...props} />
    <Skeleton className={cn(SkeletonVariants.textSm, className)} {...props} />
  </div>
)

export const SkeletonTableRow = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="flex items-center space-x-4 p-4">
    <Skeleton className={cn(SkeletonVariants.avatar, className)} {...props} />
    <div className="space-y-2 flex-1">
      <Skeleton className={cn(SkeletonVariants.text, className)} {...props} />
      <Skeleton className={cn(SkeletonVariants.textSm, className)} {...props} />
    </div>
    <Skeleton className={cn(SkeletonVariants.badge, className)} {...props} />
    <div className="flex space-x-2">
      <Skeleton className={cn(SkeletonVariants.buttonSm, className)} {...props} />
      <Skeleton className={cn(SkeletonVariants.buttonSm, className)} {...props} />
    </div>
  </div>
)

export const SkeletonDashboardCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="p-6">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <Skeleton className={cn(SkeletonVariants.textSm, className)} {...props} />
        <Skeleton className={cn(SkeletonVariants.textXl, className)} {...props} />
        <Skeleton className={cn(SkeletonVariants.textSm, className)} {...props} />
      </div>
      <Skeleton className={cn("h-12 w-12 rounded-lg", className)} {...props} />
    </div>
  </div>
)

export const SkeletonProjectCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className="p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <Skeleton className={cn(SkeletonVariants.textLg, className)} {...props} />
        <Skeleton className={cn(SkeletonVariants.textSm, className)} {...props} />
      </div>
      <Skeleton className={cn(SkeletonVariants.badge, className)} {...props} />
    </div>
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Skeleton className={cn("h-4 w-4", className)} {...props} />
        <Skeleton className={cn(SkeletonVariants.textSm, className)} {...props} />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className={cn("h-4 w-4", className)} {...props} />
        <Skeleton className={cn(SkeletonVariants.textSm, className)} {...props} />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className={cn("h-4 w-4", className)} {...props} />
        <Skeleton className={cn(SkeletonVariants.textSm, className)} {...props} />
      </div>
    </div>
    <div className="flex justify-end">
      <Skeleton className={cn(SkeletonVariants.button, className)} {...props} />
    </div>
  </div>
)

export const SkeletonList = ({ 
  count = 5, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonTableRow key={i} className={className} {...props} />
    ))}
  </div>
)

export const SkeletonGrid = ({ 
  count = 6, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonProjectCard key={i} className={className} {...props} />
    ))}
  </div>
)

export { Skeleton, SkeletonVariants }
