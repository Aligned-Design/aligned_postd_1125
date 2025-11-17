import React, { lazy, Suspense } from "react";

const Chart = lazy(() =>
  import("recharts").then((module) => ({
    default: module.LineChart,
  })),
);

export function LazyLineChart({
  data,
  ...props
}: {
  data: unknown[];
  [key: string]: unknown;
}) {
  return (
    <Suspense
      fallback={<div className="h-64 bg-gray-100 rounded animate-pulse" />}
    >
      <Chart data={data} {...props} />
    </Suspense>
  );
}
