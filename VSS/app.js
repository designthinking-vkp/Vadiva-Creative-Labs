/**
 * CBSE School Manpower Planning, Staff Optimization & Financial Forecasting System
 * Application Logic & Calculation Engine
 */

// ==========================================================================
// 1. DEFAULT DATA CONFIGURATION
// ==========================================================================

const DEFAULT_GRADES = [
    "Pre-KG", "LKG", "UKG", 
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", 
    "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", 
    "Grade 11", "Grade 12"
];

// Growth Model Student Enrollment Defaults
const DEFAULT_STUDENT_STRENGTH = {
    "Pre-KG":   [0,  0,  0,  0,  0],
    "LKG":      [25, 50, 50, 50, 50],
    "UKG":      [25, 50, 50, 50, 50],
    "Grade 1":  [30, 50, 50, 50, 50],
    "Grade 2":  [30, 50, 50, 50, 50],
    "Grade 3":  [30, 50, 60, 60, 60],
    "Grade 4":  [30, 50, 60, 60, 60],
    "Grade 5":  [30, 50, 60, 60, 60],
    "Grade 6":  [30, 50, 70, 70, 70],
    "Grade 7":  [30, 50, 70, 70, 70],
    "Grade 8":  [30, 50, 70, 70, 70],
    "Grade 9":  [0,  35, 90, 135, 180],
    "Grade 10": [0,   0, 35, 90, 135],
    "Grade 11": [0,  35, 120, 180, 240],
    "Grade 12": [0,   0, 35, 120, 205]
};

// Weekly Period Allocation Master per Section
const DEFAULT_PERIOD_ALLOCATIONS = {
    // Core & Secondary CBSE subjects
    "English": {
        primary: 7, middle: 6, high: 6, hs: 6, 
        mid_found: 0, high_found: 0, iit: 0, neet: 0
    },
    "Tamil": {
        primary: 6, middle: 6, high: 6, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 0
    },
    "Hindi": {
        primary: 4, middle: 4, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 0
    },
    "Mathematics": {
        primary: 7, middle: 7, high: 8, hs: 8,
        mid_found: 0, high_found: 0, iit: 0, neet: 0
    },
    "Science / EVS": {
        primary: 6, middle: 0, high: 0, hs: 0, // In Middle/High/HS, science splits
        mid_found: 0, high_found: 0, iit: 0, neet: 0
    },
    "Physics": {
        primary: 0, middle: 2, high: 3, hs: 8,
        mid_found: 0, high_found: 0, iit: 0, neet: 0
    },
    "Chemistry": {
        primary: 0, middle: 2, high: 3, hs: 8,
        mid_found: 0, high_found: 0, iit: 0, neet: 0
    },
    "Biology": {
        primary: 0, middle: 2, high: 3, hs: 8,
        mid_found: 0, high_found: 0, iit: 0, neet: 0
    },
    "Social Science": {
        primary: 5, middle: 5, high: 6, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 0
    },
    "Computer / AI": {
        primary: 2, middle: 3, high: 3, hs: 8,
        mid_found: 0, high_found: 0, iit: 0, neet: 0
    },
    
    // Non-Teacher Creating Subjects (Assigned to existing staff)
    "DRT": {
        primary: 1, middle: 1, high: 1, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 0, isNonCreating: true
    },
    "GK": {
        primary: 1, middle: 1, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 0, isNonCreating: true
    },
    "Value Education": {
        primary: 1, middle: 1, high: 1, hs: 1,
        mid_found: 0, high_found: 0, iit: 0, neet: 0, isNonCreating: true
    },
    "Vadiva": {
        primary: 1, middle: 1, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 0, isNonCreating: true
    },
    "ECA": {
        primary: 1, middle: 1, high: 1, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 0, isNonCreating: true
    },
    "Clubs": {
        primary: 1, middle: 1, high: 1, hs: 1,
        mid_found: 0, high_found: 0, iit: 0, neet: 0, isNonCreating: true
    },
    "Math Excel": {
        primary: 1, middle: 1, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 0, isNonCreating: true
    },
    "YLE": {
        primary: 1, middle: 1, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 0, isNonCreating: true
    },

    // Special Programs (Independent Faculty)
    "Foundation Mathematics": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 2, high_found: 2, iit: 0, neet: 0, isFoundation: true
    },
    "Foundation Physics": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 1, high_found: 1, iit: 0, neet: 0, isFoundation: true
    },
    "Foundation Chemistry": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 1, high_found: 1, iit: 0, neet: 0, isFoundation: true
    },
    "Foundation Biology": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 1, high_found: 1, iit: 0, neet: 0, isFoundation: true
    },
    "Reasoning": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 1, high_found: 1, iit: 0, neet: 0, isFoundation: true
    },
    "Aptitude": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 1, high_found: 1, iit: 0, neet: 0, isFoundation: true
    },
    
    // IIT batch
    "IIT Mathematics": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 4, neet: 0, isIIT: true
    },
    "IIT Physics": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 4, neet: 0, isIIT: true
    },
    "IIT Chemistry": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 4, neet: 0, isIIT: true
    },
    "IIT Biology": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 4, neet: 0, isIIT: true
    },
 
    // NEET batch
    "NEET Physics": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 3, isNEET: true
    },
    "NEET Chemistry": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 3, isNEET: true
    },
    "NEET Biology": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 3, isNEET: true
    },
    "NEET Botany": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 3, isNEET: true
    },
    "NEET Zoology": {
        primary: 0, middle: 0, high: 0, hs: 0,
        mid_found: 0, high_found: 0, iit: 0, neet: 3, isNEET: true
    }
};

// Five-Year Teaching Staff Affiliation Baseline (Excludes Homerooms)
const DEFAULT_BASELINE_TEACHERS = {
    "Primary":          [5, 8, 11, 11, 11],
    "Middle":           [5, 10, 11, 11, 11],
    "High":             [0, 4, 9, 9, 9],
    "Higher Secondary": [0, 6, 8, 8, 8],
    "Principal":        [0, 1, 1, 1, 1],
    "Vice Principal":   [1, 0, 0, 0, 0],
    "ACO – Primary & Middle":          [0, 2, 2, 2, 2],
    "ACO – High & Higher Secondary":   [0, 1, 2, 2, 2],
    "PET":              [2, 4, 5, 7, 7],
    "PET HOD":          [1, 1, 1, 1, 1],
    "Arts & Crafts":    [1, 2, 2, 2, 2],
    "Handwriting":      [0, 1, 1, 1, 1],
    "Library":          [0, 1, 1, 1, 1]
};

// Transport Default Buses count
const DEFAULT_BUSES = [5, 10, 12, 12, 12];

// Non-Teaching Staff Growth Numbers
const DEFAULT_NON_TEACHING_GROWTH = {
    "Admin Officer":    [1, 1, 1, 1, 1],
    "Cashier":          [1, 1, 1, 2, 2],
    "System Admin":     [1, 1, 1, 1, 1],
    "Receptionist":     [1, 1, 1, 1, 1],
    "PRO":              [1, 1, 1, 1, 1],
    "Counsellor":       [1, 1, 1, 1, 1],
    "Electrician":      [0, 1, 1, 1, 1],
    "Typist":           [1, 1, 1, 1, 1],
    "Lab Assistant":    [0, 1, 1, 1, 1],
    "Security":         [4, 7, 7, 7, 7],
    "Attender":         [1, 2, 2, 3, 3],
    "Housekeeping":     [5, 8, 14, 14, 14]
};

// Part-time ECA Staff Requirement
const DEFAULT_PART_TIME_ECA_REQS = {
    "Classical Dance":  [1, 1, 1, 1, 1],
    "Yoga":             [1, 1, 1, 1, 1],
    "Karate":           [1, 1, 1, 1, 1],
    "Music":            [2, 2, 2, 2, 2],
    "Other Activities": [0, 3, 3, 3, 3],
    "Sports Coach":     [1, 3, 3, 3, 3]
};

// Salary Tiers Config
const SALARY_TIERS = {
    tier1: {
        "Pre-KG Homeroom": 20000,
        "LKG Homeroom": 20000,
        "UKG Homeroom": 20000,
        "Gr 1-2 Homeroom": 23000,
        "Primary Teacher": 23000,
        "Middle Teacher": 25000,
        "High Teacher": 28000,
        "Higher Secondary Teacher": 35000,
        
        "Principal": 75000,
        "Vice Principal": 50000,
        "ACO – Primary & Middle": 35000,
        "ACO – High & Higher Secondary": 50000,
        "PET": 20000,
        "PET HOD": 25000,
        "Arts & Crafts": 20000, // Default 20,000 (can be updated to 25,000)
        "Handwriting": 20000,
        "Librarian": 20000,
        
        "Foundation Faculty": 30000,
        "IIT Faculty": 45000,
        "NEET Faculty": 45000,
        "IIT Mathematics": 45000,
        "IIT Physics": 45000,
        "IIT Chemistry": 45000,
        "IIT Biology": 45000,
        "NEET Physics": 45000,
        "NEET Chemistry": 45000,
        "NEET Biology": 45000,
        "NEET Botany": 45000,
        "NEET Zoology": 45000,
        
        // Non-teaching
        "Admin Officer": 30000,
        "Cashier": 25000,
        "System Admin": 20000,
        "Receptionist": 20000,
        "PRO": 20000,
        "Counsellor": 20000,
        "Electrician": 22000,
        "Driver": 20000,
        "Conductor": 13000,
        "Typist": 16000,
        "Lab Assistant": 16000,
        "Security": 17000,
        "Attender": 13000,
        "Housekeeping": 13000,
        
        // ECA
        "Classical Dance": 10000,
        "Yoga": 10000,
        "Karate": 10000,
        "Music": 20000,
        "Other Activities": 10000,
        "Sports Coach": 10000
    },
    tier2: {
        "Pre-KG Homeroom": 18000,
        "LKG Homeroom": 18000,
        "UKG Homeroom": 18000,
        "Gr 1-2 Homeroom": 20000,
        "Primary Teacher": 20000,
        "Middle Teacher": 23000,
        "High Teacher": 25000,
        "Higher Secondary Teacher": 30000,
        
        "Principal": 65000,
        "Vice Principal": 45000,
        "ACO – Primary & Middle": 30000,
        "ACO – High & Higher Secondary": 45000,
        "PET": 18000,
        "PET HOD": 22000,
        "Arts & Crafts": 18000,
        "Handwriting": 18000,
        "Librarian": 18000,
        
        "Foundation Faculty": 26000,
        "IIT Faculty": 40000,
        "NEET Faculty": 40000,
        "IIT Mathematics": 40000,
        "IIT Physics": 40000,
        "IIT Chemistry": 40000,
        "IIT Biology": 40000,
        "NEET Physics": 40000,
        "NEET Chemistry": 40000,
        "NEET Biology": 40000,
        "NEET Botany": 40000,
        "NEET Zoology": 40000,
        
        // Non-teaching
        "Admin Officer": 26000,
        "Cashier": 22000,
        "System Admin": 18000,
        "Receptionist": 18000,
        "PRO": 18000,
        "Counsellor": 18000,
        "Electrician": 19000,
        "Driver": 18000,
        "Conductor": 11500,
        "Typist": 14000,
        "Lab Assistant": 14000,
        "Security": 15000,
        "Attender": 11500,
        "Housekeeping": 11500,
        
        // ECA
        "Classical Dance": 8000,
        "Yoga": 8000,
        "Karate": 8000,
        "Music": 16000,
        "Other Activities": 8000,
        "Sports Coach": 8000
    }
};

// ==========================================================================
// 2. STATE MANAGER
// ==========================================================================

let appState = {
    schoolName: "Velammal Bodhi campus - Staff calculation",
    academicYear: "2026-27",
    maxStudentsPerSection: 40,
    globalSelectedYear: 3, // Default to complete year 3
    salaryTier: "tier1",
    annualIncrementPct: 5,
    scienceModel: "A", // Option A (combined Phys/Chem/Bio) or B (Separate)
    capacities: {
        primary: 32,
        middle: 32,
        highHS: 36
    },
    simulatedAdditionalSections: 0,
    
    // Onboarding setup wizard states
    wizardCompleted: false,
    studentGrowthRatePct: 15,
    busesStarting: 5,
    busesIncrement: 2,
    optFoundationEnabled: true,
    optIITNeetEnabled: true,
    
    // Grade-wise maximum students per section
    maxStudentsPerGrade: {
        "Pre-KG": 30, "LKG": 30, "UKG": 30,
        "Grade 1": 40, "Grade 2": 40, "Grade 3": 40, "Grade 4": 40, "Grade 5": 40,
        "Grade 6": 40, "Grade 7": 40, "Grade 8": 40,
        "Grade 9": 40, "Grade 10": 40, "Grade 11": 40, "Grade 12": 40
    },
    
    // User configurations
    studentStrength: JSON.parse(JSON.stringify(DEFAULT_STUDENT_STRENGTH)),
    periodAllocations: JSON.parse(JSON.stringify(DEFAULT_PERIOD_ALLOCATIONS)),
    baselineTeachers: JSON.parse(JSON.stringify(DEFAULT_BASELINE_TEACHERS)),
    buses: [...DEFAULT_BUSES],
    nonTeachingStaffGrowth: JSON.parse(JSON.stringify(DEFAULT_NON_TEACHING_GROWTH)),
    partTimeECAReqs: JSON.parse(JSON.stringify(DEFAULT_PART_TIME_ECA_REQS)),
    customSalaries: JSON.parse(JSON.stringify(SALARY_TIERS.tier1)) // Custom starts with tier 1 values
};

// Load state from local storage if exists
function loadStateFromLocalStorage() {
    const saved = localStorage.getItem("cbse_manpower_planner_state");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            
            // Self-heal and migrate baselineTeachers
            if (parsed.baselineTeachers) {
                if (parsed.baselineTeachers["ACO"]) {
                    delete parsed.baselineTeachers["ACO"];
                }
                Object.keys(DEFAULT_BASELINE_TEACHERS).forEach(k => {
                    if (!parsed.baselineTeachers[k]) {
                        parsed.baselineTeachers[k] = [...DEFAULT_BASELINE_TEACHERS[k]];
                    }
                });
            }
            
            // Self-heal customSalaries
            if (parsed.customSalaries) {
                if (parsed.customSalaries["ACO"]) {
                    delete parsed.customSalaries["ACO"];
                }
                Object.keys(SALARY_TIERS.tier1).forEach(k => {
                    if (parsed.customSalaries[k] === undefined) {
                        parsed.customSalaries[k] = SALARY_TIERS.tier1[k];
                    }
                });
            }
            
            // Self-heal other sub-objects
            if (parsed.studentStrength) {
                parsed.studentStrength = JSON.parse(JSON.stringify(DEFAULT_STUDENT_STRENGTH));
            }
            
            if (parsed.periodAllocations) {
                Object.keys(DEFAULT_PERIOD_ALLOCATIONS).forEach(k => {
                    if (!parsed.periodAllocations[k]) {
                        parsed.periodAllocations[k] = { ...DEFAULT_PERIOD_ALLOCATIONS[k] };
                    }
                });
            }
            
            if (parsed.nonTeachingStaffGrowth) {
                Object.keys(DEFAULT_NON_TEACHING_GROWTH).forEach(k => {
                    if (!parsed.nonTeachingStaffGrowth[k]) {
                        parsed.nonTeachingStaffGrowth[k] = [...DEFAULT_NON_TEACHING_GROWTH[k]];
                    }
                });
            }
            
            if (parsed.partTimeECAReqs) {
                Object.keys(DEFAULT_PART_TIME_ECA_REQS).forEach(k => {
                    if (!parsed.partTimeECAReqs[k]) {
                        parsed.partTimeECAReqs[k] = [...DEFAULT_PART_TIME_ECA_REQS[k]];
                    }
                });
            }
            
            if (parsed.maxStudentsPerGrade) {
                Object.keys(appState.maxStudentsPerGrade).forEach(k => {
                    if (parsed.maxStudentsPerGrade[k] === undefined) {
                        parsed.maxStudentsPerGrade[k] = appState.maxStudentsPerGrade[k];
                    }
                });
            }

            // Merge back safely
            appState = { ...appState, ...parsed };
            
            // Update input elements
            document.getElementById("school-name-input").value = appState.schoolName;
            document.getElementById("max-students-per-section").value = appState.maxStudentsPerSection;
            document.getElementById("salary-tier-select").value = appState.salaryTier;
            document.getElementById("annual-increment-pct").value = appState.annualIncrementPct;
            document.getElementById("science-model-select").value = appState.scienceModel;
            
            if (document.getElementById("sharing-model-select")) {
                document.getElementById("sharing-model-select").value = appState.sharingMode || "shared";
            }
            if (document.getElementById("neet-biology-select")) {
                document.getElementById("neet-biology-select").value = appState.neetBiologyStructure || "separate";
            }
            if (document.getElementById("iit-biology-select")) {
                document.getElementById("iit-biology-select").value = appState.iitBiologyProgram || "disabled";
            }
            
            if (appState.capacities) {
                document.getElementById("capacity-primary").value = appState.capacities.primary || 32;
                document.getElementById("capacity-middle").value = appState.capacities.middle || 32;
                document.getElementById("capacity-high-hs").value = appState.capacities.highHS || 36;
            }
        } catch (e) {
            console.error("Error loading local storage state", e);
        }
    }
}

function saveStateToLocalStorage() {
    localStorage.setItem("cbse_manpower_planner_state", JSON.stringify(appState));
}

function resetAppState() {
    localStorage.removeItem("cbse_manpower_planner_state");
    window.location.reload();
}

// ==========================================================================
// 3. ENGINE CALCULATIONS & MODELS
// ==========================================================================

// Core Calculation Output Store
let calcResults = {
    sections: {}, // grade -> [sections Y1...Y5]
    totalStudents: [0,0,0,0,0],
    totalSections: [0,0,0,0,0],
    
    // Core CBSE Teacher workloads (subject -> stage -> [periods Y1...Y5])
    cbseWorkloads: {},
    
    // Calculated staff count matrices (role -> [count Y1...Y5])
    staffCounts: {},
    
    // Salary tables (role -> [monthly Y1...Y5])
    monthlySalaries: {},
    
    // Total salaries by category
    salariesByCategory: {
        teaching: [0,0,0,0,0],
        special: [0,0,0,0,0],
        nonTeaching: [0,0,0,0,0],
        eca: [0,0,0,0,0]
    },
    
    // Utilizations (dept -> [utilization Y1...Y5])
    utilizations: {},
    
    grandTotalSalaries: [0,0,0,0,0],
    monthlyGrandTotalSalaries: [0,0,0,0,0],
    
    // Ratios
    teacherStudentRatio: [0,0,0,0,0],
    costPerStudent: [0,0,0,0,0],
    costPerSection: [0,0,0,0,0]
};

// Helper: Calculate sections from strength
function calculateSectionsCount(strength, limit) {
    if (strength <= 0) return 0;
    return Math.ceil(strength / limit);
}

