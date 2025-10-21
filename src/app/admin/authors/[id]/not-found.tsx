import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircleIcon } from "lucide-react";

export default function AuthorNotFound() {
  return (
    <div className="container max-w-2xl py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="size-6 text-destructive" />
            <CardTitle>Author Not Found</CardTitle>
          </div>
          <CardDescription>
            The author you're looking for doesn't exist or may have been
            deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/admin/authors">Back to Authors</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

