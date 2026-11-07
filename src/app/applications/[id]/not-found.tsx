import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function ApplicationNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <SearchX className="text-muted-foreground size-8" aria-hidden />
      <h1 className="text-lg font-semibold">Ansökan hittades inte</h1>
      <p className="text-muted-foreground text-sm">Den kan ha tagits bort.</p>
      <Link href="/applications" className={buttonVariants({ variant: "outline" })}>
        Till alla ansökningar
      </Link>
    </div>
  );
}
