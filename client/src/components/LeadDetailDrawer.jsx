import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { leads as leadsApi, ai, dripSequences } from "../api";
import { LeadStatus } from "../constants";

const SpeechRecognitionAPI = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

function WhatsAppIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ScoreBadge({ score }) {
  if (!score) return null;
  const map = { hot: "🔥 Hot", warm: "🌡 Warm", cold: "❄️ Cold" };
  const cls = { hot: "bg-accent-orange/20 text-accent-orange", warm: "bg-yellow-500/20 text-yellow-400", cold: "bg-blue-500/20 text-blue-300" };
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls[score] || ""}`}>{map[score] || score}</span>;
}

export default function LeadDetailDrawer({ leadId, onClose, onUpdate }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [activeSequences, setActiveSequences] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [logChannel, setLogChannel] = useState("CALL");
  const [logContent, setLogContent] = useState("");
  const [logSaving, setLogSaving] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef(null);
  const [nextActions, setNextActions] = useState(null);
  const [nextActionsLoading, setNextActionsLoading] = useState(false);
  const [sendSmsLoading, setSendSmsLoading] = useState(false);
  const [leadAdvice, setLeadAdvice] = useState(null);
  const [leadAdviceLoading, setLeadAdviceLoading] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    Promise.all([
      leadsApi.get(leadId),
      dripSequences.active().catch(() => []),
    ])
      .then(([data, seqs]) => {
        setLead(data);
        setNotes(data.notes ?? "");
        setStatus(data.status ?? "");
        setActiveSequences(seqs || []);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [leadId]);

  useEffect(() => {
    if (!leadId || !lead) return;
    setNextActionsLoading(true);
    ai.nextActions(leadId)
      .then((data) => setNextActions(data))
      .catch(() => setNextActions(null))
      .finally(() => setNextActionsLoading(false));
  }, [leadId, lead?.id]);

  useEffect(() => {
    if (!leadId || !lead) return;
    setLeadAdviceLoading(true);
    ai.leadAdvice(leadId)
      .then((data) => setLeadAdvice(data))
      .catch(() => setLeadAdvice(null))
      .finally(() => setLeadAdviceLoading(false));
  }, [leadId, lead?.id]);

  async function handleScore() {
    if (!lead) return;
    setScoreLoading(true);
    try {
      const result = await ai.scoreLead({
        budget: lead.budget,
        financing: lead.financing,
        timeframe: lead.timeframe,
        tradeIn: lead.tradeIn,
      });
      await leadsApi.update(leadId, { score: result.score, scoreReason: result.reason, urgency: result.urgency });
      setLead((l) => ({ ...l, score: result.score, scoreReason: result.reason, urgency: result.urgency }));
      toast.success("Lead scored");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setScoreLoading(false);
    }
  }

  async function handleGenerateFollowUp() {
    if (!lead) return;
    setFollowUpLoading(true);
    try {
      const { followUps } = await ai.followUp(leadId);
      setLead((l) => ({ ...l, followUps: followUps || [] }));
      toast.success("Follow-up messages generated");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setFollowUpLoading(false);
    }
  }

  async function handleSaveStatus() {
    if (!lead || status === lead.status) return;
    try {
      await leadsApi.updateStatus(leadId, status);
      setLead((l) => ({ ...l, status }));
      toast.success("Status updated");
      onUpdate?.();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleSaveNotes() {
    if (!lead) return;
    try {
      await leadsApi.update(leadId, { notes });
      setLead((l) => ({ ...l, notes }));
      toast.success("Notes saved");
    } catch (e) {
      toast.error(e.message);
    }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  /** Strip leading 0 and ensure 254 prefix for Kenya */
  function whatsappNumber(phone) {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return "254" + digits.slice(1);
    if (digits.startsWith("254")) return digits;
    return "254" + digits;
  }

  function whatsappUrl(phone, text) {
    const num = whatsappNumber(phone);
    if (!num) return null;
    return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
  }

  async function handleEnroll(sequenceId) {
    if (!sequenceId) return;
    setEnrollLoading(true);
    try {
      await leadsApi.enrollDrip(leadId, { sequenceId });
      const data = await leadsApi.get(leadId);
      setLead(data);
      toast.success("Lead enrolled in sequence");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnrollLoading(false);
    }
  }

  async function handlePauseEnrollment(enrollmentId, status) {
    try {
      await leadsApi.updateDripEnrollment(leadId, enrollmentId, { status });
      const data = await leadsApi.get(leadId);
      setLead(data);
      toast.success(status === "PAUSED" ? "Sequence paused" : "Sequence stopped");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleLogCommunication() {
    if (!logContent.trim()) {
      toast.error("Enter note or summary");
      return;
    }
    setLogSaving(true);
    try {
      const updated = await leadsApi.logCommunication(leadId, { channel: logChannel, content: logContent.trim() });
      setLead(updated);
      setLogContent("");
      setShowLogForm(false);
      toast.success("Logged");
      onUpdate?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLogSaving(false);
    }
  }

  function startDictation() {
    if (!SpeechRecognitionAPI) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-KE";
    recognition.onresult = (e) => {
      const last = e.results.length - 1;
      const transcript = e.results[last][0].transcript;
      if (e.results[last].isFinal) {
        setNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    recognition.onend = () => setIsDictating(false);
    recognition.onerror = () => {
      setIsDictating(false);
      toast.error("Voice input failed");
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsDictating(true);
    toast.success("Listening…");
  }

  function stopDictation() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsDictating(false);
  }

  async function handleSendSuggestedSms(message) {
    if (!message?.trim()) return;
    setSendSmsLoading(true);
    try {
      const { lead: updated } = await leadsApi.sendSms(leadId, { message: message.trim() });
      setLead(updated);
      setNextActions((prev) => ({
        ...prev,
        suggestedActions: (prev?.suggestedActions || []).filter(
          (a) => a.type !== "SMS" || a.message !== message
        ),
      }));
      toast.success("SMS sent");
      onUpdate?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSendSmsLoading(false);
    }
  }

  if (!leadId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="w-full h-full min-h-screen md:h-auto md:min-h-0 md:max-w-md bg-navy-card border-l border-white/10 shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-navy-card border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <h2 className="font-heading font-semibold text-white">Lead details</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-6">
          {loading ? (
            <div className="animate-pulse h-48 bg-navy rounded-lg" />
          ) : !lead ? (
            <p className="text-gray-400">Lead not found.</p>
          ) : (
            <>
              <div>
                <p className="text-xl font-heading font-semibold text-white">{lead.name}</p>
                <p className="text-gray-400">{lead.car?.make} {lead.car?.model} {lead.car?.year}</p>
                <p className="text-sm text-gray-500 mt-1">{lead.phone} · {lead.email}</p>
                <p className="text-sm text-gray-400 mt-1">Budget: {lead.budget || "—"} · {lead.financing || "—"} · {lead.timeframe || "—"} · Trade-in: {lead.tradeIn || "—"}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <ScoreBadge score={lead.score} />
                {!lead.score && (
                  <button onClick={handleScore} disabled={scoreLoading} className="text-sm text-accent-blue hover:underline disabled:opacity-50">
                    {scoreLoading ? "Scoring…" : "Score lead"}
                  </button>
                )}
                {lead.scoreReason && <p className="text-sm text-gray-400 w-full mt-1">{lead.scoreReason}</p>}
              </div>

              {(leadAdviceLoading || leadAdvice) && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10 space-y-3">
                  <h3 className="font-heading font-medium text-white">AI suggestions</h3>
                  {leadAdviceLoading ? (
                    <div className="h-20 bg-navy rounded-lg animate-pulse" />
                  ) : leadAdvice ? (
                    <>
                      {leadAdvice.leadScore && (
                        <p className="text-sm">
                          <span className="text-gray-400">Lead score: </span>
                          <ScoreBadge score={leadAdvice.leadScore} />
                        </p>
                      )}
                      {leadAdvice.nextAction && (
                        <p className="text-sm text-gray-300">
                          <span className="text-gray-400">Recommended: </span>
                          {leadAdvice.nextAction}
                        </p>
                      )}
                      {leadAdvice.suggestedResponse && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Suggested WhatsApp response</p>
                          <p className="text-sm text-gray-300 p-2 rounded bg-navy border border-white/10 mb-2">{leadAdvice.suggestedResponse}</p>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => copyText(leadAdvice.suggestedResponse)} className="text-sm text-accent-blue hover:underline">Copy</button>
                            {whatsappUrl(lead.phone, leadAdvice.suggestedResponse) && (
                              <a href={whatsappUrl(lead.phone, leadAdvice.suggestedResponse)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-500">
                                <WhatsAppIcon className="w-3.5 h-3.5" /> Open WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              )}

              {(nextActionsLoading || nextActions?.suggestedActions?.length || nextActions?.closeProbability != null) && (
                <div className="space-y-2">
                  <h3 className="font-heading font-medium text-white">Next best action</h3>
                  {nextActionsLoading ? (
                    <div className="h-16 bg-navy rounded-lg animate-pulse" />
                  ) : (
                    <>
                      {nextActions?.closeProbability != null && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-sm font-medium text-emerald-300">
                            {nextActions.closeProbability}% close probability
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Book a test drive in 48h to improve odds.
                          </p>
                        </div>
                      )}
                      {(nextActions?.suggestedActions || []).map((action, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-navy border border-white/10">
                          {action.type === "SMS" && (
                            <>
                              <p className="text-xs text-gray-400 mb-1">{action.label}</p>
                              <p className="text-sm text-gray-300 mb-2 line-clamp-2">{action.message}</p>
                              <button
                                type="button"
                                onClick={() => handleSendSuggestedSms(action.message)}
                                disabled={sendSmsLoading}
                                className="w-full py-2 rounded-lg bg-accent-blue text-white text-sm font-medium disabled:opacity-50 min-h-[44px]"
                              >
                                {sendSmsLoading ? "Sending…" : "Send SMS"}
                              </button>
                            </>
                          )}
                          {action.type === "NOTE" && (
                            <p className="text-sm text-gray-300">{action.message}</p>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-medium text-white">Follow-up messages</h3>
                  <button onClick={handleGenerateFollowUp} disabled={followUpLoading} className="text-sm text-accent-blue hover:underline disabled:opacity-50">
                    {followUpLoading ? "Generating…" : "Generate"}
                  </button>
                </div>
                <div className="space-y-2">
                  {(lead.followUps || []).map((fu) => (
                    <div key={fu.id} className="p-3 rounded-lg bg-navy border border-white/10">
                      <p className="text-xs text-gray-500 mb-1">Day {fu.day}</p>
                      <p className="text-sm text-gray-300">{fu.message}</p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <button onClick={() => copyText(fu.message)} className="text-xs text-accent-blue hover:underline">Copy</button>
                        {whatsappUrl(lead.phone, fu.message) && (
                          <a href={whatsappUrl(lead.phone, fu.message)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-500">
                            <WhatsAppIcon className="w-3.5 h-3.5" /> Send via WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!lead.followUps || lead.followUps.length === 0) && (
                    <p className="text-sm text-gray-500">Generate Day 1, 3 & 7 messages with AI.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Automation</label>
                <div className="flex gap-2 flex-wrap items-center">
                  <select
                    value=""
                    onChange={(e) => { const v = e.target.value; if (v) handleEnroll(v); e.target.value = ""; }}
                    disabled={enrollLoading}
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-navy border border-white/10 text-white text-sm"
                  >
                    <option value="">Enroll in sequence…</option>
                    {activeSequences
                      .filter((s) => !(lead.dripEnrollments || []).some((e) => e.sequenceId === s.id && (e.status === "ACTIVE" || e.status === "PAUSED")))
                      .map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                  </select>
                </div>
                {(lead.dripEnrollments || []).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {lead.dripEnrollments.map((e) => (
                      <div key={e.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-navy border border-white/5 text-sm">
                        <span className="text-gray-300">{e.sequence?.name} · {e.status}</span>
                        {(e.status === "ACTIVE" || e.status === "PAUSED") && (
                          <div className="flex gap-1">
                            {e.status === "ACTIVE" && (
                              <button type="button" onClick={() => handlePauseEnrollment(e.id, "PAUSED")} className="text-xs text-amber-400 hover:underline">Pause</button>
                            )}
                            <button type="button" onClick={() => handlePauseEnrollment(e.id, "STOPPED")} className="text-xs text-red-400 hover:underline">Stop</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Quick log</label>
                {!showLogForm ? (
                  <button
                    type="button"
                    onClick={() => setShowLogForm(true)}
                    className="w-full px-3 py-2.5 rounded-lg bg-navy border border-white/10 text-white text-sm font-medium hover:bg-white/5 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    Log call / SMS / note
                  </button>
                ) : (
                  <div className="space-y-2 p-3 rounded-lg bg-navy border border-white/10">
                    <select
                      value={logChannel}
                      onChange={(e) => setLogChannel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-navy-card border border-white/10 text-white text-sm"
                    >
                      <option value="CALL">Call</option>
                      <option value="SMS">SMS</option>
                      <option value="NOTE">Note</option>
                    </select>
                    <textarea
                      value={logContent}
                      onChange={(e) => setLogContent(e.target.value)}
                      placeholder="What was discussed?"
                      className="w-full px-3 py-2 rounded-lg bg-navy-card border border-white/10 text-white text-sm min-h-[72px]"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleLogCommunication}
                        disabled={logSaving || !logContent.trim()}
                        className="flex-1 px-3 py-2 rounded-lg bg-accent-blue text-white text-sm font-medium disabled:opacity-50 min-h-[44px]"
                      >
                        {logSaving ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowLogForm(false); setLogContent(""); }}
                        className="px-3 py-2 rounded-lg border border-white/10 text-gray-400 text-sm min-h-[44px]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} onBlur={handleSaveStatus} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white min-h-[44px]">
                  {LeadStatus.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-sm text-gray-400">Notes</label>
                  {SpeechRecognitionAPI && (
                    <button
                      type="button"
                      onClick={isDictating ? stopDictation : startDictation}
                      className={`text-xs px-2 py-1 rounded font-medium min-h-[32px] ${isDictating ? "bg-red-500/20 text-red-300" : "bg-accent-blue/20 text-accent-blue"}`}
                    >
                      {isDictating ? "Stop dictation" : "Dictate note"}
                    </button>
                  )}
                </div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={handleSaveNotes} className="w-full px-3 py-2 rounded-lg bg-navy border border-white/10 text-white min-h-[80px]" placeholder="Internal notes…" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
