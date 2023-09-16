"use client";
import { Member, User } from "@prisma/client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable, DataTableColumnHeader } from "../ui/data-table";
import { Badge } from "../ui/badge";

type MemberWithUser = Member & { user: User };

const columns: ColumnDef<MemberWithUser>[] = [
	{
		accessorKey: "user.name",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
	},
	{
		accessorKey: "permission",
		header: ({ column }) => <DataTableColumnHeader column={column} title="Permission" />,
		cell: ({ row }) => {
			return <Badge>{row.original.permission}</Badge>;
		},
	},
];

export function MembersTable({
	members,
	className,
}: {
	members: MemberWithUser[];
	className?: string;
}) {
	return <DataTable columns={columns} data={members} className={className} />;
}
