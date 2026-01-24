"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, FileText, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const pathname = usePathname();

  // Extract project slug from pathname if on a project page
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/);
  const projectSlug = projectMatch?.[1];

  const isProjectPage = !!projectSlug;
  const isDashboard = pathname === "/dashboard" || pathname === "/dashboard/new";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t pb-safe md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center min-h-[44px] flex-1 gap-1 text-xs",
            isDashboard ? "text-primary" : "text-muted-foreground"
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>

        {/* Add Entry - context aware */}
        {isProjectPage ? (
          <Link
            href={`/projects/${projectSlug}/journal/new`}
            className={cn(
              "flex flex-col items-center justify-center min-h-[44px] flex-1 gap-1 text-xs",
              pathname.includes("/journal/new") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <PlusCircle className="h-5 w-5" />
            <span>Add Entry</span>
          </Link>
        ) : (
          <Link
            href="/dashboard/new"
            className={cn(
              "flex flex-col items-center justify-center min-h-[44px] flex-1 gap-1 text-xs",
              pathname === "/dashboard/new" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <PlusCircle className="h-5 w-5" />
            <span>New Project</span>
          </Link>
        )}

        {/* Case Study - only on project pages */}
        {isProjectPage ? (
          <Link
            href={`/projects/${projectSlug}/case-study`}
            className={cn(
              "flex flex-col items-center justify-center min-h-[44px] flex-1 gap-1 text-xs",
              pathname.includes("/case-study") ? "text-primary" : "text-muted-foreground"
            )}
          >
            <FileText className="h-5 w-5" />
            <span>Case Study</span>
          </Link>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[44px] flex-1 gap-1 text-xs text-muted-foreground/50">
            <FileText className="h-5 w-5" />
            <span>Case Study</span>
          </div>
        )}

        {/* More menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center min-h-[44px] flex-1 gap-1 text-xs text-muted-foreground"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[50vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 p-4">
              <Button variant="ghost" className="justify-start h-12" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-3 h-5 w-5" />
                  All Projects
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start h-12" asChild>
                <Link href="/dashboard/new">
                  <PlusCircle className="mr-3 h-5 w-5" />
                  New Project
                </Link>
              </Button>
              {isProjectPage && (
                <>
                  <div className="border-t my-2" />
                  <Button variant="ghost" className="justify-start h-12" asChild>
                    <Link href={`/projects/${projectSlug}`}>
                      Project Overview
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start h-12" asChild>
                    <Link href={`/projects/${projectSlug}/journal/new`}>
                      Add Journal Entry
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start h-12" asChild>
                    <Link href={`/projects/${projectSlug}/case-study`}>
                      Compile Case Study
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
