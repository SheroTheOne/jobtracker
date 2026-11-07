import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ApplicationListItem } from "@/lib/data/applications";
import { formatDate } from "@/lib/dates";
import { getFollowUpState } from "@/lib/domain/follow-up";
import { FollowUpBadge } from "./follow-up-badge";
import { MatchScore } from "./match-score";
import { StatusBadge } from "./status-badge";

interface ApplicationsTableProps {
  applications: ApplicationListItem[];
  now: Date;
}

export function ApplicationsTable({ applications, now }: ApplicationsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Företag & roll</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Sökt</TableHead>
          <TableHead className="hidden sm:table-cell">Match</TableHead>
          <TableHead className="hidden lg:table-cell">Ändrad</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((application) => (
          <TableRow key={application.id} className="relative">
            <TableCell className="max-w-0 w-full">
              {/* Länken täcker hela raden via ::after – klickbar rad utan JS. */}
              <Link
                href={`/applications/${application.id}`}
                className="block truncate font-medium after:absolute after:inset-0 focus-visible:outline-none"
              >
                {application.company}
              </Link>
              <div className="text-muted-foreground truncate text-xs">{application.role}</div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col items-start gap-1">
                <StatusBadge status={application.status} />
                <FollowUpBadge state={getFollowUpState(application, now)} />
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground hidden whitespace-nowrap md:table-cell">
              {formatDate(application.appliedDate)}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <MatchScore score={application.latestScore} />
            </TableCell>
            <TableCell className="text-muted-foreground hidden whitespace-nowrap lg:table-cell">
              {formatDate(application.updatedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
