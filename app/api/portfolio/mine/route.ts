import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { privyServer } from "@/lib/privy-server";

export async function GET() {
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

    const { data: dbUser, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("privy_user_id", privyUserId)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!dbUser) {
      return NextResponse.json({
        openBets: [],
        pastBets: [],
      });
    }

    const { data: bets, error: betsError } = await supabaseAdmin
      .from("bets")
      .select(
        `
        id,
        account_id,
        game_id,
        league,
        market,
        selection,
        odds,
        stake,
        potential_profit,
        potential_payout,
        status,
        result,
        settlement_amount,
        placed_at,
        settled_at,
        challenge_accounts (
          plan_key,
          plan_size
        )
      `
      )
      .eq("user_id", dbUser.id)
      .order("placed_at", { ascending: false });

    if (betsError) {
      throw betsError;
    }

    const allBets = bets ?? [];

    return NextResponse.json({
      openBets: allBets.filter((bet) => bet.status === "open"),
      pastBets: allBets.filter((bet) => bet.status !== "open"),
    });
  } catch (error) {
    console.error("Portfolio load error:", error);

    return NextResponse.json(
      { error: "Unable to load portfolio." },
      { status: 500 }
    );
  }
}