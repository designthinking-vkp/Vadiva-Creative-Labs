// src/data/questions.js

export const QUESTIONS = [
  // Theme: Parent & Reputation
  {
    id: 1,
    theme: "Parent & Reputation",
    text: "Parent grievances and concerns are systematically logged and resolved within 48 hours.",
    effects: {
      stronglyAgree: { parentTrust: 8, reputation: 6, whatsappHeat: -5 },
      agree: { parentTrust: 5, reputation: 3, whatsappHeat: -2 },
      disagree: { parentTrust: -4, whatsappHeat: 4 },
      stronglyDisagree: { parentTrust: -8, reputation: -5, whatsappHeat: 10, admissions: -4 }
    }
  },
  {
    id: 2,
    theme: "Parent & Reputation",
    text: "Parent-teacher meetings are highly structured, well-attended, and lead to actionable student development plans.",
    effects: {
      stronglyAgree: { parentTrust: 8, reputation: 5, studentProgress: 4 },
      agree: { parentTrust: 5, reputation: 2, studentProgress: 2 },
      disagree: { parentTrust: -3, studentProgress: -2 },
      stronglyDisagree: { parentTrust: -8, reputation: -4, studentProgress: -4, admissions: -3 }
    }
  },
  {
    id: 3,
    theme: "Parent & Reputation",
    text: "School policies, schedule changes, and fee structures are communicated transparently to parents in advance.",
    effects: {
      stronglyAgree: { integrity: 8, parentTrust: 8, reputation: 4 },
      agree: { integrity: 4, parentTrust: 4 },
      disagree: { integrity: -4, parentTrust: -4, whatsappHeat: 5 },
      stronglyDisagree: { integrity: -8, parentTrust: -8, reputation: -4, whatsappHeat: 10 }
    }
  },
  {
    id: 4,
    theme: "Parent & Reputation",
    text: "Social media and local online discussion forums show consistently positive sentiment regarding our school.",
    effects: {
      stronglyAgree: { reputation: 8, admissions: 6, whatsappHeat: -6 },
      agree: { reputation: 4, admissions: 3, whatsappHeat: -2 },
      disagree: { reputation: -3, whatsappHeat: 4 },
      stronglyDisagree: { reputation: -8, admissions: -6, whatsappHeat: 10 }
    }
  },

  // Theme: Academic Systems
  {
    id: 5,
    theme: "Academic Systems",
    text: "Teacher absenteeism is low, and we have a seamless substitute/cover class management system in place.",
    effects: {
      stronglyAgree: { academicTime: 8, results: 5, teachersTrust: 3 },
      agree: { academicTime: 4, results: 2 },
      disagree: { academicTime: -4, results: -2 },
      stronglyDisagree: { academicTime: -8, results: -6, teachersTrust: -5 }
    }
  },
  {
    id: 6,
    theme: "Academic Systems",
    text: "Classroom observations and lesson plan audits are conducted for every teacher at least twice a month.",
    effects: {
      stronglyAgree: { auditScores: 8, results: 6, studentProgress: 4 },
      agree: { auditScores: 4, results: 3 },
      disagree: { auditScores: -3, results: -2 },
      stronglyDisagree: { auditScores: -6, results: -5, studentProgress: -4 }
    }
  },
  {
    id: 7,
    theme: "Academic Systems",
    text: "The academic syllabus across all grades is completed on or ahead of the planned schedule without compromising quality.",
    effects: {
      stronglyAgree: { academicTime: 8, results: 6, parentTrust: 3 },
      agree: { academicTime: 4, results: 3 },
      disagree: { academicTime: -4, results: -3 },
      stronglyDisagree: { academicTime: -8, results: -6, parentTrust: -4 }
    }
  },
  {
    id: 8,
    theme: "Academic Systems",
    text: "Student assessments are graded promptly, and learning gap data is systematically tracked to adjust instruction.",
    effects: {
      stronglyAgree: { studentProgress: 8, results: 5, auditScores: 4 },
      agree: { studentProgress: 4, results: 2 },
      disagree: { studentProgress: -3, results: -2 },
      stronglyDisagree: { studentProgress: -8, results: -5, auditScores: -4 }
    }
  },
  {
    id: 9,
    theme: "Academic Systems",
    text: "Remedial classes and personalized learning support programs are actively run for students falling behind academically.",
    effects: {
      stronglyAgree: { studentProgress: 8, results: 6, parentTrust: 4 },
      agree: { studentProgress: 4, results: 3, parentTrust: 2 },
      disagree: { studentProgress: -3, results: -2 },
      stronglyDisagree: { studentProgress: -8, results: -5, parentTrust: -4 }
    }
  },
  {
    id: 10,
    theme: "Academic Systems",
    text: "Academic calendars and curriculum planning guides are finalized and shared with teachers before the academic term starts.",
    effects: {
      stronglyAgree: { academicTime: 8, teachersTrust: 6, managementTrust: 4 },
      agree: { academicTime: 4, teachersTrust: 3 },
      disagree: { academicTime: -4, teachersTrust: -3 },
      stronglyDisagree: { academicTime: -8, teachersTrust: -6, managementTrust: -4 }
    }
  },

  // Theme: Teachers Trust
  {
    id: 11,
    theme: "Teachers Trust",
    text: "Our annual teacher retention rate exceeds 90%, reflecting high staff satisfaction and professional security.",
    effects: {
      stronglyAgree: { teachersTrust: 10, reputation: 5, results: 4 },
      agree: { teachersTrust: 6, reputation: 2 },
      disagree: { teachersTrust: -4, reputation: -2 },
      stronglyDisagree: { teachersTrust: -10, reputation: -5, results: -4 }
    }
  },
  {
    id: 12,
    theme: "Teachers Trust",
    text: "School leadership is easily accessible to teachers for sharing personal concerns or professional feedback.",
    effects: {
      stronglyAgree: { teachersTrust: 8, integrity: 6, managementTrust: 4 },
      agree: { teachersTrust: 5, integrity: 3 },
      disagree: { teachersTrust: -4, managementTrust: -2 },
      stronglyDisagree: { teachersTrust: -8, integrity: -5, managementTrust: -4 }
    }
  },
  {
    id: 13,
    theme: "Teachers Trust",
    text: "We have an active, transparent system for teacher appreciation and professional milestone recognition.",
    effects: {
      stronglyAgree: { teachersTrust: 8, reputation: 4, managementTrust: 4 },
      agree: { teachersTrust: 5, reputation: 2 },
      disagree: { teachersTrust: -3 },
      stronglyDisagree: { teachersTrust: -8, managementTrust: -4 }
    }
  },
  {
    id: 14,
    theme: "Teachers Trust",
    text: "The distribution of teaching hours and administrative workload among staff is balanced and fair.",
    effects: {
      stronglyAgree: { teachersTrust: 8, academicTime: 4, compliance: 4 },
      agree: { teachersTrust: 4, academicTime: 2 },
      disagree: { teachersTrust: -4, academicTime: -2 },
      stronglyDisagree: { teachersTrust: -8, academicTime: -4, compliance: -4 }
    }
  },

  // Theme: Compliance & Integrity
  {
    id: 15,
    theme: "Compliance & Integrity",
    text: "All safety certifications, building approvals, and student health compliance documents are updated and audit-ready.",
    effects: {
      stronglyAgree: { compliance: 10, auditScores: 8, managementTrust: 4 },
      agree: { compliance: 6, auditScores: 4 },
      disagree: { compliance: -4, auditScores: -3 },
      stronglyDisagree: { compliance: -10, auditScores: -8, managementTrust: -5, reputation: -5 }
    }
  },
  {
    id: 16,
    theme: "Compliance & Integrity",
    text: "Our institution scores exceptionally high in surprise regulatory inspections or internal compliance checklists.",
    effects: {
      stronglyAgree: { compliance: 8, auditScores: 10, managementTrust: 4 },
      agree: { compliance: 4, auditScores: 6 },
      disagree: { compliance: -3, auditScores: -4 },
      stronglyDisagree: { compliance: -6, auditScores: -10, managementTrust: -4, reputation: -4 }
    }
  },
  {
    id: 17,
    theme: "Compliance & Integrity",
    text: "Zero compliance/integrity violations or ethical concerns have been raised by staff or stakeholders in the past year.",
    effects: {
      stronglyAgree: { integrity: 10, reputation: 6, managementTrust: 5 },
      agree: { integrity: 6, reputation: 3 },
      disagree: { integrity: -4, reputation: -3 },
      stronglyDisagree: { integrity: -10, reputation: -6, managementTrust: -5, whatsappHeat: 8 }
    }
  },
  {
    id: 18,
    theme: "Compliance & Integrity",
    text: "Safety guidelines, fire drills, and anti-bullying policies are actively practiced and strictly enforced.",
    effects: {
      stronglyAgree: { compliance: 8, parentTrust: 6, auditScores: 4 },
      agree: { compliance: 5, parentTrust: 3 },
      disagree: { compliance: -4, parentTrust: -3 },
      stronglyDisagree: { compliance: -8, parentTrust: -6, auditScores: -4, reputation: -4 }
    }
  },

  // Theme: Budget & Management
  {
    id: 19,
    theme: "Budget & Management",
    text: "Our annual budget planning is collaborative, data-driven, and maintains a healthy contingency reserve.",
    effects: {
      stronglyAgree: { budget: 10, managementTrust: 6, compliance: 4 },
      agree: { budget: 6, managementTrust: 3 },
      disagree: { budget: -4, managementTrust: -3 },
      stronglyDisagree: { budget: -10, managementTrust: -6, compliance: -4 }
    }
  },
  {
    id: 20,
    theme: "Budget & Management",
    text: "Vendor contracts and procurement cycles are regularly reviewed to ensure optimal cost and quality control.",
    effects: {
      stronglyAgree: { budget: 8, managementTrust: 4, compliance: 4 },
      agree: { budget: 4, managementTrust: 2 },
      disagree: { budget: -4 },
      stronglyDisagree: { budget: -8, managementTrust: -4, compliance: -4 }
    }
  },
  {
    id: 21,
    theme: "Budget & Management",
    text: "School resources (classrooms, laboratories, technology tools) are highly utilized and well-maintained without wastage.",
    effects: {
      stronglyAgree: { budget: 8, auditScores: 4, studentProgress: 4 },
      agree: { budget: 5, auditScores: 2 },
      disagree: { budget: -3, studentProgress: -2 },
      stronglyDisagree: { budget: -8, auditScores: -4, studentProgress: -4 }
    }
  },
  {
    id: 22,
    theme: "Budget & Management",
    text: "Financial approval processes are swift, well-documented, and prevent unauthorized expenditure.",
    effects: {
      stronglyAgree: { budget: 8, integrity: 8, auditScores: 6 },
      agree: { budget: 4, integrity: 4, auditScores: 3 },
      disagree: { budget: -4, integrity: -4, auditScores: -3 },
      stronglyDisagree: { budget: -8, integrity: -8, auditScores: -6, managementTrust: -5 }
    }
  },

  // Theme: Admissions & Results
  {
    id: 23,
    theme: "Admissions & Results",
    text: "The conversion rate of admission inquiries to active enrollments has increased or met our high growth targets.",
    effects: {
      stronglyAgree: { admissions: 10, budget: 5, reputation: 4 },
      agree: { admissions: 6, budget: 2 },
      disagree: { admissions: -4 },
      stronglyDisagree: { admissions: -10, budget: -4, reputation: -4 }
    }
  },
  {
    id: 24,
    theme: "Admissions & Results",
    text: "A substantial portion (>40%) of our new admissions are driven by referrals and word-of-mouth from existing parents.",
    effects: {
      stronglyAgree: { admissions: 8, parentTrust: 8, reputation: 6 },
      agree: { admissions: 5, parentTrust: 4, reputation: 3 },
      disagree: { admissions: -3, parentTrust: -3 },
      stronglyDisagree: { admissions: -8, parentTrust: -6, reputation: -5 }
    }
  },
  {
    id: 25,
    theme: "Admissions & Results",
    text: "Mock exams and board preparation bootcamps are systematically scheduled and reviewed to ensure high exam readiness.",
    effects: {
      stronglyAgree: { results: 10, studentProgress: 5, academicTime: 4 },
      agree: { results: 6, studentProgress: 3 },
      disagree: { results: -4, studentProgress: -2 },
      stronglyDisagree: { results: -10, studentProgress: -5, academicTime: -4 }
    }
  },
  {
    id: 26,
    theme: "Admissions & Results",
    text: "The percentage of students successfully progressing to higher grades or top tier universities has increased.",
    effects: {
      stronglyAgree: { studentProgress: 10, results: 8, admissions: 6 },
      agree: { studentProgress: 6, results: 4, admissions: 3 },
      disagree: { studentProgress: -4, results: -3 },
      stronglyDisagree: { studentProgress: -10, results: -6, admissions: -5 }
    }
  },
  {
    id: 27,
    theme: "Admissions & Results",
    text: "Our board exam results consistently rank in the top quartile of schools in our region.",
    effects: {
      stronglyAgree: { results: 10, reputation: 8, admissions: 6 },
      agree: { results: 6, reputation: 4, admissions: 3 },
      disagree: { results: -4, reputation: -3 },
      stronglyDisagree: { results: -10, reputation: -8, admissions: -6 }
    }
  },
  {
    id: 28,
    theme: "Admissions & Results",
    text: "Our school actively participates in external branding events, community programs, and national/regional rankings.",
    effects: {
      stronglyAgree: { reputation: 8, admissions: 6, managementTrust: 4 },
      agree: { reputation: 5, admissions: 3 },
      disagree: { reputation: -3 },
      stronglyDisagree: { reputation: -8, admissions: -5 }
    }
  }
];

