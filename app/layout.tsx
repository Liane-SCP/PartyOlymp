import type { Metadata } from "next";
import "./globals.css";
import "./refinements.css";
import "./showtime.css";
import "./gameplay.css";
import "./game-feel.css";
import "./desktop.css";
import "./party-games.css";
import "./categories.css";
import "./trio-games.css";
import "./auction-jury.css";
import "./game-fixes.css";
import "./code-game.css";
import "./characters.css";
import "./boss-games.css";
import "./boss-hud.css";
import "./boss-venues.css";
import "./boss-dice.css";
import "./game-hud.css";
import "./planner.css";
import "./ceremony.css";
import "./rematch.css";
import "./journey.css";
import "./atlas.css";
import "./atlas-nature.css";
import "./adventure.css";
import "./shopping-tour.css";
import "./casino-place.css";
import "./race-adventure.css";
import "./dice-adventure.css";
import "./dice-results.css";
import "./card-adventure.css";
import "./viewport-world.css";
import "./party-flow.css";

export const metadata: Metadata = {
  title: "Party Olymp · Dein Spieleabend. Neu aufgelegt.",
  description:
    "21 Disziplinen mit drei epischen Bosskämpfen, eine Crew, ein Podium. Eure private Multiplayer-Olympiade im Browser.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