// Main Calculate Loop
function runManpowerCalculations() {
    const limit = parseInt(appState.maxStudentsPerSection) || 40;
    
    // Reset Aggregates
    calcResults.totalStudents = [0,0,0,0,0];
    calcResults.totalSections = [0,0,0,0,0];
    
    // 1. Calculate sections count grade-wise
    DEFAULT_GRADES.forEach(grade => {
        calcResults.sections[grade] = [];
        for (let y = 0; y < 5; y++) {
            // Apply Growth rules: Y1 has NO grade 9-12. Y2 has NO grade 10 or 12.
            let strength = appState.studentStrength[grade][y] || 0;
            if (y === 0) { // Year 1
                if (["Grade 9", "Grade 10", "Grade 11", "Grade 12"].includes(grade)) strength = 0;
            } else if (y === 1) { // Year 2
                if (["Grade 10", "Grade 12"].includes(grade)) strength = 0;
            }
            // Sync adjusted strength back to local model for execution integrity
            appState.studentStrength[grade][y] = strength;
            
            const gradeLimit = (appState.maxStudentsPerGrade && appState.maxStudentsPerGrade[grade]) ? (parseInt(appState.maxStudentsPerGrade[grade]) || 40) : limit;
            const sections = calculateSectionsCount(strength, gradeLimit);
            calcResults.sections[grade].push(sections);
            
            calcResults.totalStudents[y] += strength;
            calcResults.totalSections[y] += sections;
        }
    });

    // Helper to get total sections for a stage
    const getStageSections = (stageGrades, yearIdx) => {
        return stageGrades.reduce((sum, g) => sum + calcResults.sections[g][yearIdx], 0);
    };

    const KG_GRADES = ["Pre-KG", "LKG", "UKG"];
    const PRIMARY_GRADES = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];
    const MIDDLE_GRADES = ["Grade 6", "Grade 7", "Grade 8"];
    const HIGH_GRADES = ["Grade 9", "Grade 10"];
    const HS_GRADES = ["Grade 11", "Grade 12"];

    // 2. Compile Period Workloads
    // Reset workload lists
    calcResults.cbseWorkloads = {};
    Object.keys(appState.periodAllocations).forEach(subject => {
        calcResults.cbseWorkloads[subject] = [];
        for (let y = 0; y < 5; y++) {
            let periods = 0;
            const alloc = appState.periodAllocations[subject];
            
            // Grades 1-2 english/tamil pooling workloads
            if (subject === "English") {
                periods += (calcResults.sections["Grade 1"][y] + calcResults.sections["Grade 2"][y]) * (alloc.primary || 7);
                periods += (calcResults.sections["Grade 3"][y] + calcResults.sections["Grade 4"][y] + calcResults.sections["Grade 5"][y]) * (alloc.primary || 7);
            } else if (subject === "Tamil") {
                periods += (calcResults.sections["Grade 1"][y] + calcResults.sections["Grade 2"][y]) * (alloc.primary || 6);
                periods += (calcResults.sections["Grade 3"][y] + calcResults.sections["Grade 4"][y] + calcResults.sections["Grade 5"][y]) * (alloc.primary || 6);
            } else {
                // Grades 3-5 Primary EVS/Science/Math etc.
                periods += getStageSections(["Grade 3", "Grade 4", "Grade 5"], y) * (alloc.primary || 0);
            }
            
            // Middle, High, HS workloads
            periods += getStageSections(MIDDLE_GRADES, y) * (alloc.middle || 0);
            periods += getStageSections(HIGH_GRADES, y) * (alloc.high || 0);
            periods += getStageSections(HS_GRADES, y) * (alloc.hs || 0);
            
            // Foundation prep program periods (Year 2 onwards)
            if (y >= 1) {
                periods += getStageSections(MIDDLE_GRADES, y) * (alloc.mid_found || 0);
                periods += getStageSections(HIGH_GRADES, y) * (alloc.high_found || 0);
                // IIT & NEET workloads
                periods += getStageSections(HS_GRADES, y) * (alloc.iit || 0);
                periods += getStageSections(HS_GRADES, y) * (alloc.neet || 0);
            }
            
            calcResults.cbseWorkloads[subject].push(periods);
        }
    });

    // 3. Compile Hired Staff Counts Matrix
    calcResults.staffCounts = {};
    
    // Homeroom Teachers Requirements
    calcResults.staffCounts["KG Homeroom"] = [];
    calcResults.staffCounts["Gr 1-2 Homeroom"] = [];
    
    for (let y = 0; y < 5; y++) {
        // KG Homeroom: Pre-KG, LKG, UKG sections
        const kgSec = getStageSections(KG_GRADES, y);
        calcResults.staffCounts["KG Homeroom"].push(kgSec);
        
        // Grades 1-2 Homeroom: Grade 1 & 2 sections
        const g12Sec = getStageSections(["Grade 1", "Grade 2"], y);
        calcResults.staffCounts["Gr 1-2 Homeroom"].push(g12Sec);
    }
    
    // 2. pooledDepts: english, tamil, hindi, social science, computer/ai (Mathematics is calculated separately)
    const pooledDepts = ["English", "Tamil", "Hindi", "Social Science", "Computer / AI"];
    pooledDepts.forEach(dept => {
        calcResults.staffCounts[dept] = [];
        for (let y = 0; y < 5; y++) {
            let fractionalCount = 0;
            const alloc = appState.periodAllocations[dept];
            
            // Primary (Grades 1-5)
            const primW = (dept === "English" || dept === "Tamil") ? 
                (getStageSections(PRIMARY_GRADES, y) * (alloc.primary || 0)) :
                (getStageSections(["Grade 3", "Grade 4", "Grade 5"], y) * (alloc.primary || 0));
            fractionalCount += primW / appState.capacities.primary;
            
            // Middle (Grades 6-8)
            const midW = getStageSections(MIDDLE_GRADES, y) * (alloc.middle || 0);
            fractionalCount += midW / appState.capacities.middle;
            
            // High (Grades 9-10)
            const highW = getStageSections(HIGH_GRADES, y) * (alloc.high || 0);
            fractionalCount += highW / appState.capacities.highHS;
            
            // HS (Grades 11-12)
            const hsW = getStageSections(HS_GRADES, y) * (alloc.hs || 0);
            fractionalCount += hsW / appState.capacities.highHS;
            
            calcResults.staffCounts[dept].push(Math.ceil(fractionalCount));
        }
    });

    // 3. Mathematics Department & IIT Mathematics calculation
    calcResults.staffCounts["Mathematics"] = [];
    calcResults.staffCounts["IIT Mathematics"] = [];
    for (let y = 0; y < 5; y++) {
        const allocMath = appState.periodAllocations["Mathematics"];
        const allocIITMath = appState.periodAllocations["IIT Mathematics"];
        
        const primMathW = getStageSections(PRIMARY_GRADES, y) * allocMath.primary;
        const midMathW = getStageSections(MIDDLE_GRADES, y) * allocMath.middle;
        
        const cbseHighMathW = getStageSections(HIGH_GRADES, y) * allocMath.high;
        const cbseHSMathW = getStageSections(HS_GRADES, y) * allocMath.hs;
        
        const iitMathW = y === 0 ? 0 : (getStageSections(HS_GRADES, y) * allocIITMath.iit);
        
        if (appState.sharingMode === "shared") {
            // Combined calculation
            const highHSWorkload = cbseHighMathW + cbseHSMathW + iitMathW;
            const hiredMath = Math.ceil(primMathW / appState.capacities.primary + midMathW / appState.capacities.middle + highHSWorkload / appState.capacities.highHS);
            
            calcResults.staffCounts["Mathematics"].push(hiredMath);
            
            // Worked fraction allocated to IIT (fractional FTE)
            const iitFTE = Math.min(hiredMath, iitMathW / appState.capacities.highHS);
            calcResults.staffCounts["IIT Mathematics"].push(Number(iitFTE.toFixed(2)));
        } else {
            // Dedicated mode
            const hiredCBSE = Math.ceil(primMathW / appState.capacities.primary + midMathW / appState.capacities.middle + (cbseHighMathW + cbseHSMathW) / appState.capacities.highHS);
            calcResults.staffCounts["Mathematics"].push(hiredCBSE);
            
            const hiredIIT = Math.ceil(iitMathW / appState.capacities.highHS);
            calcResults.staffCounts["IIT Mathematics"].push(hiredIIT);
        }
    }

    // Initialize all specialist subject counts arrays
    const specialistRoles = [
        "IIT Physics", "IIT Chemistry", "IIT Biology",
        "NEET Physics", "NEET Chemistry", "NEET Biology", "NEET Botany", "NEET Zoology"
    ];
    specialistRoles.forEach(role => {
        calcResults.staffCounts[role] = [];
    });

    // 4. Core Science Departments and Subject Specialists
    const sciSubjects = ["Physics", "Chemistry", "Biology"];
    sciSubjects.forEach(s => {
        calcResults.staffCounts[s] = [];
    });
    
    // Toggled Middle Composite Science roles
    calcResults.staffCounts["Science Phy/Che (Middle)"] = [];
    calcResults.staffCounts["Science Bio/Phy (Middle)"] = [];
    
    for (let y = 0; y < 5; y++) {
        // Calculate workloads for science subjects
        const getSecs = (stage) => getStageSections(stage, y);
        
        const pCBSEPhys = {
            mid: getSecs(MIDDLE_GRADES) * appState.periodAllocations["Physics"].middle,
            high: getSecs(HIGH_GRADES) * appState.periodAllocations["Physics"].high,
            hs: getSecs(HS_GRADES) * appState.periodAllocations["Physics"].hs
        };
        const pCBSEChem = {
            mid: getSecs(MIDDLE_GRADES) * appState.periodAllocations["Chemistry"].middle,
            high: getSecs(HIGH_GRADES) * appState.periodAllocations["Chemistry"].high,
            hs: getSecs(HS_GRADES) * appState.periodAllocations["Chemistry"].hs
        };
        const pCBSEBio = {
            mid: getSecs(MIDDLE_GRADES) * appState.periodAllocations["Biology"].middle,
            high: getSecs(HIGH_GRADES) * appState.periodAllocations["Biology"].high,
            hs: getSecs(HS_GRADES) * appState.periodAllocations["Biology"].hs
        };

        // Programs workloads
        const pIITPhys = y === 0 ? 0 : (getSecs(HS_GRADES) * appState.periodAllocations["IIT Physics"].iit);
        const pIITChem = y === 0 ? 0 : (getSecs(HS_GRADES) * appState.periodAllocations["IIT Chemistry"].iit);
        const pIITBio = (y === 0 || appState.iitBiologyProgram !== "enabled") ? 0 : (getSecs(HS_GRADES) * appState.periodAllocations["IIT Biology"].iit);

        const pNEETPhys = y === 0 ? 0 : (getSecs(HS_GRADES) * appState.periodAllocations["NEET Physics"].neet);
        const pNEETChem = y === 0 ? 0 : (getSecs(HS_GRADES) * appState.periodAllocations["NEET Chemistry"].neet);
        const pNEETBio = (y === 0 || appState.neetBiologyStructure !== "combined") ? 0 : (getSecs(HS_GRADES) * appState.periodAllocations["NEET Biology"].neet);
        const pNEETBot = (y === 0 || appState.neetBiologyStructure !== "separate") ? 0 : (getSecs(HS_GRADES) * appState.periodAllocations["NEET Botany"].neet);
        const pNEETZoo = (y === 0 || appState.neetBiologyStructure !== "separate") ? 0 : (getSecs(HS_GRADES) * appState.periodAllocations["NEET Zoology"].neet);

        // Middle composite science calculations
        if (appState.scienceModel === "A") {
            const wlPhyChe = pCBSEChem.mid + (pCBSEPhys.mid / 2);
            const wlBioPhy = pCBSEBio.mid + (pCBSEPhys.mid / 2);
            
            calcResults.staffCounts["Science Phy/Che (Middle)"].push(Math.ceil(wlPhyChe / appState.capacities.middle));
            calcResults.staffCounts["Science Bio/Phy (Middle)"].push(Math.ceil(wlBioPhy / appState.capacities.middle));
        } else {
            calcResults.staffCounts["Science Phy/Che (Middle)"].push(0);
            calcResults.staffCounts["Science Bio/Phy (Middle)"].push(0);
        }

        // Shared vs Dedicated calculations for Physics, Chemistry, Biology
        const highHSCap = appState.capacities.highHS;
        const middleCap = appState.capacities.middle;

        // Physics
        if (appState.sharingMode === "shared") {
            const physHighHSWorkload = pCBSEPhys.high + pCBSEPhys.hs + pIITPhys + pNEETPhys;
            const physMidW = appState.scienceModel === "A" ? 0 : pCBSEPhys.mid;
            
            const hiredPhys = Math.ceil(physMidW / middleCap + physHighHSWorkload / highHSCap);
            calcResults.staffCounts["Physics"].push(hiredPhys);
            
            const iitFTE = Math.min(hiredPhys, pIITPhys / highHSCap);
            const neetFTE = Math.min(hiredPhys - iitFTE, pNEETPhys / highHSCap);
            
            calcResults.staffCounts["IIT Physics"].push(Number(iitFTE.toFixed(2)));
            calcResults.staffCounts["NEET Physics"].push(Number(neetFTE.toFixed(2)));
        } else {
            const physMidW = appState.scienceModel === "A" ? 0 : pCBSEPhys.mid;
            const hiredCBSE = Math.ceil(physMidW / middleCap + (pCBSEPhys.high + pCBSEPhys.hs) / highHSCap);
            calcResults.staffCounts["Physics"].push(hiredCBSE);
            
            calcResults.staffCounts["IIT Physics"].push(Math.ceil(pIITPhys / highHSCap));
            calcResults.staffCounts["NEET Physics"].push(Math.ceil(pNEETPhys / highHSCap));
        }

        // Chemistry
        if (appState.sharingMode === "shared") {
            const chemHighHSWorkload = pCBSEChem.high + pCBSEChem.hs + pIITChem + pNEETChem;
            const chemMidW = appState.scienceModel === "A" ? 0 : pCBSEChem.mid;
            
            const hiredChem = Math.ceil(chemMidW / middleCap + chemHighHSWorkload / highHSCap);
            calcResults.staffCounts["Chemistry"].push(hiredChem);
            
            const iitFTE = Math.min(hiredChem, pIITChem / highHSCap);
            const neetFTE = Math.min(hiredChem - iitFTE, pNEETChem / highHSCap);
            
            calcResults.staffCounts["IIT Chemistry"].push(Number(iitFTE.toFixed(2)));
            calcResults.staffCounts["NEET Chemistry"].push(Number(neetFTE.toFixed(2)));
        } else {
            const chemMidW = appState.scienceModel === "A" ? 0 : pCBSEChem.mid;
            const hiredCBSE = Math.ceil(chemMidW / middleCap + (pCBSEChem.high + pCBSEChem.hs) / highHSCap);
            calcResults.staffCounts["Chemistry"].push(hiredCBSE);
            
            calcResults.staffCounts["IIT Chemistry"].push(Math.ceil(pIITChem / highHSCap));
            calcResults.staffCounts["NEET Chemistry"].push(Math.ceil(pNEETChem / highHSCap));
        }

        // Biology
        if (appState.sharingMode === "shared") {
            const bioHighHSWorkload = pCBSEBio.high + pCBSEBio.hs + pIITBio + pNEETBio + pNEETBot + pNEETZoo;
            const bioMidW = appState.scienceModel === "A" ? 0 : pCBSEBio.mid;
            
            const hiredBio = Math.ceil(bioMidW / middleCap + bioHighHSWorkload / highHSCap);
            calcResults.staffCounts["Biology"].push(hiredBio);
            
            const iitFTE = Math.min(hiredBio, pIITBio / highHSCap);
            let remaining = hiredBio - iitFTE;
            
            if (appState.neetBiologyStructure === "combined") {
                const neetFTE = Math.min(remaining, pNEETBio / highHSCap);
                calcResults.staffCounts["NEET Biology"].push(Number(neetFTE.toFixed(2)));
                calcResults.staffCounts["NEET Botany"].push(0);
                calcResults.staffCounts["NEET Zoology"].push(0);
            } else {
                const botFTE = Math.min(remaining, pNEETBot / highHSCap);
                remaining -= botFTE;
                const zooFTE = Math.min(remaining, pNEETZoo / highHSCap);
                
                calcResults.staffCounts["NEET Biology"].push(0);
                calcResults.staffCounts["NEET Botany"].push(Number(botFTE.toFixed(2)));
                calcResults.staffCounts["NEET Zoology"].push(Number(zooFTE.toFixed(2)));
            }
            calcResults.staffCounts["IIT Biology"].push(Number(iitFTE.toFixed(2)));
        } else {
            const bioMidW = appState.scienceModel === "A" ? 0 : pCBSEBio.mid;
            const hiredCBSE = Math.ceil(bioMidW / middleCap + (pCBSEBio.high + pCBSEBio.hs) / highHSCap);
            calcResults.staffCounts["Biology"].push(hiredCBSE);
            
            calcResults.staffCounts["IIT Biology"].push(Math.ceil(pIITBio / highHSCap));
            if (appState.neetBiologyStructure === "combined") {
                calcResults.staffCounts["NEET Biology"].push(Math.ceil(pNEETBio / highHSCap));
                calcResults.staffCounts["NEET Botany"].push(0);
                calcResults.staffCounts["NEET Zoology"].push(0);
            } else {
                calcResults.staffCounts["NEET Biology"].push(0);
                calcResults.staffCounts["NEET Botany"].push(Math.ceil(pNEETBot / highHSCap));
                calcResults.staffCounts["NEET Zoology"].push(Math.ceil(pNEETZoo / highHSCap));
            }
        }
    }

    // 5. General Primary Science / EVS
    calcResults.staffCounts["Science / EVS"] = [];
    for (let y = 0; y < 5; y++) {
        const primW = getStageSections(["Grade 3", "Grade 4", "Grade 5"], y) * appState.periodAllocations["Science / EVS"].primary;
        calcResults.staffCounts["Science / EVS"].push(Math.ceil(primW / appState.capacities.primary));
    }

    // Apply affiliation baselines to Core CBSE Teacher categories
    // Map of baseline stage categories
    const coreCbses = ["Primary", "Middle", "High", "Higher Secondary"];
    coreCbses.forEach(stage => {
        calcResults.staffCounts[stage + " Baseline Check"] = [];
        for (let y = 0; y < 5; y++) {
            const baselineVal = appState.baselineTeachers[stage][y];
            calcResults.staffCounts[stage + " Baseline Check"].push(baselineVal);
        }
    });

    // Special Specialist / Admin Staff baselines (hired directly from baseline matrix)
    const baselineKeys = [
        "Principal", "Vice Principal", 
        "ACO – Primary & Middle", "ACO – High & Higher Secondary", 
        "PET", "PET HOD", 
        "Arts & Crafts", "Handwriting", "Library"
    ];
    baselineKeys.forEach(key => {
        calcResults.staffCounts[key] = [];
        for (let y = 0; y < 5; y++) {
            calcResults.staffCounts[key].push(appState.baselineTeachers[key][y]);
        }
    });

    // Foundation Faculty (Year 2 onwards, calculated separately)
    const foundationSubjects = Object.keys(appState.periodAllocations).filter(s => appState.periodAllocations[s].isFoundation);
    calcResults.staffCounts["Foundation Faculty"] = [];
    for (let y = 0; y < 5; y++) {
        if (y === 0) {
            calcResults.staffCounts["Foundation Faculty"].push(0);
        } else {
            let totalFoundPeriods = 0;
            foundationSubjects.forEach(sub => {
                totalFoundPeriods += getStageSections(MIDDLE_GRADES, y) * appState.periodAllocations[sub].mid_found;
                totalFoundPeriods += getStageSections(HIGH_GRADES, y) * appState.periodAllocations[sub].high_found;
            });
            // Hired as a pooled Foundation department
            calcResults.staffCounts["Foundation Faculty"].push(Math.ceil(totalFoundPeriods / appState.capacities.highHS));
        }
    }



    // ECP Assistant Teachers (pre-KG, LKG, UKG sections rule)
    calcResults.staffCounts["ECP Assistant"] = [];
    for (let y = 0; y < 5; y++) {
        const kgSecs = getStageSections(KG_GRADES, y);
        let ecpCount = 0;
        if (kgSecs >= 10) ecpCount = 3;
        else if (kgSecs >= 7) ecpCount = 2;
        else if (kgSecs >= 4) ecpCount = 1;
        
        calcResults.staffCounts["ECP Assistant"].push(ecpCount);
    }

    // Non-Teaching Staff (growth model + transport)
    Object.keys(appState.nonTeachingStaffGrowth).forEach(role => {
        calcResults.staffCounts[role] = [];
        for (let y = 0; y < 5; y++) {
            calcResults.staffCounts[role].push(appState.nonTeachingStaffGrowth[role][y]);
        }
    });

    // Transport Driver/Conductors count tied directly to number of buses
    calcResults.staffCounts["Driver"] = [];
    calcResults.staffCounts["Conductor"] = [];
    for (let y = 0; y < 5; y++) {
        const buses = appState.buses[y];
        calcResults.staffCounts["Driver"].push(buses);
        calcResults.staffCounts["Conductor"].push(buses);
    }

    // Part-time ECA Staff
    Object.keys(appState.partTimeECAReqs).forEach(role => {
        calcResults.staffCounts[role] = [];
        for (let y = 0; y < 5; y++) {
            calcResults.staffCounts[role].push(appState.partTimeECAReqs[role][y]);
        }
    });

    // 4. Salaries schedule calculation with annual compounding
    const scale = appState.salaryTier === "custom" ? appState.customSalaries : SALARY_TIERS[appState.salaryTier];
    const increment = (parseFloat(appState.annualIncrementPct) || 5) / 100;
    
    calcResults.monthlySalaries = {};
    Object.keys(scale).forEach(role => {
        calcResults.monthlySalaries[role] = [];
        const baseSal = scale[role] || 20000;
        for (let y = 0; y < 5; y++) {
            // Apply compounding increment starting Year 2
            const compoundedVal = baseSal * Math.pow(1 + increment, y);
            calcResults.monthlySalaries[role].push(Math.round(compoundedVal));
        }
    });

    // Add extra calculated salaries mapping for visual purposes
    const subCategories = [
        "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology", 
        "Science / EVS", "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI"
    ];
    subCategories.forEach(sub => {
        // Map science and subjects to corresponding stage salary values
        calcResults.monthlySalaries[sub] = [];
        for (let y = 0; y < 5; y++) {
            // Standard middle or high rate
            const standardRate = scale["Middle Teacher"] * Math.pow(1 + increment, y);
            calcResults.monthlySalaries[sub].push(Math.round(standardRate));
        }
    });

    // 5. Total budget compiling
    calcResults.salariesByCategory = {
        teaching: [0,0,0,0,0],
        special: [0,0,0,0,0],
        nonTeaching: [0,0,0,0,0],
        eca: [0,0,0,0,0]
    };
    calcResults.monthlySalariesByCategory = {
        teaching: [0,0,0,0,0],
        special: [0,0,0,0,0],
        nonTeaching: [0,0,0,0,0],
        eca: [0,0,0,0,0]
    };
    calcResults.grandTotalSalaries = [0,0,0,0,0];
    calcResults.monthlyGrandTotalSalaries = [0,0,0,0,0];

    // Helper to add to financial totals
    const addRoleSalary = (role, countArray, cat) => {
        for (let y = 0; y < 5; y++) {
            const count = countArray[y];
            const monSal = calcResults.monthlySalaries[role] ? calcResults.monthlySalaries[role][y] : 20000;
            const annualSal = count * monSal * 12;
            const monthlyTotal = count * monSal;
            
            calcResults.salariesByCategory[cat][y] += annualSal;
            calcResults.monthlySalariesByCategory[cat][y] += monthlyTotal;
            calcResults.grandTotalSalaries[y] += annualSal;
            calcResults.monthlyGrandTotalSalaries[y] += monthlyTotal;
        }
    };

    // Teaching staff additions
    addRoleSalary("KG Homeroom", calcResults.staffCounts["KG Homeroom"], "teaching");
    addRoleSalary("Gr 1-2 Homeroom", calcResults.staffCounts["Gr 1-2 Homeroom"], "teaching");
    addRoleSalary("ECP Assistant", calcResults.staffCounts["ECP Assistant"], "teaching");
    
    // Core CBSE subject depts with shared-workload salary offsets
    const coreDepts = [
        "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS",
        "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology"
    ];
    coreDepts.forEach(d => {
        if (appState.sharingMode === "shared") {
            let adjustedCount = [];
            for (let y = 0; y < 5; y++) {
                let count = calcResults.staffCounts[d][y] || 0;
                if (d === "Mathematics") {
                    count -= (calcResults.staffCounts["IIT Mathematics"][y] || 0);
                } else if (d === "Physics") {
                    count -= (calcResults.staffCounts["IIT Physics"][y] || 0) + (calcResults.staffCounts["NEET Physics"][y] || 0);
                } else if (d === "Chemistry") {
                    count -= (calcResults.staffCounts["IIT Chemistry"][y] || 0) + (calcResults.staffCounts["NEET Chemistry"][y] || 0);
                } else if (d === "Biology") {
                    count -= (calcResults.staffCounts["IIT Biology"][y] || 0) + 
                             (calcResults.staffCounts["NEET Biology"][y] || 0) + 
                             (calcResults.staffCounts["NEET Botany"][y] || 0) + 
                             (calcResults.staffCounts["NEET Zoology"][y] || 0);
                }
                adjustedCount.push(Math.max(0, count));
            }
            addRoleSalary(d, adjustedCount, "teaching");
        } else {
            addRoleSalary(d, calcResults.staffCounts[d], "teaching");
        }
    });

    // Admin & Specialist baselines
    baselineKeys.forEach(k => {
        // Map baseline keys to correct salary scale role name
        let salaryKey = k;
        if (k === "Library") salaryKey = "Librarian";
        addRoleSalary(salaryKey, calcResults.staffCounts[k], "teaching");
    });

    // Foundation/IIT/NEET
    addRoleSalary("Foundation Faculty", calcResults.staffCounts["Foundation Faculty"], "special");
    
    // Subject-specific IIT & NEET salary budgets
    const iitRoles = ["IIT Mathematics", "IIT Physics", "IIT Chemistry", "IIT Biology"];
    const neetRoles = ["NEET Physics", "NEET Chemistry", "NEET Biology", "NEET Botany", "NEET Zoology"];

    iitRoles.forEach(r => {
        if (appState.iitBiologyProgram !== "enabled" && r === "IIT Biology") return;
        addRoleSalary(r, calcResults.staffCounts[r], "special");
    });

    neetRoles.forEach(r => {
        if (appState.neetBiologyStructure === "combined" && (r === "NEET Botany" || r === "NEET Zoology")) return;
        if (appState.neetBiologyStructure === "separate" && r === "NEET Biology") return;
        addRoleSalary(r, calcResults.staffCounts[r], "special");
    });

    // Non-teaching
    Object.keys(appState.nonTeachingStaffGrowth).forEach(r => {
        addRoleSalary(r, calcResults.staffCounts[r], "nonTeaching");
    });
    addRoleSalary("Driver", calcResults.staffCounts["Driver"], "nonTeaching");
    addRoleSalary("Conductor", calcResults.staffCounts["Conductor"], "nonTeaching");

    // ECA
    Object.keys(appState.partTimeECAReqs).forEach(e => {
        addRoleSalary(e, calcResults.staffCounts[e], "eca");
    });

    // 6. Ratios & Key Indicators
    for (let y = 0; y < 5; y++) {
        const stds = calcResults.totalStudents[y] || 1;
        const secs = calcResults.totalSections[y] || 1;
        
        // Sum total hired teachers count (teaching + special faculties)
        let totalHiredTeachers = 0;
        const teachingStaffKeys = [
            "KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant", ...coreDepts, 
            "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary", 
            "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library",
            "Foundation Faculty", 
            "IIT Mathematics", "IIT Physics", "IIT Chemistry", "IIT Biology",
            "NEET Physics", "NEET Chemistry", "NEET Biology", "NEET Botany", "NEET Zoology"
        ];
        teachingStaffKeys.forEach(k => {
            totalHiredTeachers += calcResults.staffCounts[k] ? calcResults.staffCounts[k][y] : 0;
        });

        calcResults.teacherStudentRatio[y] = Math.round((stds / (totalHiredTeachers || 1)) * 10) / 10;
        calcResults.costPerStudent[y] = Math.round(calcResults.grandTotalSalaries[y] / stds);
        calcResults.costPerSection[y] = Math.round(calcResults.grandTotalSalaries[y] / secs);
    }

    // 7. Staff Utilization Compile
    calcResults.utilizations = {};
    const utilizableDepts = ["English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS"];
    utilizableDepts.forEach(dept => {
        calcResults.utilizations[dept] = [];
        for (let y = 0; y < 5; y++) {
            const periods = calcResults.cbseWorkloads[dept][y];
            const staff = calcResults.staffCounts[dept][y];
            const cap = appState.capacities.primary; // default to 32 for util percentage
            
            const totalCap = staff * cap;
            const util = totalCap > 0 ? Math.round((periods / totalCap) * 100) : 0;
            calcResults.utilizations[dept].push(util);
        }
    });

    // Add science depts utilization
    if (appState.scienceModel === "A") {
        calcResults.utilizations["Science Phy/Che (Middle)"] = [];
        calcResults.utilizations["Science Bio/Phy (Middle)"] = [];
        for (let y = 0; y < 5; y++) {
            const staffPC = calcResults.staffCounts["Science Phy/Che (Middle)"][y];
            const staffBP = calcResults.staffCounts["Science Bio/Phy (Middle)"][y];
            
            // Middle periods phys/chem/bio
            const pPhys = getStageSections(MIDDLE_GRADES, y) * appState.periodAllocations["Physics"].middle;
            const pChem = getStageSections(MIDDLE_GRADES, y) * appState.periodAllocations["Chemistry"].middle;
            const pBio = getStageSections(MIDDLE_GRADES, y) * appState.periodAllocations["Biology"].middle;
            
            const wlPC = pChem + (pPhys / 2);
            const wlBP = pBio + (pPhys / 2);
            
            calcResults.utilizations["Science Phy/Che (Middle)"].push(staffPC > 0 ? Math.round((wlPC / (staffPC * 32)) * 100) : 0);
            calcResults.utilizations["Science Bio/Phy (Middle)"].push(staffBP > 0 ? Math.round((wlBP / (staffBP * 32)) * 100) : 0);
        }
    } else {
        sciSubjects.forEach(sub => {
            calcResults.utilizations[sub] = [];
            for (let y = 0; y < 5; y++) {
                const staff = calcResults.staffCounts[sub][y];
                const p = calcResults.cbseWorkloads[sub][y];
                const totalCap = staff * 36;
                calcResults.utilizations[sub].push(totalCap > 0 ? Math.round((p / totalCap) * 100) : 0);
            }
        });
    }

    saveStateToLocalStorage();
}

// Helper: Determine utilization pill colors
function getUtilBadge(util) {
    if (util === 0) return `<span class="badge badge-green">0%</span>`;
    if (util >= 80 && util <= 95) return `<span class="badge badge-green">${util}% (Optimal)</span>`;
    if (util >= 60 && util <= 79) return `<span class="badge badge-yellow">${util}% (Under)</span>`;
    if (util >= 96 && util <= 100) return `<span class="badge badge-orange">${util}% (Full)</span>`;
    return `<span class="badge badge-red">${util}% (Over)</span>`;
}

// ==========================================================================
// 4. CHART RENDERING CONTROLLER
// ==========================================================================

let salaryChartInstance = null;
let staffChartInstance = null;
let utilChartInstance = null;

function renderDashboardCharts() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const textColor = isDark ? "#9ca3af" : "#475569";
    const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    
    // Y-axis grid line options
    const scaleOpts = {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: "Plus Jakarta Sans" } }
    };

    // 1. Five Year Salary Projection Line Chart
    const ctxProjection = document.getElementById("chart-salary-projection").getContext("2d");
    if (salaryChartInstance) salaryChartInstance.destroy();
    
    salaryChartInstance = new Chart(ctxProjection, {
        type: "line",
        data: {
            labels: ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"],
            datasets: [
                {
                    label: "CBSE Teachers",
                    data: calcResults.salariesByCategory.teaching.map(v => v / 100000), // In Lakhs
                    borderColor: "#6366f1",
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    fill: true,
                    tension: 0.3,
                    borderWidth: 3
                },
                {
                    label: "IIT/NEET/Foundation",
                    data: calcResults.salariesByCategory.special.map(v => v / 100000),
                    borderColor: "#0ea5e9",
                    backgroundColor: "rgba(14, 165, 233, 0.1)",
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2
                },
                {
                    label: "Non-Teaching Staff",
                    data: calcResults.salariesByCategory.nonTeaching.map(v => v / 100000),
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2
                },
                {
                    label: "ECA Staff",
                    data: calcResults.salariesByCategory.eca.map(v => v / 100000),
                    borderColor: "#f59e0b",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    fill: true,
                    tension: 0.3,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: textColor, font: { family: "Outfit", size: 12 } } }
            },
            scales: {
                x: scaleOpts,
                y: {
                    ...scaleOpts,
                    title: { display: true, text: "Annual Cost (₹ Lakhs)", color: textColor }
                }
            }
        }
    });

    // 2. Staff Distribution Pie Chart for Selected Year
    const ctxStaff = document.getElementById("chart-staff-distribution").getContext("2d");
    if (staffChartInstance) staffChartInstance.destroy();
    
    const yearIdx = appState.globalSelectedYear - 1;
    let tCount = 0;
    const coreDepts = [
        "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS",
        "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology"
    ];
    const teacherRoles = [
        "KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant", ...coreDepts,
        "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary", "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library"
    ];
    teacherRoles.forEach(k => { tCount += calcResults.staffCounts[k][yearIdx]; });
    
    let splCount = 0;
    const specKeys = ["Foundation Faculty", "IIT Mathematics", "IIT Physics", "IIT Chemistry"];
    if (appState.iitBiologyProgram === "enabled") specKeys.push("IIT Biology");
    specKeys.push("NEET Physics", "NEET Chemistry");
    if (appState.neetBiologyStructure === "combined") specKeys.push("NEET Biology");
    else specKeys.push("NEET Botany", "NEET Zoology");
    specKeys.forEach(k => {
        splCount += calcResults.staffCounts[k] ? calcResults.staffCounts[k][yearIdx] : 0;
    });

    let nonTeachTotal = 0;
    Object.keys(appState.nonTeachingStaffGrowth).forEach(k => { nonTeachTotal += calcResults.staffCounts[k] ? calcResults.staffCounts[k][yearIdx] : 0; });
    nonTeachTotal += (calcResults.staffCounts["Driver"] ? calcResults.staffCounts["Driver"][yearIdx] : 0) + (calcResults.staffCounts["Conductor"] ? calcResults.staffCounts["Conductor"][yearIdx] : 0);

    let ecaTotal = 0;
    Object.keys(appState.partTimeECAReqs).forEach(k => { ecaTotal += calcResults.staffCounts[k] ? calcResults.staffCounts[k][yearIdx] : 0; });

    const teachingTotal = tCount + splCount;

    staffChartInstance = new Chart(ctxStaff, {
        type: "doughnut",
        data: {
            labels: ["Teaching Staff", "Non-Teaching Staff", "Part-Time / ECA Staff"],
            datasets: [{
                data: [teachingTotal, nonTeachTotal, ecaTotal],
                backgroundColor: ["#6366f1", "#10b981", "#f59e0b"],
                borderWidth: isDark ? 2 : 0,
                borderColor: isDark ? "#121426" : "#fff"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "right", labels: { color: textColor, font: { family: "Outfit" } } }
            },
            cutout: "70%"
        }
    });

    // 3. Department-wise Teacher Utilization Bar Chart
    const ctxUtil = document.getElementById("chart-dept-utilization").getContext("2d");
    if (utilChartInstance) utilChartInstance.destroy();

    const depts = Object.keys(calcResults.utilizations);
    const utilsData = depts.map(d => calcResults.utilizations[d][yearIdx]);
    
    // Dynamic bar colors based on utilization norms
    const barColors = utilsData.map(v => {
        if (v >= 80 && v <= 95) return "rgba(16, 185, 129, 0.7)"; // Optimal
        if (v >= 60 && v < 80) return "rgba(234, 179, 8, 0.7)"; // Under
        return "rgba(239, 68, 68, 0.7)"; // Over/Empty
    });

    utilChartInstance = new Chart(ctxUtil, {
        type: "bar",
        data: {
            labels: depts,
            datasets: [{
                label: "Utilization (%)",
                data: utilsData,
                backgroundColor: barColors,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: scaleOpts,
                y: {
                    ...scaleOpts,
                    min: 0,
                    max: 120,
                    title: { display: true, text: "Percentage (%)", color: textColor }
                }
            }
        }
    });
}

// ==========================================================================
// 5. VIEW DATA BINDING & PRESENTATION
// ==========================================================================

