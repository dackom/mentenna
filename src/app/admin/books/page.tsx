import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export default function BooksPage() {
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Books</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage books
          </p>
        </div>
        <Link href="/admin/books/new">
          <Button>
            <PlusIcon />
            Generate Book
          </Button>
        </Link>
      </div>
    </div>
  );
}
