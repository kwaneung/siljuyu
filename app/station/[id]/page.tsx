import { StationDetail } from "@/components/station/Detail";

export default async function StationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StationDetail id={id} />;
}
