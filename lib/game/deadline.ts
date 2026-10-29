import type {GameState} from "./types";
export function inputDeadline(g:GameState,id:string) {
  if(g.id==="dice")return g.public.turnDeadline ?? 0;
  if(g.id==="picture" && g.public.buzzer===id)return g.public.buzzDeadline;
  return g.deadline;
}
