import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LanguageSwitcher } from "../languages/LanguageSwitcher";
import { useActiveLanguage } from "../languages/activeLanguage";
import { resolveActiveLanguage } from "../languages/resolve";
import { services } from "../services";

/*
 * Binds the LanguageSwitcher to the languages repo + the active-language store.
 * Keeps the active pointer valid (resolveActiveLanguage) when languages change.
 */
export function LanguageBar({ compact = false }: { compact?: boolean }) {
  const qc = useQueryClient();
  const { activeId, setActive } = useActiveLanguage();

  const { data: languages = [] } = useQuery({
    queryKey: ["languages"],
    queryFn: () => services.languages.listLanguages(),
  });

  // Keep the active id valid as the set of languages loads/changes.
  const resolved = resolveActiveLanguage(activeId, languages);
  useEffect(() => {
    if (resolved !== activeId) setActive(resolved);
  }, [resolved, activeId, setActive]);

  async function addLanguage(name: string) {
    const id = name.toLowerCase().replace(/\s+/g, "-");
    await services.languages.createLanguage({ id, name });
    await qc.invalidateQueries({ queryKey: ["languages"] });
    setActive(id);
  }

  return (
    <div className={compact ? "w-40" : undefined}>
      <LanguageSwitcher
        languages={languages}
        activeId={resolved}
        onSwitch={setActive}
        onAdd={addLanguage}
      />
    </div>
  );
}
