import { useEffect, useState } from "react";
import { getTransitNetwork, supportsTransit, type TransitNetwork } from "@/data/transitNetworks";

export function useTransitNetwork(city: string, enabled: boolean) {
  const [network, setNetwork] = useState<TransitNetwork | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState(() => !enabled || !supportsTransit(city));

  useEffect(() => {
    let active = true;
    if (!enabled || !supportsTransit(city)) {
      setLoading(false);
      setResolved(true);
      return () => { active = false; };
    }

    if (network?.city === city) {
      setLoading(false);
      setResolved(true);
      return () => { active = false; };
    }

    setLoading(true);
    setResolved(false);
    getTransitNetwork(city)
      .then((result) => { if (active) setNetwork(result); })
      .finally(() => {
        if (active) {
          setLoading(false);
          setResolved(true);
        }
      });

    return () => { active = false; };
  }, [city, enabled, network]);

  useEffect(() => {
    setNetwork(null);
    setResolved(!enabled || !supportsTransit(city));
  }, [city]);

  return { network, loading, resolved, supported: supportsTransit(city) };
}
