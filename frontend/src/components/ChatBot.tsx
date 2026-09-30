import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Local assistant: keyword FAQ over the REAL backend flows. No network call,
 * no Supabase edge function — AI answering is a separate, parked workstream;
 * when it lands it can replace `findFAQAnswer` without touching this UI.
 */

const FAQ: Record<string, string> = {
  "how do i sell":
    "Create an account, complete KYC verification (KYC page), and an admin grants your selling role. Then open My Listings to post products, services, jobs or rentals.",
  "how to pay":
    "Fund your wallet from the Wallet page (card checkout via Flutterwave). Every purchase then debits your wallet into escrow — no card details are stored anywhere on KHUB.",
  "what is escrow":
    "Escrow holds the buyer's money until delivery is confirmed. The seller only gets paid after you confirm; cancel before delivery for an instant refund to your wallet.",
  "how to withdraw":
    "Wallet → Withdraw. Requires KYC verification and admin approval. Funds are held, approved, then sent to your bank account.",
  "how to verify":
    "Open the KYC page and upload a valid government ID (jpg/png/webp/pdf). An admin reviews it; verification unlocks withdrawals and driver/agent onboarding.",
  "refund policy":
    "Cancel before delivery and your escrow is refunded to your wallet instantly. Disputes freeze the money until an admin resolves it. See the Refund Policy page.",
  "delivery time":
    "Delivery agents pick up parcels near them. You get a 10-character tracking code — anyone can follow it on the tracking page without an account.",
  "contact support":
    "You can reach us at +234 706 503 6761 (WhatsApp) or +234 701 800 3863. Our support hours are 8AM - 8PM WAT.",
  "how to track":
    "Orders: Orders page. Parcels: you receive a tracking code — open the tracking page and enter it. It shows status and timing only, never your address.",
  "rides":
    "Open the Rides page, get an instant fare estimate, and request the ride. The fare is held in escrow and released to the driver when you arrive.",
  "referrals":
    "Open the Referrals page to get your personal code. When someone you referred completes their first purchase, a bonus lands in your wallet automatically.",
  "become a driver":
    "Open the Drive page: apply with your vehicle details, complete KYC, and an admin verifies your profile. Then nearby ride requests appear on your board.",
  "become an agent":
    "Open the Deliver page: apply with your vehicle details, complete KYC, and an admin verifies your profile. Then nearby parcel requests appear on your board.",
};

function findFAQAnswer(input: string): string | null {
  const lower = input.toLowerCase();
  for (const [key, answer] of Object.entries(FAQ)) {
    if (lower.includes(key) || key.split(" ").every(w => lower.includes(w))) return answer;
  }
  return null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! 👋 I'm Khub Assistant. Ask about selling, payments, escrow, rides, deliveries — or anything else!" },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const faqAnswer = findFAQAnswer(userMsg.content);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content:
            faqAnswer ??
            "I don't have an answer for that yet. Our team can help directly:\n\n📱 WhatsApp: +234 706 503 6761\n📞 Call: +234 701 800 3863",
        },
      ]);
    }, 350);
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/2347065036761?text=Hello%20KHUB%2C%20I%20need%20assistance", "_blank");
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 z-50 w-[340px] sm:w-[380px] h-[480px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="gradient-purple p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-primary-foreground text-sm">Khub Assistant</h3>
                <p className="text-[10px] text-primary-foreground/70">Online • Typically replies instantly</p>
              </div>
              <div className="flex gap-1">
                <button onClick={openWhatsApp} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary-foreground" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                  <X className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "gradient-purple text-primary-foreground rounded-br-sm"
                      : "bg-accent text-foreground rounded-bl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="px-3 pb-2 flex gap-1 overflow-x-auto scrollbar-hide">
              {["How to sell", "Payment methods", "Escrow info", "How to track", "Contact support"].map(q => (
                <button key={q} onClick={() => { setInput(q); }} className="px-2.5 py-1 text-[10px] rounded-full border border-border bg-background text-muted-foreground hover:border-primary/50 whitespace-nowrap transition-colors">
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Type your question..."
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button size="icon" onClick={sendMessage} disabled={!input.trim()} className="gradient-purple text-primary-foreground shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full gradient-purple shadow-lg flex items-center justify-center text-primary-foreground"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </>
  );
};

export default ChatBot;