export const CATEGORIES = {
  parentTrust: "Parent Trust",
  reputation: "Reputation",
  budget: "Budget",
  teachersTrust: "Teachers Trust",
  compliance: "Compliance",
  integrity: "Integrity",
  academicTime: "Academic Time",
  studentProgress: "Student Progress",
  whatsappHeat: "WhatsApp Heat",
  managementTrust: "Management Trust",
  auditScores: "Audit Scores",
  admissions: "Admissions",
  results: "Results"
};

// Compute minimum and maximum possible raw scores for each category dynamically
export function calculateMinMaxScores() {
  const minMax = {};
  
  // Initialize minMax for all categories
  Object.keys(CATEGORIES).forEach(cat => {
    minMax[cat] = { min: 0, max: 0 };
  });

  QUESTIONS.forEach(q => {
    // Find min and max for each category for this question across all choices
    Object.keys(CATEGORIES).forEach(cat => {
      let maxVal = -Infinity;
      let minVal = Infinity;
      
      const choices = ["stronglyAgree", "agree", "disagree", "stronglyDisagree"];
      choices.forEach(choice => {
        const val = q.effects[choice][cat] || 0;
        if (val > maxVal) maxVal = val;
        if (val < minVal) minVal = val;
      });

      minMax[cat].max += maxVal;
      minMax[cat].min += minVal;
    });
  });

  return minMax;
}

