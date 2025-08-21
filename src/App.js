import React, { useEffect, useMemo, useRef, useState } from "react";

// --- CONFIG ---
const API_BASE = "https://api.cobblestonecloud.com"; // your on‑prem API via Cloudflare
const APP_ORIGIN = "https://app.cobblestonecloud.com"; // must match your API's AllowedOrigin

// Robust fetch that throws on HTTP errors
async function fetchJson(url, init = {}) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.detail || data?.message || res.statusText;
    const err = new Error(`${res.status} ${res.statusText}: ${msg}`);
    err.status = res.status; err.body = data; throw err;
  }
  return data;
}

// Try to read a cookie value (fallback if CSRF endpoint doesn't return JSON)
function getCookie(name) {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

// 1) Get CSRF
async function getCsrf() {
  const data = await fetchJson(`${API_BASE}/session/csrf`, { credentials: "include" });
  return data?.csrf || getCookie("csrf");
}

// 2) Exchange Zoho context + CSRF for a session (and token if your API returns it)
async function exchangeSession({ userId, orgId, recordId = "" }, csrf) {
  const body = JSON.stringify({ userId, orgId, recordId });
  const resp = await fetchJson(`${API_BASE}/session/exchange`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrf,
      // The browser automatically sets Origin to APP_ORIGIN when this runs from your app host
    },
    body
  });
  return resp?.token || null; // if server returns { token }
}

// 3) Fetch data (prefer Authorization header when token is available)
async function fetchProcessBins({ limit = 25, batchId, outletId, sinceUtc }, token) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (batchId) params.set("batchId", String(batchId));
  if (outletId) params.set("outletId", String(outletId));
  if (sinceUtc) params.set("since", sinceUtc);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const data = await fetchJson(`${API_BASE}/sizer/bin-outputs?${params.toString()}`, {
    headers,
    credentials: "include"
  });
  return data;
}

function clsx(...xs) { return xs.filter(Boolean).join(" "); }

function prettyDate(x) {
  if (!x) return "";
  const d = new Date(x);
  return isNaN(d.getTime()) ? String(x) : d.toLocaleString();
}

export default function ProcessBinsApp() {
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filters
  const [limit, setLimit] = useState(25);
  const [batchId, setBatchId] = useState("");
  const [outletId, setOutletId] = useState("");
  const [since, setSince] = useState(""); // datetime-local string

  // Zoho context (fallback defaults for testing outside Zoho)
  const [zohoUser, setZohoUser] = useState("chris");
  const [zohoOrg, setZohoOrg] = useState("cobblestone");
  const [zohoRid, setZohoRid] = useState("");

  // Initialize Zoho if available, otherwise keep defaults
  useEffect(() => {
    if (typeof window !== "undefined" && window.ZOHO && window.ZOHO.embeddedApp) {
      window.ZOHO.embeddedApp.on("PageLoad", async (data) => {
        try {
          const userInfo = await window.ZOHO.CRM.CONFIG.getCurrentUser();
          const orgInfo = await window.ZOHO.CRM.CONFIG.getOrgInfo();
          setZohoUser(String(userInfo?.users?.[0]?.id ?? "user"));
          setZohoOrg(String(orgInfo?.org?.[0]?.id ?? "org"));
          setZohoRid(String(data?.EntityId ?? ""));
        } catch (e) { /* ignore */ }
      });
      window.ZOHO.embeddedApp.init();
    }
  }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      // 1) CSRF + 2) exchange → token (or cookie)
      const csrf = await getCsrf();
      if (!csrf) throw new Error("No CSRF token returned");
      const token = await exchangeSession({ userId: zohoUser, orgId: zohoOrg, recordId: zohoRid }, csrf);

      // 3) Fetch data
      const sinceUtc = since ? new Date(since).toISOString() : undefined; // convert local to UTC ISO
      const data = await fetchProcessBins({
        limit,
        batchId: batchId ? Number(batchId) : undefined,
        outletId: outletId ? Number(outletId) : undefined,
        sinceUtc
      }, token);

      setRows(data?.rows ?? []);
      setCount(data?.count ?? 0);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Sizer Bin Outputs</h1>
          <p className="text-sm text-slate-600">API: {API_BASE}</p>
        </header>

        <div className="grid md:grid-cols-5 gap-3 mb-4">
          <label className="flex flex-col text-sm">
            <span className="mb-1">Limit</span>
            <select value={limit} onChange={e=>setLimit(Number(e.target.value))} className="border rounded-lg px-3 py-2">
              {[25,50,100,250,500,1000].map(n=> <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1">Batch Id</span>
            <input value={batchId} onChange={e=>setBatchId(e.target.value)} placeholder="e.g. 123" className="border rounded-lg px-3 py-2" />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1">Outlet Id</span>
            <input value={outletId} onChange={e=>setOutletId(e.target.value)} placeholder="e.g. 5" className="border rounded-lg px-3 py-2" />
          </label>
          <label className="flex flex-col text-sm md:col-span-2">
            <span className="mb-1">Since (UTC implied)</span>
            <input type="datetime-local" value={since} onChange={e=>setSince(e.target.value)} className="border rounded-lg px-3 py-2" />
          </label>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button onClick={load} disabled={loading} className={clsx("px-4 py-2 rounded-xl shadow",
            loading ? "bg-slate-300" : "bg-slate-900 text-white hover:bg-slate-800")}>{loading ? "Loading…" : "Load data"}</button>
          <span className="text-sm text-slate-600">{count ? `${count} rows` : ""}</span>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="overflow-auto border rounded-2xl bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                {[
                  "PackId","BatchId","OutletId","OutletName","PackCount","PackWeightLbs",
                  "PackTypeName","BatchName","Commodity","Grade","Size","Variety","LotId",
                  "modified_pacific"
                ].map(h => (
                  <th key={h} className="text-left px-3 py-2 whitespace-nowrap font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="px-3 py-2">{r.PackId}</td>
                  <td className="px-3 py-2">{r.BatchId}</td>
                  <td className="px-3 py-2">{r.OutletId}</td>
                  <td className="px-3 py-2">{r.OutletName}</td>
                  <td className="px-3 py-2">{r.PackCount}</td>
                  <td className="px-3 py-2">{r.PackWeightLbs}</td>
                  <td className="px-3 py-2">{r.PackTypeName}</td>
                  <td className="px-3 py-2">{r.BatchName}</td>
                  <td className="px-3 py-2">{r.Commodity}</td>
                  <td className="px-3 py-2">{r.Grade}</td>
                  <td className="px-3 py-2">{r.Size}</td>
                  <td className="px-3 py-2">{r.Variety}</td>
                  <td className="px-3 py-2">{r.LotId}</td>
                  <td className="px-3 py-2">{prettyDate(r.modified_pacific)}</td>
                </tr>
              ))}
              {!rows.length && !loading && (
                <tr><td className="px-3 py-6 text-center text-slate-500" colSpan={14}>No rows yet. Click “Load data”.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Tip: This component also works inside Zoho. When the Zoho SDK is present, it will use the real user/org & record id.
        </p>
      </div>
    </div>
  );
}
