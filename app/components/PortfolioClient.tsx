"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

type AccountJoin = {
  plan_key: string;
  plan_size: number;
} | null;

type Bet = {
  id: string;
  account_id: string;
  game_id: string;
  league: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  potential_profit: number;
  potential_payout: number;
  status: string;
  result: string | null;
  settlement_amount: number | null;
  placed_at: string;
  settled_at: string | null;
  challenge_accounts: AccountJoin;
};

type SettleResult = "won" | "lost" | "void" | "cashed_out";

function formatOdds(odds: number) {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

function formatMoney(value: number | null | undefined) {
  const safeValue = Number(value ?? 0);

  return `$${safeValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Date(date).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getAccountLabel(bet: Bet) {
  const size = bet.challenge_accounts?.plan_size;

  if (!size) return "Account";

  return `$${Number(size).toLocaleString()} Account`;
}

function resultLabel(status: string) {
  if (status === "won") return "Won";
  if (status === "lost") return "Lost";
  if (status === "void") return "Void";
  if (status === "cashed_out") return "Cashed Out";
  return status;
}

function BetCard({
  bet,
  active,
  onSettle,
  isSettling,
}: {
  bet: Bet;
  active?: boolean;
  onSettle?: (betId: string, result: SettleResult, cashoutAmount?: number) => void;
  isSettling?: boolean;
}) {
  const [cashoutOpen, setCashoutOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState("");

  const pnl =
    bet.status === "won"
      ? Number(bet.potential_profit)
      : bet.status === "lost"
        ? -Number(bet.stake)
        : bet.status === "void"
          ? 0
          : bet.status === "cashed_out"
            ? Number(bet.settlement_amount ?? 0) - Number(bet.stake)
            : null;

  return (
    <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            {getAccountLabel(bet)}
          </div>

          <h3 className="mt-2 truncate text-[22px] font-semibold tracking-tight text-zinc-100">
            {bet.selection}
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            {bet.league.toUpperCase()} · {bet.market}
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-zinc-800 px-3 py-1 text-[12px] font-medium text-zinc-400">
          {resultLabel(bet.status)}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-800 pt-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            Odds
          </div>
          <div className="mt-1 text-sm font-semibold text-zinc-100">
            {formatOdds(bet.odds)}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            Stake
          </div>
          <div className="mt-1 text-sm font-semibold text-zinc-100">
            {formatMoney(bet.stake)}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            Payout
          </div>
          <div className="mt-1 text-sm font-semibold text-zinc-100">
            {formatMoney(bet.potential_payout)}
          </div>
        </div>
      </div>

      {!active ? (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
              Settled
            </div>
            <div className="mt-1 text-sm font-semibold text-zinc-100">
              {formatMoney(bet.settlement_amount)}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
              P/L
            </div>
            <div className="mt-1 text-sm font-semibold text-zinc-100">
              {pnl === null ? "—" : formatMoney(pnl)}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-[12px] text-zinc-500">
          {active ? "Placed" : "Settled"}{" "}
          {formatDate(active ? bet.placed_at : bet.settled_at)}
        </div>
      </div>

      {active && onSettle ? (
        <div className="mt-5 border-t border-zinc-800 pt-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onSettle(bet.id, "won")}
              disabled={isSettling}
              className="rounded-xl border border-zinc-700 px-3 py-2 text-[12px] font-medium text-zinc-200 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Won
            </button>

            <button
              type="button"
              onClick={() => onSettle(bet.id, "lost")}
              disabled={isSettling}
              className="rounded-xl border border-zinc-700 px-3 py-2 text-[12px] font-medium text-zinc-200 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Lost
            </button>

            <button
              type="button"
              onClick={() => onSettle(bet.id, "void")}
              disabled={isSettling}
              className="rounded-xl border border-zinc-700 px-3 py-2 text-[12px] font-medium text-zinc-200 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Void
            </button>
          </div>

          <div className="mt-3">
            {!cashoutOpen ? (
              <button
                type="button"
                onClick={() => setCashoutOpen(true)}
                disabled={isSettling}
                className="w-full rounded-xl border border-zinc-800 px-3 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cashout
              </button>
            ) : (
              <div className="flex gap-2">
                <div className="flex h-10 min-w-0 flex-1 items-center rounded-xl border border-zinc-800 bg-black/30 px-3">
                  <span className="text-sm text-zinc-500">$</span>
                  <input
                    value={cashoutAmount}
                    onChange={(event) =>
                      setCashoutAmount(
                        event.target.value.replace(/[^0-9.]/g, "")
                      )
                    }
                    placeholder="0.00"
                    inputMode="decimal"
                    className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold text-white outline-none placeholder:text-zinc-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onSettle(bet.id, "cashed_out", Number(cashoutAmount))
                  }
                  disabled={isSettling || !Number(cashoutAmount)}
                  className="rounded-xl bg-zinc-100 px-3 py-2 text-[12px] font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function PortfolioClient() {
  const { ready, authenticated, login, getAccessToken } = usePrivy();

  const [openBets, setOpenBets] = useState<Bet[]>([]);
  const [pastBets, setPastBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingBetId, setSettlingBetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const activeRisk = openBets.reduce((sum, bet) => sum + Number(bet.stake), 0);

    const possiblePayout = openBets.reduce(
      (sum, bet) => sum + Number(bet.potential_payout),
      0
    );

    const realizedPnl = pastBets.reduce((sum, bet) => {
      if (bet.status === "won") return sum + Number(bet.potential_profit);
      if (bet.status === "lost") return sum - Number(bet.stake);
      if (bet.status === "void") return sum;
      if (bet.status === "cashed_out") {
        return sum + (Number(bet.settlement_amount ?? 0) - Number(bet.stake));
      }

      return sum;
    }, 0);

    return {
      activeCount: openBets.length,
      pastCount: pastBets.length,
      activeRisk,
      possiblePayout,
      realizedPnl,
    };
  }, [openBets, pastBets]);

  async function loadPortfolio() {
    if (!ready) return;

    if (!authenticated) {
      setOpenBets([]);
      setPastBets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const accessToken = await getAccessToken();

      const response = await fetch("/api/portfolio/mine", {
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {},
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to load portfolio.");
      }

      setOpenBets(data.openBets ?? []);
      setPastBets(data.pastBets ?? []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to load portfolio.");
    } finally {
      setLoading(false);
    }
  }

  async function settleBet(
    betId: string,
    result: SettleResult,
    cashoutAmount?: number
  ) {
    try {
      setSettlingBetId(betId);
      setError(null);

      const accessToken = await getAccessToken();

      const response = await fetch("/api/bets/settle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {}),
        },
        body: JSON.stringify({
          betId,
          result,
          cashoutAmount: result === "cashed_out" ? cashoutAmount : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to settle bet.");
      }

      await loadPortfolio();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to settle bet.");
    } finally {
      setSettlingBetId(null);
    }
  }

  useEffect(() => {
    loadPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated]);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 md:py-10">
      <div className="mb-8">
        <h1 className="text-[34px] font-semibold tracking-tight text-zinc-100">
          Portfolio
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          View active and past positions across your accounts.
        </p>
      </div>

      {!ready || loading ? (
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-500">
          Loading portfolio...
        </div>
      ) : !authenticated ? (
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-xl font-semibold text-zinc-100">
            Sign in to view your portfolio
          </h2>
          <button
            type="button"
            onClick={login}
            className="mt-4 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950"
          >
            Sign in
          </button>
        </div>
      ) : (
        <>
          {error ? (
            <div className="mb-5 rounded-[20px] border border-red-950 bg-red-950/20 p-4 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Active Positions
              </div>
              <div className="mt-2 text-3xl font-semibold text-zinc-100">
                {totals.activeCount}
              </div>
            </div>

            <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Past Positions
              </div>
              <div className="mt-2 text-3xl font-semibold text-zinc-100">
                {totals.pastCount}
              </div>
            </div>

            <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Active Risk
              </div>
              <div className="mt-2 text-3xl font-semibold text-zinc-100">
                {formatMoney(totals.activeRisk)}
              </div>
            </div>

            <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Realized P/L
              </div>
              <div className="mt-2 text-3xl font-semibold text-zinc-100">
                {formatMoney(totals.realizedPnl)}
              </div>
            </div>
          </div>

          <section>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-zinc-100">
              Active Positions
            </h2>

            {openBets.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {openBets.map((bet) => (
                  <BetCard
                    key={bet.id}
                    bet={bet}
                    active
                    onSettle={settleBet}
                    isSettling={settlingBetId === bet.id}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-500">
                No active positions yet.
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-zinc-100">
              Past Positions
            </h2>

            {pastBets.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {pastBets.map((bet) => (
                  <BetCard key={bet.id} bet={bet} />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-500">
                No past positions yet.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}