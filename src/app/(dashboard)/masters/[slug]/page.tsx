import React from "react";
import { MasterDetailClient } from "./MasterDetailClient";

export const metadata = {
  title: "Master SOP: made. desk",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <MasterDetailClient slug={slug} />;
}
