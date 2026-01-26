import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ArticleCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 rounded-none" />
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full mt-1" />
        <Skeleton className="h-4 w-2/3 mt-1" />
      </CardContent>
      <CardFooter className="px-4 py-3 border-t">
        <Skeleton className="h-4 w-24" />
      </CardFooter>
    </Card>
  );
}
