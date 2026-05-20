import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, ThumbsUp, ThumbsDown, BookOpen } from "lucide-react";
import { BOOK_A, BOOK_B } from "./quotes";
import { supabase } from "./supabaseClient";


function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function makePair() {
  return {
    pairId: crypto.randomUUID(),
    left: randomItem(BOOK_A.quotes),
    right: randomItem(BOOK_B.quotes),
  };
}

const VOTES_STORAGE_KEY = "quote-similarity-votes";

export default function QuoteSimilarityVoter() {
  const [pair, setPair] = useState(() => makePair());
  const [votes, setVotes] = useState([]);
  useEffect(() => {
    async function loadVotes() {
      const { data, error } = await supabase
        .from("votes")
        .select("*")
        .order("created_at", { ascending: false });
  
      if (error) {
        console.warn("Could not load votes:", error);
        return;
      }
  
      setVotes(data ?? []);
    }
  
    loadVotes();
  }, []);
  const [lastVote, setLastVote] = useState(null);

  const stats = useMemo(() => {
    const similar = votes.filter((vote) => vote.choice === "similar").length;
    const different = votes.filter((vote) => vote.choice === "different").length;
    const total = votes.length;
    const similarityRate = total ? Math.round((similar / total) * 100) : 0;
    return { similar, different, total, similarityRate };
  }, [votes]);

  function nextPair() {
    setPair(makePair());
    setLastVote(null);
  }

  async function castVote(choice) {
    const vote = {
      pair_id: pair.pairId,
      left_quote_id: pair.left.id,
      right_quote_id: pair.right.id,
      choice,
    };

    const { data, error } = await supabase
      .from("votes")
      .insert(vote)
      .select()
      .single();

    if (error) {
      console.warn("Could not save vote:", error);
      return;
    }

    setVotes((currentVotes) => [data, ...currentVotes]);
    setLastVote(choice);
    nextPair();
  }
  //async function castVote(choice) {
  //  const vote = {
  //    pair_id: pair.pairId,
  //    left_quote_id: pair.left.id,
  //    right_quote_id: pair.right.id,
  //    choice,
  //  };
  //
  //  console.log("Attempting Supabase insert:", vote);
  //
  //  const { data, error } = await supabase
  //    .from("votes")
  //    .insert(vote)
  //    .select()
  //    .single();
  //
  //  if (error) {
  //    console.error("Supabase insert failed:", error);
  //    alert(`Could not save vote: ${error.message}`);
  //    return;
  //  }
  //
  //  console.log("Supabase insert succeeded:", data);
  //
  //  setVotes((currentVotes) => [data, ...currentVotes]);
  //  setLastVote(choice);
  //}


//  function resetVotes() {
//    setVotes([]);
//    setLastVote(null);
//  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300">
              <BookOpen className="h-4 w-4" />
              Quote Similarity Lab
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Are these two passages similar enough to be a parody of the other?
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Randomly pair one quote from each book, then vote on whether they feel similar.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center sm:min-w-80">
            <Stat label="Similar" value={stats.similar} />
            <Stat label="Different" value={stats.different} />
            <Stat label="Match %" value={`${stats.similarityRate}%`} />
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${pair.pairId}-left`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.22 }}
            >
              <QuoteCard book={BOOK_A.title} quote={pair.left} />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${pair.pairId}-right`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.22 }}
            >
              <QuoteCard book={BOOK_B.title} quote={pair.right} />
            </motion.div>
          </AnimatePresence>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Your verdict</h2>
              <p className="text-sm text-zinc-400">
                Vote, then shuffle to the next pair. Vote for as many or as few as you like. Use your first instinct.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={() => castVote("similar")} className="inline-flex items-center rounded-2xl bg-zinc-50 px-4 py-2 font-medium text-zinc-950 hover:bg-zinc-200">
                <ThumbsUp className="mr-2 h-4 w-4" /> Similar
              </button>
              <button onClick={() => castVote("different")} className="inline-flex items-center rounded-2xl bg-zinc-800 px-4 py-2 font-medium text-zinc-50 hover:bg-zinc-700">
                <ThumbsDown className="mr-2 h-4 w-4" /> Different
              </button>
              <button onClick={nextPair} className="inline-flex items-center rounded-2xl border border-zinc-700 bg-transparent px-4 py-2 font-medium text-zinc-50 hover:bg-zinc-800">
                <Shuffle className="mr-2 h-4 w-4" /> New pair
              </button>
            </div>
          </div>

          {lastVote && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-2xl bg-zinc-800 p-3 text-sm text-zinc-200"
            >
              Last vote: <span className="font-semibold capitalize">{lastVote}</span>. The quote goblin has updated the ledger.
            </motion.p>
          )}
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Recent votes</h2>
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">{stats.total} total</span>
          </div>

          {votes.length === 0 ? (
            <p className="text-zinc-400">No votes yet. The ballot box is hungry.</p>
          ) : (
            <div className="space-y-2">
              {votes.slice(0, 8).map((vote) => (
                <div key={vote.id} className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-zinc-300">
                    {vote.leftQuoteId} × {vote.right_quote_id}
                  </span>
                  <span className="font-medium capitalize text-zinc-100">{vote.choice}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function QuoteCard({ book, quote }) {
  return (
    <div className="h-full rounded-3xl border border-zinc-800 bg-zinc-900/80 text-zinc-50 shadow-xl">
      <div className="flex h-full flex-col justify-between gap-8 p-6">
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">{book}</span>
          </div>
          <blockquote className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            “{quote.text}”
          </blockquote>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
    </div>
  );
}

