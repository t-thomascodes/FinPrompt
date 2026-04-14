import { DemoGate } from "@/components/DemoGate";
import { Meridian } from "@/components/Meridian";
import { MeridianProvider } from "@/context/MeridianContext";

export default function Home() {
  return (
    <DemoGate>
      <MeridianProvider>
        <Meridian />
      </MeridianProvider>
    </DemoGate>
  );
}
