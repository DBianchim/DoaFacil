import type { Metadata } from "next";
import { PublishForm } from "@/components/publish/PublishForm";
import { requireCondoAccess } from "@/lib/condo";

export const metadata: Metadata = { title: "Publicar doação" };

export default async function PublicarPage() {
  await requireCondoAccess();
  return <PublishForm />;
}
