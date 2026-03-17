"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import { useMembers } from "@/hooks/use-members";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { MemberDto } from "@/types/member";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = { current: null as ReturnType<typeof setTimeout> | null };

  const debounce = useCallback(
    (val: T) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setDebouncedValue(val), delay);
    },
    [delay]
  );

  return debouncedValue;
}

export default function MembersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useMembers(page, search);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchInput(e.target.value);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const columns = [
    {
      key: "memberCode",
      header: "Code",
      render: (m: MemberDto) => (
        <span className="font-mono text-xs text-gray-500">{m.memberCode}</span>
      ),
    },
    {
      key: "fullName",
      header: "Name",
      render: (m: MemberDto) => (
        <Link
          href={`/members/${m.id}`}
          className="font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {m.fullName}
        </Link>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (m: MemberDto) => (
        <span className="text-gray-600">{m.email}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (m: MemberDto) => (
        <span className="text-gray-600">{m.phone ?? "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (m: MemberDto) => <Badge status={m.status} />,
    },
    {
      key: "joinedAt",
      header: "Joined",
      render: (m: MemberDto) => (
        <span className="text-gray-500 text-xs">
          {new Date(m.joinedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (error) {
    return (
      <div
        role="alert"
        className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
      >
        Failed to load members. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2"
          role="search"
        >
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search members..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-9 w-64"
              aria-label="Search members"
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <Link href="/members/new">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Member
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="No members found. Try a different search or add a new member."
        pagination={
          data
            ? {
                page: data.page,
                pageSize: data.pageSize,
                totalCount: data.totalCount,
                onPageChange: setPage,
              }
            : undefined
        }
      />
    </div>
  );
}