function updateDashboardMetrics() {
    const yIdx = appState.globalSelectedYear - 1;
    
    // Students/Sections count
    document.getElementById("dash-total-students").textContent = calcResults.totalStudents[yIdx];
    document.getElementById("dash-sections-count").textContent = `${calcResults.totalSections[yIdx]} Sections`;
    
    // Total Hired Teachers Count
    let tCount = 0;
    const coreDepts = [
        "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS",
        "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology"
    ];
    const teacherRoles = [
        "KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant", ...coreDepts,
        "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary", "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library"
    ];
    teacherRoles.forEach(k => { tCount += calcResults.staffCounts[k][yIdx]; });
    
    // Special teachers count
    let splCount = 0;
    const specKeys = ["Foundation Faculty", "IIT Mathematics", "IIT Physics", "IIT Chemistry"];
    if (appState.iitBiologyProgram === "enabled") specKeys.push("IIT Biology");
    specKeys.push("NEET Physics", "NEET Chemistry");
    if (appState.neetBiologyStructure === "combined") specKeys.push("NEET Biology");
    else specKeys.push("NEET Botany", "NEET Zoology");
    
    specKeys.forEach(k => {
        splCount += calcResults.staffCounts[k] ? calcResults.staffCounts[k][yIdx] : 0;
    });

    const totalTeachers = tCount + splCount;
    const teachMonSal = calcResults.monthlySalariesByCategory.teaching[yIdx] + calcResults.monthlySalariesByCategory.special[yIdx];
    const teachAnnSal = calcResults.salariesByCategory.teaching[yIdx] + calcResults.salariesByCategory.special[yIdx];

    document.getElementById("dash-total-teachers").textContent = totalTeachers;
    document.getElementById("dash-teaching-salaries").textContent = `Monthly: ₹${Math.round(teachMonSal).toLocaleString('en-IN')} | Annual: ₹${Math.round(teachAnnSal).toLocaleString('en-IN')}`;
    
    // Non-Teaching Count
    let ntCount = 0;
    Object.keys(appState.nonTeachingStaffGrowth).forEach(k => { ntCount += calcResults.staffCounts[k] ? calcResults.staffCounts[k][yIdx] : 0; });
    ntCount += (calcResults.staffCounts["Driver"] ? calcResults.staffCounts["Driver"][yIdx] : 0) + (calcResults.staffCounts["Conductor"] ? calcResults.staffCounts["Conductor"][yIdx] : 0);
    const ntMonSal = calcResults.monthlySalariesByCategory.nonTeaching[yIdx];
    const ntAnnSal = calcResults.salariesByCategory.nonTeaching[yIdx];

    document.getElementById("dash-total-nonteaching").textContent = ntCount;
    document.getElementById("dash-nonteaching-salaries").textContent = `Monthly: ₹${Math.round(ntMonSal).toLocaleString('en-IN')} | Annual: ₹${Math.round(ntAnnSal).toLocaleString('en-IN')}`;

    // Part-Time / ECA Staff Count
    let ecaCount = 0;
    Object.keys(appState.partTimeECAReqs).forEach(k => { ecaCount += calcResults.staffCounts[k] ? calcResults.staffCounts[k][yIdx] : 0; });
    const ecaMonSal = calcResults.monthlySalariesByCategory.eca[yIdx];
    const ecaAnnSal = calcResults.salariesByCategory.eca[yIdx];

    document.getElementById("dash-total-eca").textContent = ecaCount;
    document.getElementById("dash-eca-salaries").textContent = `Monthly: ₹${Math.round(ecaMonSal).toLocaleString('en-IN')} | Annual: ₹${Math.round(ecaAnnSal).toLocaleString('en-IN')}`;

    // Grand Totals Summary
    const totalEmployees = totalTeachers + ntCount + ecaCount;
    const grandMonSal = calcResults.monthlyGrandTotalSalaries[yIdx];
    const grandAnnSal = calcResults.grandTotalSalaries[yIdx];

    document.getElementById("dash-grand-total-employees").textContent = `${totalEmployees} Employees`;
    document.getElementById("dash-grand-total-salaries").textContent = `Monthly: ₹${Math.round(grandMonSal).toLocaleString('en-IN')} | Annual: ₹${Math.round(grandAnnSal).toLocaleString('en-IN')}`;
    
    // Avg Teacher Workload Utilization (if card exists in DOM)
    const utilKeys = Object.keys(calcResults.utilizations);
    const avgUtil = Math.round(utilKeys.reduce((sum, k) => sum + calcResults.utilizations[k][yIdx], 0) / (utilKeys.length || 1));
    const workloadEl = document.getElementById("dash-avg-utilization");
    if (workloadEl) {
        workloadEl.textContent = `${avgUtil}%`;
        let label = "Optimal Workload";
        if (avgUtil < 70) label = "Underutilized Capacity";
        if (avgUtil > 95) label = "Severe Bottlenecks";
        document.getElementById("dash-utilization-status").textContent = label;
    }
}

// ==========================================================================
// DETAILED SALARY BREAKDOWN HELPERS, MODALS & TABLES
// ==========================================================================

function getTeachingStaffTotalsForYear(yIdx) {
    let count = 0;
    let monthly = 0;
    const coreDepts = [
        "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS",
        "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology"
    ];
    const teachList = [
        "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary",
        "KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant",
        ...coreDepts, "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library",
        "Foundation Faculty", "IIT Mathematics", "IIT Physics", "IIT Chemistry"
    ];
    if (appState.iitBiologyProgram === "enabled") teachList.push("IIT Biology");
    teachList.push("NEET Physics", "NEET Chemistry");
    if (appState.neetBiologyStructure === "combined") teachList.push("NEET Biology");
    else teachList.push("NEET Botany", "NEET Zoology");

    teachList.forEach(role => {
        let rCount = calcResults.staffCounts[role] ? calcResults.staffCounts[role][yIdx] : 0;
        if (appState.sharingMode === "shared") {
            if (coreDepts.includes(role)) {
                if (role === "Mathematics") {
                    rCount -= (calcResults.staffCounts["IIT Mathematics"][yIdx] || 0);
                } else if (role === "Physics") {
                    rCount -= (calcResults.staffCounts["IIT Physics"][yIdx] || 0) + (calcResults.staffCounts["NEET Physics"][yIdx] || 0);
                } else if (role === "Chemistry") {
                    rCount -= (calcResults.staffCounts["IIT Chemistry"][yIdx] || 0) + (calcResults.staffCounts["NEET Chemistry"][yIdx] || 0);
                } else if (role === "Biology") {
                    rCount -= (calcResults.staffCounts["IIT Biology"][yIdx] || 0) + 
                             (calcResults.staffCounts["NEET Biology"][yIdx] || 0) + 
                             (calcResults.staffCounts["NEET Botany"][yIdx] || 0) + 
                             (calcResults.staffCounts["NEET Zoology"][yIdx] || 0);
                }
                rCount = Math.max(0, rCount);
            }
        }
        let roleSalKey = role;
        if (role === "Library") roleSalKey = "Librarian";
        const monSal = calcResults.monthlySalaries[roleSalKey] ? calcResults.monthlySalaries[roleSalKey][yIdx] : 20000;
        count += rCount;
        monthly += rCount * monSal;
    });
    return { count, monthly, annual: monthly * 12 };
}

function getNonTeachingStaffTotalsForYear(yIdx) {
    let count = 0;
    let monthly = 0;
    const ntList = [
        "Admin Officer", "Receptionist", "Sys Admin", "Counsellor", "Security HOD", "Security Guard", "Electrician", "Attender", "Housekeeping HOD", "Housekeeping Staff", "Gardener", "Driver", "Conductor"
    ];
    ntList.forEach(role => {
        let rCount = calcResults.staffCounts[role] ? calcResults.staffCounts[role][yIdx] : 0;
        const monSal = calcResults.monthlySalaries[role] ? calcResults.monthlySalaries[role][yIdx] : 20000;
        count += rCount;
        monthly += rCount * monSal;
    });
    return { count, monthly, annual: monthly * 12 };
}

function getECAStaffTotalsForYear(yIdx) {
    let count = 0;
    let monthly = 0;
    const ecaList = [
        "Classical Dance", "Yoga", "Karate", "Music", "Other Activities", "Sports Coach"
    ];
    ecaList.forEach(role => {
        let rCount = calcResults.staffCounts[role] ? calcResults.staffCounts[role][yIdx] : 0;
        const monSal = calcResults.monthlySalaries[role] ? calcResults.monthlySalaries[role][yIdx] : 10000;
        count += rCount;
        monthly += rCount * monSal;
    });
    return { count, monthly, annual: monthly * 12 };
}

