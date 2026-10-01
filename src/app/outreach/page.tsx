import React from "react";
import { BoardLoader } from "./BoardLoader";

export const metadata = {
  title: "Outreach board: made. desk",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ sample?: string }> }) {
  const params = await searchParams;
  return <BoardLoader initialSample={params.sample !== undefined} />;
}
