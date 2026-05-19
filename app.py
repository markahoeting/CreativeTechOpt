"""
Creative Technology Portfolio Optimizer
Higher Education Adobe & Canva License Assessment Platform

Flask application for deployment on Render.com
Info-Tech Research Group branding
"""

import json
import math
from flask import Flask, render_template, request, jsonify, session
from datetime import datetime

app = Flask(__name__)
app.secret_key = "ctpo-infotech-2025-secret-key"

# ── Info-Tech brand palette (used in Python-generated content) ──────────────
BRAND = {
    "primary":   "#2676B7",   # Mariner blue
    "light":     "#74A5CD",   # Danube light blue
    "dark":      "#02122B",   # Tangaroa navy
    "white":     "#FFFFFF",
    "light_bg":  "#EAF2F9",
    "mid_bg":    "#D0E5F3",
    "text_dark": "#02122B",
    "text_mid":  "#3D5A73",
    "success":   "#1A7A4A",
    "warning":   "#C47F00",
    "danger":    "#C0392B",
}

# ── Scenario definitions ─────────────────────────────────────────────────────
SCENARIOS = [
    {"id": "a", "label": "Scenario A", "sublabel": "Status Quo",          "color": "#64748b", "rec": False},
    {"id": "b", "label": "Scenario B", "sublabel": "Light Optimization",   "color": "#0891b2", "rec": False},
    {"id": "c", "label": "Scenario C", "sublabel": "Segmented Portfolio",  "color": "#2676B7", "rec": True},
    {"id": "d", "label": "Scenario D", "sublabel": "Aggressive Rationalization", "color": "#C47F00", "rec": False},
    {"id": "e", "label": "Scenario E", "sublabel": "Academic Exception Model",   "color": "#7c3aed", "rec": False},
]

# ── Segment config ─────────────────────────────────────────────────────────
SEGMENTS = [
    {"id": "power",      "label": "Creative Power Users",        "color": "#C0392B", "recommend": "Retain Full Adobe CC"},
    {"id": "light",      "label": "Light Designers",              "color": "#C47F00", "recommend": "→ Canva / Adobe Express"},
    {"id": "academic",   "label": "Academic Content Creators",    "color": "#1A7A4A", "recommend": "Canva + Acrobat"},
    {"id": "occasional", "label": "Occasional / Consumer Users",  "color": "#64748b", "recommend": "Remove / Shared Device"},
    {"id": "students",   "label": "General Student Population",   "color": "#2676B7", "recommend": "→ Canva for Education"},
    {"id": "curriculum", "label": "Curriculum-Critical Users",    "color": "#7c3aed", "recommend": "Protect Adobe"},
]

# ── Department recommendations ───────────────────────────────────────────────
DEPT_RECS = [
    ("Marketing & Communications",  "Retain Full Adobe CC",       "Core brand/design professionals",                     "Low"),
    ("Design Programs (BFA/MFA)",   "Retain Full Adobe CC",       "Curriculum-critical, industry-standard tools",         "Critical"),
    ("Film / Video Production",     "Retain Full Adobe CC",       "Premiere Pro, After Effects required",                 "Critical"),
    ("Architecture / Digital Media","Retain Full Adobe CC",       "Studio workflows: Acrobat, Illustrator",               "High"),
    ("Instructional Design / CTL",  "Canva + Acrobat",            "LMS content, video, simple graphics",                  "Low"),
    ("General Faculty",             "Canva (evaluate per dept)",  "Presentations, classroom materials, flyers",           "Medium"),
    ("Student Affairs / Advising",  "Move to Canva",              "Social media, event flyers, newsletters",              "Low"),
    ("Admissions & Enrollment",     "Canva + selective Adobe",    "Viewbooks, email graphics, social posts",              "Low"),
    ("Business / Finance Offices",  "Remove Adobe",               "Acrobat Reader sufficient; rare creative needs",       "Very Low"),
    ("General Administrative Staff","Remove / Canva Free",        "Minimal creative production needs",                    "Very Low"),
    ("Student General Population",  "Canva for Education",        "Assignments, presentations, club materials",           "Low"),
    ("Graduate Research Programs",  "Evaluate by program",        "Research visualization needs vary widely",             "Medium"),
    ("Nursing / Allied Health",     "Canva + Acrobat",            "Patient education materials, presentations",           "Low"),
    ("Library & Academic Resources","Selective Adobe + Canva",    "Digital collections, research guides, signage",        "Low"),
]


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html", brand=BRAND, segments=SEGMENTS)


