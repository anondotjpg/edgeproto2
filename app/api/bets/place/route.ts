import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { privyServer } from "@/lib/privy-server";

type PlaceBetBody = {
  accountIds?: string[];
  gameId?: string;
  league?: string;
  market?: string;
  selection?: string;
  odds?: number;
  stake?: number;
};

export async function POST(req: Request) {
  try {
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verifiedClaims = await privyServer
      .utils()
      .auth()
      .verifyAuthToken(accessToken);

    const privyUserId = verifiedClaims.user_id;

    if (!privyUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as PlaceBetBody;

    const accountIds = body.accountIds ?? [];
    const gameId = body.gameId;
    const league = body.league;
    const market = body.market;
    const selection = body.selection;
    const odds = Number(body.odds);
    const stake = Number(body.stake);

    if (!accountIds.length) {
      return NextResponse.json(
        { error: "Select at least one account." },
        { status: 400 }
      );
    }

    if (!gameId || !league || !market || !selection) {
      return NextResponse.json(
        { error: "Missing bet details." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(odds) || odds === 0) {
      return NextResponse.json({ error: "Invalid odds." }, { status: 400 });
    }

    if (!Number.isFinite(stake) || stake <= 0) {
      return NextResponse.json({ error: "Invalid stake." }, { status: 400 });
    }

    const { data: dbUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("privy_user_id", privyUserId)
      .maybeSingle();

    if (userError) throw userError;

    if (!dbUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const placedBetIds: string[] = [];

    for (const accountId of accountIds) {
      const { data: betId, error: rpcError } = await supabaseAdmin.rpc(
        "place_bet_for_account",
        {
          p_user_id: dbUser.id,
          p_account_id: accountId,
          p_game_id: gameId,
          p_league: league,
          p_market: market,
          p_selection: selection,
          p_odds: odds,
          p_stake: stake,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      placedBetIds.push(betId as string);
    }

    return NextResponse.json({
      ok: true,
      betIds: placedBetIds,
    });
  } catch (error) {
    console.error("Place bet error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to place bet." },
      { status: 500 }
    );
  }
}