const MIN_MAX_SCORES = calculateMinMaxScores();

/**
 * Calculates final scores for the 13 categories as percentages (0-100)
 * @param {Object} answers - Key-value pair of { questionId: choiceString }
 * where choiceString is 'stronglyAgree', 'agree', 'disagree', or 'stronglyDisagree'
 */
export function calculateCategoryScores(answers) {
  const rawScores = {};
  
  // Initialize raw scores to 0
  Object.keys(CATEGORIES).forEach(cat => {
    rawScores[cat] = 0;
  });

  // Accumulate raw scores based on user answers
  QUESTIONS.forEach(q => {
    const choice = answers[q.id];
    if (choice && q.effects[choice]) {
      Object.keys(q.effects[choice]).forEach(cat => {
        rawScores[cat] += q.effects[choice][cat];
      });
    }
  });

  // Normalize scores to 0-100%
  const normalizedScores = {};
  Object.keys(CATEGORIES).forEach(cat => {
    const min = MIN_MAX_SCORES[cat].min;
    const max = MIN_MAX_SCORES[cat].max;
    const raw = rawScores[cat];
    
    // Safety division check
    const percentage = max !== min 
      ? Math.max(0, Math.min(100, Math.round(((raw - min) / (max - min)) * 100))) 
      : 50;
      
    normalizedScores[cat] = percentage;
  });

  return normalizedScores;
}