@app.route("/api/ping")
def ping():
    """Keepalive endpoint — called by the frontend on every phase transition
    to prevent the Render free-tier server from hibernating mid-assessment."""
    return jsonify({"ok": True, "ts": datetime.now().isoformat()})


@app.route("/api/calculate", methods=["POST"])
def calculate():
    """Main calculation endpoint — receives full form data, returns JSON results."""
    data = request.get_json()

    # ── Phase 2 numbers ──────────────────────────────────────────────────────
    total_licenses  = max(1, int(data.get("adobe_total", 1000)))
    adobe_cost      = float(data.get("adobe_cost", 0))
    support_cost    = float(data.get("support_cost", 0))
    acrobat_cost    = float(data.get("acrobat_cost", 0))
    total_current   = adobe_cost + support_cost + acrobat_cost

    pct_inactive = float(data.get("pct_inactive", 30)) / 100
    pct_acrobat  = float(data.get("pct_acrobat",  20)) / 100
    pct_light    = float(data.get("pct_light",    25)) / 100
    pct_power    = float(data.get("pct_power",    15)) / 100

    inactive_n  = round(total_licenses * pct_inactive)
    acrobat_n   = round(total_licenses * pct_acrobat)
    light_n     = round(total_licenses * pct_light)
    power_n     = round(total_licenses * pct_power)
    other_n     = max(0, total_licenses - inactive_n - acrobat_n - light_n - power_n)

    cost_per_license = adobe_cost / total_licenses if total_licenses else 175

    # ── Financial scenario params ────────────────────────────────────────────
    canva_user_cost = float(data.get("canva_user_cost", 0))
    migration_cost  = float(data.get("migration_cost",  0))
    training_cost   = float(data.get("training_cost",   0))
    one_time_cost   = migration_cost + training_cost

    sc_b_reduce = float(data.get("sc_b_reduce", 20)) / 100
    sc_c_reduce = float(data.get("sc_c_reduce", 40)) / 100
    sc_c_canva  = float(data.get("sc_c_canva",  35)) / 100
    sc_d_reduce = float(data.get("sc_d_reduce", 60)) / 100
    sc_d_canva  = float(data.get("sc_d_canva",  55)) / 100
    sc_e_reduce = float(data.get("sc_e_reduce", 50)) / 100

    def calc_scenario(reduce, canva_pct):
        remain   = round(total_licenses * (1 - reduce))
        new_adobe = remain * cost_per_license
        new_canva = round(total_licenses * canva_pct) * canva_user_cost
        new_total = new_adobe + new_canva + support_cost
        saving    = total_current - new_total
        yr3       = (saving * 3) - one_time_cost
        roi       = round((saving / total_current * 100)) if total_current else 0
        return {
            "remain":     remain,
            "canva_seats": round(total_licenses * canva_pct),
            "new_total":  round(new_total),
            "saving":     round(saving),
            "yr3":        round(yr3),
            "roi":        roi,
        }

    scenarios_out = {
        "a": calc_scenario(0,            0),
        "b": calc_scenario(sc_b_reduce,  0),
        "c": calc_scenario(sc_c_reduce,  sc_c_canva),
        "d": calc_scenario(sc_d_reduce,  sc_d_canva),
        "e": calc_scenario(sc_e_reduce,  sc_e_reduce),
    }

    # ── Segmentation ─────────────────────────────────────────────────────────
    seg_data = {}
    seg_total = 0
    for s in SEGMENTS:
        v = int(data.get(f"seg_{s['id']}", 0))
        seg_data[s["id"]] = v
        seg_total += v
    for s in SEGMENTS:
        seg_data[s["id"] + "_pct"] = round(seg_data[s["id"]] / seg_total * 100) if seg_total else 0

    # ── Risk scoring ──────────────────────────────────────────────────────────
    accred       = data.get("accreditation",  "none")
    workforce    = data.get("workforce_req",  "low")
    faculty_gov  = data.get("faculty_gov",    "low")
    digital_lit  = data.get("digital_literacy","medium")
    gov_maturity = int(data.get("gov_maturity", 2))
    film_prog    = data.get("film_program",   "no") == "yes"
    arch_prog    = data.get("arch_program",   "no") == "yes"

    risk_scores = {
        "Academic Disruption":    90 if accred == "critical" else (55 if accred == "some" else 20),
        "Faculty Resistance":     80 if faculty_gov == "high" else (50 if faculty_gov == "medium" else 25),
        "Workforce Readiness":    75 if workforce == "high" else (40 if workforce == "medium" else 15),
        "Creative Program Dependency": min(100, (20 if film_prog else 0) + (20 if arch_prog else 0) +
                                        (30 if pct_power > 0.20 else (15 if pct_power > 0.10 else 5))),
        "Change Management":      80 if digital_lit == "low" else (50 if digital_lit == "medium" else 25),
        "Governance Maturity":    round((5 - gov_maturity) * 20),
    }
    avg_risk = round(sum(risk_scores.values()) / len(risk_scores))
    overall_risk = "HIGH" if avg_risk >= 65 else ("MEDIUM" if avg_risk >= 35 else "LOW")

    # ── KPIs ─────────────────────────────────────────────────────────────────
    recommended_saving = scenarios_out["c"]["saving"]
    kpis = {
        "total_licenses": total_licenses,
        "inactive_count": inactive_n,
        "inactive_pct":   round(pct_inactive * 100),
        "annual_saving":  recommended_saving,
        "yr3_saving":     recommended_saving * 3,
    }

    # ── App usage ─────────────────────────────────────────────────────────────
    app_usage = {
        "Photoshop":       int(data.get("use_ps",      18)),
        "Illustrator":     int(data.get("use_ai",      12)),
        "InDesign":        int(data.get("use_id",       8)),
        "Premiere Pro":    int(data.get("use_pr",      10)),
        "After Effects":   int(data.get("use_ae",       5)),
        "Acrobat Pro":     int(data.get("use_acro",    65)),
        "Dimension/Sub":   int(data.get("use_dim",      3)),
        "Adobe Express":   int(data.get("use_express", 20)),
    }

    # ── Findings ─────────────────────────────────────────────────────────────
    inst_name = data.get("inst_name", "Your Institution")
    removable = inactive_n + acrobat_n + light_n
    removable_pct = round(removable / total_licenses * 100) if total_licenses else 0

    return jsonify({
        "ok": True,
        "kpis": kpis,
        "scenarios": scenarios_out,
        "scenario_meta": SCENARIOS,
        "segments": seg_data,
        "segment_meta": SEGMENTS,
        "risk_scores": risk_scores,
        "avg_risk": avg_risk,
        "overall_risk": overall_risk,
        "app_usage": app_usage,
        "dept_recs": DEPT_RECS,
        "usage_breakdown": {
            "inactive": inactive_n,
            "acrobat":  acrobat_n,
            "light":    light_n,
            "power":    power_n,
            "other":    other_n,
        },
        "financials": {
            "total_current":   round(total_current),
            "cost_per_license": round(cost_per_license),
            "one_time_cost":   round(one_time_cost),
            "adobe_cost":      round(adobe_cost),
        },
        "findings": {
            "inst_name":     inst_name,
            "removable":     removable,
            "removable_pct": removable_pct,
            "power_n":       power_n,
            "light_n":       light_n,
            "inactive_n":    inactive_n,
            "acrobat_n":     acrobat_n,
        },
        "meta": {
            "rollout":  data.get("rollout_strategy", "pilot"),
            "renewal":  data.get("renewal_date", ""),
            "gov_mat":  gov_maturity,
            "today":    datetime.now().strftime("%B %d, %Y"),
        },
        "brand": BRAND,
    })


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
