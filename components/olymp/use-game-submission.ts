"use client";

import { useRef, useState } from "react";

/** Await transport confirmation; only the authoritative snapshot seals an answer. */
export function useGameSubmission(
  act: (action: any) => void | Promise<boolean>,
  scope: string,
) {
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const inFlight = useRef<{ scope: string } | null>(null);
  const [state, setState] = useState({ scope, pending: false, error: "" });
  const pending = state.scope === scope && state.pending;
  const error = state.scope === scope ? state.error : "";

  function clearError() {
    setState((previous) => previous.scope === scope && previous.error
      ? { ...previous, error: "" }
      : previous);
  }

  async function submit(action: any) {
    if (inFlight.current?.scope === scope) return false;
    const request = { scope };
    inFlight.current = request;
    setState({ scope, pending: true, error: "" });
    let accepted = false;
    let message = "";
    try {
      accepted = await act(action) !== false;
      if (!accepted) message = "Noch nicht bestätigt. Deine Eingabe bleibt erhalten. Bitte versuche es erneut.";
    } catch (cause) {
      message = cause instanceof Error ? cause.message : "Die Abgabe konnte nicht bestätigt werden. Bitte versuche es erneut.";
    } finally {
      if (inFlight.current === request) {
        inFlight.current = null;
        if (currentScope.current === scope) setState({ scope, pending: false, error: message });
      }
    }
    return accepted;
  }

  return { pending, error, clearError, submit };
}