function showDetailedSalaryDrilldown(category) {
    const yIdx = appState.globalSelectedYear - 1;
    
    // Create modal element if not exists
    let modal = document.getElementById("drilldown-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "drilldown-modal";
        modal.className = "modal-backdrop";
        document.body.appendChild(modal);
    }
    
    let title = "";
    let tablesHtml = "";
    
    const formatRow = (role, count, monSal, monthlyTotal, annualTotal) => {
        const formattedCount = count % 1 === 0 ? count : count.toFixed(2);
        const formattedSal = Math.round(monSal).toLocaleString('en-IN');
        const formula = `₹${formattedSal} × ${formattedCount}`;
        return `
            <tr>
                <td><span class="font-semibold">${role}</span></td>
                <td style="text-align:right;">${formattedCount}</td>
                <td style="text-align:right;">₹${formattedSal}</td>
                <td style="text-align:center; font-family: monospace; font-size:11px;">${formula}</td>
                <td style="text-align:right; font-weight:600;">₹${Math.round(monthlyTotal).toLocaleString('en-IN')}</td>
                <td style="text-align:right; font-weight:600;">₹${Math.round(annualTotal).toLocaleString('en-IN')}</td>
            </tr>
        `;
    };
    
    const generateTableForRoles = (rolesList, headerText, isTeaching = false) => {
        let rows = "";
        let totalCount = 0;
        let totalMonthly = 0;
        let totalAnnual = 0;
        
        rolesList.forEach(role => {
            let count = calcResults.staffCounts[role] ? calcResults.staffCounts[role][yIdx] : 0;
            if (isTeaching && appState.sharingMode === "shared") {
                const coreDepts = [
                    "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS",
                    "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology"
                ];
                if (coreDepts.includes(role)) {
                    if (role === "Mathematics") {
                        count -= (calcResults.staffCounts["IIT Mathematics"][yIdx] || 0);
                    } else if (role === "Physics") {
                        count -= (calcResults.staffCounts["IIT Physics"][yIdx] || 0) + (calcResults.staffCounts["NEET Physics"][yIdx] || 0);
                    } else if (role === "Chemistry") {
                        count -= (calcResults.staffCounts["IIT Chemistry"][yIdx] || 0) + (calcResults.staffCounts["NEET Chemistry"][yIdx] || 0);
                    } else if (role === "Biology") {
                        count -= (calcResults.staffCounts["IIT Biology"][yIdx] || 0) + 
                                 (calcResults.staffCounts["NEET Biology"][yIdx] || 0) + 
                                 (calcResults.staffCounts["NEET Botany"][yIdx] || 0) + 
                                 (calcResults.staffCounts["NEET Zoology"][yIdx] || 0);
                    }
                    count = Math.max(0, count);
                }
            }
            
            let roleSalKey = role;
            if (role === "Library") roleSalKey = "Librarian";
            
            const monSal = calcResults.monthlySalaries[roleSalKey] ? calcResults.monthlySalaries[roleSalKey][yIdx] : (isTeaching ? 20000 : 10000);
            const monthlyTotal = count * monSal;
            const annualTotal = monthlyTotal * 12;
            
            totalCount += count;
            totalMonthly += monthlyTotal;
            totalAnnual += annualTotal;
            
            rows += formatRow(role, count, monSal, monthlyTotal, annualTotal);
        });
        
        return {
            html: `
                <h4 style="margin: 15px 0 8px 0; font-size:13px; color:var(--accent-secondary); text-transform:uppercase;">${headerText}</h4>
                <table class="data-table" style="font-size:11px; margin-bottom:15px; width:100%;">
                    <thead>
                        <tr>
                            <th>Designation</th>
                            <th style="text-align:right; width:90px;">No. of Staff</th>
                            <th style="text-align:right; width:110px;">Salary per Staff</th>
                            <th style="text-align:center; width:130px;">Calculation</th>
                            <th style="text-align:right; width:110px;">Monthly Total</th>
                            <th style="text-align:right; width:120px;">Annual Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                        <tr style="font-weight:bold; background:rgba(255,255,255,0.03);">
                            <td>TOTALS</td>
                            <td style="text-align:right;">${totalCount % 1 === 0 ? totalCount : totalCount.toFixed(2)}</td>
                            <td style="text-align:right;">-</td>
                            <td style="text-align:center;">-</td>
                            <td style="text-align:right; color:var(--accent-primary);">₹${Math.round(totalMonthly).toLocaleString('en-IN')}</td>
                            <td style="text-align:right; color:var(--accent-secondary);">₹${Math.round(totalAnnual).toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            `,
            count: totalCount,
            monthly: totalMonthly,
            annual: totalAnnual
        };
    };
    
    if (category === "teaching") {
        title = "Teaching Staff Salary Breakdown (Year " + (yIdx + 1) + ")";
        const teachList = [
            "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary",
            "KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant",
            "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS"
        ];
        if (appState.scienceModel === "A") {
            teachList.push("Science Phy/Che (Middle)", "Science Bio/Phy (Middle)");
        }
        teachList.push("Physics", "Chemistry", "Biology", "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library");
        teachList.push("Foundation Faculty", "IIT Mathematics", "IIT Physics", "IIT Chemistry");
        if (appState.iitBiologyProgram === "enabled") teachList.push("IIT Biology");
        teachList.push("NEET Physics", "NEET Chemistry");
        if (appState.neetBiologyStructure === "combined") teachList.push("NEET Biology");
        else teachList.push("NEET Botany", "NEET Zoology");
        
        const res = generateTableForRoles(teachList, "CBSE Core & Special Academics", true);
        tablesHtml = res.html + `
            <div style="margin-top: 15px; padding: 12px; background: rgba(99, 102, 241, 0.05); border-left: 4px solid var(--accent-primary); border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; font-size: 13px; color: var(--accent-primary); text-transform: uppercase; letter-spacing: 0.5px;">Teaching Staff Summary</h4>
                <div style="display: flex; gap: 30px; font-size: 12px;">
                    <div>Total Teachers : <strong style="color: var(--text-primary);">${res.count % 1 === 0 ? res.count : res.count.toFixed(2)}</strong></div>
                    <div>Monthly Salary : <strong style="color: var(--text-primary);">₹${Math.round(res.monthly).toLocaleString('en-IN')}</strong></div>
                    <div>Annual Salary : <strong style="color: var(--text-primary);">₹${Math.round(res.annual).toLocaleString('en-IN')}</strong></div>
                </div>
            </div>
        `;
    } else if (category === "nonteaching") {
        title = "Non-Teaching Staff Salary Breakdown (Year " + (yIdx + 1) + ")";
        const ntList = [
            "Admin Officer", "Receptionist", "Sys Admin", "Counsellor", "Security HOD", "Security Guard", "Electrician", "Attender", "Housekeeping HOD", "Housekeeping Staff", "Gardener", "Driver", "Conductor"
        ];
        const res = generateTableForRoles(ntList, "Support & Services");
        tablesHtml = res.html + `
            <div style="margin-top: 15px; padding: 12px; background: rgba(14, 165, 233, 0.05); border-left: 4px solid var(--accent-secondary); border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; font-size: 13px; color: var(--accent-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Non-Teaching Staff Summary</h4>
                <div style="display: flex; gap: 30px; font-size: 12px;">
                    <div>Total Staff : <strong style="color: var(--text-primary);">${res.count % 1 === 0 ? res.count : res.count.toFixed(2)}</strong></div>
                    <div>Monthly Salary : <strong style="color: var(--text-primary);">₹${Math.round(res.monthly).toLocaleString('en-IN')}</strong></div>
                    <div>Annual Salary : <strong style="color: var(--text-primary);">₹${Math.round(res.annual).toLocaleString('en-IN')}</strong></div>
                </div>
            </div>
        `;
    } else if (category === "eca") {
        title = "Part-Time / ECA Staff Salary Breakdown (Year " + (yIdx + 1) + ")";
        const ecaList = [
            "Classical Dance", "Yoga", "Karate", "Music", "Other Activities", "Sports Coach"
        ];
        const res = generateTableForRoles(ecaList, "Extracurricular Activities");
        tablesHtml = res.html + `
            <div style="margin-top: 15px; padding: 12px; background: rgba(16, 185, 129, 0.05); border-left: 4px solid var(--accent-tertiary); border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; font-size: 13px; color: var(--accent-tertiary); text-transform: uppercase; letter-spacing: 0.5px;">Part-Time / ECA Staff Summary</h4>
                <div style="display: flex; gap: 30px; font-size: 12px;">
                    <div>Total Staff : <strong style="color: var(--text-primary);">${res.count % 1 === 0 ? res.count : res.count.toFixed(2)}</strong></div>
                    <div>Monthly Salary : <strong style="color: var(--text-primary);">₹${Math.round(res.monthly).toLocaleString('en-IN')}</strong></div>
                    <div>Annual Salary : <strong style="color: var(--text-primary);">₹${Math.round(res.annual).toLocaleString('en-IN')}</strong></div>
                </div>
            </div>
        `;
    } else if (category === "grand") {
        title = "Grand Manpower & Salary Summary (Year " + (yIdx + 1) + ")";
        
        const teachList = [
            "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary",
            "KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant",
            "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS",
            "Physics", "Chemistry", "Biology", "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library",
            "Foundation Faculty", "IIT Mathematics", "IIT Physics", "IIT Chemistry"
        ];
        if (appState.iitBiologyProgram === "enabled") teachList.push("IIT Biology");
        teachList.push("NEET Physics", "NEET Chemistry");
        if (appState.neetBiologyStructure === "combined") teachList.push("NEET Biology");
        else teachList.push("NEET Botany", "NEET Zoology");
        
        const ntList = [
            "Admin Officer", "Receptionist", "Sys Admin", "Counsellor", "Security HOD", "Security Guard", "Electrician", "Attender", "Housekeeping HOD", "Housekeeping Staff", "Gardener", "Driver", "Conductor"
        ];
        const ecaList = [
            "Classical Dance", "Yoga", "Karate", "Music", "Other Activities", "Sports Coach"
        ];
        
        const tRes = generateTableForRoles(teachList, "1. Teaching Staff", true);
        const nRes = generateTableForRoles(ntList, "2. Non-Teaching Staff");
        const eRes = generateTableForRoles(ecaList, "3. Part-Time / ECA Staff");
        
        const totalEmployees = tRes.count + nRes.count + eRes.count;
        const totalMonthly = tRes.monthly + nRes.monthly + eRes.monthly;
        const totalAnnual = tRes.annual + nRes.annual + eRes.annual;
        
        tablesHtml = `
            ${tRes.html}
            ${nRes.html}
            ${eRes.html}
            
            <div style="margin-top: 20px; padding: 20px; background: rgba(99, 102, 241, 0.08); border: 1px solid var(--border-focus); border-radius: 12px; box-shadow: var(--shadow-main);">
                <h3 style="margin: 0 0 15px 0; font-size:15px; font-family: var(--font-heading); color: var(--accent-secondary); text-transform:uppercase; border-bottom:1px solid var(--border-color); padding-bottom:8px;">Grand Summary</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom:15px;">
                    <div>
                        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Teaching Staff</div>
                        <div style="font-size:13px; margin-top:2px;">Staff Count: <strong>${tRes.count % 1 === 0 ? tRes.count : tRes.count.toFixed(2)}</strong></div>
                        <div style="font-size:13px;">Monthly Salary: <strong>₹${Math.round(tRes.monthly).toLocaleString('en-IN')}</strong></div>
                        <div style="font-size:13px;">Annual Salary: <strong>₹${Math.round(tRes.annual).toLocaleString('en-IN')}</strong></div>
                    </div>
                    <div>
                        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Non-Teaching Staff</div>
                        <div style="font-size:13px; margin-top:2px;">Staff Count: <strong>${nRes.count % 1 === 0 ? nRes.count : nRes.count.toFixed(2)}</strong></div>
                        <div style="font-size:13px;">Monthly Salary: <strong>₹${Math.round(nRes.monthly).toLocaleString('en-IN')}</strong></div>
                        <div style="font-size:13px;">Annual Salary: <strong>₹${Math.round(nRes.annual).toLocaleString('en-IN')}</strong></div>
                    </div>
                    <div>
                        <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Part-Time / ECA Staff</div>
                        <div style="font-size:13px; margin-top:2px;">Staff Count: <strong>${eRes.count % 1 === 0 ? eRes.count : eRes.count.toFixed(2)}</strong></div>
                        <div style="font-size:13px;">Monthly Salary: <strong>₹${Math.round(eRes.monthly).toLocaleString('en-IN')}</strong></div>
                        <div style="font-size:13px;">Annual Salary: <strong>₹${Math.round(eRes.annual).toLocaleString('en-IN')}</strong></div>
                    </div>
                </div>
                <div style="border-top:1px dashed var(--border-color); padding-top:12px; display:flex; gap:30px; font-size:14px; font-weight:bold;">
                    <div>Total Employees: <span style="color:var(--text-primary);">${totalEmployees % 1 === 0 ? totalEmployees : totalEmployees.toFixed(2)}</span></div>
                    <div>Total Monthly Salary: <span style="color:var(--accent-primary);">₹${Math.round(totalMonthly).toLocaleString('en-IN')}</span></div>
                    <div>Total Annual Salary: <span style="color:var(--accent-secondary);">₹${Math.round(totalAnnual).toLocaleString('en-IN')}</span></div>
                </div>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-content-card">
            <button class="modal-close-btn" id="modal-close-btn">&times;</button>
            <div class="modal-header-title">${title}</div>
            <div style="overflow-y:auto; flex-grow:1; padding-right:5px;">
                ${tablesHtml}
            </div>
        </div>
    `;
    
    modal.classList.add("open");
    
    const closeModal = () => {
        modal.classList.remove("open");
    };
    
    modal.querySelector("#modal-close-btn").onclick = closeModal;
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
}

function populateDetailedSalaryBreakdownTable() {
    const tbody = document.getElementById("sal-breakdown-tbody");
    const summaryContainer = document.getElementById("sal-breakdown-summary-container");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    summaryContainer.innerHTML = "";
    
    const yIdx = appState.globalSelectedYear - 1;
    const category = document.getElementById("sal-breakdown-category-select").value;
    
    let rolesList = [];
    let isTeaching = false;
    let label = "";
    let subtotalColor = "";
    let countLabel = "";
    
    if (category === "teaching") {
        isTeaching = true;
        label = "Teaching Staff Summary";
        subtotalColor = "var(--accent-primary)";
        countLabel = "Total Teachers";
        
        rolesList = [
            "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary",
            "KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant",
            "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS"
        ];
        if (appState.scienceModel === "A") {
            rolesList.push("Science Phy/Che (Middle)", "Science Bio/Phy (Middle)");
        }
        rolesList.push("Physics", "Chemistry", "Biology", "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library");
        rolesList.push("Foundation Faculty", "IIT Mathematics", "IIT Physics", "IIT Chemistry");
        if (appState.iitBiologyProgram === "enabled") rolesList.push("IIT Biology");
        rolesList.push("NEET Physics", "NEET Chemistry");
        if (appState.neetBiologyStructure === "combined") rolesList.push("NEET Biology");
        else rolesList.push("NEET Botany", "NEET Zoology");
    } else if (category === "nonteaching") {
        label = "Non-Teaching Staff Summary";
        subtotalColor = "var(--accent-secondary)";
        countLabel = "Total Staff";
        rolesList = [
            "Admin Officer", "Receptionist", "Sys Admin", "Counsellor", "Security HOD", "Security Guard", "Electrician", "Attender", "Housekeeping HOD", "Housekeeping Staff", "Gardener", "Driver", "Conductor"
        ];
    } else if (category === "eca") {
        label = "Part-Time / ECA Staff Summary";
        subtotalColor = "var(--accent-tertiary)";
        countLabel = "Total Staff";
        rolesList = [
            "Classical Dance", "Yoga", "Karate", "Music", "Other Activities", "Sports Coach"
        ];
    }
    
    let grandCount = 0;
    let grandMonthly = 0;
    let grandAnnual = 0;
    
    rolesList.forEach(role => {
        let count = calcResults.staffCounts[role] ? calcResults.staffCounts[role][yIdx] : 0;
        if (isTeaching && appState.sharingMode === "shared") {
            const coreDepts = [
                "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS",
                "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology"
            ];
            if (coreDepts.includes(role)) {
                if (role === "Mathematics") {
                    count -= (calcResults.staffCounts["IIT Mathematics"][yIdx] || 0);
                } else if (role === "Physics") {
                    count -= (calcResults.staffCounts["IIT Physics"][yIdx] || 0) + (calcResults.staffCounts["NEET Physics"][yIdx] || 0);
                } else if (role === "Chemistry") {
                    count -= (calcResults.staffCounts["IIT Chemistry"][yIdx] || 0) + (calcResults.staffCounts["NEET Chemistry"][yIdx] || 0);
                } else if (role === "Biology") {
                    count -= (calcResults.staffCounts["IIT Biology"][yIdx] || 0) + 
                             (calcResults.staffCounts["NEET Biology"][yIdx] || 0) + 
                             (calcResults.staffCounts["NEET Botany"][yIdx] || 0) + 
                             (calcResults.staffCounts["NEET Zoology"][yIdx] || 0);
                }
                count = Math.max(0, count);
            }
        }
        
        let roleSalKey = role;
        if (role === "Library") roleSalKey = "Librarian";
        
        const monSal = calcResults.monthlySalaries[roleSalKey] ? calcResults.monthlySalaries[roleSalKey][yIdx] : (isTeaching ? 20000 : 10000);
        const monthlyTotal = count * monSal;
        const annualTotal = monthlyTotal * 12;
        
        grandCount += count;
        grandMonthly += monthlyTotal;
        grandAnnual += annualTotal;
        
        const formattedCount = count % 1 === 0 ? count : count.toFixed(2);
        const formattedSal = Math.round(monSal).toLocaleString('en-IN');
        const formula = `₹${formattedSal} × ${formattedCount}`;
        
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><span class="font-semibold">${role}</span></td>
            <td class="text-right">${formattedCount}</td>
            <td class="text-right">₹${formattedSal}</td>
            <td class="text-center" style="font-family: monospace; font-size: 11px;">${formula}</td>
            <td class="text-right" style="font-weight:600;">₹${Math.round(monthlyTotal).toLocaleString('en-IN')}</td>
            <td class="text-right" style="font-weight:600;">₹${Math.round(annualTotal).toLocaleString('en-IN')}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Totals row
    const totalRow = document.createElement("tr");
    totalRow.style.fontWeight = "bold";
    totalRow.style.background = "rgba(255, 255, 255, 0.03)";
    totalRow.innerHTML = `
        <td>TOTALS</td>
        <td class="text-right">${grandCount % 1 === 0 ? grandCount : grandCount.toFixed(2)}</td>
        <td class="text-right">-</td>
        <td class="text-center">-</td>
        <td class="text-right" style="color: var(--accent-primary);">₹${Math.round(grandMonthly).toLocaleString('en-IN')}</td>
        <td class="text-right" style="color: var(--accent-secondary);">₹${Math.round(grandAnnual).toLocaleString('en-IN')}</td>
    `;
    tbody.appendChild(totalRow);
    
    // Summary card
    summaryContainer.innerHTML = `
        <div style="padding: 12px; background: rgba(255,255,255,0.02); border-left: 4px solid ${subtotalColor}; border-radius: 4px;">
            <h4 style="margin: 0 0 8px 0; font-size: 12px; color: ${subtotalColor}; text-transform: uppercase; letter-spacing: 0.5px;">${label}</h4>
            <div style="display: flex; gap: 30px; font-size: 11px;">
                <div>${countLabel} : <strong style="color: var(--text-primary);">${grandCount % 1 === 0 ? grandCount : grandCount.toFixed(2)}</strong></div>
                <div>Monthly Salary : <strong style="color: var(--text-primary);">₹${Math.round(grandMonthly).toLocaleString('en-IN')}</strong></div>
                <div>Annual Salary : <strong style="color: var(--text-primary);">₹${Math.round(grandAnnual).toLocaleString('en-IN')}</strong></div>
            </div>
        </div>
    `;
}

// 5-Year student strength table renderer
function populateStudentStrengthTable() {
    const tbody = document.getElementById("student-strength-tbody");
    tbody.innerHTML = "";
    
    DEFAULT_GRADES.forEach(grade => {
        const row = document.createElement("tr");
        
        let gradeHtml = `<td><span class="font-semibold">${grade}</span></td>`;
        for (let y = 0; y < 5; y++) {
            const strength = appState.studentStrength[grade][y];
            const sections = calcResults.sections[grade][y];
            
            // Check growth constraint: Y1: No G9-12. Y2: No G10/12
            const disabled = (y === 0 && ["Grade 9", "Grade 10", "Grade 11", "Grade 12"].includes(grade)) ||
                             (y === 1 && ["Grade 10", "Grade 12"].includes(grade));
            
            gradeHtml += `
                <td>
                    <input type="number" 
                           class="form-control student-input" 
                           data-grade="${grade}" 
                           data-year="${y}" 
                           value="${strength}" 
                           style="width: 70px; text-align: center;"
                           ${disabled ? 'disabled' : ''}>
                </td>
                <td class="text-center font-semibold">${sections}</td>
            `;
        }
        
        row.innerHTML = gradeHtml;
        tbody.appendChild(row);
    });
    
    // Aggregate row values
    for (let y = 0; y < 5; y++) {
        document.getElementById(`tot-std-y${y+1}`).textContent = calcResults.totalStudents[y];
        document.getElementById(`tot-sec-y${y+1}`).textContent = calcResults.totalSections[y];
    }
}

// Period Allocations Table renderer
function populatePeriodsMasterTable() {
    const tbody = document.getElementById("periods-master-tbody");
    tbody.innerHTML = "";
    
    const filterText = document.getElementById("search-periods").value.toLowerCase();
    
    Object.keys(appState.periodAllocations).forEach(subject => {
        // Hiding/showing checks based on optional programs
        if (subject === "IIT Biology" && appState.iitBiologyProgram !== "enabled") return;
        if (subject === "NEET Biology" && appState.neetBiologyStructure !== "combined") return;
        if ((subject === "NEET Botany" || subject === "NEET Zoology") && appState.neetBiologyStructure !== "separate") return;
        
        if (filterText && !subject.toLowerCase().includes(filterText)) return;
        
        const row = document.createElement("tr");
        const alloc = appState.periodAllocations[subject];
        
        const isNC = alloc.isNonCreating;
        const ncClass = isNC ? 'style="background: rgba(234,179,8,0.06);"' : '';
        
        row.innerHTML = `
            <td ${ncClass}>
                <span class="font-semibold" style="${isNC ? 'color: var(--status-yellow);' : ''}">
                    ${subject} ${isNC ? ' <span style="font-size:9px; font-weight:normal;">(Non-creating)</span>' : ''}
                </span>
            </td>
            <td><input type="number" class="form-control period-input" data-subject="${subject}" data-field="primary" value="${alloc.primary}" style="width: 50px;"></td>
            <td><input type="number" class="form-control period-input" data-subject="${subject}" data-field="middle" value="${alloc.middle}" style="width: 50px;"></td>
            <td><input type="number" class="form-control period-input" data-subject="${subject}" data-field="high" value="${alloc.high}" style="width: 50px;"></td>
            <td><input type="number" class="form-control period-input" data-subject="${subject}" data-field="hs" value="${alloc.hs}" style="width: 50px;"></td>
            <td><input type="number" class="form-control period-input" data-subject="${subject}" data-field="mid_found" value="${alloc.mid_found}" style="width: 50px;"></td>
            <td><input type="number" class="form-control period-input" data-subject="${subject}" data-field="high_found" value="${alloc.high_found}" style="width: 50px;"></td>
            <td><input type="number" class="form-control period-input" data-subject="${subject}" data-field="iit" value="${alloc.iit}" style="width: 50px;"></td>
            <td><input type="number" class="form-control period-input" data-subject="${subject}" data-field="neet" value="${alloc.neet}" style="width: 50px;"></td>
        `;
        tbody.appendChild(row);
    });
}

// Manpower Planner View renderer
let currentManpowerCategory = "cbse-teaching";
function populateManpowerCalculatorTable() {
    const tbody = document.getElementById("manpower-calc-tbody");
    tbody.innerHTML = "";
    
    const yearIdx = appState.globalSelectedYear - 1;
    document.getElementById("manpower-selected-year-label").textContent = `Year ${appState.globalSelectedYear}`;
    
    const rolesToShow = [];
    const capacityVal = 32; // standard stage workload count

    if (currentManpowerCategory === "cbse-teaching") {
        rolesToShow.push(
            { name: "KG Homeroom", isHomeroom: true, capacity: 28 },
            { name: "Gr 1-2 Homeroom", isHomeroom: true, capacity: 32 },
            { name: "ECP Assistant", isEcp: true, capacity: 28 },
            
            // Core departments
            { name: "English", isSubject: true, capKey: "primary" },
            { name: "Tamil", isSubject: true, capKey: "primary" },
            { name: "Hindi", isSubject: true, capKey: "primary" },
            { name: "Mathematics", isSubject: true, capKey: "primary" },
            { name: "Science / EVS", isSubject: true, capKey: "primary" }
        );
        
        if (appState.scienceModel === "A") {
            rolesToShow.push(
                { name: "Science Phy/Che (Middle)", isSubject: true, capKey: "middle" },
                { name: "Science Bio/Phy (Middle)", isSubject: true, capKey: "middle" }
            );
        }
        
        rolesToShow.push(
            { name: "Physics", isSubject: true, capKey: "highHS" },
            { name: "Chemistry", isSubject: true, capKey: "highHS" },
            { name: "Biology", isSubject: true, capKey: "highHS" },
            { name: "Social Science", isSubject: true, capKey: "primary" },
            { name: "Computer / AI", isSubject: true, capKey: "primary" },
            
            // Baseline Administration
            { name: "Principal", isBaseline: true },
            { name: "Vice Principal", isBaseline: true },
            { name: "ACO – Primary & Middle", isBaseline: true },
            { name: "ACO – High & Higher Secondary", isBaseline: true },
            { name: "PET", isBaseline: true },
            { name: "PET HOD", isBaseline: true },
            { name: "Arts & Crafts", isBaseline: true },
            { name: "Handwriting", isBaseline: true },
            { name: "Library", isBaseline: true }
        );
    } else if (currentManpowerCategory === "special-faculty") {
        rolesToShow.push({ name: "Foundation Faculty", isSpecial: true });
        
        rolesToShow.push(
            { name: "IIT Mathematics", isSpecial: true },
            { name: "IIT Physics", isSpecial: true },
            { name: "IIT Chemistry", isSpecial: true }
        );
        if (appState.iitBiologyProgram === "enabled") {
            rolesToShow.push({ name: "IIT Biology", isSpecial: true });
        }
        
        rolesToShow.push(
            { name: "NEET Physics", isSpecial: true },
            { name: "NEET Chemistry", isSpecial: true }
        );
        if (appState.neetBiologyStructure === "combined") {
            rolesToShow.push({ name: "NEET Biology", isSpecial: true });
        } else {
            rolesToShow.push(
                { name: "NEET Botany", isSpecial: true },
                { name: "NEET Zoology", isSpecial: true }
            );
        }
    } else if (currentManpowerCategory === "non-teaching") {
        Object.keys(appState.nonTeachingStaffGrowth).forEach(r => {
            rolesToShow.push({ name: r, isSupport: true });
        });
        rolesToShow.push(
            { name: "Driver", isSupport: true },
            { name: "Conductor", isSupport: true }
        );
    } else if (currentManpowerCategory === "eca-parttime") {
        Object.keys(appState.partTimeECAReqs).forEach(e => {
            rolesToShow.push({ name: e, isECA: true });
        });
    }

    rolesToShow.forEach(role => {
        const row = document.createElement("tr");
        const name = role.name;
        
        let workload = "-";
        let calcVal = "-";
        let baseVal = "-";
        let reqVal = calcResults.staffCounts[name][yearIdx];
        let util = 0;
        let cap = "-";
        
        if (role.isHomeroom || role.isEcp) {
            calcVal = reqVal;
            baseVal = "-";
            cap = role.capacity;
        } else if (role.isSubject) {
            // Periods workload
            workload = calcResults.cbseWorkloads[name] ? calcResults.cbseWorkloads[name][yearIdx] : 0;
            const floatCapacity = appState.capacities[role.capKey];
            cap = floatCapacity;
            
            // Fraction count
            const periodsFraction = workload / floatCapacity;
            calcVal = Math.ceil(periodsFraction);
            
            // Base checks
            let checkKey = "Primary";
            if (role.capKey === "middle") checkKey = "Middle";
            if (role.capKey === "highHS") checkKey = "High";
            
            baseVal = appState.baselineTeachers[checkKey] ? appState.baselineTeachers[checkKey][yearIdx] : 0;
            util = calcResults.utilizations[name] ? calcResults.utilizations[name][yearIdx] : 0;
        } else if (role.isBaseline) {
            baseVal = appState.baselineTeachers[name][yearIdx];
            calcVal = "-";
        } else if (role.isSpecial) {
            if (name === "Foundation Faculty") {
                let totalFoundPeriods = 0;
                const foundationSubs = Object.keys(appState.periodAllocations).filter(s => appState.periodAllocations[s].isFoundation);
                foundationSubs.forEach(sub => {
                    totalFoundPeriods += getStageSections(MIDDLE_GRADES, yearIdx) * appState.periodAllocations[sub].mid_found;
                    totalFoundPeriods += getStageSections(HIGH_GRADES, yearIdx) * appState.periodAllocations[sub].high_found;
                });
                workload = totalFoundPeriods;
                cap = appState.capacities.highHS;
                calcVal = Math.ceil(workload / cap);
                util = reqVal > 0 ? Math.round((workload / (reqVal * cap)) * 100) : 0;
            } else {
                const alloc = appState.periodAllocations[name];
                if (alloc) {
                    const periodsPerSec = alloc.iit || alloc.neet || 0;
                    workload = getStageSections(HS_GRADES, yearIdx) * periodsPerSec;
                } else {
                    workload = 0;
                }
                cap = appState.capacities.highHS;
                calcVal = Math.ceil(workload / cap);
                util = reqVal > 0 ? Math.round((workload / (reqVal * cap)) * 100) : 0;
            }
            baseVal = "-";
        } else if (role.isSupport || role.isECA) {
            calcVal = reqVal;
            baseVal = "-";
        }

        row.innerHTML = `
            <td><span class="font-semibold">${name}</span></td>
            <td class="text-center">${workload}</td>
            <td class="text-center">${calcVal}</td>
            <td class="text-center">${baseVal}</td>
            <td class="text-center font-semibold" style="color: var(--accent-primary);">${reqVal}</td>
            <td class="text-center">${cap}</td>
            <td class="text-center">${util ? util + '%' : '-'}</td>
            <td class="text-center">${util ? getUtilBadge(util) : '<span class="badge badge-green">Optimal</span>'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Salary Assumptions renderer
function populateSalaryMasterTables() {
    // 1. Salary Tiers scale editor
    const tbodyScale = document.getElementById("salary-scale-tbody");
    tbodyScale.innerHTML = "";
    
    const scale = appState.salaryTier === "custom" ? appState.customSalaries : SALARY_TIERS[appState.salaryTier];
    const isCustom = appState.salaryTier === "custom";

    Object.keys(scale).forEach(role => {
        const row = document.createElement("tr");
        
        let cols = `<td><span class="font-semibold">${role}</span></td>`;
        for (let y = 0; y < 5; y++) {
            const salValue = calcResults.monthlySalaries[role][y];
            if (y === 0) {
                // Input is only editable for custom scale in Year 1
                cols += `
                    <td>
                        <input type="number" 
                               class="form-control salary-input" 
                               data-role="${role}" 
                               value="${scale[role]}" 
                               style="width: 100px;" 
                               ${isCustom ? '' : 'disabled'}>
                    </td>
                `;
            } else {
                cols += `<td>₹${salValue.toLocaleString('en-IN')}</td>`;
            }
        }
        
        row.innerHTML = cols;
        tbodyScale.appendChild(row);
    });

    // 2. 5-Year Salary Projection department list
    const tbodyProj = document.getElementById("salary-projection-tbody");
    tbodyProj.innerHTML = "";
    
    const categories = [
        { label: "CBSE Teaching Staff", data: calcResults.salariesByCategory.teaching },
        { label: "IIT/NEET/Foundation Faculty", data: calcResults.salariesByCategory.special },
        { label: "Non-Teaching Support Staff", data: calcResults.salariesByCategory.nonTeaching },
        { label: "Part-Time ECA Staff", data: calcResults.salariesByCategory.eca }
    ];

    categories.forEach(cat => {
        const row = document.createElement("tr");
        let cols = `<td><span class="font-semibold">${cat.label}</span></td>`;
        for (let y = 0; y < 5; y++) {
            cols += `<td class="text-right">₹${cat.data[y].toLocaleString('en-IN')}</td>`;
        }
        row.innerHTML = cols;
        tbodyProj.appendChild(row);
    });

    // Grand totals
    for (let y = 0; y < 5; y++) {
        document.getElementById(`tot-sal-y${y+1}`).textContent = `₹${calcResults.grandTotalSalaries[y].toLocaleString('en-IN')}`;
    }
    
    // Populate detailed designation breakdown card
    populateDetailedSalaryBreakdownTable();
}

// ==========================================================================
// 6. CAPACITY SIMULATOR & OPTIMIZATION MODULE
// ==========================================================================

function calculateGradeCapacityDetails(grade, yearIdx) {
    const currentSections = calcResults.sections[grade] ? calcResults.sections[grade][yearIdx] : 0;
    
    // KG Grades
    if (["Pre-KG", "LKG", "UKG"].includes(grade)) {
        const currentKGSections = (calcResults.sections["Pre-KG"][yearIdx] || 0) + (calcResults.sections["LKG"][yearIdx] || 0) + (calcResults.sections["UKG"][yearIdx] || 0);
        const hiredKG = calcResults.staffCounts["KG Homeroom"][yearIdx] || 0;
        const remainingKG = Math.max(0, hiredKG - currentKGSections);
        const maxSections = currentSections + remainingKG;
        const additionalSections = remainingKG;
        const limitingDept = "Homeroom";
        
        return {
            grade,
            currentSections,
            maxSections,
            additionalSections,
            limitingDept,
            bottleneckSubject: "Homeroom",
            subjectCapacities: [
                { subject: "Homeroom", available: hiredKG * 28, used: currentKGSections * 28, remaining: remainingKG * 28, extraSectionsSupported: additionalSections }
            ],
            aiRecommendation: additionalSections > 0 ? 
                `${additionalSections} additional section${additionalSections > 1 ? 's' : ''} can be opened without recruiting new teachers.` : 
                `Current staffing has reached maximum capacity. Recruit one KG teacher before opening another section.`
        };
    }
    
    // Grade 1 & 2
    if (["Grade 1", "Grade 2"].includes(grade)) {
        const currentG12Sections = (calcResults.sections["Grade 1"][yearIdx] || 0) + (calcResults.sections["Grade 2"][yearIdx] || 0);
        const hiredG12 = calcResults.staffCounts["Gr 1-2 Homeroom"][yearIdx] || 0;
        const remainingG12 = Math.max(0, hiredG12 - currentG12Sections);
        
        // English & Tamil pools
        const engAlloc = appState.periodAllocations["English"].primary || 7;
        const engStaff = calcResults.staffCounts["English"][yearIdx] || 0;
        const engHiredW = engStaff * appState.capacities.primary;
        const engAllocW = calcResults.cbseWorkloads["English"][yearIdx] || 0;
        const engRem = Math.max(0, engHiredW - engAllocW);
        const engExtra = engAlloc > 0 ? Math.floor(engRem / engAlloc) : 99;
        
        const tamAlloc = appState.periodAllocations["Tamil"].primary || 6;
        const tamStaff = calcResults.staffCounts["Tamil"][yearIdx] || 0;
        const tamHiredW = tamStaff * appState.capacities.primary;
        const tamAllocW = calcResults.cbseWorkloads["Tamil"][yearIdx] || 0;
        const tamRem = Math.max(0, tamHiredW - tamAllocW);
        const tamExtra = tamAlloc > 0 ? Math.floor(tamRem / tamAlloc) : 99;
        
        const subjectCapacities = [
            { subject: "Homeroom", available: hiredG12 * 32, used: currentG12Sections * 32, remaining: remainingG12 * 32, extraSectionsSupported: remainingG12 },
            { subject: "English", available: engHiredW, used: engAllocW, remaining: engRem, extraSectionsSupported: engExtra },
            { subject: "Tamil", available: tamHiredW, used: tamAllocW, remaining: tamRem, extraSectionsSupported: tamExtra }
        ];
        
        let additionalSections = remainingG12;
        let limitingDept = "Homeroom";
        
        subjectCapacities.forEach(c => {
            if (c.extraSectionsSupported < additionalSections) {
                additionalSections = c.extraSectionsSupported;
                limitingDept = c.subject;
            }
        });
        
        const maxSections = currentSections + additionalSections;
        
        return {
            grade,
            currentSections,
            maxSections,
            additionalSections,
            limitingDept,
            bottleneckSubject: limitingDept,
            subjectCapacities,
            aiRecommendation: additionalSections > 0 ? 
                `${additionalSections} additional section${additionalSections > 1 ? 's' : ''} can be opened without recruiting new teachers.` : 
                `Current staffing has reached maximum capacity. Recruit one ${limitingDept} teacher before opening another section.`
        };
    }
    
    // Core pooled grades: Grade 3 to 12
    let stageKey = "primary";
    let capValue = appState.capacities.primary;
    if (grade.includes("Grade 6") || grade.includes("Grade 7") || grade.includes("Grade 8")) {
        stageKey = "middle";
        capValue = appState.capacities.middle;
    } else if (grade.includes("Grade 9") || grade.includes("Grade 10")) {
        stageKey = "high";
        capValue = appState.capacities.highHS;
    } else if (grade.includes("Grade 11") || grade.includes("Grade 12")) {
        stageKey = "hs";
        capValue = appState.capacities.highHS;
    }
    
    const subjectsToTest = ["English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI"];
    
    if (stageKey === "primary") {
        subjectsToTest.push("Science / EVS");
    } else {
        if (appState.scienceModel === "A" && stageKey === "middle") {
            subjectsToTest.push("Science Phy/Che (Middle)", "Science Bio/Phy (Middle)");
        } else {
            subjectsToTest.push("Physics", "Chemistry", "Biology");
        }
    }
    
    const subjectCapacities = [];
    
    subjectsToTest.forEach(sub => {
        let periodAlloc = 0;
        let staffKey = sub;
        
        if (sub === "Science Phy/Che (Middle)") {
            periodAlloc = (appState.periodAllocations["Chemistry"].middle || 2) + (appState.periodAllocations["Physics"].middle || 2) / 2;
        } else if (sub === "Science Bio/Phy (Middle)") {
            periodAlloc = (appState.periodAllocations["Biology"].middle || 2) + (appState.periodAllocations["Physics"].middle || 2) / 2;
        } else {
            periodAlloc = appState.periodAllocations[sub] ? appState.periodAllocations[sub][stageKey] : 0;
        }
        
        if (periodAlloc === 0) return;
        
        const staff = calcResults.staffCounts[staffKey] ? calcResults.staffCounts[staffKey][yearIdx] : 0;
        const totalCap = staff * capValue;
        const allocated = calcResults.cbseWorkloads[staffKey] ? calcResults.cbseWorkloads[staffKey][yearIdx] : 0;
        const remaining = Math.max(0, totalCap - allocated);
        const extraSecs = periodAlloc > 0 ? Math.floor(remaining / periodAlloc) : 99;
        
        subjectCapacities.push({
            subject: sub,
            available: totalCap,
            used: allocated,
            remaining: remaining,
            extraSectionsSupported: extraSecs
        });
    });
    
    let additionalSections = 999;
    let limitingDept = "None";
    
    subjectCapacities.forEach(c => {
        if (c.extraSectionsSupported < additionalSections) {
            additionalSections = c.extraSectionsSupported;
            limitingDept = c.subject;
        }
    });
    
    if (additionalSections === 999 || additionalSections < 0) additionalSections = 0;
    const maxSections = currentSections + additionalSections;
    
    let recommendation = "";
    if (additionalSections > 0) {
        recommendation = `${additionalSections} additional section${additionalSections > 1 ? 's' : ''} can be accommodated. ${limitingDept} will become the limiting department after expansion.`;
    } else {
        recommendation = `Current staffing has reached maximum capacity. Recruit one ${limitingDept} teacher before opening another section.`;
    }
    
    return {
        grade,
        currentSections,
        maxSections,
        additionalSections,
        limitingDept,
        bottleneckSubject: limitingDept,
        subjectCapacities,
        aiRecommendation: recommendation
    };
}

function runCapacitySimulator() {
    const yearIdx = appState.globalSelectedYear - 1;
    const maxStds = parseInt(appState.maxStudentsPerSection) || 40;
    
    const allGradeDetails = DEFAULT_GRADES.map(grade => calculateGradeCapacityDetails(grade, yearIdx));
    
    // 1. Populate Grade-wise Additional Section Analysis Table
    const tbodyAnalysis = document.getElementById("opt-grade-analysis-tbody");
    if (tbodyAnalysis) {
        tbodyAnalysis.innerHTML = "";
        allGradeDetails.forEach(d => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><span class="font-semibold">${d.grade}</span></td>
                <td class="text-center">${d.currentSections}</td>
                <td class="text-center">${d.maxSections}</td>
                <td class="text-center font-bold text-primary">${d.additionalSections > 0 ? '+' + d.additionalSections : '0'}</td>
                <td><span class="badge ${d.additionalSections > 0 ? 'badge-blue' : 'badge-red'}">${d.limitingDept}</span></td>
            `;
            tbodyAnalysis.appendChild(row);
        });
    }
    
    // 2. Populate Side Widget Summary
    let totalExtraSections = 0;
    let totalExtraStudents = 0;
    let totalNewHireCost = 0;
    const recruitmentDepts = new Set();
    
    allGradeDetails.forEach(d => {
        totalExtraSections += d.additionalSections;
        totalExtraStudents += d.additionalSections * maxStds;
        
        if (d.additionalSections === 0 && d.limitingDept !== "None") {
            recruitmentDepts.add(d.limitingDept);
        }
    });
    
    const scale = appState.salaryTier === "custom" ? appState.customSalaries : SALARY_TIERS[appState.salaryTier];
    const increment = (parseFloat(appState.annualIncrementPct) || 5) / 100;
    
    recruitmentDepts.forEach(dept => {
        let role = "Middle Teacher";
        if (dept === "Physics" || dept === "Chemistry" || dept === "Biology") {
            role = "High School Teacher";
        } else if (dept === "Homeroom") {
            role = "Primary Teacher";
        }
        const baseSal = scale[role] || 25000;
        const currentSal = baseSal * Math.pow(1 + increment, yearIdx);
        totalNewHireCost += currentSal * 12;
    });
    
    document.getElementById("opt-widget-total-sections").textContent = `${totalExtraSections} Sections`;
    document.getElementById("opt-widget-total-students").textContent = `${totalExtraStudents.toLocaleString('en-IN')} Students`;
    document.getElementById("opt-widget-total-hire-cost").textContent = `₹${Math.round(totalNewHireCost).toLocaleString('en-IN')}/Yr`;
    
    const badgeContainer = document.getElementById("opt-widget-recruitment-depts");
    if (badgeContainer) {
        badgeContainer.innerHTML = "";
        if (recruitmentDepts.size > 0) {
            recruitmentDepts.forEach(dept => {
                const badge = document.createElement("span");
                badge.className = "badge badge-red";
                badge.style.margin = "2px";
                badge.textContent = dept;
                badgeContainer.appendChild(badge);
            });
        } else {
            badgeContainer.innerHTML = `<span style="font-size:11px; color:#4a5568;">None (Operating with spare capacity)</span>`;
        }
    }
    
    // 3. Populate Grade-wise Expansion Dashboard cards
    const cardsGrid = document.getElementById("opt-grade-cards-grid");
    if (cardsGrid) {
        cardsGrid.innerHTML = "";
        allGradeDetails.forEach(d => {
            const card = document.createElement("div");
            card.className = "stat-card";
            card.style.flexDirection = "column";
            card.style.alignItems = "start";
            card.style.padding = "15px";
            card.style.gap = "4px";
            
            const canExpand = d.additionalSections > 0;
            const statusBadge = canExpand ? 
                `<span class="badge badge-green" style="margin-top:5px;"><i class="fa-solid fa-circle-check"></i> Can Expand</span>` :
                `<span class="badge badge-red" style="margin-top:5px;"><i class="fa-solid fa-circle-xmark"></i> Full Capacity</span>`;
                
            card.innerHTML = `
                <div style="font-weight: 800; font-family: 'Outfit'; color: var(--accent-secondary); margin-bottom: 2px;">${d.grade}</div>
                <div style="font-size: 11px; color: var(--text-muted);">
                    Current Sections: <strong>${d.currentSections}</strong><br>
                    Possible Sections: <strong>${d.maxSections}</strong>
                </div>
                <div style="font-size: 13px; font-weight: 700; margin-top: 5px; color: ${canExpand ? 'var(--status-green)' : 'var(--text-muted)'};">
                    ${canExpand ? '+' + d.additionalSections + ' Section' + (d.additionalSections > 1 ? 's' : '') : '0 Additional'}
                </div>
                <div style="font-size: 10px; color: var(--text-muted);">
                    (+${d.additionalSections * maxStds} Students cap)
                </div>
                ${statusBadge}
            `;
            cardsGrid.appendChild(card);
        });
    }
    
    // 4. Populate Dropdown grade selector if empty
    const gradeSelect = document.getElementById("opt-capacity-grade-select");
    if (gradeSelect) {
        const currentSel = gradeSelect.value;
        gradeSelect.innerHTML = "";
        DEFAULT_GRADES.forEach(g => {
            const opt = document.createElement("option");
            opt.value = g;
            opt.textContent = g;
            if (g === currentSel) opt.selected = true;
            gradeSelect.appendChild(opt);
        });
        
        updateTeacherCapacityTable(gradeSelect.value || DEFAULT_GRADES[0], allGradeDetails);
        
        gradeSelect.onchange = function() {
            updateTeacherCapacityTable(this.value, allGradeDetails);
        };
    }
    
    // 5. Populate Limiting Factors table & Recommendations list
    const tbodyLimiting = document.getElementById("opt-limiting-factors-tbody");
    if (tbodyLimiting) {
        tbodyLimiting.innerHTML = "";
        allGradeDetails.forEach(d => {
            if (d.additionalSections === 0 && d.limitingDept !== "None") {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><span class="font-semibold">${d.grade}</span></td>
                    <td><span class="badge badge-red">${d.limitingDept}</span></td>
                    <td class="text-center font-bold">1</td>
                `;
                tbodyLimiting.appendChild(row);
            }
        });
        if (tbodyLimiting.innerHTML === "") {
            tbodyLimiting.innerHTML = `<tr><td colspan="3" class="text-center" style="color:var(--text-muted);">None (No immediate bottleneck constraints)</td></tr>`;
        }
    }
    
    const recsList = document.getElementById("opt-grade-recs-list");
    if (recsList) {
        recsList.innerHTML = "";
        allGradeDetails.forEach(d => {
            const item = document.createElement("div");
            item.style.fontSize = "11px";
            item.style.lineHeight = "1.4";
            item.style.padding = "8px";
            item.style.borderRadius = "4px";
            item.style.background = d.additionalSections > 0 ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)";
            item.style.borderLeft = d.additionalSections > 0 ? "3px solid var(--status-green)" : "3px solid var(--status-red)";
            item.innerHTML = `<strong>${d.grade}:</strong> ${d.aiRecommendation}`;
            recsList.appendChild(item);
        });
    }
}

function updateTeacherCapacityTable(grade, allGradeDetails) {
    const tbody = document.getElementById("opt-teacher-capacity-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    
    const details = allGradeDetails.find(d => d.grade === grade);
    if (!details || !details.subjectCapacities) return;
    
    details.subjectCapacities.forEach(c => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><span class="font-semibold">${c.subject}</span></td>
            <td class="text-right">${c.available}</td>
            <td class="text-right">${c.used}</td>
            <td class="text-right font-bold text-success">${c.remaining}</td>
            <td class="text-right font-bold" style="color: var(--accent-primary);">${c.extraSectionsSupported === Infinity ? '∞' : c.extraSectionsSupported}</td>
        `;
        tbody.appendChild(row);
    });
}

// ==========================================================================
// 7. AI INSIGHTS MODULE
// ==========================================================================

function compileAIRecommendations() {
    const container = document.getElementById("ai-insights-container");
    container.innerHTML = "";
    
    const yearIdx = appState.globalSelectedYear - 1;
    const maxStds = parseInt(appState.maxStudentsPerSection) || 40;

    // Recommendation 1: English Department Capacity
    const engUtil = calcResults.utilizations["English"][yearIdx];
    const engStaff = calcResults.staffCounts["English"][yearIdx];
    const engPeriods = calcResults.cbseWorkloads["English"][yearIdx];
    const engUnused = (engStaff * appState.capacities.primary) - engPeriods;
    const engExtraSections = Math.floor(engUnused / 6);
    
    let engText = `English department is fully utilized.`;
    if (engExtraSections > 0) {
        engText = `English department has ${engUnused} periods of excess capacity. It can support up to ${engExtraSections} additional sections without hiring.`;
    }
    
    // Recommendation 2: Mathematics department hiring advice
    const mathUtil = calcResults.utilizations["Mathematics"][yearIdx];
    let mathText = `Mathematics workload is optimal at ${mathUtil}%.`;
    let mathType = "success";
    let mathIcon = "fa-check";
    if (mathUtil > 95) {
        mathText = `Mathematics is operating at ${mathUtil}% utilization. Consider hiring 1 additional teacher immediately.`;
        mathType = "danger";
        mathIcon = "fa-user-plus";
    }

    // Recommendation 3: Science department utilization option
    const sciUtil = appState.scienceModel === "A" ? 
        calcResults.utilizations["Science Phy/Che (Middle)"][yearIdx] : 
        calcResults.utilizations["Physics"][yearIdx];
    let sciText = `Science workloads are running optimal.`;
    if (sciUtil < 70) {
        sciText = `Science department is under-utilized (${sciUtil}%). Option A composite role structure is highly cost-effective here.`;
    }

    // Recommendation 4: PE department sections check
    const petHired = calcResults.staffCounts["PET"][yearIdx];
    const petText = `Current PE & Games staff (${petHired} teachers) can easily handle all outdoor curriculum needs. No additional hires needed.`;

    // Recommendation 5: Non-teacher creating subjects audit
    const ncText = `DRT, Clubs, ECA, GK, Value Education, Vadiva, and Math Excel require ₹0 extra hiring budget as periods are distributed internally.`;

    // Compile into cards
    const insights = [
        { title: "English Department Load", text: engText, type: "info", icon: "fa-message" },
        { title: "Mathematics Staffing Audit", text: mathText, type: mathType, icon: mathIcon },
        { title: "Science Department Audit", text: sciText, type: "info", icon: "fa-flask" },
        { title: "Physical Education Audit", text: petText, type: "success", icon: "fa-baseball-bat-ball" },
        { title: "Curriculum Optimization", text: ncText, type: "success", icon: "fa-shield-halved" }
    ];

    insights.forEach(ins => {
        const card = document.createElement("div");
        card.className = "insight-card";
        card.innerHTML = `
            <div class="insight-icon ${ins.type}"><i class="fa-solid ${ins.icon}"></i></div>
            <div class="insight-content">
                <span class="insight-title">${ins.title}</span>
                <span class="insight-text">${ins.text}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==========================================================================
// 8. REPORTS COMPILER MODULE (Interactive & Multi-Sheet)
// ==========================================================================

function compileSelectedReport() {
    const reportType = document.getElementById("report-type-select").value;
    const filterText = document.getElementById("search-reports-table").value.toLowerCase();
    
    const thead = document.getElementById("compiled-report-thead");
    const tbody = document.getElementById("compiled-report-tbody");
    const orgRenderer = document.getElementById("org-chart-renderer");
    const tableWrapper = document.querySelector("#report-view-container .table-wrapper");
    
    // Reset view visibility
    thead.innerHTML = "";
    tbody.innerHTML = "";
    orgRenderer.innerHTML = "";
    orgRenderer.style.display = "none";
    tableWrapper.style.display = "block";
    
    const oldSummary = document.getElementById("compiled-report-summary-card");
    if (oldSummary) {
        if (oldSummary.remove) oldSummary.remove();
        else if (oldSummary.parentNode) oldSummary.parentNode.removeChild(oldSummary);
    }
    
    const currentYearIdx = appState.globalSelectedYear - 1;

    // Helper: compile standard grade-wise array data
    const compileGradeRows = (titleKey, valMatrix) => {
        thead.innerHTML = `
            <tr>
                <th>Grade Level</th>
                <th class="text-center">Year 1</th>
                <th class="text-center">Year 2</th>
                <th class="text-center">Year 3</th>
                <th class="text-center">Year 4</th>
                <th class="text-center">Year 5</th>
            </tr>
        `;
        
        DEFAULT_GRADES.forEach(grade => {
            if (filterText && !grade.toLowerCase().includes(filterText)) return;
            const row = document.createElement("tr");
            let cols = `<td><span class="font-semibold">${grade}</span></td>`;
            for (let y = 0; y < 5; y++) {
                cols += `<td class="text-center">${valMatrix[grade][y]}</td>`;
            }
            row.innerHTML = cols;
            tbody.appendChild(row);
        });
    };

    // Helper: compile standard role counts report
    const compileRoleRows = (rolesList) => {
        thead.innerHTML = `
            <tr>
                <th>Staff Designation / Role</th>
                <th class="text-center">Year 1</th>
                <th class="text-center">Year 2</th>
                <th class="text-center">Year 3</th>
                <th class="text-center">Year 4</th>
                <th class="text-center">Year 5</th>
            </tr>
        `;
        
        rolesList.forEach(role => {
            if (filterText && !role.toLowerCase().includes(filterText)) return;
            const row = document.createElement("tr");
            let cols = `<td><span class="font-semibold">${role}</span></td>`;
            for (let y = 0; y < 5; y++) {
                const val = calcResults.staffCounts[role] ? calcResults.staffCounts[role][y] : 0;
                cols += `<td class="text-center">${val}</td>`;
            }
            row.innerHTML = cols;
            tbody.appendChild(row);
        });
    };

    const compileDetailedSalaryReport = (rolesList) => {
        thead.innerHTML = `
            <tr>
                <th>Designation</th>
                <th class="text-right" style="width: 100px;">No. of Staff</th>
                <th class="text-right" style="width: 120px;">Salary per Staff</th>
                <th class="text-center" style="width: 150px;">Calculation</th>
                <th class="text-right" style="width: 120px;">Monthly Total</th>
                <th class="text-right" style="width: 130px;">Annual Total</th>
            </tr>
        `;
        
        let grandCount = 0;
        let grandMonthly = 0;
        let grandAnnual = 0;
        
        const isTeaching = (reportType === "teacher-salary-details");
        
        rolesList.forEach(role => {
            if (filterText && !role.toLowerCase().includes(filterText)) return;
            
            let count = calcResults.staffCounts[role] ? calcResults.staffCounts[role][currentYearIdx] : 0;
            
            // Adjust count if shared program teachers offset is needed to prevent double-counting CBSE core outlays
            if (isTeaching && appState.sharingMode === "shared") {
                const coreDepts = [
                    "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS",
                    "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology"
                ];
                if (coreDepts.includes(role)) {
                    if (role === "Mathematics") {
                        count -= (calcResults.staffCounts["IIT Mathematics"][currentYearIdx] || 0);
                    } else if (role === "Physics") {
                        count -= (calcResults.staffCounts["IIT Physics"][currentYearIdx] || 0) + (calcResults.staffCounts["NEET Physics"][currentYearIdx] || 0);
                    } else if (role === "Chemistry") {
                        count -= (calcResults.staffCounts["IIT Chemistry"][currentYearIdx] || 0) + (calcResults.staffCounts["NEET Chemistry"][currentYearIdx] || 0);
                    } else if (role === "Biology") {
                        count -= (calcResults.staffCounts["IIT Biology"][currentYearIdx] || 0) + 
                                 (calcResults.staffCounts["NEET Biology"][currentYearIdx] || 0) + 
                                 (calcResults.staffCounts["NEET Botany"][currentYearIdx] || 0) + 
                                 (calcResults.staffCounts["NEET Zoology"][currentYearIdx] || 0);
                    }
                    count = Math.max(0, count);
                }
            }
            
            let roleSalKey = role;
            if (role === "Library") roleSalKey = "Librarian";
            
            const monSal = calcResults.monthlySalaries[roleSalKey] ? calcResults.monthlySalaries[roleSalKey][currentYearIdx] : (isTeaching ? 20000 : 10000);
            const monthlyTotal = count * monSal;
            const annualTotal = monthlyTotal * 12;
            
            grandCount += count;
            grandMonthly += monthlyTotal;
            grandAnnual += annualTotal;
            
            const formattedCount = count % 1 === 0 ? count : count.toFixed(2);
            const formattedSal = Math.round(monSal).toLocaleString('en-IN');
            const calculationStr = `₹${formattedSal} × ${formattedCount}`;
            
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><span class="font-semibold">${role}</span></td>
                <td class="text-right">${formattedCount}</td>
                <td class="text-right">₹${formattedSal}</td>
                <td class="text-center" style="font-family: monospace; font-size: 11px;">${calculationStr}</td>
                <td class="text-right" style="font-weight: 600;">₹${Math.round(monthlyTotal).toLocaleString('en-IN')}</td>
                <td class="text-right" style="font-weight: 600;">₹${Math.round(annualTotal).toLocaleString('en-IN')}</td>
            `;
            tbody.appendChild(row);
        });
        
        const totalRow = document.createElement("tr");
        totalRow.style.background = "rgba(99, 102, 241, 0.1)";
        totalRow.style.fontWeight = "bold";
        totalRow.innerHTML = `
            <td>TOTALS</td>
            <td class="text-right">${grandCount % 1 === 0 ? grandCount : grandCount.toFixed(2)}</td>
            <td class="text-right">-</td>
            <td class="text-center">-</td>
            <td class="text-right" style="color: var(--accent-primary);">₹${Math.round(grandMonthly).toLocaleString('en-IN')}</td>
            <td class="text-right" style="color: var(--accent-secondary);">₹${Math.round(grandAnnual).toLocaleString('en-IN')}</td>
        `;
        tbody.appendChild(totalRow);
        
        // Append dynamic subtotal card under the table
        let label = "Staff Summary";
        let subtotalColor = "var(--accent-primary)";
        if (reportType === "teacher-salary-details") {
            label = "Teaching Staff Summary";
            subtotalColor = "var(--accent-primary)";
        } else if (reportType === "nonteaching-salary-details") {
            label = "Non-Teaching Staff Summary";
            subtotalColor = "var(--accent-secondary)";
        } else if (reportType === "eca-salary-details") {
            label = "Part-Time / ECA Staff Summary";
            subtotalColor = "var(--accent-tertiary)";
        }
        
        const oldSummary = document.getElementById("compiled-report-summary-card");
        if (oldSummary) {
            if (oldSummary.remove) oldSummary.remove();
            else if (oldSummary.parentNode) oldSummary.parentNode.removeChild(oldSummary);
        }

        const summaryDiv = document.createElement("div");
        summaryDiv.id = "compiled-report-summary-card";
        summaryDiv.style.marginTop = "20px";
        summaryDiv.style.padding = "15px";
        summaryDiv.style.background = "rgba(255, 255, 255, 0.02)";
        summaryDiv.style.borderLeft = `4px solid ${subtotalColor}`;
        summaryDiv.style.borderRadius = "4px";
        summaryDiv.style.boxShadow = "var(--shadow-main)";
        
        const countLabel = reportType === "teacher-salary-details" ? "Total Teachers" : "Total Staff";
        
        summaryDiv.innerHTML = `
            <h4 style="margin: 0 0 8px 0; font-size: 13px; color: ${subtotalColor}; text-transform: uppercase; letter-spacing: 0.5px;">${label}</h4>
            <div style="display: flex; gap: 30px; font-size: 12px;">
                <div>${countLabel} : <strong style="color: var(--text-primary);">${grandCount % 1 === 0 ? grandCount : grandCount.toFixed(2)}</strong></div>
                <div>Monthly Salary : <strong style="color: var(--text-primary);">₹${Math.round(grandMonthly).toLocaleString('en-IN')}</strong></div>
                <div>Annual Salary : <strong style="color: var(--text-primary);">₹${Math.round(grandAnnual).toLocaleString('en-IN')}</strong></div>
            </div>
        `;
        document.getElementById("report-view-container").appendChild(summaryDiv);
    };

    switch (reportType) {
        case "grade-enrollment":
            compileGradeRows("Students", appState.studentStrength);
            break;
            
        case "section-planning":
            compileGradeRows("Sections", calcResults.sections);
            break;
            
        case "subject-requirement":
            thead.innerHTML = `
                <tr>
                    <th>Subject Description</th>
                    <th class="text-center">Year 1 (Periods/Staff)</th>
                    <th class="text-center">Year 2 (Periods/Staff)</th>
                    <th class="text-center">Year 3 (Periods/Staff)</th>
                    <th class="text-center">Year 4 (Periods/Staff)</th>
                    <th class="text-center">Year 5 (Periods/Staff)</th>
                </tr>
            `;
            Object.keys(appState.periodAllocations).forEach(subject => {
                if (filterText && !subject.toLowerCase().includes(filterText)) return;
                const row = document.createElement("tr");
                let cols = `<td><span class="font-semibold">${subject}</span></td>`;
                for (let y = 0; y < 5; y++) {
                    const periods = calcResults.cbseWorkloads[subject][y];
                    const staff = calcResults.staffCounts[subject] ? calcResults.staffCounts[subject][y] : 0;
                    cols += `<td class="text-center">${periods} P / ${staff} Staff</td>`;
                }
                row.innerHTML = cols;
                tbody.appendChild(row);
            });
            break;
            
        case "department-requirement":
            thead.innerHTML = `
                <tr>
                    <th>Department</th>
                    <th class="text-center">Year 1 (Workload/Hired)</th>
                    <th class="text-center">Year 2 (Workload/Hired)</th>
                    <th class="text-center">Year 3 (Workload/Hired)</th>
                    <th class="text-center">Year 4 (Workload/Hired)</th>
                    <th class="text-center">Year 5 (Workload/Hired)</th>
                </tr>
            `;
            const cbseDepts = ["English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS"];
            cbseDepts.forEach(dept => {
                if (filterText && !dept.toLowerCase().includes(filterText)) return;
                const row = document.createElement("tr");
                let cols = `<td><span class="font-semibold">${dept}</span></td>`;
                for (let y = 0; y < 5; y++) {
                    const periods = calcResults.cbseWorkloads[dept][y];
                    const staff = calcResults.staffCounts[dept][y];
                    cols += `<td class="text-center">${periods} Periods / ${staff} Hired</td>`;
                }
                row.innerHTML = cols;
                tbody.appendChild(row);
            });
            break;
            
        case "homeroom-report":
            compileRoleRows(["KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant"]);
            break;
            
        case "foundation-report":
            // Foundation is a single pooled group of staff
            compileRoleRows(["Foundation Faculty"]);
            break;
            
        case "iit-report":
            {
                const iitList = ["IIT Mathematics", "IIT Physics", "IIT Chemistry"];
                if (appState.iitBiologyProgram === "enabled") {
                    iitList.push("IIT Biology");
                }
                compileRoleRows(iitList);
            }
            break;
            
        case "neet-report":
            {
                const neetList = ["NEET Physics", "NEET Chemistry"];
                if (appState.neetBiologyStructure === "combined") {
                    neetList.push("NEET Biology");
                } else {
                    neetList.push("NEET Botany", "NEET Zoology");
                }
                compileRoleRows(neetList);
            }
            break;
            
        case "teacher-salary-details":
            {
                const teachList = [
                    "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary",
                    "KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant",
                    "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS"
                ];
                if (appState.scienceModel === "A") {
                    teachList.push("Science Phy/Che (Middle)", "Science Bio/Phy (Middle)");
                }
                teachList.push("Physics", "Chemistry", "Biology", "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library");
                teachList.push("Foundation Faculty", "IIT Mathematics", "IIT Physics", "IIT Chemistry");
                if (appState.iitBiologyProgram === "enabled") teachList.push("IIT Biology");
                teachList.push("NEET Physics", "NEET Chemistry");
                if (appState.neetBiologyStructure === "combined") teachList.push("NEET Biology");
                else teachList.push("NEET Botany", "NEET Zoology");
                
                compileDetailedSalaryReport(teachList);
            }
            break;

        case "nonteaching-salary-details":
            {
                const ntList = [
                    "Admin Officer", "Receptionist", "Sys Admin", "Counsellor", "Security HOD", "Security Guard", "Electrician", "Attender", "Housekeeping HOD", "Housekeeping Staff", "Gardener", "Driver", "Conductor"
                ];
                compileDetailedSalaryReport(ntList);
            }
            break;

        case "eca-salary-details":
            {
                const ecaList = [
                    "Classical Dance", "Yoga", "Karate", "Music", "Other Activities", "Sports Coach"
                ];
                compileDetailedSalaryReport(ecaList);
            }
            break;

        case "admin-staff":
            compileRoleRows(["Admin Officer", "Receptionist", "Sys Admin", "Counsellor", "Gardener"]);
            break;
            
        case "teaching-summary":
            const coreDepts = [
                "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS",
                "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology"
            ];
            compileRoleRows([
                "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary", "KG Homeroom", "Gr 1-2 Homeroom", 
                ...coreDepts, "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library"
            ]);
            break;
            
        case "non-teaching-summary":
            const supports = Object.keys(appState.nonTeachingStaffGrowth);
            compileRoleRows([...supports]);
            break;
            
        case "eca-summary":
            const ecas = Object.keys(appState.partTimeECAReqs);
            compileRoleRows([...ecas]);
            break;
            
        case "salary-budget":
            thead.innerHTML = `
                <tr>
                    <th>Department category</th>
                    <th class="text-right">Year 1 Monthly / Annual</th>
                    <th class="text-right">Year 2 Monthly / Annual</th>
                    <th class="text-right">Year 3 Monthly / Annual</th>
                    <th class="text-right">Year 4 Monthly / Annual</th>
                    <th class="text-right">Year 5 Monthly / Annual</th>
                </tr>
            `;
            const categories = [
                { label: "Teaching Staff", data: calcResults.salariesByCategory.teaching },
                { label: "Special Faculties", data: calcResults.salariesByCategory.special },
                { label: "Non-Teaching Support", data: calcResults.salariesByCategory.nonTeaching },
                { label: "ECA Staff", data: calcResults.salariesByCategory.eca }
            ];
            categories.forEach(cat => {
                const row = document.createElement("tr");
                let cols = `<td><span class="font-semibold">${cat.label}</span></td>`;
                for (let y = 0; y < 5; y++) {
                    const mon = Math.round(cat.data[y] / 12);
                    cols += `<td class="text-right">₹${mon.toLocaleString('en-IN')} / ₹${cat.data[y].toLocaleString('en-IN')}</td>`;
                }
                row.innerHTML = cols;
                tbody.appendChild(row);
            });
            break;
            
        case "five-year-salaries":
            thead.innerHTML = `
                <tr>
                    <th>Designation</th>
                    <th class="text-right">Year 1 Monthly</th>
                    <th class="text-right">Year 2 Monthly</th>
                    <th class="text-right">Year 3 Monthly</th>
                    <th class="text-right">Year 4 Monthly</th>
                    <th class="text-right">Year 5 Monthly</th>
                </tr>
            `;
            Object.keys(calcResults.monthlySalaries).forEach(role => {
                if (filterText && !role.toLowerCase().includes(filterText)) return;
                const row = document.createElement("tr");
                let cols = `<td><span class="font-semibold">${role}</span></td>`;
                for (let y = 0; y < 5; y++) {
                    cols += `<td class="text-right">₹${calcResults.monthlySalaries[role][y].toLocaleString('en-IN')}</td>`;
                }
                row.innerHTML = cols;
                tbody.appendChild(row);
            });
            break;
            
        case "staff-utilization":
            thead.innerHTML = `
                <tr>
                    <th>Department</th>
                    <th class="text-center">Year 1</th>
                    <th class="text-center">Year 2</th>
                    <th class="text-center">Year 3</th>
                    <th class="text-center">Year 4</th>
                    <th class="text-center">Year 5</th>
                </tr>
            `;
            Object.keys(calcResults.utilizations).forEach(dept => {
                if (filterText && !dept.toLowerCase().includes(filterText)) return;
                const row = document.createElement("tr");
                let cols = `<td><span class="font-semibold">${dept}</span></td>`;
                for (let y = 0; y < 5; y++) {
                    const val = calcResults.utilizations[dept][y];
                    cols += `<td class="text-center">${val}%</td>`;
                }
                row.innerHTML = cols;
                tbody.appendChild(row);
            });
            break;
            
        case "utilization-extremes":
            thead.innerHTML = `
                <tr>
                    <th>Department Designation</th>
                    <th class="text-center">Selected Year Utilization</th>
                    <th class="text-center">Status Category</th>
                    <th>Staff Recommendations</th>
                </tr>
            `;
            Object.keys(calcResults.utilizations).forEach(dept => {
                const util = calcResults.utilizations[dept][currentYearIdx];
                if (util === 0) return;
                
                let isExtreme = false;
                let status = "";
                let advice = "";
                
                if (util < 75) {
                    isExtreme = true;
                    status = `<span class="badge badge-yellow">Under-utilized</span>`;
                    advice = "Combine workloads, handle admin files, or assign extracurricular coordination.";
                } else if (util > 95) {
                    isExtreme = true;
                    status = `<span class="badge badge-red">Overloaded</span>`;
                    advice = "Hire additional part-time teacher, split sections, or reduce elective periods.";
                }
                
                if (isExtreme) {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td><span class="font-semibold">${dept}</span></td>
                        <td class="text-center">${util}%</td>
                        <td class="text-center">${status}</td>
                        <td>${advice}</td>
                    `;
                    tbody.appendChild(row);
                }
            });
            break;
            
        case "expansion-capacity":
            thead.innerHTML = `
                <tr>
                    <th>Department</th>
                    <th class="text-center">Current Sections</th>
                    <th class="text-center">Current Workload (P)</th>
                    <th class="text-center">Total Staff capacity</th>
                    <th class="text-center">Unused Periods</th>
                    <th class="text-center">Additional Sections Possible</th>
                </tr>
            `;
            const pooledD = ["English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS"];
            pooledD.forEach(dept => {
                const sections = calcResults.totalSections[currentYearIdx];
                const workload = calcResults.cbseWorkloads[dept][currentYearIdx];
                const staff = calcResults.staffCounts[dept][currentYearIdx];
                const cap = staff * 32;
                const unused = cap - workload;
                const periodPerSec = appState.periodAllocations[dept].primary || 6;
                const addPossible = periodPerSec > 0 ? Math.floor(unused / periodPerSec) : 0;
                
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><span class="font-semibold">${dept}</span></td>
                    <td class="text-center">${sections}</td>
                    <td class="text-center">${workload}</td>
                    <td class="text-center">${cap}</td>
                    <td class="text-center">${unused < 0 ? 0 : unused}</td>
                    <td class="text-center font-semibold" style="color: var(--accent-primary);">${addPossible < 0 ? 0 : addPossible} Sections</td>
                `;
                tbody.appendChild(row);
            });
            break;
            
        case "transport-staff":
            thead.innerHTML = `
                <tr>
                    <th>Staff Role</th>
                    <th class="text-center">Year 1</th>
                    <th class="text-center">Year 2</th>
                    <th class="text-center">Year 3</th>
                    <th class="text-center">Year 4</th>
                    <th class="text-center">Year 5</th>
                </tr>
            `;
            const transportRoles = ["Driver", "Conductor"];
            transportRoles.forEach(role => {
                const row = document.createElement("tr");
                let cols = `<td><span class="font-semibold">${role} Staff</span></td>`;
                for (let y = 0; y < 5; y++) {
                    cols += `<td class="text-center">${calcResults.staffCounts[role][y]}</td>`;
                }
                row.innerHTML = cols;
                tbody.appendChild(row);
            });
            break;
            
        case "five-year-manpower":
            thead.innerHTML = `
                <tr>
                    <th>Staff Group</th>
                    <th class="text-center">Year 1</th>
                    <th class="text-center">Year 2</th>
                    <th class="text-center">Year 3</th>
                    <th class="text-center">Year 4</th>
                    <th class="text-center">Year 5</th>
                </tr>
            `;
            // Summarize teaching, special, non-teaching, eca counts
            const teachKeys = ["KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant", "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS", "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology", "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary", "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library"];
            
            const countSums = { teaching: [0,0,0,0,0], special: [0,0,0,0,0], nonTeaching: [0,0,0,0,0], eca: [0,0,0,0,0] };
            
            for (let y = 0; y < 5; y++) {
                teachKeys.forEach(k => { countSums.teaching[y] += calcResults.staffCounts[k][y] || 0; });
                
                const specKeys = ["Foundation Faculty", "IIT Mathematics", "IIT Physics", "IIT Chemistry"];
                if (appState.iitBiologyProgram === "enabled") specKeys.push("IIT Biology");
                specKeys.push("NEET Physics", "NEET Chemistry");
                if (appState.neetBiologyStructure === "combined") specKeys.push("NEET Biology");
                else specKeys.push("NEET Botany", "NEET Zoology");
                
                specKeys.forEach(k => { countSums.special[y] += calcResults.staffCounts[k][y] || 0; });
                
                Object.keys(appState.nonTeachingStaffGrowth).forEach(k => { countSums.nonTeaching[y] += (calcResults.staffCounts[k] ? calcResults.staffCounts[k][y] : 0); });
                countSums.nonTeaching[y] += (calcResults.staffCounts["Driver"] ? calcResults.staffCounts["Driver"][y] : 0) + (calcResults.staffCounts["Conductor"] ? calcResults.staffCounts["Conductor"][y] : 0);
                Object.keys(appState.partTimeECAReqs).forEach(k => { countSums.eca[y] += (calcResults.staffCounts[k] ? calcResults.staffCounts[k][y] : 0); });
            }

            const groups = [
                { label: "CBSE Teaching Staff", data: countSums.teaching },
                { label: "IIT/NEET/Foundation Faculty", data: countSums.special },
                { label: "Non-Teaching Support", data: countSums.nonTeaching },
                { label: "Part-Time ECA Coaches", data: countSums.eca }
            ];

            groups.forEach(g => {
                const row = document.createElement("tr");
                let cols = `<td><span class="font-semibold">${g.label}</span></td>`;
                for (let y = 0; y < 5; y++) {
                    cols += `<td class="text-center">${g.data[y]}</td>`;
                }
                row.innerHTML = cols;
                tbody.appendChild(row);
            });
            break;
            
        case "org-chart":
            // Render Organization Chart Flow tree
            tableWrapper.style.display = "none";
            orgRenderer.style.display = "flex";
            
            // Build visual tree representation
            orgRenderer.innerHTML = `
                <div class="org-child-wrapper">
                    <div class="org-node">
                        <div class="role">School Trust Board</div>
                        <div class="details">Strategic Governance</div>
                    </div>
                    <div class="org-line"></div>
                    <div class="org-node">
                        <div class="role">Principal</div>
                        <div class="details">Head of School (Y2-5)</div>
                    </div>
                    <div class="org-line"></div>
                    
                    <div class="org-row">
                        <div class="org-child-wrapper">
                            <div class="org-node">
                                <div class="role">Vice Principal</div>
                                <div class="details">Academic Head (Y1)</div>
                            </div>
                        </div>
                        <div class="org-child-wrapper">
                            <div class="org-node">
                                <div class="role">Academic Coord. (ACO)</div>
                                <div class="details">Stage Supervisors</div>
                            </div>
                        </div>
                    </div>
                    <div class="org-line"></div>
                    
                    <div class="org-row">
                        <div class="org-child-wrapper">
                            <div class="org-node" style="min-width: 100px;">
                                <div class="role">CBSE Teachers</div>
                                <div class="details">Core Curriculum</div>
                            </div>
                        </div>
                        <div class="org-child-wrapper">
                            <div class="org-node" style="min-width: 100px;">
                                <div class="role">Spl Academy</div>
                                <div class="details">IIT / NEET Prep</div>
                            </div>
                        </div>
                        <div class="org-child-wrapper">
                            <div class="org-node" style="min-width: 100px;">
                                <div class="role">ECA/Sports</div>
                                <div class="details">Co-Curriculum</div>
                            </div>
                        </div>
                        <div class="org-child-wrapper">
                            <div class="org-node" style="min-width: 100px;">
                                <div class="role">Administration</div>
                                <div class="details">Finance & Operations</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
    }
}

// Multi-Sheet Excel Workbook Compiler utilizing SheetJS
function handleExcelExport() {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Enrollment Matrix
    const enrollmentData = [["Grade Level", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"]];
    DEFAULT_GRADES.forEach(g => {
        enrollmentData.push([g, ...appState.studentStrength[g]]);
    });
    const wsEnrollment = XLSX.utils.aoa_to_sheet(enrollmentData);
    XLSX.utils.book_append_sheet(wb, wsEnrollment, "Student Enrollment");

    // Sheet 2: Sections count
    const sectionsData = [["Grade Level", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5"]];
    DEFAULT_GRADES.forEach(g => {
        sectionsData.push([g, ...calcResults.sections[g]]);
    });
    const wsSections = XLSX.utils.aoa_to_sheet(sectionsData);
    XLSX.utils.book_append_sheet(wb, wsSections, "Sections count");

    // Sheet 3: Manpower summary matrix
    const manpowerData = [["Designation / Department", "Year 1 Count", "Year 2 Count", "Year 3 Count", "Year 4 Count", "Year 5 Count"]];
    Object.keys(calcResults.staffCounts).forEach(role => {
        if (!role.includes("Baseline Check")) {
            manpowerData.push([role, ...calcResults.staffCounts[role]]);
        }
    });
    const wsManpower = XLSX.utils.aoa_to_sheet(manpowerData);
    XLSX.utils.book_append_sheet(wb, wsManpower, "Manpower Forecast");

    // Sheet 4: Salary & Budgets Summary
    const salaryData = [["Department Category", "Year 1 Budget (₹)", "Year 2 Budget (₹)", "Year 3 Budget (₹)", "Year 4 Budget (₹)", "Year 5 Budget (₹)"]];
    salaryData.push(["CBSE Core Teachers", ...calcResults.salariesByCategory.teaching]);
    salaryData.push(["IIT/NEET/Foundation Faculty", ...calcResults.salariesByCategory.special]);
    salaryData.push(["Non-Teaching Support Staff", ...calcResults.salariesByCategory.nonTeaching]);
    salaryData.push(["Part-Time ECA Staff", ...calcResults.salariesByCategory.eca]);
    salaryData.push(["Grand Total Salary Budget", ...calcResults.grandTotalSalaries]);
    const wsSalaries = XLSX.utils.aoa_to_sheet(salaryData);
    XLSX.utils.book_append_sheet(wb, wsSalaries, "Salary Budget Summary");

    // Detailed Sheets for Selected Year
    const currentYear = appState.globalSelectedYear;
    const yIdx = currentYear - 1;
    
    // Teaching Detailed Salary Sheet
    const teachExcelData = [
        ["Teaching Staff Detailed Salaries (Year " + currentYear + ")"],
        ["Designation", "No. of Staff", "Salary per Staff", "Calculation Formula", "Monthly Total (₹)", "Annual Total (₹)"]
    ];
    const teachList = [
        "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary",
        "KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant",
        "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS"
    ];
    if (appState.scienceModel === "A") {
        teachList.push("Science Phy/Che (Middle)", "Science Bio/Phy (Middle)");
    }
    teachList.push("Physics", "Chemistry", "Biology", "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library");
    teachList.push("Foundation Faculty", "IIT Mathematics", "IIT Physics", "IIT Chemistry");
    if (appState.iitBiologyProgram === "enabled") teachList.push("IIT Biology");
    teachList.push("NEET Physics", "NEET Chemistry");
    if (appState.neetBiologyStructure === "combined") teachList.push("NEET Biology");
    else teachList.push("NEET Botany", "NEET Zoology");
    
    let tCount = 0, tMonthly = 0, tAnnual = 0;
    teachList.forEach(role => {
        let count = calcResults.staffCounts[role] ? calcResults.staffCounts[role][yIdx] : 0;
        if (appState.sharingMode === "shared") {
            const coreDepts = [
                "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS",
                "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology"
            ];
            if (coreDepts.includes(role)) {
                if (role === "Mathematics") {
                    count -= (calcResults.staffCounts["IIT Mathematics"][yIdx] || 0);
                } else if (role === "Physics") {
                    count -= (calcResults.staffCounts["IIT Physics"][yIdx] || 0) + (calcResults.staffCounts["NEET Physics"][yIdx] || 0);
                } else if (role === "Chemistry") {
                    count -= (calcResults.staffCounts["IIT Chemistry"][yIdx] || 0) + (calcResults.staffCounts["NEET Chemistry"][yIdx] || 0);
                } else if (role === "Biology") {
                    count -= (calcResults.staffCounts["IIT Biology"][yIdx] || 0) + 
                             (calcResults.staffCounts["NEET Biology"][yIdx] || 0) + 
                             (calcResults.staffCounts["NEET Botany"][yIdx] || 0) + 
                             (calcResults.staffCounts["NEET Zoology"][yIdx] || 0);
                }
                count = Math.max(0, count);
            }
        }
        let roleSalKey = role;
        if (role === "Library") roleSalKey = "Librarian";
        
        const monSal = calcResults.monthlySalaries[roleSalKey] ? calcResults.monthlySalaries[roleSalKey][yIdx] : 20000;
        const monthlyTotal = count * monSal;
        const annualTotal = monthlyTotal * 12;
        
        tCount += count;
        tMonthly += monthlyTotal;
        tAnnual += annualTotal;
        
        const formattedCount = count % 1 === 0 ? count : Number(count.toFixed(2));
        const formattedSal = Math.round(monSal);
        teachExcelData.push([
            role,
            formattedCount,
            formattedSal,
            `₹${formattedSal.toLocaleString('en-IN')} × ${formattedCount}`,
            Math.round(monthlyTotal),
            Math.round(annualTotal)
        ]);
    });
    teachExcelData.push(["TOTALS", tCount % 1 === 0 ? tCount : Number(tCount.toFixed(2)), "", "", Math.round(tMonthly), Math.round(tAnnual)]);
    const wsTeachSal = XLSX.utils.aoa_to_sheet(teachExcelData);
    XLSX.utils.book_append_sheet(wb, wsTeachSal, `Teaching Salaries Y${currentYear}`);

    // Non-Teaching Detailed Salary Sheet
    const ntExcelData = [
        ["Non-Teaching Staff Detailed Salaries (Year " + currentYear + ")"],
        ["Designation", "No. of Staff", "Salary per Staff", "Calculation Formula", "Monthly Total (₹)", "Annual Total (₹)"]
    ];
    const ntList = [
        "Admin Officer", "Receptionist", "Sys Admin", "Counsellor", "Security HOD", "Security Guard", "Electrician", "Attender", "Housekeeping HOD", "Housekeeping Staff", "Gardener", "Driver", "Conductor"
    ];
    let nCount = 0, nMonthly = 0, nAnnual = 0;
    ntList.forEach(role => {
        let count = calcResults.staffCounts[role] ? calcResults.staffCounts[role][yIdx] : 0;
        const monSal = calcResults.monthlySalaries[role] ? calcResults.monthlySalaries[role][yIdx] : 20000;
        const monthlyTotal = count * monSal;
        const annualTotal = monthlyTotal * 12;
        
        nCount += count;
        nMonthly += monthlyTotal;
        nAnnual += annualTotal;
        
        const formattedCount = count % 1 === 0 ? count : Number(count.toFixed(2));
        const formattedSal = Math.round(monSal);
        ntExcelData.push([
            role,
            formattedCount,
            formattedSal,
            `₹${formattedSal.toLocaleString('en-IN')} × ${formattedCount}`,
            Math.round(monthlyTotal),
            Math.round(annualTotal)
        ]);
    });
    ntExcelData.push(["TOTALS", nCount % 1 === 0 ? nCount : Number(nCount.toFixed(2)), "", "", Math.round(nMonthly), Math.round(nAnnual)]);
    const wsNTSal = XLSX.utils.aoa_to_sheet(ntExcelData);
    XLSX.utils.book_append_sheet(wb, wsNTSal, `Non-Teaching Salaries Y${currentYear}`);

    // ECA Detailed Salary Sheet
    const ecaExcelData = [
        ["Part-Time / ECA Staff Detailed Salaries (Year " + currentYear + ")"],
        ["Designation", "No. of Staff", "Salary per Staff", "Calculation Formula", "Monthly Total (₹)", "Annual Total (₹)"]
    ];
    const ecaList = [
        "Classical Dance", "Yoga", "Karate", "Music", "Other Activities", "Sports Coach"
    ];
    let eCount = 0, eMonthly = 0, eAnnual = 0;
    ecaList.forEach(role => {
        let count = calcResults.staffCounts[role] ? calcResults.staffCounts[role][yIdx] : 0;
        const monSal = calcResults.monthlySalaries[role] ? calcResults.monthlySalaries[role][yIdx] : 10000;
        const monthlyTotal = count * monSal;
        const annualTotal = monthlyTotal * 12;
        
        eCount += count;
        eMonthly += monthlyTotal;
        eAnnual += annualTotal;
        
        const formattedCount = count % 1 === 0 ? count : Number(count.toFixed(2));
        const formattedSal = Math.round(monSal);
        ecaExcelData.push([
            role,
            formattedCount,
            formattedSal,
            `₹${formattedSal.toLocaleString('en-IN')} × ${formattedCount}`,
            Math.round(monthlyTotal),
            Math.round(annualTotal)
        ]);
    });
    ecaExcelData.push(["TOTALS", eCount % 1 === 0 ? eCount : Number(eCount.toFixed(2)), "", "", Math.round(eMonthly), Math.round(eAnnual)]);
    const wsECASal = XLSX.utils.aoa_to_sheet(ecaExcelData);
    XLSX.utils.book_append_sheet(wb, wsECASal, `ECA Salaries Y${currentYear}`);

    // Write file
    XLSX.writeFile(wb, `${appState.schoolName.replace(/\s+/g, '_')}_manpower_forecast.xlsx`);
}

// ==========================================================================
// 8. EVENT BINDINGS & SPA ROUTER
// ==========================================================================

function initAppRouting() {
    const links = document.querySelectorAll(".sidebar-link");
    const sections = document.querySelectorAll(".content-section");
    
    links.forEach(link => {
        link.addEventListener("click", function() {
            const targetId = this.getAttribute("data-target");
            if (!targetId) return;
            
            // Sidebar link toggle
            links.forEach(l => l.classList.remove("active"));
            this.classList.add("active");
            
            // Section toggle
            sections.forEach(s => s.classList.remove("active"));
            document.getElementById(targetId).classList.add("active");
            
            // Close mobile menu if open
            document.getElementById("app-sidebar").classList.remove("mobile-open");
            
            // Custom section updates
            if (targetId === "section-dashboard") {
                renderDashboardCharts();
            } else if (targetId === "section-periods") {
                populatePeriodsMasterTable();
            } else if (targetId === "section-manpower") {
                populateManpowerCalculatorTable();
            } else if (targetId === "section-salaries") {
                populateSalaryMasterTables();
            } else if (targetId === "section-optimization") {
                runCapacitySimulator();
            } else if (targetId === "section-reports") {
                compileSelectedReport();
            } else if (targetId === "section-designer") {
                initReportDesigner();
            }
        });
    });

    // Mobile Sidebar toggle menu
    document.getElementById("sidebar-toggle-mobile").addEventListener("click", () => {
        document.getElementById("app-sidebar").classList.toggle("mobile-open");
    });
}

function bindInputEvents() {
    // School Name input
    document.getElementById("school-name-input").addEventListener("input", function() {
        appState.schoolName = this.value;
        saveStateToLocalStorage();
    });

    // Year selection
    document.getElementById("global-year-select").addEventListener("change", function() {
        appState.globalSelectedYear = parseInt(this.value);
        
        // Trigger all active panels recalculations
        runManpowerCalculations();
        updateDashboardMetrics();
        populateManpowerCalculatorTable();
        compileAIRecommendations();
        runCapacitySimulator();
        compileSelectedReport();
        renderDashboardCharts();
    });

    // Max students per section
    document.getElementById("max-students-per-section").addEventListener("input", function() {
        appState.maxStudentsPerSection = parseInt(this.value) || 40;
        runManpowerCalculations();
        populateStudentStrengthTable();
        updateDashboardMetrics();
    });

    // Science model toggle option
    document.getElementById("science-model-select").addEventListener("change", function() {
        appState.scienceModel = this.value;
        runManpowerCalculations();
        populateManpowerCalculatorTable();
        updateDashboardMetrics();
    });

    // Sharing model select
    document.getElementById("sharing-model-select").addEventListener("change", function() {
        appState.sharingMode = this.value;
        runManpowerCalculations();
        populateManpowerCalculatorTable();
        updateDashboardMetrics();
    });

    // NEET Biology select
    document.getElementById("neet-biology-select").addEventListener("change", function() {
        appState.neetBiologyStructure = this.value;
        runManpowerCalculations();
        populateManpowerCalculatorTable();
        updateDashboardMetrics();
    });

    // IIT Biology select
    document.getElementById("iit-biology-select").addEventListener("change", function() {
        appState.iitBiologyProgram = this.value;
        runManpowerCalculations();
        populateManpowerCalculatorTable();
        updateDashboardMetrics();
    });

    // Teacher capacities
    document.getElementById("capacity-primary").addEventListener("input", function() {
        appState.capacities.primary = parseInt(this.value) || 32;
        runManpowerCalculations();
        updateDashboardMetrics();
    });
    document.getElementById("capacity-middle").addEventListener("input", function() {
        appState.capacities.middle = parseInt(this.value) || 32;
        runManpowerCalculations();
        updateDashboardMetrics();
    });
    document.getElementById("capacity-high-hs").addEventListener("input", function() {
        appState.capacities.highHS = parseInt(this.value) || 36;
        runManpowerCalculations();
        updateDashboardMetrics();
    });

    // Student enrollment inputs change event
    document.addEventListener("input", function(e) {
        if (e.target.classList.contains("student-input")) {
            const grade = e.target.getAttribute("data-grade");
            const year = parseInt(e.target.getAttribute("data-year"));
            const value = parseInt(e.target.value) || 0;
            
            appState.studentStrength[grade][year] = value;
            runManpowerCalculations();
            
            // Update section counts display in that row
            const sectionsCell = e.target.parentElement.nextElementSibling;
            sectionsCell.textContent = calcResults.sections[grade][year];
            
            // Recalculate totals row
            for (let y = 0; y < 5; y++) {
                document.getElementById(`tot-std-y${y+1}`).textContent = calcResults.totalStudents[y];
                document.getElementById(`tot-sec-y${y+1}`).textContent = calcResults.totalSections[y];
            }
            updateDashboardMetrics();
        }
    });

    // Weekly Period input change event
    document.addEventListener("input", function(e) {
        if (e.target.classList.contains("period-input")) {
            const subject = e.target.getAttribute("data-subject");
            const field = e.target.getAttribute("data-field");
            const value = parseInt(e.target.value) || 0;
            
            appState.periodAllocations[subject][field] = value;
            runManpowerCalculations();
            updateDashboardMetrics();
        }
    });

    // Search subject filter in allocations table
    document.getElementById("search-periods").addEventListener("input", populatePeriodsMasterTable);

    // Manpower planner categories tabs
    const manTabs = document.querySelectorAll("#manpower-category-tabs .tab-btn");
    manTabs.forEach(tab => {
        tab.addEventListener("click", function() {
            manTabs.forEach(t => t.classList.remove("active"));
            this.classList.add("active");
            currentManpowerCategory = this.getAttribute("data-category");
            populateManpowerCalculatorTable();
        });
    });

    // Salary tier selection change
    document.getElementById("salary-tier-select").addEventListener("change", function() {
        appState.salaryTier = this.value;
        runManpowerCalculations();
        populateSalaryMasterTables();
        updateDashboardMetrics();
    });

    // Increment percent change
    document.getElementById("annual-increment-pct").addEventListener("input", function() {
        appState.annualIncrementPct = parseFloat(this.value) || 5;
        runManpowerCalculations();
        populateSalaryMasterTables();
        updateDashboardMetrics();
    });

    // Salary input editor event for custom tier
    document.addEventListener("input", function(e) {
        if (e.target.classList.contains("salary-input")) {
            const role = e.target.getAttribute("data-role");
            const val = parseInt(e.target.value) || 0;
            
            appState.customSalaries[role] = val;
            runManpowerCalculations();
            populateSalaryMasterTables();
            updateDashboardMetrics();
        }
    });



    // Reports compiler select and search filters
    document.getElementById("report-type-select").addEventListener("change", compileSelectedReport);
    document.getElementById("search-reports-table").addEventListener("input", compileSelectedReport);

    // Reset settings in sidebar footer
    document.getElementById("reset-data-btn").addEventListener("click", () => {
        if (confirm("Are you sure you want to restore default period, student, and salary settings?")) {
            resetAppState();
        }
    });

    // Relaunch wizard button trigger
    document.getElementById("relaunch-wizard-btn").addEventListener("click", () => {
        appState.wizardCompleted = false;
        saveStateToLocalStorage();
        
        // Hide shell, show wizard
        document.getElementById("app-shell").style.display = "none";
        const wiz = document.getElementById("setup-wizard-container");
        wiz.style.display = "flex";
        
        // Prefill values
        document.getElementById("wiz-school-name").value = appState.schoolName;
        document.getElementById("wiz-academic-year").value = appState.academicYear;
        document.getElementById("wiz-growth-rate").value = appState.studentGrowthRatePct || 15;
        document.getElementById("wiz-salary-inc").value = appState.annualIncrementPct || 5;
        document.getElementById("wiz-salary-tier").value = appState.salaryTier;
        document.getElementById("wiz-opt-found").checked = appState.optFoundationEnabled !== false;
        document.getElementById("wiz-opt-iit-neet").checked = appState.optIITNeetEnabled !== false;
        
        populateWizardIntakeTable();
    });

    // Wizard input listeners for dynamic sections count
    document.addEventListener("input", function(e) {
        if (e.target.classList.contains("wiz-std-input") || e.target.classList.contains("wiz-max-input")) {
            const grade = e.target.getAttribute("data-grade");
            const strengthInput = document.querySelector(`.wiz-std-input[data-grade="${grade}"]`);
            const maxInput = document.querySelector(`.wiz-max-input[data-grade="${grade}"]`);
            
            if (strengthInput && maxInput) {
                const strength = parseInt(strengthInput.value) || 0;
                const maxLimit = parseInt(maxInput.value) || 40;
                
                appState.studentStrength[grade][0] = strength;
                appState.maxStudentsPerGrade[grade] = maxLimit;
                
                const sections = Math.ceil(strength / maxLimit) || 0;
                const outputCell = document.querySelector(`.wiz-sec-output[data-grade="${grade}"]`);
                if (outputCell) outputCell.textContent = sections;
            }
        }
    });

    // Wizard Plan Generator click trigger
    document.getElementById("generate-plan-btn").addEventListener("click", () => {
        // Read simple inputs
        appState.schoolName = document.getElementById("wiz-school-name").value || "Velammal Bodhi campus - Staff calculation";
        appState.academicYear = document.getElementById("wiz-academic-year").value || "2026-27";
        appState.studentGrowthRatePct = parseFloat(document.getElementById("wiz-growth-rate").value) || 15;
        appState.annualIncrementPct = parseFloat(document.getElementById("wiz-salary-inc").value) || 5;
        appState.salaryTier = document.getElementById("wiz-salary-tier").value;
        appState.optFoundationEnabled = document.getElementById("wiz-opt-found").checked;
        appState.optIITNeetEnabled = document.getElementById("wiz-opt-iit-neet").checked;
        
        // Save table limits and strengths
        const wizGrades = ["Pre-KG", "LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"];
        wizGrades.forEach(grade => {
            const strengthVal = parseInt(document.querySelector(`.wiz-std-input[data-grade="${grade}"]`).value) || 0;
            const maxVal = parseInt(document.querySelector(`.wiz-max-input[data-grade="${grade}"]`).value) || 40;
            
            appState.studentStrength[grade][0] = strengthVal;
            appState.maxStudentsPerGrade[grade] = maxVal;
        });
        
        // High school cohorts are 0 in Year 1
        ["Grade 9", "Grade 10", "Grade 11", "Grade 12"].forEach(g => {
            appState.studentStrength[g][0] = 0;
        });

        // Run projection algorithm for Years 2 to 5
        const growth = appState.studentGrowthRatePct / 100;
        for (let y = 1; y < 5; y++) {
            // KG entry
            appState.studentStrength["Pre-KG"][y] = Math.round(appState.studentStrength["Pre-KG"][y-1] * (1 + growth));
            appState.studentStrength["LKG"][y] = Math.round(appState.studentStrength["LKG"][y-1] * (1 + growth));
            appState.studentStrength["UKG"][y] = Math.round(appState.studentStrength["UKG"][y-1] * (1 + growth));
            
            // Grade 1 cohort progression
            appState.studentStrength["Grade 1"][y] = Math.round(appState.studentStrength["UKG"][y-1] * (1 + growth));
            
            // Grades 2 to 8 progression
            const gradesProgression = ["Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"];
            gradesProgression.forEach(grade => {
                const prevGradeIdx = DEFAULT_GRADES.indexOf(grade) - 1;
                const prevGradeName = DEFAULT_GRADES[prevGradeIdx];
                appState.studentStrength[grade][y] = Math.round(appState.studentStrength[prevGradeName][y-1] * (1 + growth));
            });
            
            // High School Grade 9 & 10 opening
            if (y === 1) { // Year 2
                appState.studentStrength["Grade 9"][y] = 30;
                appState.studentStrength["Grade 10"][y] = 0;
            } else if (y >= 2) {
                appState.studentStrength["Grade 9"][y] = Math.round(appState.studentStrength["Grade 8"][y-1] * (1 + growth));
                appState.studentStrength["Grade 10"][y] = Math.round(appState.studentStrength["Grade 9"][y-1] * 0.9);
            }
            
            // Higher Secondary Grade 11 & 12 opening
            if (y === 1) { // Year 2
                appState.studentStrength["Grade 11"][y] = 20;
                appState.studentStrength["Grade 12"][y] = 0;
            } else if (y >= 2) {
                appState.studentStrength["Grade 11"][y] = Math.round(20 * Math.pow(1 + growth, y-1));
                appState.studentStrength["Grade 12"][y] = Math.round(appState.studentStrength["Grade 11"][y-1] * 0.9);
            }
        }
        
        // Buses count progression defaults
        appState.buses = [5, 10, 12, 12, 12];
        
        // Apply special program period configurations
        // If disabled, zero out allocation cells
        if (!appState.optFoundationEnabled) {
            Object.keys(appState.periodAllocations).forEach(sub => {
                if (appState.periodAllocations[sub].isFoundation) {
                    appState.periodAllocations[sub].mid_found = 0;
                    appState.periodAllocations[sub].high_found = 0;
                }
            });
        }
        if (!appState.optIITNeetEnabled) {
            Object.keys(appState.periodAllocations).forEach(sub => {
                if (appState.periodAllocations[sub].isIIT || appState.periodAllocations[sub].isNEET) {
                    appState.periodAllocations[sub].iit = 0;
                    appState.periodAllocations[sub].neet = 0;
                }
            });
        }

        // Finalize state
        appState.wizardCompleted = true;
        saveStateToLocalStorage();
        runManpowerCalculations();
        
        // Hide wizard, show app shell
        document.getElementById("setup-wizard-container").style.display = "none";
        document.getElementById("app-shell").style.display = "flex";
        
        // Update main topbar and form inputs
        document.getElementById("school-name-input").value = appState.schoolName;
        document.getElementById("salary-tier-select").value = appState.salaryTier;
        document.getElementById("annual-increment-pct").value = appState.annualIncrementPct;
        
        // Refresh view structures
        populateStudentStrengthTable();
        updateDashboardMetrics();
        compileAIRecommendations();
        renderDashboardCharts();
    });

    // Dark/Light Theme toggler
    document.getElementById("theme-toggle").addEventListener("click", () => {
        const root = document.documentElement;
        const currentTheme = root.getAttribute("data-theme") || "dark";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        
        root.setAttribute("data-theme", newTheme);
        document.getElementById("theme-toggle").innerHTML = 
            newTheme === "dark" ? `<i class="fa-solid fa-moon"></i>` : `<i class="fa-solid fa-sun"></i>`;
            
        renderDashboardCharts();
    });

    // Action button triggers
    document.getElementById("print-report-btn").addEventListener("click", () => {
        window.print();
    });
    
    document.getElementById("export-excel-btn").addEventListener("click", handleExcelExport);

    // Dashboard stat cards detailed breakdown drilldowns
    const cardTeach = document.getElementById("dash-card-teaching");
    if (cardTeach) cardTeach.addEventListener("click", () => showDetailedSalaryDrilldown("teaching"));
    
    const cardNonTeach = document.getElementById("dash-card-nonteaching");
    if (cardNonTeach) cardNonTeach.addEventListener("click", () => showDetailedSalaryDrilldown("nonteaching"));
    
    const cardEca = document.getElementById("dash-card-eca");
    if (cardEca) cardEca.addEventListener("click", () => showDetailedSalaryDrilldown("eca"));
    
    const cardGrand = document.getElementById("dash-card-grand");
    if (cardGrand) cardGrand.addEventListener("click", () => showDetailedSalaryDrilldown("grand"));

    // Detailed salary breakdown category select dropdown in Salary Tab
    const selectBreakdown = document.getElementById("sal-breakdown-category-select");
    if (selectBreakdown) selectBreakdown.addEventListener("change", populateDetailedSalaryBreakdownTable);
}

// Year 1 student intake table populator in setup wizard
function populateWizardIntakeTable() {
    const tbody = document.getElementById("wiz-student-tbody");
    tbody.innerHTML = "";
    
    const wizGrades = ["Pre-KG", "LKG", "UKG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"];
    
    wizGrades.forEach(grade => {
        const row = document.createElement("tr");
        const strength = appState.studentStrength[grade][0] || 0;
        const maxLimit = appState.maxStudentsPerGrade[grade] || 40;
        const sections = Math.ceil(strength / maxLimit) || 0;
        
        row.innerHTML = `
            <td><span class="font-semibold">${grade}</span></td>
            <td>
                <input type="number" 
                       class="form-control wiz-std-input" 
                       data-grade="${grade}" 
                       value="${strength}" 
                       style="width: 80px; text-align: center;">
            </td>
            <td>
                <input type="number" 
                       class="form-control wiz-max-input" 
                       data-grade="${grade}" 
                       value="${maxLimit}" 
                       style="width: 80px; text-align: center;">
            </td>
            <td class="text-center font-semibold wiz-sec-output" data-grade="${grade}">${sections}</td>
        `;
        tbody.appendChild(row);
    });
}

// ==========================================================================
// 8. CUSTOM REPORT DESIGNER MODULE
// ==========================================================================
let selectedDesignerSections = [];
let savedReportTemplates = {
    "Trustee Meeting": ["school-profile", "student-strength", "five-year-student-proj", "total-sections", "salary-budget", "ai-recs"],
    "Finance Committee": ["school-profile", "salary-budget", "five-year-salaries", "ai-recs"],
    "Principal Review": ["student-strength", "total-sections", "teach-summary", "staff-utilization", "ai-recs"],
    "HR Recruitment": ["teach-summary", "homeroom-teachers", "iit-program", "neet-program", "staff-utilization", "ai-recs"]
};

function initReportDesigner() {
    // Bind available sections drag elements
    const draggables = document.querySelectorAll(".draggable-item");
    draggables.forEach(item => {
        item.setAttribute("draggable", "true");
        item.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", item.getAttribute("data-section"));
        });
        // Click action support
        item.onclick = () => {
            const section = item.getAttribute("data-section");
            appendDesignerSection(section);
        };
    });
    
    // Bind dropzone
    const dropzone = document.getElementById("selected-sections-list");
    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
    });
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        const section = e.dataTransfer.getData("text/plain");
        if (section) {
            appendDesignerSection(section);
        }
    });
    
    // Bind filter events to update preview
    document.getElementById("des-filter-ac-year").addEventListener("change", updateDesignerPreview);
    document.getElementById("des-filter-proj-year").addEventListener("change", updateDesignerPreview);
    document.getElementById("des-filter-program").addEventListener("change", updateDesignerPreview);
    
    document.getElementById("des-opt-exec-summary").addEventListener("change", updateDesignerPreview);
    document.getElementById("des-opt-charts").addEventListener("change", updateDesignerPreview);
    document.getElementById("des-opt-branding").addEventListener("change", updateDesignerPreview);
    
    // Clear all
    document.getElementById("clear-sections-btn").onclick = () => {
        selectedDesignerSections = [];
        renderSelectedSectionsList();
        updateDesignerPreview();
    };
    
    // Bind built-in packages
    document.getElementById("pkg-executive").onclick = () => {
        selectedDesignerSections = ["school-profile", "student-strength", "total-sections", "salary-budget", "ai-recs"];
        renderSelectedSectionsList();
        updateDesignerPreview();
    };
    document.getElementById("pkg-hr").onclick = () => {
        selectedDesignerSections = ["teach-summary", "homeroom-teachers", "staff-utilization", "ai-recs"];
        renderSelectedSectionsList();
        updateDesignerPreview();
    };
    document.getElementById("pkg-finance").onclick = () => {
        selectedDesignerSections = ["salary-budget", "five-year-salaries", "ai-recs"];
        renderSelectedSectionsList();
        updateDesignerPreview();
    };
    document.getElementById("pkg-complete").onclick = () => {
        selectedDesignerSections = [
            "school-profile", "academic-year", "growth-assumptions", "school-config",
            "student-strength", "grade-student-strength", "section-strength", "five-year-student-proj",
            "total-sections", "teach-summary", "homeroom-teachers", "foundation-program",
            "iit-program", "neet-program", "salary-budget", "five-year-salaries",
            "staff-utilization", "ai-recs"
        ];
        renderSelectedSectionsList();
        updateDesignerPreview();
    };
    
    // Populate templates dropdown
    populateTemplatesDropdown();
    
    // Save template
    document.getElementById("save-template-btn").onclick = () => {
        const nameInput = document.getElementById("new-template-name");
        const name = nameInput.value.trim();
        if (!name) {
            alert("Please enter a template name.");
            return;
        }
        if (selectedDesignerSections.length === 0) {
            alert("Please add at least one section to your layout before saving.");
            return;
        }
        savedReportTemplates[name] = [...selectedDesignerSections];
        localStorage.setItem("savedReportTemplates", JSON.stringify(savedReportTemplates));
        populateTemplatesDropdown();
        nameInput.value = "";
        alert(`Template "${name}" saved successfully!`);
    };
    
    // Load template selection
    document.getElementById("saved-templates-select").onchange = function() {
        const name = this.value;
        if (name && savedReportTemplates[name]) {
            selectedDesignerSections = [...savedReportTemplates[name]];
            renderSelectedSectionsList();
            updateDesignerPreview();
        }
    };
    
    // Bind exports
    // Print
    document.getElementById("des-btn-print").onclick = () => {
        if (selectedDesignerSections.length === 0) {
            alert("Nothing to print. Please design a report layout first.");
            return;
        }
        const previewEl = document.getElementById("designer-preview-page");
        const win = window.open("", "_blank");
        win.document.write(`
            <html>
            <head>
                <title>Velammal Bodhi Campus - Custom Management Report</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a202c; background: white; }
                    table { border-collapse: collapse; width: 100%; margin: 15px 0; font-size: 11px; }
                    th, td { border: 1px solid #cbd5e0; padding: 7px 9px; text-align: left; }
                    th { background-color: #edf2f7; font-weight: bold; }
                    h2 { border-bottom: 2px solid #3182ce; padding-bottom: 4px; margin-top: 25px; color: #2b6cb0; font-size: 14px; text-transform: uppercase; }
                    .header-branding { display: flex; justify-content: space-between; border-bottom: 2px double #cbd5e0; padding-bottom: 12px; margin-bottom: 25px; }
                    .footer-branding { display: flex; justify-content: space-between; border-top: 1px solid #cbd5e0; padding-top: 12px; margin-top: 35px; font-size: 9px; color: #718096; }
                </style>
            </head>
            <body>
                ${previewEl.innerHTML}
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `);
        win.document.close();
    };
    
    // Excel
    document.getElementById("des-btn-excel").onclick = () => {
        if (selectedDesignerSections.length === 0) {
            alert("No data to export. Please design a report layout first.");
            return;
        }
        const previewEl = document.getElementById("designer-preview-page");
        const tables = previewEl.querySelectorAll("table");
        if (tables.length === 0) {
            alert("No tabular reports selected in layout to export to Excel.");
            return;
        }
        const wb = XLSX.utils.book_new();
        tables.forEach((tbl, idx) => {
            const heading = tbl.previousElementSibling;
            const titleName = heading && heading.tagName.startsWith("H") ? heading.textContent.substring(0, 30) : `Report Sheet ${idx+1}`;
            const ws = XLSX.utils.table_to_sheet(tbl);
            XLSX.utils.book_append_sheet(wb, ws, titleName.replace(/[\\*?:/[\]]/g, ''));
        });
        XLSX.writeFile(wb, "Velammal_Custom_Management_Report.xlsx");
    };
    
    // PDF
    document.getElementById("des-btn-pdf").onclick = () => {
        if (selectedDesignerSections.length === 0) {
            alert("No report designed to export to PDF.");
            return;
        }
        const element = document.getElementById("designer-preview-page");
        
        const opt = {
            margin:       10,
            filename:     'Velammal_Custom_Management_Report.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true,
                scrollY: 0,
                scrollX: 0
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        const originalMaxHeight = element.style.maxHeight;
        const originalOverflow = element.style.overflow;
        
        element.style.maxHeight = "none";
        element.style.overflow = "visible";
        
        const originalScrollTop = element.scrollTop;
        element.scrollTop = 0;
        
        html2pdf().set(opt).from(element).save().then(() => {
            element.style.maxHeight = originalMaxHeight;
            element.style.overflow = originalOverflow;
            element.scrollTop = originalScrollTop;
        }).catch(err => {
            console.error("PDF generation failed:", err);
            element.style.maxHeight = originalMaxHeight;
            element.style.overflow = originalOverflow;
            element.scrollTop = originalScrollTop;
            alert("Failed to export PDF. Please use the Print option as a fallback.");
        });
    };
    
    // Word
    document.getElementById("des-btn-word").onclick = () => {
        if (selectedDesignerSections.length === 0) {
            alert("No report designed to export to Word.");
            return;
        }
        const previewEl = document.getElementById("designer-preview-page");
        const blob = new Blob([`
            <html xmlns:o="urn:schemas-microsoft-org:office:office" xmlns:w="urn:schemas-microsoft-org:office:word" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <title>Custom Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
                    th, td { border: 1px solid #cbd5e0; padding: 6px 8px; text-align: left; }
                    th { background: #edf2f7; font-weight: bold; }
                    h2 { border-bottom: 2px solid #3182ce; padding-bottom: 4px; margin-top: 20px; color: #2b6cb0; }
                </style>
            </head>
            <body>
                ${previewEl.innerHTML}
            </body>
            </html>
        `], { type: "application/msword" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Velammal_Custom_Management_Report.doc";
        a.click();
    };
    
    // Initial rendering
    renderSelectedSectionsList();
    updateDesignerPreview();
}

function appendDesignerSection(section) {
    selectedDesignerSections.push(section);
    renderSelectedSectionsList();
    updateDesignerPreview();
}

function populateTemplatesDropdown() {
    const select = document.getElementById("saved-templates-select");
    select.innerHTML = '<option value="">-- Select Template --</option>';
    
    // Load local storage templates
    const local = localStorage.getItem("savedReportTemplates");
    if (local) {
        try {
            savedReportTemplates = { ...savedReportTemplates, ...JSON.parse(local) };
        } catch (e) {
            console.error("Error reading custom report templates", e);
        }
    }
    
    Object.keys(savedReportTemplates).forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
}

function getSectionFriendlyName(sect) {
    const mapping = {
        "school-profile": "School Profile",
        "academic-year": "Academic Year Assumptions",
        "growth-assumptions": "Growth Assumptions",
        "school-config": "School Configuration",
        "student-strength": "Student Strength Summary",
        "grade-student-strength": "Grade-wise Enrollment",
        "section-strength": "Section-wise Strength",
        "five-year-student-proj": "5-Year Student Projection",
        "grade-sections": "Grade-wise Sections Planning",
        "total-sections": "Total Sections Summary",
        "max-section-cap": "Section Cap Limits",
        "teach-summary": "Teaching Staff Summary",
        "homeroom-teachers": "Homeroom Teachers Requirements",
        "math-dept": "Mathematics Department Workload",
        "science-dept": "Science Department Workload",
        "english-dept": "English Department Workload",
        "foundation-program": "Foundation Program Faculty",
        "iit-program": "IIT Program Faculty",
        "neet-program": "NEET Program Faculty",
        "salary-budget": "Salary Budget Summary",
        "teacher-salary-details": "Teacher Salary Details (Designation Level)",
        "nonteaching-salary-details": "Non-Teaching Salary Details (Designation Level)",
        "eca-salary-details": "ECA Salary Details (Designation Level)",
        "five-year-salaries": "5-Year Salary Projection",
        "staff-utilization": "Staff Utilization Report",
        "ai-recs": "AI Recommendations & Insights"
    };
    return mapping[sect] || sect;
}

function renderSelectedSectionsList() {
    const dropzone = document.getElementById("selected-sections-list");
    dropzone.innerHTML = "";
    
    if (selectedDesignerSections.length === 0) {
        dropzone.innerHTML = `
            <div class="dropzone-placeholder" style="text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 12px; margin: auto;">
                <i class="fa-solid fa-arrows-to-dot" style="font-size: 24px; margin-bottom: 8px; display: block; color: var(--accent-primary);"></i>
                Drag Report Modules Here
            </div>
        `;
        return;
    }
    
    selectedDesignerSections.forEach((sect, index) => {
        const el = document.createElement("div");
        el.className = "dropzone-item";
        
        const friendlyName = getSectionFriendlyName(sect);
        
        el.innerHTML = `
            <div class="dropzone-item-title">
                <span style="color: var(--accent-secondary); font-size: 10px; font-weight: bold;">#${index+1}</span>
                <span>${friendlyName}</span>
            </div>
            <div class="dropzone-item-actions">
                <i class="fa-solid fa-arrow-up dropzone-action-btn up" title="Move Up" data-index="${index}"></i>
                <i class="fa-solid fa-arrow-down dropzone-action-btn down" title="Move Down" data-index="${index}"></i>
                <i class="fa-solid fa-trash-can dropzone-action-btn remove" title="Remove" data-index="${index}" style="color: var(--status-red);"></i>
            </div>
        `;
        
        el.querySelector(".up").onclick = (e) => {
            e.stopPropagation();
            if (index > 0) {
                const temp = selectedDesignerSections[index];
                selectedDesignerSections[index] = selectedDesignerSections[index - 1];
                selectedDesignerSections[index - 1] = temp;
                renderSelectedSectionsList();
                updateDesignerPreview();
            }
        };
        el.querySelector(".down").onclick = (e) => {
            e.stopPropagation();
            if (index < selectedDesignerSections.length - 1) {
                const temp = selectedDesignerSections[index];
                selectedDesignerSections[index] = selectedDesignerSections[index + 1];
                selectedDesignerSections[index + 1] = temp;
                renderSelectedSectionsList();
                updateDesignerPreview();
            }
        };
        el.querySelector(".remove").onclick = (e) => {
            e.stopPropagation();
            selectedDesignerSections.splice(index, 1);
            renderSelectedSectionsList();
            updateDesignerPreview();
        };
        
        dropzone.appendChild(el);
    });
}

function updateDesignerPreview() {
    const previewContainer = document.getElementById("designer-preview-page");
    if (!previewContainer) return;
    
    if (selectedDesignerSections.length === 0) {
        previewContainer.innerHTML = `
            <div style="text-align: center; padding: 100px 0; color: #718096;">
                <i class="fa-solid fa-file-invoice" style="font-size: 40px; margin-bottom: 12px; color: #cbd5e0;"></i>
                <p>Select report modules to compile A4 preview.</p>
            </div>
        `;
        return;
    }
    
    const filterProjVal = document.getElementById("des-filter-proj-year").value;
    const yIdx = (filterProjVal === "all") ? (appState.globalSelectedYear - 1) : (parseInt(filterProjVal) - 1);
    const filterProgram = document.getElementById("des-filter-program").value;
    
    let html = "";
    
    // 1. Branding Header
    if (document.getElementById("des-opt-branding").checked) {
        html += `
            <div class="header-branding" style="display: flex; justify-content: space-between; border-bottom: 2px double #cbd5e0; padding-bottom: 12px; margin-bottom: 25px;">
                <div>
                    <h1 style="margin: 0; font-size: 16px; font-weight: 800; color: #2b6cb0; font-family: 'Outfit', sans-serif;">
                        ${appState.schoolName.toUpperCase()}
                    </h1>
                    <p style="margin: 2px 0 0 0; font-size: 9px; color: #718096; text-transform: uppercase; font-weight: 600;">
                        CBSE Manpower & Financial Forecasting System
                    </p>
                </div>
                <div style="text-align: right; font-size: 9px; color: #4a5568; line-height: 1.3;">
                    <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}<br>
                    <strong>Generated By:</strong> Velammal ERP System<br>
                    <strong>Scope:</strong> Year ${filterProjVal === "all" ? "1-5 Projections" : filterProjVal}
                </div>
            </div>
        `;
    }
    
    // 2. Executive Summary Block
    if (document.getElementById("des-opt-exec-summary").checked) {
        const stds = calcResults.totalStudents[yIdx] || 0;
        const secs = calcResults.totalSections[yIdx] || 0;
        
        let cbseTeach = 0;
        const coreDepts = [
            "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS",
            "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology"
        ];
        const cbseTeachKeys = [
            "KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant", ...coreDepts,
            "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary", "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library"
        ];
        cbseTeachKeys.forEach(k => { cbseTeach += calcResults.staffCounts[k] ? calcResults.staffCounts[k][yIdx] : 0; });
        
        let splTeach = 0;
        const specKeys = ["Foundation Faculty", "IIT Mathematics", "IIT Physics", "IIT Chemistry", "IIT Biology", "NEET Physics", "NEET Chemistry", "NEET Biology", "NEET Botany", "NEET Zoology"];
        specKeys.forEach(k => { splTeach += calcResults.staffCounts[k] ? calcResults.staffCounts[k][yIdx] : 0; });
        
        let supportCount = 0;
        Object.keys(appState.nonTeachingStaffGrowth).forEach(k => { supportCount += calcResults.staffCounts[k] ? calcResults.staffCounts[k][yIdx] : 0; });
        supportCount += (calcResults.staffCounts["Driver"] ? calcResults.staffCounts["Driver"][yIdx] : 0) + (calcResults.staffCounts["Conductor"] ? calcResults.staffCounts["Conductor"][yIdx] : 0);
        
        let ecaCount = 0;
        Object.keys(appState.partTimeECAReqs).forEach(k => { ecaCount += calcResults.staffCounts[k] ? calcResults.staffCounts[k][yIdx] : 0; });
        
        const annSal = calcResults.grandTotalSalaries[yIdx] || 0;
        
        let minAdditional = 999;
        const testDepts = ["English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS"];
        testDepts.forEach(dept => {
            const staff = calcResults.staffCounts[dept] ? calcResults.staffCounts[dept][yIdx] : 0;
            const allocated = calcResults.cbseWorkloads[dept] ? calcResults.cbseWorkloads[dept][yIdx] : 0;
            const cap = appState.capacities.primary;
            const unused = (staff * cap) - allocated;
            const periodPerSec = appState.periodAllocations[dept].primary || 6;
            const addPossible = periodPerSec > 0 ? Math.floor(unused / periodPerSec) : 999;
            if (addPossible < minAdditional) minAdditional = addPossible;
        });
        if (minAdditional === 999 || minAdditional < 0) minAdditional = 0;
        const addStds = minAdditional * (parseInt(appState.maxStudentsPerSection) || 40);
        
        html += `
            <div style="background-color: #edf2f7; border: 1px solid #cbd5e0; border-radius: 6px; padding: 12px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 8px 0; color: #1e3a8a; border-bottom: 1px solid #cbd5e0; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                    Executive Briefing (Selected Projection Year: Year ${yIdx + 1})
                </h3>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 10px 0;">
                    <div style="text-align: center; border-right: 1px solid #cbd5e0;">
                        <span style="font-size: 8px; color: #718096; text-transform: uppercase;">Total Enrollment</span><br>
                        <strong style="font-size: 12px; color: #2d3748;">${stds}</strong> <span style="font-size: 9px; color: #a0aec0;">Students</span>
                    </div>
                    <div style="text-align: center; border-right: 1px solid #cbd5e0;">
                        <span style="font-size: 8px; color: #718096; text-transform: uppercase;">Total Sections</span><br>
                        <strong style="font-size: 12px; color: #2d3748;">${secs}</strong> <span style="font-size: 9px; color: #a0aec0;">Sections</span>
                    </div>
                    <div style="text-align: center; border-right: 1px solid #cbd5e0;">
                        <span style="font-size: 8px; color: #718096; text-transform: uppercase;">Staff (CBSE+Spl)</span><br>
                        <strong style="font-size: 12px; color: #2d3748;">${cbseTeach + splTeach}</strong> <span style="font-size: 9px; color: #a0aec0;">FTE</span>
                    </div>
                    <div style="text-align: center;">
                        <span style="font-size: 8px; color: #718096; text-transform: uppercase;">Annual Payroll</span><br>
                        <strong style="font-size: 12px; color: #38a169;">₹${(annSal / 100000).toFixed(1)} L</strong>
                    </div>
                </div>
                <div style="font-size: 10px; color: #4a5568; line-height: 1.4; margin-top: 8px;">
                    <strong>Expansion Capacity Room:</strong> The school is operating at optimal teacher capacity. It can accommodate an additional <strong>${addStds} students (${minAdditional} sections)</strong> with zero additional CBSE teacher recruitment cost.
                </div>
            </div>
        `;
    }
    
    // 3. Render Custom Chosen Sections in order
    selectedDesignerSections.forEach(sect => {
        html += `<div style="margin-bottom: 25px; page-break-inside: avoid;">`;
        const title = getSectionFriendlyName(sect);
        html += `<h2>${title}</h2>`;
        
        switch (sect) {
            case "school-profile":
                html += `
                    <table class="data-table">
                        <tr>
                            <td style="font-weight:bold; width: 40%;">School Name</td>
                            <td>${appState.schoolName}</td>
                        </tr>
                        <tr>
                            <td style="font-weight:bold;">Academic Year Location</td>
                            <td>${appState.schoolLocation || "Default Location"}</td>
                        </tr>
                        <tr>
                            <td style="font-weight:bold;">Salary Grading Schedule</td>
                            <td>${appState.salaryTier.toUpperCase()} Schedule</td>
                        </tr>
                        <tr>
                            <td style="font-weight:bold;">Annual Salary Compound Increment</td>
                            <td>${appState.annualIncrementPct}% annually</td>
                        </tr>
                    </table>
                `;
                break;
                
            case "academic-year":
                html += `
                    <p>Cohort progression is dynamically managed: Entry level grades (Pre-KG/LKG) scale at growth rate, with older classes sliding up a grade each year.</p>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Operational Schedule</th>
                                <th>Year 1</th>
                                <th>Year 2</th>
                                <th>Year 3</th>
                                <th>Year 4</th>
                                <th>Year 5</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Secondary / High School (Gr 9 & 11)</td>
                                <td style="color:#e53e3e; font-weight: bold;">Closed</td>
                                <td style="color:#38a169; font-weight: bold;">Open</td>
                                <td style="color:#38a169; font-weight: bold;">Open</td>
                                <td style="color:#38a169; font-weight: bold;">Open</td>
                                <td style="color:#38a169; font-weight: bold;">Open</td>
                            </tr>
                            <tr>
                                <td>Higher Secondary (Gr 10 & 12)</td>
                                <td style="color:#e53e3e; font-weight: bold;">Closed</td>
                                <td style="color:#e53e3e; font-weight: bold;">Closed</td>
                                <td style="color:#38a169; font-weight: bold;">Open</td>
                                <td style="color:#38a169; font-weight: bold;">Open</td>
                                <td style="color:#38a169; font-weight: bold;">Open</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                break;
                
            case "growth-assumptions":
                html += `
                    <table class="data-table">
                        <tr>
                            <th>Assumption Variable</th>
                            <th>Value / Setting</th>
                        </tr>
                        <tr>
                            <td>Maximum Standard Students Limit per Section</td>
                            <td>${appState.maxStudentsPerSection} Students</td>
                        </tr>
                        <tr>
                            <td>Active Science Stage Model</td>
                            <td>Option ${appState.scienceModel} (Composite vs Split Specialties)</td>
                        </tr>
                        <tr>
                            <td>IIT/NEET Program Faculty Pools</td>
                            <td>${appState.sharingMode === "shared" ? "Shared CBSE Faculty Workload Model" : "Dedicated Independent Program Pool"}</td>
                        </tr>
                    </table>
                `;
                break;
                
            case "school-config":
                html += `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Stage Grade Band</th>
                                <th>Teacher Max Weekly Capacity (Periods)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Primary & Middle (Grades 1-8)</td>
                                <td>${appState.capacities.primary} periods / week</td>
                            </tr>
                            <tr>
                                <td>High & Higher Secondary (Grades 9-12)</td>
                                <td>${appState.capacities.highHS} periods / week</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                break;
                
            case "student-strength":
                {
                    html += `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Summary Matriculation</th>
                                    <th style="text-align:right;">Year 1</th>
                                    <th style="text-align:right;">Year 2</th>
                                    <th style="text-align:right;">Year 3</th>
                                    <th style="text-align:right;">Year 4</th>
                                    <th style="text-align:right;">Year 5</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Total Student Enrollment</td>
                                    <td style="text-align:right; font-weight:bold;">${calcResults.totalStudents[0]}</td>
                                    <td style="text-align:right; font-weight:bold;">${calcResults.totalStudents[1]}</td>
                                    <td style="text-align:right; font-weight:bold;">${calcResults.totalStudents[2]}</td>
                                    <td style="text-align:right; font-weight:bold;">${calcResults.totalStudents[3]}</td>
                                    <td style="text-align:right; font-weight:bold;">${calcResults.totalStudents[4]}</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                }
                break;
                
            case "grade-student-strength":
                {
                    html += `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Grade Level</th>
                                    <th style="text-align:center;">Year 1 Strength</th>
                                    <th style="text-align:center;">Year 2 Strength</th>
                                    <th style="text-align:center;">Year 3 Strength</th>
                                    <th style="text-align:center;">Year 4 Strength</th>
                                    <th style="text-align:center;">Year 5 Strength</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    DEFAULT_GRADES.forEach(g => {
                        html += `
                            <tr>
                                <td>${g}</td>
                                <td style="text-align:center;">${appState.studentStrength[g][0]}</td>
                                <td style="text-align:center;">${appState.studentStrength[g][1]}</td>
                                <td style="text-align:center;">${appState.studentStrength[g][2]}</td>
                                <td style="text-align:center;">${appState.studentStrength[g][3]}</td>
                                <td style="text-align:center;">${appState.studentStrength[g][4]}</td>
                            </tr>
                        `;
                    });
                    html += `</tbody></table>`;
                }
                break;
                
            case "section-strength":
                {
                    html += `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Grade Level</th>
                                    <th style="text-align:center;">Year 1 Sections</th>
                                    <th style="text-align:center;">Year 2 Sections</th>
                                    <th style="text-align:center;">Year 3 Sections</th>
                                    <th style="text-align:center;">Year 4 Sections</th>
                                    <th style="text-align:center;">Year 5 Sections</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    DEFAULT_GRADES.forEach(g => {
                        html += `
                            <tr>
                                <td>${g}</td>
                                <td style="text-align:center;">${calcResults.sections[g][0]}</td>
                                <td style="text-align:center;">${calcResults.sections[g][1]}</td>
                                <td style="text-align:center;">${calcResults.sections[g][2]}</td>
                                <td style="text-align:center;">${calcResults.sections[g][3]}</td>
                                <td style="text-align:center;">${calcResults.sections[g][4]}</td>
                            </tr>
                        `;
                    });
                    html += `</tbody></table>`;
                }
                break;
                
            case "five-year-student-proj":
                html += `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Projection Metric</th>
                                <th>Year 1</th>
                                <th>Year 2</th>
                                <th>Year 3</th>
                                <th>Year 4</th>
                                <th>Year 5</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Enrollment strength</td>
                                <td>${calcResults.totalStudents[0]}</td>
                                <td>${calcResults.totalStudents[1]}</td>
                                <td>${calcResults.totalStudents[2]}</td>
                                <td>${calcResults.totalStudents[3]}</td>
                                <td>${calcResults.totalStudents[4]}</td>
                            </tr>
                            <tr>
                                <td>Total Sections</td>
                                <td>${calcResults.totalSections[0]}</td>
                                <td>${calcResults.totalSections[1]}</td>
                                <td>${calcResults.totalSections[2]}</td>
                                <td>${calcResults.totalSections[3]}</td>
                                <td>${calcResults.totalSections[4]}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                break;
                
            case "grade-sections":
                html += `
                    <p>Calculated section sizes and limits grade-by-grade based on section ceilings.</p>
                `;
                break;
                
            case "total-sections":
                html += `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Year 1</th>
                                <th>Year 2</th>
                                <th>Year 3</th>
                                <th>Year 4</th>
                                <th>Year 5</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Sections count</td>
                                <td>${calcResults.totalSections[0]}</td>
                                <td>${calcResults.totalSections[1]}</td>
                                <td>${calcResults.totalSections[2]}</td>
                                <td>${calcResults.totalSections[3]}</td>
                                <td>${calcResults.totalSections[4]}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                break;
                
            case "teach-summary":
                {
                    html += `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Role / Department</th>
                                    <th style="text-align:center;">Year 1</th>
                                    <th style="text-align:center;">Year 2</th>
                                    <th style="text-align:center;">Year 3</th>
                                    <th style="text-align:center;">Year 4</th>
                                    <th style="text-align:center;">Year 5</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    const coreD = ["English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS"];
                    const listDepts = ["Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary", ...coreD, "PET", "Library"];
                    listDepts.forEach(d => {
                        if (calcResults.staffCounts[d]) {
                            html += `
                                <tr>
                                    <td>${d}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[d][0]}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[d][1]}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[d][2]}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[d][3]}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[d][4]}</td>
                                </tr>
                            `;
                        }
                    });
                    html += `</tbody></table>`;
                }
                break;
                
            case "homeroom-teachers":
                html += `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Homeroom Role</th>
                                <th>Year 1</th>
                                <th>Year 2</th>
                                <th>Year 3</th>
                                <th>Year 4</th>
                                <th>Year 5</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>KG Homeroom (PKG/LKG/UKG)</td>
                                <td>${calcResults.staffCounts["KG Homeroom"][0]}</td>
                                <td>${calcResults.staffCounts["KG Homeroom"][1]}</td>
                                <td>${calcResults.staffCounts["KG Homeroom"][2]}</td>
                                <td>${calcResults.staffCounts["KG Homeroom"][3]}</td>
                                <td>${calcResults.staffCounts["KG Homeroom"][4]}</td>
                            </tr>
                            <tr>
                                <td>Gr 1-2 Homeroom</td>
                                <td>${calcResults.staffCounts["Gr 1-2 Homeroom"][0]}</td>
                                <td>${calcResults.staffCounts["Gr 1-2 Homeroom"][1]}</td>
                                <td>${calcResults.staffCounts["Gr 1-2 Homeroom"][2]}</td>
                                <td>${calcResults.staffCounts["Gr 1-2 Homeroom"][3]}</td>
                                <td>${calcResults.staffCounts["Gr 1-2 Homeroom"][4]}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                break;
                
            case "math-dept":
                html += `
                    <table class="data-table">
                        <tr>
                            <th>Mathematics Workload (Selected Year)</th>
                            <th>Periods</th>
                        </tr>
                        <tr>
                            <td>CBSE Math workload periods</td>
                            <td>${calcResults.cbseWorkloads["Mathematics"] ? calcResults.cbseWorkloads["Mathematics"][yIdx] : 0} periods / week</td>
                        </tr>
                        <tr>
                            <td>Specialist Teachers Hired count</td>
                            <td>${calcResults.staffCounts["Mathematics"] ? calcResults.staffCounts["Mathematics"][yIdx] : 0} Teachers</td>
                        </tr>
                    </table>
                `;
                break;
                
            case "science-dept":
                html += `
                    <table class="data-table">
                        <tr>
                            <th>Science Department Metrics (Selected Year)</th>
                            <th>Values</th>
                        </tr>
                        <tr>
                            <td>Composite / Biology / Physics Teacher counts</td>
                            <td>Active Model ${appState.scienceModel}</td>
                        </tr>
                    </table>
                `;
                break;
                
            case "english-dept":
                html += `
                    <table class="data-table">
                        <tr>
                            <th>English Department (Selected Year)</th>
                            <th>Values</th>
                        </tr>
                        <tr>
                            <td>English workload periods</td>
                            <td>${calcResults.cbseWorkloads["English"] ? calcResults.cbseWorkloads["English"][yIdx] : 0} periods / week</td>
                        </tr>
                        <tr>
                            <td>Hired staff count</td>
                            <td>${calcResults.staffCounts["English"] ? calcResults.staffCounts["English"][yIdx] : 0} Teachers</td>
                        </tr>
                    </table>
                `;
                break;
                
            case "foundation-program":
                html += `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Role</th>
                                <th>Year 1</th>
                                <th>Year 2</th>
                                <th>Year 3</th>
                                <th>Year 4</th>
                                <th>Year 5</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Foundation Faculty</td>
                                <td>${calcResults.staffCounts["Foundation Faculty"][0]}</td>
                                <td>${calcResults.staffCounts["Foundation Faculty"][1]}</td>
                                <td>${calcResults.staffCounts["Foundation Faculty"][2]}</td>
                                <td>${calcResults.staffCounts["Foundation Faculty"][3]}</td>
                                <td>${calcResults.staffCounts["Foundation Faculty"][4]}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                break;
                
            case "iit-program":
                {
                    html += `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>IIT Role</th>
                                    <th>Year 1</th>
                                    <th>Year 2</th>
                                    <th>Year 3</th>
                                    <th>Year 4</th>
                                    <th>Year 5</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    const iitList = ["IIT Mathematics", "IIT Physics", "IIT Chemistry"];
                    if (appState.iitBiologyProgram === "enabled") iitList.push("IIT Biology");
                    
                    iitList.forEach(k => {
                        html += `
                            <tr>
                                <td>${k}</td>
                                <td>${calcResults.staffCounts[k] ? calcResults.staffCounts[k][0] : 0}</td>
                                <td>${calcResults.staffCounts[k] ? calcResults.staffCounts[k][1] : 0}</td>
                                <td>${calcResults.staffCounts[k] ? calcResults.staffCounts[k][2] : 0}</td>
                                <td>${calcResults.staffCounts[k] ? calcResults.staffCounts[k][3] : 0}</td>
                                <td>${calcResults.staffCounts[k] ? calcResults.staffCounts[k][4] : 0}</td>
                            </tr>
                        `;
                    });
                    html += `</tbody></table>`;
                }
                break;
                
            case "neet-program":
                {
                    html += `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>NEET Role</th>
                                    <th>Year 1</th>
                                    <th>Year 2</th>
                                    <th>Year 3</th>
                                    <th>Year 4</th>
                                    <th>Year 5</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    const neetList = ["NEET Physics", "NEET Chemistry"];
                    if (appState.neetBiologyStructure === "combined") neetList.push("NEET Biology");
                    else neetList.push("NEET Botany", "NEET Zoology");
                    
                    neetList.forEach(k => {
                        html += `
                            <tr>
                                <td>${k}</td>
                                <td>${calcResults.staffCounts[k] ? calcResults.staffCounts[k][0] : 0}</td>
                                <td>${calcResults.staffCounts[k] ? calcResults.staffCounts[k][1] : 0}</td>
                                <td>${calcResults.staffCounts[k] ? calcResults.staffCounts[k][2] : 0}</td>
                                <td>${calcResults.staffCounts[k] ? calcResults.staffCounts[k][3] : 0}</td>
                                <td>${calcResults.staffCounts[k] ? calcResults.staffCounts[k][4] : 0}</td>
                            </tr>
                        `;
                    });
                    html += `</tbody></table>`;
                }
                break;
                
            case "teacher-salary-details":
                {
                    html += `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Teacher Designation</th>
                                    <th style="text-align:right; width:90px;">No. of Staff</th>
                                    <th style="text-align:right; width:110px;">Salary per Staff</th>
                                    <th style="text-align:center; width:130px;">Calculation</th>
                                    <th style="text-align:right; width:110px;">Monthly Total</th>
                                    <th style="text-align:right; width:120px;">Annual Total</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    const teachList = [
                        "Principal", "Vice Principal", "ACO – Primary & Middle", "ACO – High & Higher Secondary",
                        "KG Homeroom", "Gr 1-2 Homeroom", "ECP Assistant",
                        "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS"
                    ];
                    if (appState.scienceModel === "A") {
                        teachList.push("Science Phy/Che (Middle)", "Science Bio/Phy (Middle)");
                    }
                    teachList.push("Physics", "Chemistry", "Biology", "PET", "PET HOD", "Arts & Crafts", "Handwriting", "Library");
                    teachList.push("Foundation Faculty", "IIT Mathematics", "IIT Physics", "IIT Chemistry");
                    if (appState.iitBiologyProgram === "enabled") teachList.push("IIT Biology");
                    teachList.push("NEET Physics", "NEET Chemistry");
                    if (appState.neetBiologyStructure === "combined") teachList.push("NEET Biology");
                    else teachList.push("NEET Botany", "NEET Zoology");

                    let tCount = 0;
                    let tMonthly = 0;
                    let tAnnual = 0;

                    teachList.forEach(role => {
                        let count = calcResults.staffCounts[role] ? calcResults.staffCounts[role][yIdx] : 0;
                        if (appState.sharingMode === "shared") {
                            const coreDepts = [
                                "English", "Tamil", "Hindi", "Mathematics", "Social Science", "Computer / AI", "Science / EVS",
                                "Science Phy/Che (Middle)", "Science Bio/Phy (Middle)", "Physics", "Chemistry", "Biology"
                            ];
                            if (coreDepts.includes(role)) {
                                if (role === "Mathematics") {
                                    count -= (calcResults.staffCounts["IIT Mathematics"][yIdx] || 0);
                                } else if (role === "Physics") {
                                    count -= (calcResults.staffCounts["IIT Physics"][yIdx] || 0) + (calcResults.staffCounts["NEET Physics"][yIdx] || 0);
                                } else if (role === "Chemistry") {
                                    count -= (calcResults.staffCounts["IIT Chemistry"][yIdx] || 0) + (calcResults.staffCounts["NEET Chemistry"][yIdx] || 0);
                                } else if (role === "Biology") {
                                    count -= (calcResults.staffCounts["IIT Biology"][yIdx] || 0) + 
                                             (calcResults.staffCounts["NEET Biology"][yIdx] || 0) + 
                                             (calcResults.staffCounts["NEET Botany"][yIdx] || 0) + 
                                             (calcResults.staffCounts["NEET Zoology"][yIdx] || 0);
                                }
                                count = Math.max(0, count);
                            }
                        }
                        let roleSalKey = role;
                        if (role === "Library") roleSalKey = "Librarian";
                        const monSal = calcResults.monthlySalaries[roleSalKey] ? calcResults.monthlySalaries[roleSalKey][yIdx] : 20000;
                        const monthlyTotal = count * monSal;
                        const annualTotal = monthlyTotal * 12;

                        tCount += count;
                        tMonthly += monthlyTotal;
                        tAnnual += annualTotal;

                        const formattedCount = count % 1 === 0 ? count : count.toFixed(2);
                        const formattedSal = Math.round(monSal).toLocaleString('en-IN');
                        const formula = `₹${formattedSal} × ${formattedCount}`;

                        html += `
                            <tr>
                                <td>${role}</td>
                                <td style="text-align:right;">${formattedCount}</td>
                                <td style="text-align:right;">₹${formattedSal}</td>
                                <td style="text-align:center; font-family:monospace; font-size:11px;">${formula}</td>
                                <td style="text-align:right;">₹${Math.round(monthlyTotal).toLocaleString('en-IN')}</td>
                                <td style="text-align:right;">₹${Math.round(annualTotal).toLocaleString('en-IN')}</td>
                            </tr>
                        `;
                    });

                    html += `
                            <tr style="font-weight:bold; background-color:#f7fafc;">
                                <td>TOTALS</td>
                                <td style="text-align:right;">${tCount % 1 === 0 ? tCount : tCount.toFixed(2)}</td>
                                <td style="text-align:right;">-</td>
                                <td style="text-align:center;">-</td>
                                <td style="text-align:right;">₹${Math.round(tMonthly).toLocaleString('en-IN')}</td>
                                <td style="text-align:right;">₹${Math.round(tAnnual).toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 10px; margin-bottom: 20px; padding: 10px; background: rgba(99,102,241,0.04); border-left: 3px solid var(--accent-primary); border-radius: 4px; font-size: 11px;">
                        <div style="font-weight:bold; color:var(--accent-primary); text-transform:uppercase; margin-bottom:4px;">Teaching Staff Summary</div>
                        <div style="display:flex; gap:20px;">
                            <div>Total Teachers : <strong>${tCount % 1 === 0 ? tCount : tCount.toFixed(2)}</strong></div>
                            <div>Monthly Salary : <strong>₹${Math.round(tMonthly).toLocaleString('en-IN')}</strong></div>
                            <div>Annual Salary : <strong>₹${Math.round(tAnnual).toLocaleString('en-IN')}</strong></div>
                        </div>
                    </div>
                    `;
                }
                break;

            case "nonteaching-salary-details":
                {
                    html += `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Non-Teaching Designation</th>
                                    <th style="text-align:right; width:90px;">No. of Staff</th>
                                    <th style="text-align:right; width:110px;">Salary per Staff</th>
                                    <th style="text-align:center; width:130px;">Calculation</th>
                                    <th style="text-align:right; width:110px;">Monthly Total</th>
                                    <th style="text-align:right; width:120px;">Annual Total</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    const ntList = [
                        "Admin Officer", "Receptionist", "Sys Admin", "Counsellor", "Security HOD", "Security Guard", "Electrician", "Attender", "Housekeeping HOD", "Housekeeping Staff", "Gardener", "Driver", "Conductor"
                    ];
                    let nCount = 0;
                    let nMonthly = 0;
                    let nAnnual = 0;

                    ntList.forEach(role => {
                        let count = calcResults.staffCounts[role] ? calcResults.staffCounts[role][yIdx] : 0;
                        const monSal = calcResults.monthlySalaries[role] ? calcResults.monthlySalaries[role][yIdx] : 20000;
                        const monthlyTotal = count * monSal;
                        const annualTotal = monthlyTotal * 12;

                        nCount += count;
                        nMonthly += monthlyTotal;
                        nAnnual += annualTotal;

                        const formattedCount = count % 1 === 0 ? count : count.toFixed(2);
                        const formattedSal = Math.round(monSal).toLocaleString('en-IN');
                        const formula = `₹${formattedSal} × ${formattedCount}`;

                        html += `
                            <tr>
                                <td>${role}</td>
                                <td style="text-align:right;">${formattedCount}</td>
                                <td style="text-align:right;">₹${formattedSal}</td>
                                <td style="text-align:center; font-family:monospace; font-size:11px;">${formula}</td>
                                <td style="text-align:right;">₹${Math.round(monthlyTotal).toLocaleString('en-IN')}</td>
                                <td style="text-align:right;">₹${Math.round(annualTotal).toLocaleString('en-IN')}</td>
                            </tr>
                        `;
                    });

                    html += `
                            <tr style="font-weight:bold; background-color:#f7fafc;">
                                <td>TOTALS</td>
                                <td style="text-align:right;">${nCount % 1 === 0 ? nCount : nCount.toFixed(2)}</td>
                                <td style="text-align:right;">-</td>
                                <td style="text-align:center;">-</td>
                                <td style="text-align:right;">₹${Math.round(nMonthly).toLocaleString('en-IN')}</td>
                                <td style="text-align:right;">₹${Math.round(nAnnual).toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 10px; margin-bottom: 20px; padding: 10px; background: rgba(14,165,233,0.04); border-left: 3px solid var(--accent-secondary); border-radius: 4px; font-size: 11px;">
                        <div style="font-weight:bold; color:var(--accent-secondary); text-transform:uppercase; margin-bottom:4px;">Non-Teaching Staff Summary</div>
                        <div style="display:flex; gap:20px;">
                            <div>Total Staff : <strong>${nCount % 1 === 0 ? nCount : nCount.toFixed(2)}</strong></div>
                            <div>Monthly Salary : <strong>₹${Math.round(nMonthly).toLocaleString('en-IN')}</strong></div>
                            <div>Annual Salary : <strong>₹${Math.round(nAnnual).toLocaleString('en-IN')}</strong></div>
                        </div>
                    </div>
                    `;
                }
                break;

            case "eca-salary-details":
                {
                    html += `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Part-Time / ECA Designation</th>
                                    <th style="text-align:right; width:90px;">No. of Staff</th>
                                    <th style="text-align:right; width:110px;">Salary per Staff</th>
                                    <th style="text-align:center; width:130px;">Calculation</th>
                                    <th style="text-align:right; width:110px;">Monthly Total</th>
                                    <th style="text-align:right; width:120px;">Annual Total</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    const ecaList = [
                        "Classical Dance", "Yoga", "Karate", "Music", "Other Activities", "Sports Coach"
                    ];
                    let eCount = 0;
                    let eMonthly = 0;
                    let eAnnual = 0;

                    ecaList.forEach(role => {
                        let count = calcResults.staffCounts[role] ? calcResults.staffCounts[role][yIdx] : 0;
                        const monSal = calcResults.monthlySalaries[role] ? calcResults.monthlySalaries[role][yIdx] : 10000;
                        const monthlyTotal = count * monSal;
                        const annualTotal = monthlyTotal * 12;

                        eCount += count;
                        eMonthly += monthlyTotal;
                        eAnnual += annualTotal;

                        const formattedCount = count % 1 === 0 ? count : count.toFixed(2);
                        const formattedSal = Math.round(monSal).toLocaleString('en-IN');
                        const formula = `₹${formattedSal} × ${formattedCount}`;

                        html += `
                            <tr>
                                <td>${role}</td>
                                <td style="text-align:right;">${formattedCount}</td>
                                <td style="text-align:right;">₹${formattedSal}</td>
                                <td style="text-align:center; font-family:monospace; font-size:11px;">${formula}</td>
                                <td style="text-align:right;">₹${Math.round(monthlyTotal).toLocaleString('en-IN')}</td>
                                <td style="text-align:right;">₹${Math.round(annualTotal).toLocaleString('en-IN')}</td>
                            </tr>
                        `;
                    });

                    html += `
                            <tr style="font-weight:bold; background-color:#f7fafc;">
                                <td>TOTALS</td>
                                <td style="text-align:right;">${eCount % 1 === 0 ? eCount : eCount.toFixed(2)}</td>
                                <td style="text-align:right;">-</td>
                                <td style="text-align:center;">-</td>
                                <td style="text-align:right;">₹${Math.round(eMonthly).toLocaleString('en-IN')}</td>
                                <td style="text-align:right;">₹${Math.round(eAnnual).toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 10px; margin-bottom: 20px; padding: 10px; background: rgba(16,185,129,0.04); border-left: 3px solid var(--accent-tertiary); border-radius: 4px; font-size: 11px;">
                        <div style="font-weight:bold; color:var(--accent-tertiary); text-transform:uppercase; margin-bottom:4px;">Part-Time / ECA Staff Summary</div>
                        <div style="display:flex; gap:20px;">
                            <div>Total Staff : <strong>${eCount % 1 === 0 ? eCount : eCount.toFixed(2)}</strong></div>
                            <div>Monthly Salary : <strong>₹${Math.round(eMonthly).toLocaleString('en-IN')}</strong></div>
                            <div>Annual Salary : <strong>₹${Math.round(eAnnual).toLocaleString('en-IN')}</strong></div>
                        </div>
                    </div>
                    `;
                }
                break;
                
            case "salary-budget":
                html += `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Salary Budget category</th>
                                <th>Year 1</th>
                                <th>Year 2</th>
                                <th>Year 3</th>
                                <th>Year 4</th>
                                <th>Year 5</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>CBSE Core Teachers</td>
                                <td>₹${(calcResults.salariesByCategory.teaching[0] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.teaching[1] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.teaching[2] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.teaching[3] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.teaching[4] || 0).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                                <td>IIT/NEET Special Faculty</td>
                                <td>₹${(calcResults.salariesByCategory.special[0] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.special[1] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.special[2] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.special[3] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.special[4] || 0).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                                <td>Non-Teaching Support Staff</td>
                                <td>₹${(calcResults.salariesByCategory.nonTeaching[0] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.nonTeaching[1] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.nonTeaching[2] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.nonTeaching[3] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.nonTeaching[4] || 0).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                                <td>Part-Time / ECA Coaches</td>
                                <td>₹${(calcResults.salariesByCategory.eca[0] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.eca[1] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.eca[2] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.eca[3] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.salariesByCategory.eca[4] || 0).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr style="font-weight:bold; background-color:#edf2f7;">
                                <td>GRAND TOTAL ANNUAL COST</td>
                                <td>₹${(calcResults.grandTotalSalaries[0] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.grandTotalSalaries[1] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.grandTotalSalaries[2] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.grandTotalSalaries[3] || 0).toLocaleString('en-IN')}</td>
                                <td>₹${(calcResults.grandTotalSalaries[4] || 0).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr style="font-style:italic; font-size:10px; color:#4a5568;">
                                <td>Salary Cost per Student</td>
                                <td>₹${Math.round(calcResults.grandTotalSalaries[0] / (calcResults.totalStudents[0] || 1)).toLocaleString('en-IN')}</td>
                                <td>₹${Math.round(calcResults.grandTotalSalaries[1] / (calcResults.totalStudents[1] || 1)).toLocaleString('en-IN')}</td>
                                <td>₹${Math.round(calcResults.grandTotalSalaries[2] / (calcResults.totalStudents[2] || 1)).toLocaleString('en-IN')}</td>
                                <td>₹${Math.round(calcResults.grandTotalSalaries[3] / (calcResults.totalStudents[3] || 1)).toLocaleString('en-IN')}</td>
                                <td>₹${Math.round(calcResults.grandTotalSalaries[4] / (calcResults.totalStudents[4] || 1)).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr style="font-style:italic; font-size:10px; color:#4a5568;">
                                <td>Salary Cost per Section</td>
                                <td>₹${Math.round(calcResults.grandTotalSalaries[0] / (calcResults.totalSections[0] || 1)).toLocaleString('en-IN')}</td>
                                <td>₹${Math.round(calcResults.grandTotalSalaries[1] / (calcResults.totalSections[1] || 1)).toLocaleString('en-IN')}</td>
                                <td>₹${Math.round(calcResults.grandTotalSalaries[2] / (calcResults.totalSections[2] || 1)).toLocaleString('en-IN')}</td>
                                <td>₹${Math.round(calcResults.grandTotalSalaries[3] / (calcResults.totalSections[3] || 1)).toLocaleString('en-IN')}</td>
                                <td>₹${Math.round(calcResults.grandTotalSalaries[4] / (calcResults.totalSections[4] || 1)).toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                break;
                
            case "five-year-salaries":
                html += `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Grand Totals Projections</th>
                                <th>Year 1</th>
                                <th>Year 2</th>
                                <th>Year 3</th>
                                <th>Year 4</th>
                                <th>Year 5</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Annual Salary Outflow</td>
                                <td style="font-weight:bold;color:#2b6cb0;">₹${(calcResults.grandTotalSalaries[0] || 0).toLocaleString('en-IN')}</td>
                                <td style="font-weight:bold;color:#2b6cb0;">₹${(calcResults.grandTotalSalaries[1] || 0).toLocaleString('en-IN')}</td>
                                <td style="font-weight:bold;color:#2b6cb0;">₹${(calcResults.grandTotalSalaries[2] || 0).toLocaleString('en-IN')}</td>
                                <td style="font-weight:bold;color:#2b6cb0;">₹${(calcResults.grandTotalSalaries[3] || 0).toLocaleString('en-IN')}</td>
                                <td style="font-weight:bold;color:#2b6cb0;">₹${(calcResults.grandTotalSalaries[4] || 0).toLocaleString('en-IN')}</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                break;
                
            case "staff-utilization":
                {
                    html += `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th style="text-align:center;">Year 1 Load</th>
                                    <th style="text-align:center;">Year 2 Load</th>
                                    <th style="text-align:center;">Year 3 Load</th>
                                    <th style="text-align:center;">Year 4 Load</th>
                                    <th style="text-align:center;">Year 5 Load</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    Object.keys(calcResults.utilizations).forEach(dept => {
                        html += `
                            <tr>
                                <td>${dept}</td>
                                <td style="text-align:center;">${calcResults.utilizations[dept][0]}%</td>
                                <td style="text-align:center;">${calcResults.utilizations[dept][1]}%</td>
                                <td style="text-align:center;">${calcResults.utilizations[dept][2]}%</td>
                                <td style="text-align:center;">${calcResults.utilizations[dept][3]}%</td>
                                <td style="text-align:center;">${calcResults.utilizations[dept][4]}%</td>
                            </tr>
                        `;
                    });
                    html += `</tbody></table>`;
                }
                break;
                
            case "non-teaching-summary":
                {
                    html += `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Non-Teaching Staff Role</th>
                                    <th style="text-align:center;">Year 1</th>
                                    <th style="text-align:center;">Year 2</th>
                                    <th style="text-align:center;">Year 3</th>
                                    <th style="text-align:center;">Year 4</th>
                                    <th style="text-align:center;">Year 5</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    const ntRoles = ["Admin Officer", "Receptionist", "Sys Admin", "Counsellor", "Security HOD", "Security Guard", "Electrician", "Attender", "Housekeeping HOD", "Housekeeping Staff", "Gardener"];
                    ntRoles.forEach(r => {
                        if (calcResults.staffCounts[r]) {
                            html += `
                                <tr>
                                    <td>${r}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[r][0]}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[r][1]}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[r][2]}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[r][3]}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[r][4]}</td>
                                </tr>
                            `;
                        }
                    });
                    html += `</tbody></table>`;
                }
                break;
                
            case "eca-summary":
                {
                    html += `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Part-Time ECA Coach Role</th>
                                    <th style="text-align:center;">Year 1</th>
                                    <th style="text-align:center;">Year 2</th>
                                    <th style="text-align:center;">Year 3</th>
                                    <th style="text-align:center;">Year 4</th>
                                    <th style="text-align:center;">Year 5</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    Object.keys(appState.partTimeECAReqs).forEach(r => {
                        if (calcResults.staffCounts[r]) {
                            html += `
                                <tr>
                                    <td>${r}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[r][0]}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[r][1]}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[r][2]}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[r][3]}</td>
                                    <td style="text-align:center;">${calcResults.staffCounts[r][4]}</td>
                                </tr>
                            `;
                        }
                    });
                    html += `</tbody></table>`;
                }
                break;
                
            case "grade-expansion-analysis":
                {
                    html += `
                        <p style="font-size:11px; margin-bottom: 8px;">Grade-wise analysis of section expansion potential under current core teacher headcount, evaluated for Year ${yIdx + 1}.</p>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Grade Level</th>
                                    <th style="text-align:center;">Current Sections</th>
                                    <th style="text-align:center;">Max Sections Supported</th>
                                    <th style="text-align:center;">Additional Sections Possible</th>
                                    <th>Limiting Subject / Department</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    DEFAULT_GRADES.forEach(grade => {
                        const d = calculateGradeCapacityDetails(grade, yIdx);
                        html += `
                            <tr>
                                <td>${d.grade}</td>
                                <td style="text-align:center;">${d.currentSections}</td>
                                <td style="text-align:center;">${d.maxSections}</td>
                                <td style="text-align:center; font-weight:bold; color:${d.additionalSections > 0 ? '#3182ce' : '#718096'};">${d.additionalSections > 0 ? '+' + d.additionalSections : '0'}</td>
                                <td>${d.limitingDept}</td>
                            </tr>
                        `;
                    });
                    
                    html += `</tbody></table>`;
                }
                break;
 
            case "ai-recs":
                {
                    html += `<ul style="font-size:10px; color:#4a5568; line-height: 1.5; padding-left: 15px; margin: 5px 0;">`;
                    const items = document.querySelectorAll("#ai-recommendations-list li");
                    if (items.length > 0) {
                        items.forEach(li => {
                            html += `<li style="margin-bottom: 4px;">${li.textContent}</li>`;
                        });
                    } else {
                        html += `<li>All departments operating within standard utilization parameters. No extreme bottlenecks flagged.</li>`;
                    }
                    html += `</ul>`;
                }
                break;
        }
        
        html += `</div>`;
    });
    
    // 3.5. Grand Summary Table (If salary detailed reports are selected)
    const hasSalaries = selectedDesignerSections.some(s => s === "teacher-salary-details" || s === "nonteaching-salary-details" || s === "eca-salary-details");
    if (hasSalaries) {
        const tTotals = getTeachingStaffTotalsForYear(yIdx);
        const nTotals = getNonTeachingStaffTotalsForYear(yIdx);
        const eTotals = getECAStaffTotalsForYear(yIdx);
        
        const totalEmployees = tTotals.count + nTotals.count + eTotals.count;
        const totalMonthly = tTotals.monthly + nTotals.monthly + eTotals.monthly;
        const totalAnnual = tTotals.annual + nTotals.annual + eTotals.annual;
        
        html += `
            <div class="designer-report-section" style="margin-bottom: 25px; page-break-inside: avoid;">
                <h3 class="section-title" style="font-size: 14px; color: var(--accent-secondary); border-bottom: 2px solid var(--border-focus); padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase;">
                    <i class="fa-solid fa-calculator" style="margin-right: 6px;"></i> Grand Manpower & Salary Summary
                </h3>
                <table class="data-table" style="font-size: 11px; margin-bottom: 15px;">
                    <thead>
                        <tr style="background-color: #edf2f7; color: #2d3748;">
                            <th>Staff Category</th>
                            <th style="text-align: right;">Staff Count</th>
                            <th style="text-align: right;">Monthly Salary Outlay</th>
                            <th style="text-align: right;">Annual Salary Outlay</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Teaching Staff</strong> (Core & Special)</td>
                            <td style="text-align: right;">${tTotals.count % 1 === 0 ? tTotals.count : tTotals.count.toFixed(2)}</td>
                            <td style="text-align: right;">₹${Math.round(tTotals.monthly).toLocaleString('en-IN')}</td>
                            <td style="text-align: right;">₹${Math.round(tTotals.annual).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td><strong>Non-Teaching Staff</strong> (Operations & Transport)</td>
                            <td style="text-align: right;">${nTotals.count % 1 === 0 ? nTotals.count : nTotals.count.toFixed(2)}</td>
                            <td style="text-align: right;">₹${Math.round(nTotals.monthly).toLocaleString('en-IN')}</td>
                            <td style="text-align: right;">₹${Math.round(nTotals.annual).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <td><strong>Part-Time / ECA Staff</strong> (Coaches & Activities)</td>
                            <td style="text-align: right;">${eTotals.count % 1 === 0 ? eTotals.count : eTotals.count.toFixed(2)}</td>
                            <td style="text-align: right;">₹${Math.round(eTotals.monthly).toLocaleString('en-IN')}</td>
                            <td style="text-align: right;">₹${Math.round(eTotals.annual).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr style="font-weight: bold; background-color: #e2e8f0; color: #1a202c; border-top: 2px solid #cbd5e0;">
                            <td>GRAND TOTAL</td>
                            <td style="text-align: right;">${totalEmployees % 1 === 0 ? totalEmployees : totalEmployees.toFixed(2)}</td>
                            <td style="text-align: right; color: var(--accent-primary);">₹${Math.round(totalMonthly).toLocaleString('en-IN')}</td>
                            <td style="text-align: right; color: var(--accent-secondary);">₹${Math.round(totalAnnual).toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // 4. Branding Footer
    if (document.getElementById("des-opt-branding").checked) {
        html += `
            <div class="footer-branding" style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e0; padding-top: 10px; margin-top: 30px; font-size: 8px; color: #718096;">
                <div>
                    CONFIDENTIAL - MANAGEMENT REPORT FOR INTERNAL TRUSTEE AUDIT ONLY
                </div>
                <div>
                    Velammal DSS
                </div>
            </div>
        `;
    }
    
    previewContainer.innerHTML = html;
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
    loadStateFromLocalStorage();
    
    // Toggle layout visibility depending on setup status
    const shell = document.getElementById("app-shell");
    const wiz = document.getElementById("setup-wizard-container");
    if (appState.wizardCompleted) {
        shell.style.display = "flex";
        wiz.style.display = "none";
    } else {
        shell.style.display = "none";
        wiz.style.display = "flex";
        populateWizardIntakeTable();
    }
    
    runManpowerCalculations();
    initAppRouting();
    bindInputEvents();
    
    // Populating UI panes
    populateStudentStrengthTable();
    updateDashboardMetrics();
    compileAIRecommendations();
    
    // Initial Render of charts
    setTimeout(renderDashboardCharts, 100);
});
