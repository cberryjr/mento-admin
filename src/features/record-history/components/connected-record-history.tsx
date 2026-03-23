"use client";

import Link from "next/link";
import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecordChain, RecordChainNode } from "@/features/record-history/types";
import { formatDate } from "@/lib/format/dates";

type ConnectedRecordHistoryProps = {
  recordChain: RecordChain;
  backTo: string;
};

type RecordNodeProps = {
  node: RecordChainNode;
  depth?: number;
};

function getStatusBadgeClasses(status?: string): string {
  switch (status) {
    case "draft":
      return "border-zinc-300 bg-zinc-100 text-zinc-700";
    case "accepted":
      return "border-green-300 bg-green-100 text-green-800";
    case "invoiced":
      return "border-blue-300 bg-blue-100 text-blue-800";
    case "sent":
      return "border-amber-300 bg-amber-100 text-amber-800";
    case "paid":
      return "border-emerald-300 bg-emerald-100 text-emerald-800";
    default:
      return "border-zinc-300 bg-zinc-100 text-zinc-700";
  }
}

function getEntityIcon(entityType: RecordChainNode["entityType"]): string {
  switch (entityType) {
    case "client":
      return "C";
    case "quote":
      return "Q";
    case "quote_revision":
      return "R";
    case "invoice":
      return "I";
  }
}

function getEntityLabel(entityType: RecordChainNode["entityType"]): string {
  switch (entityType) {
    case "client":
      return "Client";
    case "quote":
      return "Quote";
    case "quote_revision":
      return "Revision";
    case "invoice":
      return "Invoice";
  }
}

function RecordNode({ node, depth = 0 }: RecordNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const indentClass = depth > 0 ? "ml-8" : "";
  const entityLabel = getEntityLabel(node.entityType);

  return (
    <div className={indentClass}>
      <div
        className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
          node.isCurrent
            ? "border-blue-200 bg-blue-50"
            : "border-zinc-200 bg-white hover:bg-zinc-50"
        }`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
            node.isCurrent
              ? "border-blue-300 bg-blue-100 text-blue-800"
              : "border-zinc-300 bg-zinc-100 text-zinc-600"
          }`}
          aria-hidden="true"
        >
          {getEntityIcon(node.entityType)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {getEntityLabel(node.entityType)}
            </p>
            {node.isCurrent ? (
              <span
                className="rounded-md border border-blue-300 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                aria-label="Current record"
              >
                Current
              </span>
            ) : null}
          </div>

          <p className="mt-0.5 text-sm font-medium text-zinc-900">{node.label}</p>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            {node.status ? (
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-medium ${getStatusBadgeClasses(
                  node.status,
                )}`}
                aria-label={`${node.entityType} status: ${node.status}`}
              >
                {node.status}
              </span>
            ) : null}

            {node.timestamp ? (
              <span className="text-xs text-zinc-500">{formatDate(node.timestamp)}</span>
            ) : null}

           </div>

          {node.metadata?.length ? (
            <dl className="mt-2 space-y-1 text-xs text-zinc-600">
              {node.metadata.map((entry) => (
                <div key={`detail-${entry.label}-${entry.value}`} className="flex flex-wrap gap-1">
                  <dt className="font-medium text-zinc-700">{entry.label}:</dt>
                  <dd>{entry.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {hasChildren ? (
             <button
               type="button"
               onClick={() => setIsExpanded(!isExpanded)}
               className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
               aria-expanded={isExpanded}
               aria-label={`${isExpanded ? "Collapse" : "Expand"} ${entityLabel.toLowerCase()} details for ${node.label}`}
             >
               {isExpanded ? "Hide details" : `${node.children?.length ?? 0} revisions`}
             </button>
            ) : null}

            {node.relatedLinks?.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                aria-label={link.ariaLabel}
              >
                {link.label}
              </Link>
            ))}

            {node.href ? (
              <Link
                href={node.href}
               className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
               aria-label={`Open ${entityLabel.toLowerCase()} ${node.label}`}
             >
               {`Open ${entityLabel.toLowerCase()}`}
             </Link>
           ) : null}
        </div>
      </div>

      {isExpanded && node.children ? (
        <div className="mt-2 space-y-2" role="group" aria-label={`Revisions for ${node.label}`}>
          {node.children.map((child) => (
            <RecordNode key={child.entityId} node={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ConnectedRecordHistory({
  recordChain,
  backTo,
}: ConnectedRecordHistoryProps) {
  const { client, quoteChain, currentEntity } = recordChain;

  return (
    <section
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6"
      aria-label="Connected record history"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Record history</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Trace connected records from client to quotes and invoices.
          </p>
        </div>
        <Link
          href={backTo}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Back
        </Link>
      </div>

      <Card className="border-zinc-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Record chain</CardTitle>
          <CardDescription>
            Navigate the connected records. Current record is highlighted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <RecordNode node={client} />

          {quoteChain.length > 0 ? (
            <div className="space-y-3">
              {quoteChain.map((chain) => (
                <div key={chain.quote.entityId} className="space-y-3">
                  <RecordNode
                    node={
                      chain.revisions.length > 1
                        ? { ...chain.quote, children: chain.revisions }
                        : chain.quote
                    }
                  />

                  {chain.revisions.length === 1 ? (
                    <div className="ml-8 space-y-2" role="group" aria-label="Quote revisions">
                      <RecordNode node={chain.revisions[0]} depth={1} />
                    </div>
                  ) : null}

                  {chain.invoices.length > 0 ? (
                    <div className="space-y-2">
                      {chain.invoices.map((invoice) => (
                        <RecordNode key={invoice.entityId} node={invoice} />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No connected quotes or invoices found.</p>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Current record</p>
        <p className="mt-1 text-sm font-medium text-zinc-900">{currentEntity.label}</p>
        {currentEntity.status ? (
          <span
            className={`mt-1 inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${getStatusBadgeClasses(
              currentEntity.status,
            )}`}
          >
            {currentEntity.status}
          </span>
        ) : null}
      </div>
    </section>
  );
}
