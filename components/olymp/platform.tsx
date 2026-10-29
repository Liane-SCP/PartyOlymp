"use client";
import {colorMoveCue} from "@/lib/color-table-presentation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Copy,
  Volume2,
  VolumeX,
  Settings,
  Smile,
  Check,
  Users,
  Clock,
  LogOut,
} from "lucide-react";
import { catalog, byId } from "@/lib/game/catalog";
import { isBoss } from "@/lib/game/boss-rules";
import type { Selection } from "@/lib/game/types";
import { sound, defaults, normalizeAudioSettings, type AudioSettings } from "@/lib/audio";
import { countdownValue, gameClockText } from "@/lib/game/presentation";
import { gameImpact } from "@/lib/game-camera";
import { Avatar, GameIcon, Mark, emoteNames } from "./art";
import { EmotePicker } from "./emote-picker";
import { RankingShow } from "./ranking-show";
import { CharacterPicker } from "./character-picker";
import { appearance, type Appearance } from "@/lib/appearance";
import { OlympiadPlanner } from "./olympiad-planner";
import { LobbyLaunch } from "./lobby-launch";
import { GamePreparation } from "./briefing-ready";
import { ConnectionStatus } from "./connection-status";
import { HostProgressControls, HostTestSkip } from "./host-progress-controls";
import { GameBoard } from "./game-board";
import { ScoreShow, Particles } from "./showtime";
import { VictoryCeremony } from "./victory-ceremony";
import {RematchBoard,LobbyParticipation} from './rematch-board';
import {DiceResultsArchive} from './dice-results';
import { PartyJourney } from './party-journey';
import { partyStep,briefingFormat,partyPlanKey } from '@/lib/game/party-flow';
import { useGraphicsQuality } from './use-graphics-quality';
import { validQuality } from '@/lib/adventure-quality';
import {PartyCredits} from './party-credits';
import { GameShow } from "./game-show";
import { TimeSignals } from "./time-signals";
import { AdventureStage } from "./adventure-stage";
import {useScenePreparation} from './scene-preparation';
interface Session {
  code: string;
  playerId: string;
  token: string;
}
export default function Platform() {
  const [graphicsQuality,setGraphicsQuality]=useGraphicsQuality();
  const [room, setRoom] = useState<any>(null),
    [session, setSession] = useState<Session | null>(null),
    [name, setName] = useState(""),
    [avatar, setAvatar] = useState(0),
    [look, setLook] = useState<Appearance>({
      shape: 0,
      accessory: 0,
      color: 0,
    }),
    [joinCode, setJoinCode] = useState(""),
    [entry, setEntry] = useState<"create" | "join" | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [entryErrors,setEntryErrors]=useState<{name?:string;code?:string}>({}),
    [connectionError, setConnectionError] = useState(""),
    [settings, setSettings] = useState<AudioSettings>(defaults),
    [settingsOpen, setSettingsOpen] = useState(false),
    [emotesOpen, setEmotesOpen] = useState(false),
    [crewOpen, setCrewOpen] = useState(false),
    [desktopPanel, setDesktopPanel] = useState(false),
    [rulesOpen, setRulesOpen] = useState(false),
    [connection, setConnection] = useState("online"),
    [now, setNow] = useState(Date.now()),
    [notice, setNotice] = useState("");
  const latest = useRef<any>(null),
    sessionRef = useRef<Session | null>(null),
    seen = useRef(new Set<string>()),
    offset = useRef(0),
    queue = useRef(Promise.resolve()),
    failedSince = useRef(0),
    pending = useRef(false),
    settingsRef = useRef(settings);
  useEffect(() => { setDesktopPanel(false); setCrewOpen(false); setEmotesOpen(false); }, [room?.phase]);
  useEffect(()=>{if(entry){setEntryErrors({});setError("");}},[entry]);
  useEffect(()=>{
    if(!entry&&!settingsOpen&&!rulesOpen)return;
    const previous=document.activeElement as HTMLElement|null;
    const dialog=[...document.querySelectorAll<HTMLElement>('.modal-backdrop [role="dialog"]')].at(-1);
    if(!dialog)return;
    const backdrop=dialog.closest('.modal-backdrop'),background=[...(backdrop?.parentElement?.children??[])].filter((node):node is HTMLElement=>node instanceof HTMLElement&&node!==backdrop).map(node=>({node,inert:node.inert}));
    background.forEach(({node})=>node.inert=true);
    const focusable=()=>[...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')].filter(node=>node.getClientRects().length>0);
    const frame=requestAnimationFrame(()=>((entry?dialog.querySelector<HTMLElement>('input'):null)??focusable()[0])?.focus({preventScroll:true}));
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'||event.key==='Tab')event.stopPropagation();
      if(event.key==='Escape'){event.preventDefault();closeEntry();setSettingsOpen(false);setRulesOpen(false);}
      if(event.key==='Tab'){const nodes=focusable(),first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
    };
    document.addEventListener('keydown',key);
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',key);background.forEach(({node,inert})=>node.inert=inert);if(previous?.isConnected)previous.focus({preventScroll:true});};
  },[entry,settingsOpen,rulesOpen]);
  const socket = useRef<WebSocket | null>(null),
    live = useRef(false),
    acceptRef = useRef<(data: any) => void>(() => {}),
    lastSnapshot = useRef(0),
    lastRoomAt = useRef(0),
    unacknowledged = useRef(new Map<string, any>());
  const actionReplies = useRef(new Map<string, (ok: boolean) => void>());
  const sessionEpoch=useRef(0),entryRequestEpoch=useRef<number|null>(null);
  const activeRequests=useRef(new Set<AbortController>());
  const invalidateSessionIO=()=>{
    sessionEpoch.current++;
    for(const controller of activeRequests.current)controller.abort();
    activeRequests.current.clear();
    queue.current=Promise.resolve();
    pending.current=false;
    live.current=false;
    socket.current?.close();
    socket.current=null;
    unacknowledged.current.clear();
    for(const reply of actionReplies.current.values())reply(false);
    actionReplies.current.clear();
    failedSince.current=0;
    lastRoomAt.current=0;
    setConnectionError("");
    return sessionEpoch.current;
  };
  const closeEntry=()=>{
    if(entryRequestEpoch.current!==null){invalidateSessionIO();entryRequestEpoch.current=null;setBusy(false);}
    if(entry){setEntryErrors({});setError("");}
    setEntry(null);
  };
  const gameCamera = useRef<HTMLDivElement>(null);
  const cameraAnimation = useRef<Animation | null>(null);
  const lastCameraImpact = useRef(0);
  const impact = (game: string, event: string) => {
    const preset = gameImpact(game, event);
    const target = gameCamera.current?.querySelector<HTMLElement>(".adventure-canvas");
    if (
      !preset ||
      !target ||
      settingsRef.current.motion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.activeElement?.matches(
        "input, textarea, [contenteditable=true]",
      ) ||
      performance.now() - lastCameraImpact.current < 420
    )
      return;
    lastCameraImpact.current = performance.now();
    cameraAnimation.current?.cancel();
    const [strength, duration] = preset;
    const d = strength * (settingsRef.current.intense ? 1 : 0.45);
    target.dataset.cameraImpact = event;
    cameraAnimation.current = target.animate(
      [
        { transform: "translate3d(0,0,0)" },
        { transform: `translate3d(${-d}px,${d * 0.4}px,0)` },
        { transform: `translate3d(${d * 0.65}px,${-d * 0.3}px,0)` },
        { transform: `translate3d(${-d * 0.3}px,${d * 0.15}px,0)` },
        { transform: "translate3d(0,0,0)" },
      ],
      { duration, easing: "ease-out" },
    );
  };
  useEffect(() => () => cameraAnimation.current?.cancel(), []);
  useScenePreparation(room);
  useEffect(() => {
    const readStored=(key:string)=>{try{return JSON.parse(localStorage.getItem(key)??'null');}catch{return null;}};
    const prefs=readStored('olymp.settings');
    if(prefs)setSettings(normalizeAudioSettings(prefs));
    const identity=readStored('olymp.identity');
    if(identity&&typeof identity==='object'&&!Array.isArray(identity)) {
        if(typeof identity.name==='string')setName(identity.name.trim().slice(0,20));
        const savedAvatar=Number.isInteger(identity.avatar)&&identity.avatar>=0?identity.avatar:0;
        setAvatar(savedAvatar);
        setLook(
          appearance(identity.look) ?? {
            shape: savedAvatar % 3,
            accessory: 0,
            color: 0,
          },
        );
    }
      const code = new URLSearchParams(location.search).get("room")?.trim().toUpperCase(),
        saved = readStored('olymp.session');
      if (saved && typeof saved.code==='string'&&/^[A-Z2-9]{6}$/.test(saved.code)&&typeof saved.playerId==='string'&&saved.playerId&&typeof saved.token==='string'&&saved.token&&(!code || code === saved.code)) {
        setSession(saved);
        sessionRef.current = saved;
      } else if (code) {
        setJoinCode(code.toUpperCase());
        setEntry("join");
      }
    const updateClock=()=>{if(!document.hidden)setNow(Date.now()+offset.current);};
    let clockTimer:ReturnType<typeof setInterval>|undefined;
    const visibility=()=>{
      if(clockTimer!==undefined){clearInterval(clockTimer);clockTimer=undefined;}
      sound.refreshMix();
      if(document.hidden)return;
      updateClock();
      clockTimer=setInterval(updateClock,100);
    };
    document.addEventListener("visibilitychange",visibility);
    visibility();
    return () => {if(clockTimer!==undefined)clearInterval(clockTimer);document.removeEventListener("visibilitychange",visibility);};
  }, []);
  useEffect(() => {
    sound.settings = settings;
    settingsRef.current = settings;
    try{localStorage.setItem("olymp.settings", JSON.stringify(settings));}catch{}
    document.documentElement.dataset.intense = settings.intense ? "on" : "off";
  }, [settings]);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      document.documentElement.dataset.motion = settings.motion || preference.matches ? "reduced" : "normal";
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, [settings.motion]);
  const accept = (data: any) => {
    if (!data.room) return;
    const r = data.room;
    if (
      latest.current &&
      r.code === latest.current.code &&
      r.revision < latest.current.revision
    )
      return;
    if (r.game?.article && !r.game.article.html) {
      const previous = latest.current?.game?.article;
      if (
        previous?.title === r.game.article.title &&
        previous?.revision === r.game.article.revision
      )
        r.game.article.html = previous.html;
    }
    lastRoomAt.current = Date.now();
    offset.current = r.serverTime - Date.now();
    const old = latest.current;
    if(old?.phase==="playing" && r.phase!=="playing" && old.game?.mine && !old.game.mine.submitted) {
      const deadline=old.game.id==="dice"?old.game.turnDeadline:old.game.id==="picture"&&old.game.buzzer?old.game.buzzDeadline:old.game.deadline;
      if(deadline>0 && r.serverTime>=deadline && !["roundReveal","done","turnReveal"].includes(old.game.stage))sound.play("timeUp");
    }
    latest.current = r;
    setRoom(r);
    if (
      old?.game?.id === r.game?.id &&
      r.phase === "playing" &&
      old.game.stage !== r.game.stage &&
      r.game.stage === "roundReveal"
    )
      impact(r.game.id, "roundReveal");
    if (old && r.phase !== old.phase) {
      if (r.phase !== "countdown")
        sound.play(
          r.phase === "countdown"
            ? "countdown"
            : r.phase === "playing"
              ? "start"
              : r.phase === "reveal"
                ? "reveal"
                : r.phase === "standings"
                  ? "score"
                  : r.phase === "podium"
                    ? "navigate"
                    : "click",
        );
    }
    // Idempotent updates also cover reconnects and consecutive games in one phase.
    sound.music(r.game?.stage === "topicSpin" ? "wheel" : r.phase, r.game?.id ?? r.selection[r.index]?.id);
    if (old && r.players.length > old.players.length) sound.play("join");
    if (
      old &&
      r.players.some(
        (p: any) =>
          p.ready && !old.players.find((x: any) => x.id === p.id)?.ready,
      )
    )
      sound.play("ready");
    if(old?.game?.id==='cards'&&r.game?.id==='cards'&&r.game.lastMove&&old.game.lastMove?.id!==r.game.lastMove.id&&r.serverTime-r.game.lastMove.at>=0&&r.serverTime-r.game.lastMove.at<1200)sound.play(colorMoveCue(r.game));
    for (const e of r.game?.events ?? []) {
      if (!seen.current.has(e.id)) {
        seen.current.add(e.id);
        // The first snapshot establishes history; only subsequent events are live cues.
        if (!old) continue;
        if (isBoss(r.game.id)) continue;
        if(r.game.id==='geo'&&['confirm','reveal'].includes(e.type)){const age=r.serverTime-e.at;if(old.game?.id==='geo'&&age>=0&&age<3000&&(e.type==='reveal'||e.player===sessionRef.current?.playerId))sound.play(e.type==='reveal'?'geoReveal':'geoSeal',undefined,e.type==='reveal'?'geoReveal':'geoSeal:'+e.player);continue;}
        if(r.game.id==='dice'&&e.type==='dice'){const age=r.serverTime-e.at;if(old.game?.id==='dice'&&age>=0&&age<1200)sound.play('dice',undefined,'dice:'+e.player);continue;}
        if(r.game.id==='color'&&['confirm','reveal'].includes(e.type)){const age=r.serverTime-e.at;if(old.game?.id==='color'&&age>=0&&age<3000)sound.play(e.type==='reveal'?'colorReveal':'colorSeal',undefined,e.type==='reveal'?'colorReveal':'colorSeal:'+e.player);continue;}
        if(r.game.id==='picture'&&['buzz','wrong','buzzTimeout','correct','reveal'].includes(e.type)){const age=r.serverTime-e.at;if(old.game?.id==='picture'&&age>=0&&age<3000)sound.play(e.type==='reveal'?'pictureReveal':e.type==='buzz'?'pictureBuzz':e.type==='correct'?'pictureWin':'pictureWrong',undefined,e.type==='reveal'?'pictureReveal':'pictureBuzzer:'+e.player);continue;}
        if(r.game.id==='wiki'&&['navigate','correct','reveal'].includes(e.type)){const age=r.serverTime-e.at;if(old.game?.id==='wiki'&&age>=0&&age<3000){if(e.type==='navigate'&&e.player===sessionRef.current?.playerId)sound.play('wikiPage');if(e.type==='correct')sound.play('wikiArrival',undefined,'wikiArrival:'+e.player);}continue;}
        const presentationCue=(r.game.id==='spectrum'&&e.type==='spectrumReveal')||(r.game.id==='herd'&&e.type==='herdGather')||(r.game.id==='categories'&&['categoryVote','categoryResult'].includes(e.type))||(r.game.id==='chain'&&['chainWord','chainChallenge','chainAccepted','chainOut'].includes(e.type));
        if(presentationCue){const age=r.serverTime-e.at;if(!(age>=0&&age<3000))continue;}
        if (
          old?.game?.id === r.game.id &&
          (!e.player ||
            e.player === sessionRef.current?.playerId ||
            ["explosion", "gavel", "categoryResult", "codeFeedback"].includes(
              e.type,
            ))
        )
          impact(r.game.id, e.type);
        if(presentationCue){sound.play(r.game.id==='herd'?(r.game.reveal?.players?.some((p:any)=>p.score>0)?'herdMatch':'herdTie'):e.type);continue;}
        if(['herd','spectrum','size'].includes(r.game.id)&&e.type==='reveal')continue;
        if (r.game.id === "bomb" && e.type === "bombPass"){sound.play("bombPass",undefined,`bombHand:${e.player}`);continue;}
        if (r.game.id === "timing" && ["clockStart","clockStop"].includes(e.type)) continue;
        if (r.game.id === "auction" && e.type === "bid"){sound.play("bid",undefined,`auctionBid:${e.player}`);continue;}
        if (r.game.id === "auction" && e.type === "reveal"){sound.play(r.game.reveal?.success?"auctionWin":"auctionFail");continue;}
        if (r.game.id === "blackjack" && e.type === "reveal") continue;
        if(r.game.id==='cards'&&e.type==='card')continue;
        if (
          !e.player ||
          e.player === sessionRef.current?.playerId ||
          (r.game.id==='blackjack'&&e.type==='card') ||
          [
            "collision",
            "hit",
            "reveal",
            "bid",
            "gavel",
            "bombPass",
            "explosion",
            "wordReview",
            "wordRejected",
            "auctionWord",
          ].includes(e.type)
        )
          sound.play(e.type);
      }
    }
    for (const e of r.emotes) {
      if (!seen.current.has(e.id)) {
        seen.current.add(e.id);
        if (!old) continue;
        if (!settingsRef.current.mutedPlayers.includes(e.player))
          sound.play("emote", e.emote);
      }
    }
    if (seen.current.size > 4000)
      seen.current = new Set([...seen.current].slice(-1000));
  };
  acceptRef.current = accept;
  useEffect(() => {
    if (!session || process.env.NEXT_PUBLIC_ROOM_TRANSPORT === "http") return;
    const epoch=sessionEpoch.current;
    let stopped = false,
      retry: ReturnType<typeof setTimeout>,
      ping: ReturnType<typeof setInterval>,
      frames: ReturnType<typeof setInterval>;
    let lastFrame = 0;
    const connect = () => {
      if(stopped||epoch!==sessionEpoch.current)return;
      const ws = new WebSocket(
        `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/live`,
      );
      socket.current = ws;
      ws.onopen = () => { if (!stopped && epoch===sessionEpoch.current && socket.current === ws) ws.send(JSON.stringify(session)); };
      ws.onmessage = (event) => {
        if (stopped || epoch!==sessionEpoch.current || socket.current !== ws) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "connected" || data.type === "snapshot") {
            live.current = true;
            lastSnapshot.current = Date.now();
            setConnection("online");
            setConnectionError("");
            failedSince.current = 0;
          }
          if (data.type === "connected")
            for (const body of unacknowledged.current.values())
              ws.send(JSON.stringify(body));
          if (data.type === "ack") {
            unacknowledged.current.delete(data.requestId);
            actionReplies.current.get(data.requestId)?.(!!data.ok);
            actionReplies.current.delete(data.requestId);
          }
          if (data.type === "ack" && data.ok) setError("");
          if (data.type === "snapshot") acceptRef.current(data);
          if (data.type === "error") setError(data.error);
        } catch {}
      };
      ws.onclose = () => {
        if (stopped || epoch!==sessionEpoch.current || socket.current !== ws) return;
        live.current = false;
        if (!stopped) {
          setConnection("reconnecting");
          retry = setTimeout(connect, 1200);
        }
      };
      ws.onerror = () => ws.close();
    };
    connect();
    // Each short frame request starts fresh Worker I/O rather than an endless
    // background request.
    frames = setInterval(() => {
      const interval = 450;
      if (
        live.current &&
        socket.current?.readyState === WebSocket.OPEN &&
        Date.now() - lastFrame >= interval
      ) {
        lastFrame = Date.now();
        socket.current.send(JSON.stringify({ type: "frame" }));
      }
    }, 35);
    ping = setInterval(() => {
      if (socket.current?.readyState === WebSocket.OPEN) {
        if (Date.now() - lastSnapshot.current > 12000) socket.current.close();
        else
          socket.current.send(JSON.stringify({ type: "ping", at: Date.now() }));
      }
    }, 4000);
    return () => {
      stopped = true;
      live.current = false;
      clearTimeout(retry);
      clearInterval(ping);
      clearInterval(frames);
      socket.current?.close();
      socket.current = null;
      unacknowledged.current.clear();
      for (const reply of actionReplies.current.values()) reply(false);
      actionReplies.current.clear();
    };
  }, [session]);
  const request = async (body: any, epoch=sessionEpoch.current, apply=true) => {
    const assertCurrent=()=>{if(epoch!==sessionEpoch.current)throw new Error("Diese Raumsitzung ist nicht mehr aktiv.");};
    const retryable =
      body.type === "poll" ||
      body.type === "action" ||
      (body.type === "join" && body.token);
    for (let attempt = 0; attempt < (retryable ? 3 : 1); attempt++) {
      assertCurrent();
      let res: Response, data: any;
      const controller=new AbortController();
      activeRequests.current.add(controller);
      const timeout=setTimeout(()=>controller.abort(),8000);
      try {
        res = await fetch("/api/room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        data = await res.json();
        assertCurrent();
      } catch {
        assertCurrent();
        if (retryable && attempt < 2) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }
        throw new Error(
          "Verbindung unterbrochen. Bitte erneut versuchen; dein Platz bleibt erhalten.",
        );
      } finally {
        clearTimeout(timeout);
        activeRequests.current.delete(controller);
      }
      if (
        retryable &&
        (res.status === 409 || res.status >= 500) &&
        attempt < 2
      ) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        continue;
      }
      assertCurrent();
      if(apply)accept(data);
      if(!res.ok && body.token && /Sitzung nicht gefunden|aus dem Raum entfernt/.test(data.error??"")) {
        invalidateSessionIO();sessionRef.current=null;latest.current=null;
        setSession(null);setRoom(null);setError(data.error);
        try{localStorage.removeItem("olymp.session");}catch{}
      }
      if (!res.ok)
        throw new Error(
          data.error ?? "Die Aktion konnte nicht verarbeitet werden.",
        );
      return data;
    }
    throw new Error("Verbindung wird wiederhergestellt.");
  };
  useEffect(() => {
    if (!session || process.env.NEXT_PUBLIC_ROOM_TRANSPORT === "http") return;
    sessionRef.current = session;
    const epoch=sessionEpoch.current;
    let stopped = false,
      t: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if(stopped||epoch!==sessionEpoch.current)return;
      if (live.current) {
        t = setTimeout(poll, 2000);
        return;
      }
      if (pending.current) {
        t = setTimeout(poll, 200);
        return;
      }
      try {
        await request({ type: "poll", ...session },epoch);
        if (!stopped&&epoch===sessionEpoch.current) {
          setConnection("online");
          setConnectionError("");
          failedSince.current = 0;
        }
      } catch (e) {
        if (!stopped&&epoch===sessionEpoch.current) {
          setConnection("reconnecting");
          if (!failedSince.current) failedSince.current = Date.now();
          if (Date.now() - failedSince.current > 5000)
            setConnectionError((e as Error).message);
        }
      } finally {
        if (!stopped&&epoch===sessionEpoch.current) t = setTimeout(poll, 850);
      }
    };
    void poll();
    return () => {
      stopped = true;
      clearTimeout(t);
    };
  }, [session]);
  const action = (a: any) => {
    sound.init();
    const s = sessionRef.current;
    if (!s) return Promise.resolve(false);
    const epoch=sessionEpoch.current;
    const requestId = crypto.randomUUID();
    if (live.current && socket.current?.readyState === WebSocket.OPEN) {
      const body = { type: "action", requestId, action: a };
      unacknowledged.current.set(requestId, body);
      return new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => {
          actionReplies.current.delete(requestId);
          resolve(false);
        }, 25000);
        actionReplies.current.set(requestId, (ok) => {
          clearTimeout(timer);
          resolve(ok);
        });
        socket.current!.send(JSON.stringify(body));
      });
    }
    const result = queue.current.then(async () => {
      if(epoch!==sessionEpoch.current)return false;
      pending.current = true;
      try {
        await request({ type: "action", ...s, requestId, action: a },epoch);
        if(epoch!==sessionEpoch.current)return false;
        setError("");
        return true;
      } catch (e) {
        if(epoch===sessionEpoch.current)setError((e as Error).message);
        return false;
      } finally {
        if(epoch===sessionEpoch.current)pending.current = false;
      }
    });
    queue.current = result.then(() => {});
    return result;
  };
  const enter = async (mode: "create" | "join") => {
    sound.init();
    if(entryRequestEpoch.current!==null)return;
    const validation:{name?:string;code?:string}={};
    if(!name.trim())validation.name="Bitte gib deinen Namen ein.";
    else if(name.trim().length>20)validation.name="Dein Name darf höchstens 20 Zeichen haben.";
    if(mode==='join'&&!/^[A-Z2-9]{6}$/.test(joinCode.trim().toUpperCase()))validation.code="Der Code braucht 6 Buchstaben oder Ziffern von 2 bis 9.";
    setEntryErrors(validation);
    if(validation.name||validation.code){requestAnimationFrame(()=>document.getElementById(validation.name?'entry-name':'entry-code')?.focus({preventScroll:true}));return;}
    const epoch=invalidateSessionIO();
    entryRequestEpoch.current=epoch;
    sessionRef.current=null;
    latest.current=null;
    setSession(null);
    setRoom(null);
    setBusy(true);
    setError("");
    try {
      const data = await request({
          type: mode,
          name:name.trim(),
          avatar,
          look,
          ...(mode === "join" ? { code: joinCode.trim().toUpperCase() } : {}),
        },epoch,false),
        s = {
          code: data.room.code,
          playerId: data.playerId,
          token: data.token,
        };
      if(epoch!==sessionEpoch.current)return;
      try{
        localStorage.setItem("olymp.session", JSON.stringify(s));
        localStorage.setItem("olymp.identity", JSON.stringify({ name:name.trim(), avatar, look }));
      }catch{}
      sessionRef.current = s;
      setSession(s);
      accept(data);
      entryRequestEpoch.current=null;
      setEntry(null);
      history.replaceState(null, "", `?room=${s.code}`);
      sound.play("join");
      sound.music("lobby");
    } catch (e) {
      if(epoch===sessionEpoch.current)setError((e as Error).message);
    } finally {
      if(epoch===sessionEpoch.current){entryRequestEpoch.current=null;setBusy(false);}
    }
  };
  const lastCountdown = useRef("");
  useEffect(() => {
    const count = countdownValue(room?.deadline ?? 0, now);
    const key = String(room?.deadline) + ":" + count;
    if (
      room?.phase === "countdown" &&
      count > 0 &&
      key !== lastCountdown.current
    ) {
      lastCountdown.current = key;
      sound.play("countdown");
    }
    sound.tension =
      room?.phase === "playing" &&
      room?.game?.deadline > 0 &&
      room?.game?.deadline - now < 10000;
  }, [room?.phase, Math.ceil((room?.deadline - now) / 1000)]);
  const me = room?.players.find((p: any) => p.id === session?.playerId),
    host = room?.host === session?.playerId,
    configure = (list: Selection[]) =>
      action({ type: "configure", selection: list, phase:room.phaseKey, plan:partyPlanKey(room.selection) }),
    emote = (i: number) => {
      if(latest.current?.phase==='playing'&&latest.current?.game?.id==='timing')return;
      action({ type: "emote", emote: i });
      setEmotesOpen(false);
    };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented || e.repeat || e.isComposing ||
        e.target instanceof HTMLElement && !!e.target.closest('[role="dialog"], [aria-modal="true"]') ||
        e.target instanceof HTMLElement && e.target.isContentEditable ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey
      )
        return;
      const i = Number(e.key) - 1;
      if(settingsOpen||rulesOpen||entry)return;
      if (i >= 0 && i < settings.favorites.length && session)
        emote(settings.favorites[i]);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [settings.favorites, session,settingsOpen,rulesOpen,entry]);
  const copy = async () => {
    const epoch=sessionEpoch.current;
    try {
      await navigator.clipboard.writeText(
        `${location.origin}/?room=${room.code}`,
      );
      if(epoch!==sessionEpoch.current)return;
      setNotice("Einladungslink kopiert");
      setTimeout(() => {if(epoch===sessionEpoch.current)setNotice("");}, 2500);
    } catch {
      if(epoch===sessionEpoch.current)setNotice(`Einladungslink: ${location.origin}/?room=${room.code}`);
    }
  };
  const leave = () => {
    invalidateSessionIO();
    entryRequestEpoch.current=null;
    setSession(null);
    sessionRef.current = null;
    setRoom(null);
    latest.current = null;
    setError("");
    setNotice("");
    try{localStorage.removeItem("olymp.session");}catch{}
    history.replaceState(null, "", "/");
    sound.music("");
  };
  const preference = (k: keyof AudioSettings, v: any) => {
    const next = normalizeAudioSettings({ ...settingsRef.current, [k]: v });
    settingsRef.current = next;
    sound.settings = next;
    setSettings(next);
    sound.init();
  };
  const prepareAudio = (event: { isTrusted: boolean }) => {
    if (!event.isTrusted || sound.settings.muted || (sound.ctx && sound.ctx.state !== "suspended")) return;
    // Let the target's input/action handlers run before cold audio setup.
    // Camera and reading controls may otherwise leave setup until a later snapshot.
    queueMicrotask(() => sound.init());
  };
  return (
    <div
      onClick={prepareAudio}
      onKeyDown={prepareAudio}
      className={`platform desktop-world ${room ? "in-room" : ""} ${desktopPanel ? "desktop-panel-open" : ""} ${['playing','reveal'].includes(room?.phase) && room?.game ? (isBoss(room.game.id) ? "immersive-boss" : "immersive-play") : ""}`}
      data-phase={room?.phase ?? "landing"}
      data-game={room?.game?.id}
    >
      <header className="site-header">
        <a
          className="brand"
          tabIndex={room?-1:undefined}
          href="/"
          onClick={(e) => {
            if (room) {
              e.preventDefault();
            }
          }}
        >
          <Mark />
          <span>
            PARTY<span className="brand-light">OLYMP</span>
            <small>DER SPIELEABEND. NEU AUFGELEGT.</small>
          </span>
        </a>
        <div className="header-actions">
          {room && (
            <ConnectionStatus connection={connection} updatedAt={lastRoomAt.current} rejoinUntil={me?.spectator?undefined:me?.rejoinUntil} now={now} error={connectionError} reconnect={()=>socket.current?.close()}/>
          )}
          <button
            className="icon-button"
            aria-label={settings.muted ? "Ton einschalten" : "Stummschalten"}
            onClick={() => preference("muted", !settings.muted)}
          >
            {settings.muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            className="icon-button"
            aria-label="Einstellungen"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>
      {error && !entry && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            aria-label="Fehlermeldung schließen"
          >
            ×
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      {!room ? (
        <main className="landing">
          <div className="hero-copy">
            <div className="pill">
              <span className="live-dot" /> DEINE FREUNDE. DEINE GAMESHOW.
            </div>
            <h1>
              Ein Abend.
              <br />
              Eine Welt.
              <br />
              <span>Eure Legende.</span>
            </h1>
            <p>
              Reist gemeinsam durch schwebende Reiche, meistert 21 Disziplinen
              und stellt euch drei Bossen. Eure private Gameshow beginnt hier.
            </p>
            <div className="hero-actions">
              <button
                className="primary"
                onClick={() => {
                  sound.init();
                  setEntry("create");
                }}
              >
                Olympiade erstellen <ArrowRight size={21} />
              </button>
              <button
                className="secondary"
                onClick={() => {
                  sound.init();
                  setEntry("join");
                }}
              >
                Mitspielen <Users size={20} />
              </button>
            </div>
            <button className="desktop-catalog-toggle secondary" onClick={() => setDesktopPanel(true)}>Alle Disziplinen ansehen</button>
            <div className="hero-facts">
              <span>
                <Users size={17} />
                2–12 Freunde
              </span>
              <span>
                <Check size={17} />
                Ohne Anmeldung
              </span>
              <span>
                <Clock size={17} />
                20–120 Minuten
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <AdventureStage hero/>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="visual-label">
              <span className="live-dot" /> READY FOR GAME NIGHT
            </span>
            <div className="floating-art art-one">
              <GameIcon id="dice" />
            </div>
            <div className="floating-art art-two">
              <GameIcon id="cards" />
            </div>
            <div className="floating-art art-three">
              <GameIcon id="code" />
            </div>
            <div className="hero-podium">
              {[1, 0, 2].map((i) => (
                <div
                  key={i}
                  className={`podium-character ${["gold", "silver", "bronze"][i]}`}
                >
                  {i === 0 && <span className="podium-star">✦</span>}
                  <Avatar
                    avatar={i}
                    color={["#bcff5c", "#9b8aff", "#ff7b9d"][i]}
                    emote={[4, 5, 3][i]}
                  />
                  <div className="podium-block">0{i + 1}</div>
                </div>
              ))}
            </div>
            <span className="visual-caption">GUT DRAUF. KNAPP VORN.</span>
            <span className="spark s1">✦</span>
            <span className="spark s2">+</span>
            <span className="spark s3">✧</span>
          </div>
          <section className="game-catalog">
            <button className="desktop-world-panel secondary" onClick={() => setDesktopPanel(false)}>Zurück zur Welt</button>
            <div className="section-title">
              <div>
                <span className="eyebrow">DEIN ABEND HAT VIELE SEITEN</span>
                <h2>Eine Lobby. 21 Disziplinen.</h2>
              </div>
              <span className="muted">
                Immer dieselbe Crew. Immer neue Chancen.
              </span>
            </div>
            <div className="catalog-grid">
              {catalog.map((g, i) => (
                <button
                  key={g.id}
                  className={`catalog-card tone-${i % 5} ${isBoss(g.id) ? "boss-catalog-card" : ""}`}
                  onClick={() => {
                    setRulesOpen(true);
                  }}
                >
                  <span className="catalog-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <GameIcon id={g.id} />
                  <h3>{g.name}</h3>
                  <p className={isBoss(g.id) ? "boss-catalog-badge" : ""}>
                    {g.tag}
                  </p>
                  <ArrowRight size={18} />
                </button>
              ))}
            </div>
          </section>
          <section className="how-it-works">
            {[
              [
                "01",
                "Crew zusammenbringen",
                "Raum erstellen, Link teilen, Name wählen. Schon seid ihr drin.",
              ],
              [
                "02",
                "Euren Mix auswählen",
                "21 Disziplinen. Drei eigene Bosskämpfe. Eure Reihenfolge.",
              ],
              [
                "03",
                "Gemeinsam aufs Podium",
                "Faire Punkte nach jedem Spiel. Bis zum Schluss ist alles drin.",
              ],
            ].map(([n, title, text]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </section>
          <footer className="landing-footer">
            <span>PARTY OLYMP · Mit Freunden wird’s besser.</span>
            <button onClick={() => setRulesOpen(true)}>
              Regeln & Fairness
            </button>
          </footer>
        </main>
      ) : (
        <div className="room-stage">
          <main
            className={`room-shell phase-${room.phase} ${crewOpen ? "crew-expanded" : ""}`}
          >
            <div className="room-top">
              <div>
                <span className="eyebrow">EURE PRIVATE GAMESHOW</span>
                <h1>
                  {room.phase === "lobby"
                    ? "Die Crew sammelt sich."
                    : room.phase === "podium"
                      ? "Das ist euer Moment."
                      : room.phase === "paused"
                        ? "Kurze Verschnaufpause."
                        : partyStep(room.phase)}
                </h1>
              </div>
              <button
                className="desktop-crew-toggle"
                aria-expanded={crewOpen}
                aria-controls="room-crew"
                onClick={() => setCrewOpen(!crewOpen)}
              >
                {crewOpen ? "Crew schließen ×" : `Crew · ${room.players.filter((p:any)=>!p.spectator).length}`}
              </button>
              <button className="room-code" onClick={copy}>
                <span>RAUMCODE</span>
                <strong>{room.code}</strong>
                <Copy size={17} />
              </button>
            </div>
            <div className="room-layout">
              <aside className="crew-panel" id="room-crew">
                <div className="panel-label">
                  <h2>Eure Crew</h2>
                  <span>
                    {room.players.filter((p: any) => !p.spectator).length}/12
                  </span>
                </div>
                <div className="crew-list">
                  {room.players.filter((p:any)=>!p.kicked).sort((a:any,b:any)=>room.game?.id==="dice" ? (room.game.opponents?.[b.id]?.total??0)-(room.game.opponents?.[a.id]?.total??0) : 0).map((p: any) => {
                    return (
                      <div
                        className={`player-tile ${p.id === me?.id ? "self" : ""} ${!p.connected ? "offline" : ""}`}
                        key={p.id}
                      >
                        <div className="avatar-wrap">
                          <Avatar
                            avatar={p.avatar}
                            look={p.look}
                            color={p.color}
                          />
                        </div>
                        <div className="player-info">
                          <strong>
                            {p.name}
                            {p.id === me?.id && <small> DU</small>}
                          </strong>
                          <span>
                            {room.game?.id === "dice" && room.game.opponents?.[p.id] ? `${room.game.opponents[p.id].total} Punkte` : p.spectator
                              ? "Zuschauer"
                              : !p.connected
                                ? "Wiederverbindung …"
                                : p.id === room.host
                                  ? "Gastgeber"
                                  : p.ready
                                    ? "Bereit"
                                    : "Spieler"}
                          </span>
                        </div>
                        {p.ready && <Check className="ready-check" size={17} />}
                        {host && p.id!==me?.id && <button className="player-kick" aria-label={`${p.name} aus dem Raum entfernen`} onClick={()=>action({type:"kick",player:p.id})}>✕</button>}
                        <button
                          className="player-mute"
                          aria-label={`${p.name} lokal stummschalten`}
                          onClick={() =>
                            preference(
                              "mutedPlayers",
                              settings.mutedPlayers.includes(p.id)
                                ? settings.mutedPlayers.filter(
                                    (x) => x !== p.id,
                                  )
                                : [...settings.mutedPlayers, p.id],
                            )
                          }
                        >
                          {settings.mutedPlayers.includes(p.id) ? (
                            <VolumeX size={13} />
                          ) : (
                            <Volume2 size={13} />
                          )}
                        </button>
                        {host &&
                          p.id !== me?.id &&
                          !p.spectator &&
                          room.phase === "lobby" && (
                            <button
                              className="transfer"
                              onClick={() =>
                                action({ type: "transfer", player: p.id })
                              }
                              title="Gastgeberrolle übertragen"
                            >
                              ♛
                            </button>
                          )}
                      </div>
                    );
                  })}
                </div>
                <div className="crew-note">
                  <span className="live-dot" />
                  <p>
                    {room.phase === "lobby"
                      ? "Alle da? Meldet euch bereit und los geht’s."
                      : "Refresh ist okay. Wiederbeitrittsfrist: 90 Sekunden."}
                  </p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setRulesOpen(true)}
                >
                  So funktioniert die Wertung ↗
                </button>
                {room.participantIds.length > 0 && (
                  <Scoreboard room={room} me={me?.id} compact />
                )}
              </aside>
              <section className="stage-panel">
                {!['lobby','playing','podium'].includes(room.phase)&&<div className="party-phase-label" role="status"><span>{partyStep(room.phase)}</span><strong>Spiel {room.index+1} / {room.selection.length}</strong></div>}
                {['lobby','podium'].includes(room.phase) && <button className="desktop-world-panel secondary" aria-expanded={desktopPanel} onClick={() => setDesktopPanel(v => !v)}>{desktopPanel ? 'Schließen' : room.phase === 'lobby' ? (host?'Spielplan ändern':'Spielplan ansehen') : 'Ergebnisse & Revanche'}</button>}
                {room.phase === "lobby" && (
                  <>
                    <div className="lobby-adventure"><AdventureStage room={room} me={me?.id} now={now}/></div>
                    <section className="party-lobby-intro"><span className="eyebrow">EURE OLYMPIADE</span><h1>Ein Abend. Eure Crew.</h1><p>{host?'Lade deine Freunde ein und wähle euren Spielplan.':'Der Gastgeber stellt euren Spielplan zusammen.'} Danach melden sich alle bereit.</p><ol aria-label="Eure nächsten Spiele">{room.selection.slice(0,5).map((s:Selection,i:number)=><li key={i}><span>{i+1}</span>{byId(s.id).name}</li>)}</ol>{room.selection.length>5&&<small>+ {room.selection.length-5} weitere Spiele im Spielplan</small>}<p className="party-plan-note">Diese Reihenfolge gilt für eure gemeinsame Reise.</p></section>
                    <OlympiadPlanner
                      selection={room.selection}
                      host={host}
                      players={
                        room.players.filter((p: any) => !p.spectator).length
                      }
                      configure={configure}
                    />
                    <LobbyParticipation room={room} me={me} act={action}/>
                    <LobbyLaunch room={room} me={me} host={host} act={action}/>
                  </>
                )}
                {host && ['travel','rules','countdown','playing','reveal'].includes(room.phase) && <HostTestSkip room={room} act={action}/>}
                {['travel','wheel','rules','standings','paused'].includes(room.phase)&&<PartyJourney room={room} me={me?.id} now={now} reduced={settings.motion} act={action}/>}
                {room.phase === "rules" && (
                  <div className="discipline-intro">
                    <span className="pill">
                      DISZIPLIN {room.index + 1} / {room.selection.length}
                    </span>
                    <GameIcon id={room.selection[room.index].id} large />
                    <h2>{byId(room.selection[room.index].id).name}</h2>
                    <p className="intro-description">
                      {byId(room.selection[room.index].id).description}
                    </p>
                    <div className="rules-cards">
                      <div>
                        <span>SO SPIELST DU</span>
                        <p>{byId(room.selection[room.index].id).controls}</p>
                      </div>
                      <div>
                        <span>SO GEWINNST DU</span>
                        <p>{byId(room.selection[room.index].id).win}</p>
                      </div>
                    </div>
                    <details className="briefing-rules"><summary>Alle Spielregeln</summary><p>{byId(room.selection[room.index].id).rules}</p></details>
                    <p className="muted briefing-format">{briefingFormat(room.selection[room.index])}</p>
                    <GamePreparation key={room.phaseKey} room={room} me={me} now={now} act={action}/>
                  </div>
                )}
                {room.phase === "countdown" && (
                  <div className="countdown-stage adventure-countdown">
                    {!isBoss(room.selection[room.index].id)?<AdventureStage room={{...room,game:{id:room.selection[room.index].id,stage:"intro"}}} me={me?.id} now={now}/>:<div className="party-countdown-map"><PartyJourney room={room} me={me?.id} now={now} reduced={settings.motion} act={action}/></div>}
                    <span className="eyebrow">GLEICH GEHT’S LOS!</span>
                    <div
                      className="countdown-number"
                      key={countdownValue(room.deadline, now)}
                    >
                      {countdownValue(room.deadline, now) || "LOS!"}
                    </div>
                    <h2>{byId(room.selection[room.index].id).name}</h2>
                    <p>Gleich geht’s los.</p>
                  </div>
                )}
                {room.phase === "playing" && room.game && (
                  <>
                    <TimeSignals room={room} now={now} me={me?.id??""} />
                    <div className="game-topline">
                      <strong className="party-game-name">{byId(room.game.id).name}</strong>
                      <span>
                        DISZIPLIN {room.index + 1}/{room.selection.length}
                      </span>
                      <strong>
                        {isBoss(room.game.id) ? "ANGRIFF" : "RUNDE"}{" "}
                        {room.game.round}/{room.game.totalRounds}
                      </strong>
                      <span className="timer">
                        <Clock size={17} />
                        {gameClockText(room.game, now)}
                      </span>
                    </div>
                  </>
                )}
                {['playing','reveal'].includes(room.phase)&&room.game&&(
                    <div className={`game-camera ${room.phase==='reveal'?'party-results-world':''}`} inert={room.phase==='reveal'||undefined} ref={gameCamera}>
                      <GameBoard
                        room={room}
                        me={me?.id}
                        now={now}
                        act={(a) =>
                          action({
                            type: "game",
                            phase: room.phaseKey,
                            action: a,
                          })
                        }
                      />
                    </div>
                )}
                {room.phase === "reveal" && (
                  <ScoreShow room={room} me={me?.id} now={now} />
                )}
                {["standings", "paused"].includes(room.phase) && (
                  <div className="standings-stage">
                    <span className="eyebrow">
                      {room.phase === "paused" ? "PAUSE" : "NEUE GESAMTWERTUNG"}
                    </span>
                    <h2>{room.phase==='paused'?'Zeit für eine Pause.':room.index+1>=room.selection.length?'Alle Spiele geschafft.':'So steht eure Crew.'}</h2>
                    <p className="score-explainer">
                      {room.index+1>=room.selection.length?'Gleich beginnt eure Siegerehrung.':`Als Nächstes: ${byId(room.selection[room.index+1].id).name}.`}
                    </p>
                    <details className="discipline-preview"><summary>Rückblick & Moderation</summary><GameShow key={`recap-${room.history.at(-1)?.id}`} room={room} now={now} mode="recap" /></details>
                    <Scoreboard room={room} me={me?.id} />
                    {host && <HostProgressControls room={room} act={action}/>}
                    <p className="muted">
                      {room.phase === "paused"
                        ? "Der Gastgeber setzt eure Olympiade fort."
                        : `Weiter in ${Math.max(0, Math.ceil((room.deadline - now) / 1000))} Sekunden.`}
                    </p>
                  </div>
                )}
                {room.phase === "podium" && (
                  <div className="finale">
                    <VictoryCeremony key={room.startedAt} me={me?.id} players={room.standings} reduced={settings.motion} intense={settings.intense} />
                    <div className="finale-details">
                    <Scoreboard room={room} me={me?.id} />
                    <div className="highlights">
                      <div>
                        <span>DISZIPLINSIEGE</span>
                        <strong>
                          {
                            room.standings.reduce((a: any, b: any) =>
                              a.wins >= b.wins ? a : b,
                            ).name
                          }
                        </strong>
                        <p>
                          {Math.max(...room.standings.map((p: any) => p.wins))}{" "}
                          erste Plätze
                        </p>
                      </div>
                      <div>
                        <span>EURE DISTANZ</span>
                        <strong>{room.history.length} Disziplinen</strong>
                        <p>{room.participantIds.length} Freunde am Start</p>
                      </div>
                      <div>
                        <span>KNAPPES FINALE</span>
                        <strong>
                          {(
                            room.standings[0].points - room.standings[1].points
                          ).toFixed(1)}{" "}
                          Punkte
                        </strong>
                        <p>zwischen den ersten beiden Plätzen</p>
                      </div>
                    </div>
                    <details className="history-table">
                      <summary>Alle Disziplinergebnisse ansehen</summary>
                      {room.history.map((h: any, i: number) => (
                        <div key={h.id}>
                          <h3>
                            {i + 1}. {byId(h.game).name}
                          </h3>
                          {h.results.map((r: any) => (
                            <p key={r.id}>
                              {
                                room.players.find((p: any) => p.id === r.id)
                                  ?.name
                              }
                              :{" "}
                              {h.game === "code"
                                ? `${r.detail?.solvedRounds ?? 0} Codes gelöst · ${r.detail?.totalGuesses ?? 0} Versuche`
                                : `${r.raw.toFixed(2)} Rohpunkte`}{" "}
                              → {(r.points ?? 0).toFixed(1)} Olympiadenpunkte
                            </p>
                          ))}
                        </div>
                      ))}
                    </details>
                    <RematchBoard room={room} me={me} act={action}/>
                    </div>
                  </div>
                )}
                {['paused','podium'].includes(room.phase)&&<DiceResultsArchive history={room.history} players={room.players} me={me?.id}/>}
              </section>
            </div>
          </main>
          <div
            className="live-reactions"
            aria-label="Reaktionen der Crew"
            aria-live="polite"
          >
            {room.emotes
              .filter(
                (e: any) =>
                  !settings.mutedPlayers.includes(e.player) &&
                  now - e.at < 5000 &&
                  room.emotes.findLast((last: any) => last.player === e.player)
                    ?.id === e.id,
              )
              .map((reaction: any) => {
                const sender = room.players.find(
                  (p: any) => p.id === reaction.player,
                );
                return (
                  <div
                    className="live-emote"
                    key={reaction.id}
                    title={emoteNames[reaction.emote]}
                  >
                    <Avatar
                      avatar={sender?.avatar}
                      look={sender?.look}
                      color={sender?.color}
                      emote={reaction.emote}
                    />
                    <span>{sender?.name}</span>
                  </div>
                );
              })}
          </div>
          <div className="emote-dock">
            <button
              className="emote-toggle"
              aria-label="Alle Emotes"
              aria-expanded={emotesOpen}
              onClick={() => setEmotesOpen(!emotesOpen)}
            >
              <Smile size={21} />
              <span>Reaktionen</span>
            </button>
            <div className="quick-emotes">
              {settings.favorites.map((i, k) => (
                <button
                  key={i}
                  title={`${emoteNames[i]} · Taste ${k + 1}`}
                  aria-label={emoteNames[i]}
                  onClick={() => emote(i)}
                >
                  <Avatar
                    color={me?.color}
                    avatar={me?.avatar}
                    look={me?.look}
                    emote={i}
                  />
                  <kbd>{k + 1}</kbd>
                </button>
              ))}
            </div>
            {emotesOpen && (
              <EmotePicker
                look={me?.look}
                avatar={me?.avatar}
                color={me?.color}
                onSend={emote}
                favorites={settings.favorites}
                onFavorites={(ids) => preference("favorites", ids)}
                onClose={() => setEmotesOpen(false)}
              />
            )}
          </div>
        </div>
      )}
      {entry && (
        <div className="modal-backdrop" onClick={closeEntry}>
          <section
            className="entry-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="entry-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={closeEntry}
              aria-label="Schließen"
            >
              ×
            </button>
            <span className="eyebrow">DEIN PLATZ IN DER CREW</span>
            <h2 id="entry-title">
              {entry === "create"
                ? "Bühne frei für euch."
                : "Schön, dass du da bist."}
            </h2>
            {error&&<p className="submission-error" role="alert">{error}</p>}
            <form
              noValidate
              aria-busy={busy}
              onSubmit={(e) => {
                e.preventDefault();
                void enter(entry);
              }}
            >
              <fieldset className="entry-fields" disabled={busy} aria-label="Dein Platz in der Crew">
              <label>
                Dein Name
                <input
                  id="entry-name"
                  autoFocus
                  required
                  autoComplete="nickname"
                  value={name}
                  maxLength={20}
                  placeholder="Wie heißt du?"
                  aria-invalid={!!entryErrors.name}
                  aria-describedby={entryErrors.name?'entry-name-error':undefined}
                  onChange={(e) => {setName(e.target.value);setEntryErrors(previous=>({...previous,name:undefined}));setError("");}}
                />
                {entryErrors.name&&<small id="entry-name-error" className="entry-field-error" role="alert">{entryErrors.name}</small>}
              </label>
              {entry === "join" && (
                <label>
                  Raumcode
                  <input
                    id="entry-code"
                    required
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    value={joinCode}
                    maxLength={6}
                    pattern="[A-Za-z2-9]{6}"
                    placeholder="ABC234"
                    className="code-input"
                    aria-invalid={!!entryErrors.code}
                    aria-describedby="entry-code-hint"
                    onChange={(e) => {setJoinCode(e.target.value.toUpperCase());setEntryErrors(previous=>({...previous,code:undefined}));setError("");}}
                    onPaste={(event)=>{
                      const text=event.clipboardData.getData('text').trim();
                      let code=text;
                      try{code=new URL(text).searchParams.get('room')??text;}catch{}
                      code=code.replace(/\s+/g,'').toUpperCase();
                      if(/^[A-Z2-9]{6}$/.test(code)){event.preventDefault();setJoinCode(code);setEntryErrors(previous=>({...previous,code:undefined}));setError("");}
                    }}
                  />
                  <small id="entry-code-hint" className={entryErrors.code?'entry-field-error':undefined} role={entryErrors.code?'alert':undefined}>{entryErrors.code??'6 Zeichen · Auch ein Einladungslink lässt sich hier einfügen.'}</small>
                </label>
              )}
              <details className="entry-character">
                <summary><Avatar look={look}/><span>Dein Charakter<small>Aussehen anpassen</small></span></summary>
                <CharacterPicker value={look} onChange={setLook} />
              </details>
              </fieldset>
              <button className="primary wide" disabled={busy}>
                {busy
                  ? "Einen Moment …"
                  : error ? "Erneut versuchen" : entry === "create"
                    ? "Olympiade erstellen"
                    : "Mitspielen"}
                <ArrowRight size={20} />
              </button>
              <p className="muted">
                Keine Registrierung. Einfach zusammen spielen.
              </p>
            </form>
          </section>
        </div>
      )}
      {settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <section
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Einstellungen"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSettingsOpen(false)}
              aria-label="Schließen"
            >
              ×
            </button>
            <h2>Dein Spielgefühl.</h2>
            {room?.phase==='playing'&&<p className="muted">Das Minispiel läuft im Hintergrund weiter.</p>}
            <label className="party-graphics-setting">Grafikqualität<select aria-label="Grafikqualität" value={graphicsQuality} onChange={e=>setGraphicsQuality(validQuality(e.target.value))}><option value="auto">Automatisch</option><option value="high">Hoch</option><option value="medium">Mittel</option><option value="low">Sparsam</option></select></label>
            {(
              [
                ["master", "Gesamtlautstärke"],
                ["music", "Musik"],
                ["effects", "Spieleffekte"],
                ["emotes", "Emote-Sounds"],
              ] as const
            ).map(([key, label]) => (
              <label className="volume-control" key={key}>
                {label}
                <input
                  aria-label={label}
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={settings[key]}
                  onChange={(e) => preference(key, Number(e.target.value))}
                />
                <output>{Math.round(settings[key] * 100)}%</output>
              </label>
            ))}
            <label className="check-setting">
              <input
                type="checkbox"
                checked={settings.muted}
                onChange={(e) => preference("muted", e.target.checked)}
              />
              Alles stumm
            </label>
            <label className="check-setting">
              <input
                type="checkbox"
                checked={settings.motion}
                onChange={(e) => preference("motion", e.target.checked)}
              />
              Weniger Bewegung
            </label>
            <label className="check-setting">
              <input
                type="checkbox"
                checked={settings.intense}
                onChange={(e) => preference("intense", e.target.checked)}
              />
              Licht- und Partikeleffekte
            </label>
            {room&&<button className="secondary" onClick={()=>{setSettingsOpen(false);setRulesOpen(true);}}>Wertung & Spielregeln</button>}
            <PartyCredits/>
            {room&&<button className="text-button party-leave" onClick={leave}><LogOut size={16}/> Raum verlassen</button>}
          </section>
        </div>
      )}
      {rulesOpen && (
        <div className="modal-backdrop" onClick={() => setRulesOpen(false)}>
          <section
            className="rules-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Regeln und Fairness"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setRulesOpen(false)}
              aria-label="Schließen"
            >
              ×
            </button>
            <span className="eyebrow">FAIR. TRANSPARENT. GEMEINSAM.</span>
            <h2>Gleiche Chancen für jede Disziplin.</h2>
            <p>
              Jedes Spiel liefert eine Rangfolge. Daraus entstehen
              Olympiadenpunkte: erster Platz 100, letzter 0. Alle Plätze
              dazwischen liegen gleichmäßig verteilt. Bosskämpfe zählen
              dreifach: erster Platz 300, letzter 0 Olympiadenpunkte.
            </p>
            <div className="formula">
              100 × (Teilnehmer − Platz) / (Teilnehmer − 1)
            </div>
            <p>
              Gleichstand? Ihr teilt die Punkte der belegten Plätze. Bei vier
              Spielern bekommen zwei gemeinsame Sieger jeweils 83,33 Punkte (100
              und 66,67 geteilt).
            </p>
            <p>
              Die Teilnehmerzahl bleibt fest. Keine Teilnahme bedeutet 0 Punkte.
              Ohne gültiges Ergebnis bekommt niemand Punkte. Normale Disziplinen
              zählen einfach, Bosskämpfe dreifach.
            </p>
            <p>
              Alle starten mit drei gleichen Relikten. Vor einer Disziplin kannst
              du eines einsetzen: Goldener Lorbeer erhöht deine Punkte um 25 %,
              Phönixfeder garantiert mindestens 40 Punkte, Sternensplitter bringt
              20 Zusatzpunkte für die obere Hälfte. Bei Bossen zählen auch diese
              Werte dreifach. Ohne gültiges Ergebnis gibt es keinen Reliktbonus.
              Nach jeder zweiten Etappe vor dem Finale wählst du ein neues Relikt
              aus einer Schatztruhe. Im Rucksack ist Platz für fünf Relikte.
            </p>
            <p>
              Gleiche Gesamtpunkte ergeben denselben Platz.
              Bei Gleichstand an der Spitze teilt ihr den Siegerplatz.
              Intern rechnen wir ungerundet.
            </p>
            <p>
              Bei Verbindungsproblemen bleibt deine Identität erhalten.
              Eingabefristen laufen weiter. Nach 90 Sekunden wechselt die
              Gastgeberrolle. Neue Gäste schauen bis zur Revanche zu.
            </p>
            <details>
              <summary>Alle Spielregeln</summary>
              {catalog.map((g) => (
                <div key={g.id}>
                  <h3>{g.name}</h3>
                  <p>
                    {g.controls} {g.rules}
                  </p>
                </div>
              ))}
            </details>
            <button className="primary" onClick={() => setRulesOpen(false)}>
              Alles klar
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
function Scoreboard({
  room,
  me,
  compact = false,
}: {
  room: any;
  me: string;
  compact?: boolean;
}) {
  if (!compact && ["standings", "paused"].includes(room.phase))
    return <RankingShow room={room} me={me} />;
  return (
    <div
      className={`scoreboard ${compact ? "compact" : ""}`}
      style={{ height: room.standings.length * (compact ? 42 : 76) }}
    >
      {room.standings.map((p: any, index: number) => {
        const delta = p.previousRank - p.rank;
        return (
          <div
            key={p.id}
            className={`scoreboard-row ${p.id === me ? "self" : ""}`}
            style={{
              transform: `translateY(${index * (compact ? 42 : 76)}px)`,
            }}
          >
            <span className="rank">{String(p.rank).padStart(2, "0")}</span>
            <Avatar avatar={p.avatar} look={p.look} color={p.color} />
            <strong>
              {p.name}
              {p.id === me && <small> DU</small>}
            </strong>
            <span className="rank-change">
              {delta > 0 ? `↑${delta}` : delta < 0 ? `↓${-delta}` : "—"}
            </span>
            <span className="last-points">+{p.lastPoints.toFixed(1)}</span>
            <b>
              <AnimatedPoints
                points={p.points}
                previous={p.points - p.lastPoints}
              />
            </b>
          </div>
        );
      })}
    </div>
  );
}

function AnimatedPoints({
  points,
  previous,
}: {
  points: number;
  previous: number;
}) {
  const [value, setValue] = useState(previous),
    current = useRef(previous);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const reduced =
      preference.matches ||
      document.documentElement.dataset.motion === "reduced";
    if (reduced) {
      setValue(points);
      current.current = points;
      return;
    }
    const from = current.current,
      start = performance.now();
    let frame = 0;
    const update = (now: number) => {
      if (preference.matches || document.documentElement.dataset.motion === "reduced") {
        current.current = points;
        setValue(points);
        return;
      }
      const t = Math.min(1, (now - start) / 2400);
      current.current = from + (points - from) * (1 - (1 - t) ** 3);
      setValue(current.current);
      if (t < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [points]);
  return value.toFixed(1);
}
