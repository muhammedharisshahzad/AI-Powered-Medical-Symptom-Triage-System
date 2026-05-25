from __future__ import annotations

RED_FLAG_MAP = {
    "chest pain": "Chest pain",
    "shortness of breath": "Difficulty breathing",
    "trouble breathing": "Difficulty breathing",
    "fainting": "Fainting or near-fainting",
    "confusion": "New confusion",
    "severe bleeding": "Severe bleeding",
    "uncontrolled bleeding": "Uncontrolled bleeding",
    "stroke": "Stroke symptoms",
    "one-sided weakness": "One-sided weakness",
    "slurred speech": "Slurred speech",
    "severe abdominal pain": "Severe abdominal pain",
    "worst headache": "Worst headache of life",
}

MED_SYNONYMS = {
    "warfarin": ["warfarin", "coumadin"],
    "ibuprofen": ["ibuprofen", "advil", "motrin"],
    "naproxen": ["naproxen", "aleve"],
    "aspirin": ["aspirin"],
    "ssri": ["ssri", "sertraline", "fluoxetine", "paroxetine", "citalopram"],
    "tramadol": ["tramadol"],
}

INTERACTIONS = [
    (("warfarin", "ibuprofen"), "Warfarin + ibuprofen can increase bleeding risk."),
    (("warfarin", "naproxen"), "Warfarin + naproxen can increase bleeding risk."),
    (("warfarin", "aspirin"), "Warfarin + aspirin can increase bleeding risk."),
    (("ssri", "tramadol"), "SSRI + tramadol can increase serotonin syndrome risk."),
]


def check_red_flags(text: str) -> list[str]:
    lowered = text.lower()
    matches: list[str] = []
    for phrase, label in RED_FLAG_MAP.items():
        if phrase in lowered:
            matches.append(label)
    return matches


def _find_medications(text: str) -> set[str]:
    lowered = text.lower()
    found: set[str] = set()
    for med, synonyms in MED_SYNONYMS.items():
        for term in synonyms:
            if term in lowered:
                found.add(med)
                break
    return found


def check_drug_interactions(text: str) -> list[str]:
    found = _find_medications(text)
    results: list[str] = []
    for (a, b), message in INTERACTIONS:
        if a in found and b in found:
            results.append(message)
    return results
