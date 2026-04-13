import { FinPrompt } from "@/components/FinPrompt";
import { FinPromptProvider } from "@/context/FinPromptContext";

export default function Home() {
  return (
    <FinPromptProvider>
      <FinPrompt />
    </FinPromptProvider>
  );
}