/**
 * Aggregates 13 categories into 5 main 3D axes (0-100)
 */
export function calculate3DAxes(catScores) {
  return {
    Trust: Math.round((catScores.parentTrust + catScores.teachersTrust + catScores.managementTrust) / 3),
    Stability: Math.round((catScores.budget + catScores.compliance + catScores.auditScores) / 3),
    Growth: Math.round((catScores.admissions + catScores.reputation) / 2),
    AcademicStrength: Math.round((catScores.academicTime + catScores.studentProgress + catScores.results) / 3),
    Governance: Math.round((catScores.integrity + (100 - catScores.whatsappHeat)) / 2) // Invert whatsappHeat
  };
}

/**
 * Classifies the school based on category and 3D axis scores
 */
export function getSchoolClassification(catScores, axes) {
  const avgScore = Object.values(catScores).reduce((a, b) => a + b, 0) / Object.values(catScores).length;

  if (axes.Growth > 75 && axes.Stability > 70) {
    return {
      type: "Growth Ready",
      color: "#00f2fe", // Cyber Cyan
      description: "Demonstrates an exceptional balance of expansion potential and operational foundations. The institution is primed for scalability.",
      recommendations: [
        "Leverage strong parent referrals to launch target branding campaigns.",
        "Reinvest budget surpluses into advanced digital labs or premium teacher professional development.",
        "Standardize compliance frameworks to maintain quality control during enrollment expansions."
      ]
    };
  } else if (catScores.reputation < 50 || catScores.whatsappHeat > 60) {
    return {
      type: "Reputation Risk",
      color: "#ff007f", // Cyber Pink
      description: "While internal processes may be functional, public sentiment and crisis management (WhatsApp groups, social media) are highly volatile.",
      recommendations: [
        "Establish an active parent communication protocol to address grievances within 24 hours.",
        "Train administrators on public relations and proactive community outreach.",
        "Implement a systematic monitoring channel for social media and parent discussion forums."
      ]
    };
  } else if (axes.AcademicStrength > 80) {
    return {
      type: "Academically Strong",
      color: "#a052ff", // Neon Purple
      description: "Classroom instruction, syllabus completion, and board result rankings are exceptional, but other management or financial pillars might be neglected.",
      recommendations: [
        "Cross-train academic team members into leadership and compliance roles.",
        "Refine budget planning to ensure academic success translates to institutional financial stability.",
        "Create structured marketing programs centered around student progress metrics."
      ]
    };
  } else if (axes.Stability < 55 || catScores.auditScores < 55) {
    return {
      type: "Operationally Unstable",
      color: "#ff9f00", // Amber Warning Glow
      description: "Compliance records, document readiness, or financial planning are erratic, presenting regulatory risks that could impact daily operations.",
      recommendations: [
        "Initiate a comprehensive internal compliance audit immediately.",
        "Implement decentralized, automated financial approval pathways to ensure transparent audits.",
        "Allocate dedicated administrative resources to document safety and regulatory readiness."
      ]
    };
  } else if (catScores.parentTrust < 50 || catScores.teachersTrust < 50) {
    return {
      type: "Trust Deficit",
      color: "#ff3333", // Red
      description: "Suffers from low engagement or high attrition among parents or teachers. Cultural alignment and accessibility of leaders need urgent reform.",
      recommendations: [
        "Open bi-weekly direct-to-principal dialogue sessions for teachers.",
        "Conduct a neutral third-party anonymous feedback survey for staff workload concerns.",
        "Revamp the parent grievance resolution engine with strict SLA tracking."
      ]
    };
  } else {
    return {
      type: "High Potential Institution",
      color: "#00ff66", // Bright Neon Green
      description: "Shows stable baseline metrics across all categories. Needs strategic focus on scaling operations and upgrading branding from regional to national standards.",
      recommendations: [
        "Define an institutional branding roadmap to transition from moderate to high regional reputation.",
        "Incorporate advanced learning tracking tools to push academic scores from good to outstanding.",
        "Review budget structures to free up 10% more funding for teacher recognition systems."
      ]
    };
  }
}
