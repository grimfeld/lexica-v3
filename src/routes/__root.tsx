import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext } from "@tanstack/react-router";
import { registerAllNoteTypes } from "../note-types/register-all";
import { AppLayout } from "../layout/AppLayout";

interface RouterContext {
  queryClient: QueryClient;
}

// Register the built-in Note Types once, at module load (before any route renders).
registerAllNoteTypes();

export const Route = createRootRouteWithContext<RouterContext>()({
  component: AppLayout,
});
