import type { GatePass, Page } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState, LoadingState } from "./AsyncState";
import { compressToken } from "@/lib/display";

export function PassTable({
  page,
  onRowClick,
  onPageChange,
  showStudent = false,
  emptyText = "No passes found.",
  rightAction,
}: {
  page: Page<GatePass> | null;
  onRowClick: (id: number) => void;
  onPageChange?: (n: number) => void;
  showStudent?: boolean;
  emptyText?: string;
  rightAction?: (pass: GatePass) => React.ReactNode;
}) {
  if (!page) return <LoadingState />;
  const rows = page.content ?? [];
  if (rows.length === 0) {
    return <EmptyState title={emptyText} />;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border glass">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {showStudent && <TableHead>Student</TableHead>}
              {showStudent && <TableHead className="hidden xl:table-cell">Email</TableHead>}
              {showStudent && <TableHead className="hidden lg:table-cell">Dept</TableHead>}
              {showStudent && <TableHead className="hidden lg:table-cell">Course</TableHead>}
              {showStudent && <TableHead className="hidden lg:table-cell">Sem</TableHead>}
              {showStudent && <TableHead className="hidden xl:table-cell">Student Mobile</TableHead>}
              {showStudent && <TableHead className="hidden xl:table-cell">Parent Mobile</TableHead>}
              <TableHead>Reason</TableHead>
              <TableHead className="hidden md:table-cell">Destination</TableHead>
              <TableHead className="hidden md:table-cell">Leave</TableHead>
              <TableHead className="hidden lg:table-cell">Return</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Code</TableHead>
              {rightAction && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow
                key={p.id}
                onClick={() => onRowClick(p.id)}
                className="cursor-pointer"
              >
                {showStudent && (
                  <TableCell className="font-medium">{p.studentName ?? "Unknown"}</TableCell>
                )}
                {showStudent && (
                  <TableCell className="hidden xl:table-cell text-muted-foreground text-xs">
                    {p.studentEmail ?? "—"}
                  </TableCell>
                )}
                {showStudent && (
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {p.department ?? "—"}
                  </TableCell>
                )}
                {showStudent && (
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {p.course ?? "—"}
                  </TableCell>
                )}
                {showStudent && (
                  <TableCell className="hidden lg:table-cell text-muted-foreground">
                    {p.semester ?? "—"}
                  </TableCell>
                )}
                {showStudent && (
                  <TableCell className="hidden xl:table-cell font-mono text-xs">
                    {p.studentMobile ?? "—"}
                  </TableCell>
                )}
                {showStudent && (
                  <TableCell className="hidden xl:table-cell font-mono text-xs">
                    {p.parentMobile ?? "—"}
                  </TableCell>
                )}
                <TableCell className="max-w-[200px] truncate">{p.reason ?? "N/A"}</TableCell>
                <TableCell className="hidden md:table-cell">{p.destination ?? "N/A"}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {p.leaveAt ? format(new Date(p.leaveAt), "MMM d, p") : "N/A"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {p.returnBy ? format(new Date(p.returnBy), "MMM d, p") : "N/A"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell font-mono text-xs tracking-wider">
                  {p.qrToken ? compressToken(p.qrToken) : "—"}
                </TableCell>
                {rightAction && (
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {rightAction(p)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {onPageChange && page.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page.number + 1} of {page.totalPages} • {page.totalElements} total
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page.number === 0}
              onClick={() => onPageChange(page.number - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page.number + 1 >= page.totalPages}
              onClick={() => onPageChange(page.number + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
