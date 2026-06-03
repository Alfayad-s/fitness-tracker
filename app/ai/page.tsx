import { AiAssistantView } from "@/components/ai/ai-assistant-view";

type AiPageProps = {
  searchParams: Promise<{ intro?: string }>;
};

export default async function AiPage({ searchParams }: AiPageProps) {
  const { intro } = await searchParams;

  return <AiAssistantView showIntroOnMount={intro === "1"} />;
}
