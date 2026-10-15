// Application logic for Under 40 Report Dashboard

// Application Version & Update Configuration
const APP_VERSION = '1.2';
const UPDATE_CONFIG = {
    versionUrl: 'https://raw.githubusercontent.com/anoopjoy1988/Under40Report/main/version.json',
    releasesUrl: 'https://github.com/anoopjoy1988/Under40Report/releases/latest',
    checkTimeoutMs: 4000
};

// Application State
let appState = {
    hoursData: null,    // Raw parsed first report
    leavesData: null,   // Raw parsed second report
    hoursFileName: '',
    leavesFileName: '',
    results: [],        // Processed candidates who are still under 40 hours
    deletedCandidates: [], // Candidates removed as part-timers
    selectedCandidates: new Set(), // Current checkbox selections
    config: {
        thresholdHours: 40,
        defaultLeaveHours: 8,
        defaultPublicHolidayHours: 0,
        ignoredNames: ["TEST Peter", "PENDING SHIFT"]
    },
    sortColumn: 'candidateName',
    sortAscending: true,
    searchQuery: '',
    activeTab: 'final',  // 'final', 'summary', 'all', 'report1', 'report2', 'grand_summary'
    summaryCandidates: [], // Strictly populated ONLY from Grand Summary
    rawSortIndex: -1,
    rawSortAscending: true,
    pdfConfig: {
        reportTitle: 'Weekly Under 40 Hours & Compliance Audit Report',
        periodLabel: '',
        scope: 'under40', // 'under40' or 'all'
        includeKpi: true,
        includeLeaves: true,
        includeComments: true,
        includeSignoff: true,
        orientation: 'landscape'
    },
    grandSummary: {
        weeks: [],
        mergedCandidates: []
    }
};

// DOM Elements
const dropZone1 = document.getElementById('drop-zone-1');
const dropZone2 = document.getElementById('drop-zone-2');
const fileInput1 = document.getElementById('file-1');
const fileInput2 = document.getElementById('file-2');
const resultsTableHead = document.getElementById('results-table-head');
const resultsTableBody = document.getElementById('results-table-body');
const searchInput = document.getElementById('search-input');
const exportCsvBtn = document.getElementById('export-csv-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');
const csvPreviewModal = document.getElementById('csv-preview-modal');
const csvPreviewCloseBtn = document.getElementById('csv-preview-close-btn');
const selectionActions = document.getElementById('selection-actions');
const restorePartTimersBtn = document.getElementById('restore-part-timers-btn');

// Application Desktop Menu DOM Elements
const fileMenuBtn = document.getElementById('file-menu-btn');
const fileDropdownMenu = document.getElementById('file-dropdown-menu');
const menuUploadReport1Btn = document.getElementById('menu-upload-report1-btn');
const menuUploadReport2Btn = document.getElementById('menu-upload-report2-btn');

// Grand Summary DOM Elements
const tabGrandSummary = document.getElementById('tab-grand-summary');
const standardTableWrapper = document.getElementById('standard-table-wrapper');
const grandSummaryView = document.getElementById('grand-summary-view');
const grandSummaryDropZone = document.getElementById('grand-summary-drop-zone');
const grandSummaryFileInput = document.getElementById('grand-summary-file-input');
const grandSummaryBrowseBtn = document.getElementById('grand-summary-browse-btn');
const grandSummaryActionsBar = document.getElementById('grand-summary-actions-bar');
const grandWeeksBadges = document.getElementById('grand-weeks-badges');
const grandSendToSummaryBtn = document.getElementById('grand-send-to-summary-btn');
const grandExportCsvBtn = document.getElementById('grand-export-csv-btn');
const grandExportPdfBtn = document.getElementById('grand-export-pdf-btn');
const grandResetBtn = document.getElementById('grand-reset-btn');
const grandTableWrapper = document.getElementById('grand-table-wrapper');
const grandTableHead = document.getElementById('grand-table-head');
const grandTableBody = document.getElementById('grand-table-body');
const grandEmptyState = document.getElementById('grand-empty-state');
const csvPreviewViewName = document.getElementById('csv-preview-view-name');
const csvPreviewFilename = document.getElementById('csv-preview-filename');
const csvPreviewCount = document.getElementById('csv-preview-count');
const csvPreviewTableContainer = document.getElementById('csv-preview-table-container');
const csvPreviewCancelBtn = document.getElementById('csv-preview-cancel-btn');
const confirmCsvDownloadBtn = document.getElementById('confirm-csv-download-btn');
const pdfPreviewModal = document.getElementById('pdf-preview-modal');
const pdfPreviewCloseBtn = document.getElementById('pdf-preview-close-btn');
const pdfPreviewCancelBtn = document.getElementById('pdf-preview-cancel-btn');
const confirmPdfPrintBtn = document.getElementById('confirm-pdf-print-btn');
const pdfPreviewViewName = document.getElementById('pdf-preview-view-name');
const pdfPreviewCount = document.getElementById('pdf-preview-count');
const pdfPreviewShortage = document.getElementById('pdf-preview-shortage');
const pdfPreviewOrient = document.getElementById('pdf-preview-orient');
const pdfPreviewContent = document.getElementById('pdf-preview-content');
const summaryActionsBar = document.getElementById('summary-actions-bar');
const summaryCountBadge = document.getElementById('summary-count-badge');
const summaryExportCsvBtn = document.getElementById('summary-export-csv-btn');
const summaryExportPdfBtn = document.getElementById('summary-export-pdf-btn');
const summaryClearBtn = document.getElementById('summary-clear-btn');
const updateBanner = document.getElementById('update-notification-banner');
const updateNewVersion = document.getElementById('update-new-version');
const updateReleaseNotes = document.getElementById('update-release-notes');
const updateDownloadBtn = document.getElementById('update-download-btn');
const updateDismissBtn = document.getElementById('update-dismiss-btn');
const checkUpdatesBtn = document.getElementById('check-updates-btn');
const pdfOptionsModal = document.getElementById('pdf-options-modal');
const pdfModalCloseBtn = document.getElementById('pdf-modal-close-btn');
const closePdfOptionsBtn = document.getElementById('close-pdf-options-btn');
const generatePdfBtn = document.getElementById('generate-pdf-btn');
const printableReportContainer = document.getElementById('printable-report-container');
const pdfReportTitleInput = document.getElementById('pdf-report-title');
const pdfPeriodLabelInput = document.getElementById('pdf-period-label');
const pdfScopeUnder40 = document.getElementById('pdf-scope-under40');
const pdfScopeAll = document.getElementById('pdf-scope-all');
const pdfIncludeKpi = document.getElementById('pdf-include-kpi');
const pdfIncludeLeaves = document.getElementById('pdf-include-leaves');
const pdfIncludeComments = document.getElementById('pdf-include-comments');
const pdfIncludeSignoff = document.getElementById('pdf-include-signoff');
const pdfOrientLandscape = document.getElementById('pdf-orient-landscape');
const pdfOrientPortrait = document.getElementById('pdf-orient-portrait');
const refreshBtn = document.getElementById('refresh-btn');
const saveReportBtn = document.getElementById('save-report-btn');
const openReportBtn = document.getElementById('open-report-btn');
const openReportFile = document.getElementById('open-report-file');
const statsProcessed = document.getElementById('stats-processed');
const statsExcluded = document.getElementById('stats-excluded');
const statsUnder40 = document.getElementById('stats-under40');
const statsLeaves = document.getElementById('stats-leaves');
const toastContainer = document.getElementById('toast-container');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    runSelfTests();
    setupDragAndDrop();
    setupEventListeners();
    loadAppStateFromLocalStorage();
    loadConfiguration();
    if (appState.hoursData) {
        processReports();
    }
    showToast('Dashboard ready. Upload your two CSV reports to build the Under 40 report.', 'info');
    // Silently check for updates in the background (non-blocking)
    setTimeout(() => {
        checkForUpdates({ manual: false });
    }, 1500);
});

// Self Diagnostics Suite
function runSelfTests() {
    console.group("Under 40 Report - Running Self-Tests");
    let passed = true;
    
    const assertEqual = (actual, expected, testName) => {
        if (Math.abs(actual - expected) < 0.0001 || actual === expected) {
            console.log(`✅ [PASS] ${testName}`);
        } else {
            console.error(`❌ [FAIL] ${testName}: expected "${expected}", got "${actual}"`);
            passed = false;
        }
    };

    // Time parsing tests
    assertEqual(parseTimeToDecimal("32:00"), 32, "parseTimeToDecimal('32:00')");
    assertEqual(parseTimeToDecimal("28:30:00"), 28.5, "parseTimeToDecimal('28:30:00')");
    assertEqual(parseTimeToDecimal("39:15"), 39.25, "parseTimeToDecimal('39:15')");
    assertEqual(parseTimeToDecimal("39:50:00").toFixed(4), (39 + 50/60).toFixed(4), "parseTimeToDecimal('39:50:00')");
    assertEqual(parseTimeToDecimal(" 24.5  "), 24.5, "parseTimeToDecimal(' 24.5  ')");
    
    // Time formatting tests
    assertEqual(formatHours(32.5), "32:30:00", "formatHours(32.5)");
    assertEqual(formatHours(32), "32:00:00", "formatHours(32)");
    assertEqual(formatHours(0), "00:00:00", "formatHours(0)");

    // Comment hours parsing tests
    assertEqual(parseHoursFromComment("4 hours sick leave"), 4, "parseHoursFromComment('4 hours sick leave')");
    assertEqual(parseHoursFromComment("2.5 hrs dentist visit"), 2.5, "parseHoursFromComment('2.5 hrs dentist visit')");
    assertEqual(parseHoursFromComment("took 0.5 hours sick leave"), 0.5, "parseHoursFromComment('took 0.5 hours sick leave')");
    assertEqual(parseHoursFromComment("took sick leave"), null, "parseHoursFromComment('took sick leave')");
    assertEqual(parseHoursFromComment("had a 3 hr break"), 3, "parseHoursFromComment('had a 3 hr break')");
    assertEqual(parseHoursFromComment("took half an hour leave"), 0.5, "parseHoursFromComment('took half an hour leave')");
    assertEqual(parseHoursFromComment("half hour dentist"), 0.5, "parseHoursFromComment('half hour dentist')");
    assertEqual(parseHoursFromComment("30 minutes late"), 0.5, "parseHoursFromComment('30 minutes late')");
    assertEqual(parseHoursFromComment("leave - 0.3(0.5) hrs"), 0.5, "parseHoursFromComment('leave - 0.3(0.5) hrs')");
    assertEqual(parseHoursFromComment("leave - 0.5(4) hrs"), 4, "parseHoursFromComment('leave - 0.5(4) hrs')");
    assertEqual(parseHoursFromComment("(0.5) hrs"), 0.5, "parseHoursFromComment('(0.5) hrs')");
    assertEqual(parseHoursFromComment("SICK - TOT - 12.30 (0.50) HRS"), 12.5, "parseHoursFromComment('SICK - TOT - 12.30 (0.50) HRS')");
    assertEqual(parseHoursFromComment("SICK - 1 HRS"), 1, "parseHoursFromComment('SICK - 1 HRS')");
    assertEqual(parseHoursFromComment("SICK - 6.30 (0.50)"), 6.5, "parseHoursFromComment('SICK - 6.30 (0.50)')");
    assertEqual(parseHoursFromComment("LEAVE - 20 HRS"), 20, "parseHoursFromComment('LEAVE - 20 HRS')");

    // Smart name matching tests
    assertEqual(areNamesMatching("Dana Valentina Hernandez Martines", "Dana Valentina Hernandez Martinez"), true, "smart name match: Dana Martines vs Martinez");
    assertEqual(areNamesMatching("Shirlyn Ricamara", "Shirlyn Ricohermoso Ricamara"), true, "smart name match: Shirlyn middle name expansion");
    assertEqual(areNamesMatching("Sushil Thapa Magar", "Jit Bahadur Thapa Magar"), false, "smart name guard: distinct first names must not match");
    assertEqual(areNamesMatching("John Smith", "Jane Smith"), false, "smart name guard: distinct first names with same last name must not match");

    console.groupEnd();
    if (!passed) {
        showToast("Self-test diagnostics failed! Check the browser console.", "error");
    }
}

// Setup Events
function setupEventListeners() {
    fileInput1.addEventListener('change', (e) => handleFileSelect(e, 1));
    fileInput2.addEventListener('change', (e) => handleFileSelect(e, 2));
    
    searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value;
        renderResults();
    });

    exportCsvBtn.addEventListener('click', exportToCSV);
    
    exportPdfBtn.addEventListener('click', () => {
        triggerPdfReportPrint();
    });

    if (csvPreviewCloseBtn) {
        csvPreviewCloseBtn.addEventListener('click', closeCsvPreviewModal);
    }

    if (csvPreviewCancelBtn) {
        csvPreviewCancelBtn.addEventListener('click', closeCsvPreviewModal);
    }

    if (confirmCsvDownloadBtn) {
        confirmCsvDownloadBtn.addEventListener('click', confirmCsvDownload);
    }

    if (csvPreviewModal) {
        csvPreviewModal.addEventListener('click', (e) => {
            if (e.target === csvPreviewModal) {
                closeCsvPreviewModal();
            }
        });
    }

    // Grand Summary Event Listeners
    if (grandSummaryBrowseBtn && grandSummaryFileInput) {
        grandSummaryBrowseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            grandSummaryFileInput.click();
        });
    }

    if (grandSummaryDropZone && grandSummaryFileInput) {
        grandSummaryDropZone.addEventListener('click', () => {
            grandSummaryFileInput.click();
        });
        grandSummaryDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            grandSummaryDropZone.classList.add('drag-over');
        });
        grandSummaryDropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            grandSummaryDropZone.classList.remove('drag-over');
        });
        grandSummaryDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            grandSummaryDropZone.classList.remove('drag-over');
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleGrandSummaryFiles(e.dataTransfer.files);
            }
        });
    }

    if (grandSummaryFileInput) {
        grandSummaryFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleGrandSummaryFiles(e.target.files);
            }
        });
    }

    if (grandSendToSummaryBtn) {
        grandSendToSummaryBtn.addEventListener('click', sendGrandSummaryToSummaryReport);
    }

    if (grandExportCsvBtn) {
        grandExportCsvBtn.addEventListener('click', exportGrandSummaryCSV);
    }

    if (grandExportPdfBtn) {
        grandExportPdfBtn.addEventListener('click', exportGrandSummaryPDF);
    }

    if (grandResetBtn) {
        grandResetBtn.addEventListener('click', resetGrandSummary);
    }

    if (summaryExportCsvBtn) {
        summaryExportCsvBtn.addEventListener('click', () => exportToCSV());
    }

    if (summaryExportPdfBtn) {
        summaryExportPdfBtn.addEventListener('click', () => exportSummaryReportPDF());
    }

    if (summaryClearBtn) {
        summaryClearBtn.addEventListener('click', clearSummaryReport);
    }

    if (pdfPreviewCloseBtn) {
        pdfPreviewCloseBtn.addEventListener('click', closePdfPreviewModal);
    }

    if (pdfPreviewCancelBtn) {
        pdfPreviewCancelBtn.addEventListener('click', closePdfPreviewModal);
    }

    if (confirmPdfPrintBtn) {
        confirmPdfPrintBtn.addEventListener('click', confirmPdfPrint);
    }

    if (pdfPreviewModal) {
        pdfPreviewModal.addEventListener('click', (e) => {
            if (e.target === pdfPreviewModal) {
                closePdfPreviewModal();
            }
        });
    }

    if (pdfModalCloseBtn) {
        pdfModalCloseBtn.addEventListener('click', closePdfOptionsModal);
    }

    if (closePdfOptionsBtn) {
        closePdfOptionsBtn.addEventListener('click', closePdfOptionsModal);
    }

    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', () => {
            savePdfOptionsFromModal();
            closePdfOptionsModal();
            triggerPdfReportPrint();
        });
    }

    if (checkUpdatesBtn) {
        checkUpdatesBtn.addEventListener('click', () => {
            checkForUpdates({ manual: true });
        });
    }

    if (updateDismissBtn) {
        updateDismissBtn.addEventListener('click', () => {
            if (updateBanner) updateBanner.style.display = 'none';
        });
    }

    refreshBtn.addEventListener('click', () => {
        if (!confirm('Are you sure you want to clear all data and start fresh? This will reset all uploaded files, manual overrides, and saved state.')) {
            return;
        }
        resetApplicationState();
        showToast('All reports, overrides, and saved state have been cleared!', 'success');
    });

    if (saveReportBtn) {
        saveReportBtn.addEventListener('click', saveWeeklyReport);
    }

    if (openReportBtn && openReportFile) {
        openReportBtn.addEventListener('click', () => {
            openReportFile.click();
        });
        openReportFile.addEventListener('change', handleOpenReportFile);
    }

    // Application Desktop File Menu Dropdown handlers
    if (fileMenuBtn && fileDropdownMenu) {
        fileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = fileDropdownMenu.style.display === 'block';
            fileDropdownMenu.style.display = isOpen ? 'none' : 'block';
            fileMenuBtn.classList.toggle('active', !isOpen);
            fileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
        });

        document.addEventListener('click', (e) => {
            const target = e && e.target;
            if (target && target.closest && (target.closest('#file-dropdown-menu') || target.closest('#file-menu-btn'))) {
                return;
            }
            fileDropdownMenu.style.display = 'none';
            fileMenuBtn.classList.remove('active');
            fileMenuBtn.setAttribute('aria-expanded', 'false');
        });

        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                fileDropdownMenu.style.display = 'none';
                fileMenuBtn.classList.remove('active');
                fileMenuBtn.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                fileDropdownMenu.style.display = 'none';
                fileMenuBtn.classList.remove('active');
                fileMenuBtn.setAttribute('aria-expanded', 'false');
            }
            if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                if (openReportFile) openReportFile.click();
            }
            if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 's') {
                e.preventDefault();
                saveWeeklyReport();
            }
            if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                triggerPdfReportPrint();
            }
        });
    }

    if (menuUploadReport1Btn && fileInput1) {
        menuUploadReport1Btn.addEventListener('click', () => {
            fileInput1.click();
        });
    }

    if (menuUploadReport2Btn && fileInput2) {
        menuUploadReport2Btn.addEventListener('click', () => {
            fileInput2.click();
        });
    }

    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', deleteSelectedCandidates);
    }

    const restorePartTimersBtn = document.getElementById('restore-part-timers-btn');
    if (restorePartTimersBtn) {
        restorePartTimersBtn.addEventListener('click', openRestoreModal);
    }

    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeRestoreModal);
    }

    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', closeRestoreModal);
    }

    const restoreAllBtn = document.getElementById('restore-all-btn');
    if (restoreAllBtn) {
        restoreAllBtn.addEventListener('click', restoreAllCandidates);
    }

    // Tabs switcher
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('.tab-btn') || btn;
            const tabName = targetBtn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            targetBtn.classList.add('active');
            appState.activeTab = tabName;
            
            // Reset sorting parameters on tab switch to prevent cross-report sort mismatches
            appState.sortColumn = 'candidateName';
            appState.sortAscending = true;
            appState.rawSortIndex = -1;
            appState.rawSortAscending = true;
            
            renderResults();
        });
    });

    // Dynamic page title during print so default PDF filename matches report type and date
    window.addEventListener('beforeprint', () => {
        appState.oldTitle = document.title;
        const timestamp = new Date().toISOString().slice(0, 10);
        renderPrintableReport();
        if (document.body) {
            if (appState.pdfConfig && appState.pdfConfig.orientation === 'portrait') {
                document.body.classList.add('pdf-portrait');
            } else {
                document.body.classList.remove('pdf-portrait');
            }
        }
        document.title = `Under_40_Compliance_Report_${timestamp}`;
    });

    window.addEventListener('afterprint', () => {
        if (appState.oldTitle) {
            document.title = appState.oldTitle;
        }
    });
}

// Drag & Drop
function setupDragAndDrop() {
    [
        { zone: dropZone1, index: 1 },
        { zone: dropZone2, index: 2 }
    ].forEach(({ zone, index }) => {
        ['dragenter', 'dragover'].forEach(eventName => {
            zone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                zone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                zone.classList.remove('dragover');
            }, false);
        });

        zone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                processUploadedFile(files[0], index);
            }
        }, false);
    });
}

function handleFileSelect(e, index) {
    const files = e.target.files;
    if (files.length > 0) {
        processUploadedFile(files[0], index);
    }
}

// Sync the compact upload drop zones with the currently loaded report state
function updateUploadZoneUI() {
    const zones = [
        { index: 1, data: appState.hoursData, fileName: appState.hoursFileName, placeholder: '(Working Hours)' },
        { index: 2, data: appState.leavesData, fileName: appState.leavesFileName, placeholder: '(Leaves Details)' }
    ];

    zones.forEach(({ index, data, fileName, placeholder }) => {
        const zone = document.getElementById(`drop-zone-${index}`);
        const fileNameEl = document.getElementById(`file-name-${index}`);
        if (!zone || !fileNameEl) return;

        zone.classList.remove('dragover');
        if (data && data.length > 0) {
            zone.classList.add('success');
            fileNameEl.textContent = fileName || `Report ${index} loaded`;
        } else {
            zone.classList.remove('success');
            fileNameEl.textContent = placeholder;
        }
    });
}

function processUploadedFile(file, index) {
    if (file.name.endsWith('.json') || file.name.endsWith('.u40')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            loadReportFromJSONText(e.target.result, file.name);
        };
        reader.readAsText(file);
        return;
    }

    if (!file.name.endsWith('.csv')) {
        showToast('Please upload a CSV file or saved report (.json).', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        try {
            const parsed = parseCSV(text);
            const zone = document.getElementById(`drop-zone-${index}`);
            const fileNameEl = document.getElementById(`file-name-${index}`);
            
            zone.classList.add('success');
            fileNameEl.textContent = `${file.name} (${formatBytes(file.size)})`;
            
            if (index === 1) {
                appState.hoursData = parsed;
                appState.hoursFileName = file.name;
                showToast('Working Hours report uploaded successfully.', 'success');
            } else {
                appState.leavesData = parsed;
                appState.leavesFileName = file.name;
                showToast('Leaves and Sick Leaves report uploaded successfully.', 'success');
            }

            if (appState.hoursData) {
                processReports();
            }
            saveAppStateToLocalStorage();
        } catch (err) {
            console.error(err);
            showToast(`Error parsing CSV: ${err.message}`, 'error');
        }
    };
    reader.readAsText(file);
}

// CSV Parser (supports quotes, commas, escapes, and newlines inside fields)
function parseCSV(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const next = text[i+1];
        
        if (c === '"') {
            if (inQuotes && next === '"') {
                row[row.length - 1] += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            row.push("");
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') { i++; }
            lines.push(row);
            row = [""];
        } else {
            row[row.length - 1] += c;
        }
    }
    
    if (row.length > 1 || row[0] !== "") {
        lines.push(row);
    }
    
    // Clean and normalize lines (trim spaces, ignore empty lines)
    const cleanedLines = lines
        .map(r => r.map(cell => cell.trim()))
        .filter(r => r.length > 0 && r.some(cell => cell !== ""));
        
    if (cleanedLines.length === 0) {
        throw new Error("CSV file is empty.");
    }
    
    return cleanedLines;
}

// Time parsing and formatting utilities
function parseTimeToDecimal(timeStr) {
    if (!timeStr) return 0;
    
    // Clean up non-matching characters except dot, minus, and colon
    const cleaned = timeStr.trim().replace(/[^0-9:.-]/g, '');
    
    // Check HH:MM:SS format
    const hmsMatch = cleaned.match(/^(\d+):(\d{2}):(\d{2})$/);
    if (hmsMatch) {
        const h = parseInt(hmsMatch[1], 10);
        const m = parseInt(hmsMatch[2], 10);
        const s = parseInt(hmsMatch[3], 10);
        return h + (m / 60) + (s / 3600);
    }
    
    // Check HH:MM format
    const hmMatch = cleaned.match(/^(\d+):(\d{2})$/);
    if (hmMatch) {
        const h = parseInt(hmMatch[1], 10);
        const m = parseInt(hmMatch[2], 10);
        return h + (m / 60);
    }
    
    // Fallback: assume decimal number
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function formatHours(decimal) {
    if (isNaN(decimal) || decimal === null || decimal === undefined || decimal < 0) {
        return "00:00:00";
    }
    const totalSeconds = Math.round(decimal * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Comment parser for specific hours (returns null if no custom hours found)
function parseHoursFromComment(comment) {
    if (!comment) return null;
    
    const cleanComment = comment.toLowerCase().trim();
    
    // 1. Check for "half an hour" / "half hour"
    if (/\bhalf\s*(?:an?\s*)?hour\b/.test(cleanComment)) {
        return 0.5;
    }
    
    // 2. Check for minutes (e.g. "30 minutes", "15 mins", "45 min", or "(30) mins")
    const minsMatch = cleanComment.match(/\b\(?(\d+)\)?\s*(?:minutes|mins|min)\b/);
    if (minsMatch) {
        const mins = parseInt(minsMatch[1], 10);
        if (!isNaN(mins)) {
            return mins / 60;
        }
    }

    // Helper: convert HH.MM time string (like '12.30', '6.30', '2.40', '5.15') or decimal ('2.5', '1', '20')
    function convertTimeToken(numStr) {
        if (!numStr) return null;
        if (numStr.includes('.')) {
            const parts = numStr.split('.');
            const h = parseInt(parts[0], 10) || 0;
            const frac = parts[1];
            // If two digits like .30, .15, .45, .40 -> treat as minutes (e.g. 12.30 = 12h 30m = 12.5h)
            if (frac.length === 2) {
                const m = parseInt(frac, 10);
                if (m < 60) return h + (m / 60);
            } else if (frac.length === 1) {
                return parseFloat(numStr);
            }
        }
        const val = parseFloat(numStr);
        return isNaN(val) ? null : val;
    }

    // 3. Explicit TOT / TOTAL takes highest precedence (e.g. 'SICK - TOT - 12.30 (0.50) HRS')
    const totMatch = cleanComment.match(/\b(?:tot|total)\s*[-:]?\s*(\d+(?:\.\d+)?)/);
    if (totMatch) {
        const h = convertTimeToken(totMatch[1]);
        if (h !== null) return h;
    }

    // 4. Pattern: number followed by bracketed break without 'hrs' on the bracket (e.g. '6.30 (0.50)')
    const numWithBreakMatch = cleanComment.match(/\b(\d+(?:\.\d+)?)\s*\([0-9.]+\)(?!\s*(?:hours|hrs|hour|hr|h)\b)/);
    if (numWithBreakMatch) {
        const h = convertTimeToken(numWithBreakMatch[1]);
        if (h !== null) return h;
    }

    // 5. Pattern where the hours unit is attached to the parenthesized number: e.g. 'leave - 0.5(4) hrs', 'leave - 0.3(0.5) hrs', '(0.5) hrs'
    const parenHoursMatch = cleanComment.match(/\(([0-9.]+)\)\s*(?:hours|hrs|hour|hr|h)\b/);
    if (parenHoursMatch) {
        const hrs = parseFloat(parenHoursMatch[1]);
        if (!isNaN(hrs)) return hrs;
    }

    // 6. Check for specific hours (e.g. '2.40 hrs', '5.15 hrs', '4 hours', '2.5 hrs', '20 hrs', '1 hrs')
    const hoursMatch = cleanComment.match(/\b(\d+(?:\.\d+)?)\s*(?:hours|hrs|hour|hr|h)\b/);
    if (hoursMatch) {
        const h = convertTimeToken(hoursMatch[1]);
        if (h !== null) return h;
    }
    
    return null;
}

// Levenshtein edit distance helper for smart name matching
function getEditDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// Smart Name Matching: safely matches names across Reports without merging distinct employees
// Rule: At least TWO distinct name parts (First, Middle, or Last) must match. Never match on 1 letter or single name.
function areNamesMatching(nameA, nameB) {
    if (!nameA || !nameB) return false;
    const cleanA = nameA.trim().toLowerCase().replace(/,/g, ' ');
    const cleanB = nameB.trim().toLowerCase().replace(/,/g, ' ');
    if (cleanA === cleanB) return true;

    const tokensA = cleanA.split(/\s+/).filter(w => w.length > 0);
    const tokensB = cleanB.split(/\s+/).filter(w => w.length > 0);

    if (tokensA.length === 0 || tokensB.length === 0) return false;

    // RULE 1: The First Name must match (either exact, minor 1-char typo on names >= 5 chars, or inverted order)
    const firstNameA = tokensA[0];
    const firstNameB = tokensB[0];
    const firstMatches = (firstNameA === firstNameB) ||
                         (firstNameA.length >= 5 && firstNameB.length >= 5 && getEditDistance(firstNameA, firstNameB) <= 1) ||
                         (tokensB.includes(firstNameA) && tokensA.includes(firstNameB));

    if (!firstMatches) {
        return false;
    }

    // RULE 2: At least TWO distinct names must match! (e.g. First + Last, or First + Middle)
    let matchCount = 0;
    const usedB = new Set();

    for (const wordA of tokensA) {
        for (let j = 0; j < tokensB.length; j++) {
            if (usedB.has(j)) continue;
            const wordB = tokensB[j];

            if (wordA === wordB) {
                matchCount++;
                usedB.add(j);
                break;
            }
            if (wordA.length >= 5 && wordB.length >= 5 && getEditDistance(wordA, wordB) === 1) {
                matchCount++;
                usedB.add(j);
                break;
            }
        }
    }

    // Must match at least 2 parts (never match on 1 word or 1 letter)
    if (matchCount < 2) {
        return false;
    }

    // RULE 3: Safeguard against merging distinct people who share common parts:
    // All tokens of the shorter name must match, OR at least 3 tokens must match
    const minTokens = Math.min(tokensA.length, tokensB.length);
    if (matchCount >= minTokens) {
        return true;
    }

    if (matchCount >= 3) {
        return true;
    }

    return false;
}

// Config management
function loadConfiguration() {
    // UI removed, configuration is loaded from localStorage only
}

function saveConfiguration() {
    // UI removed, configuration is managed in localStorage
}

// Main Report Processing
function processReports() {
    if (!appState.hoursData) {
        showToast("Hours report is missing.", "error");
        return;
    }

    const firstReport = appState.hoursData;
    const secondReport = appState.leavesData || []; // Can work without leaves initially
    
    // Find column indexes dynamically
    const header1 = firstReport[0];
    const colIdx1 = {
        name: findColumnIndex(header1, ["candidate name", "name", "candidate"]),
        status: findColumnIndex(header1, ["status"]),
        type: findColumnIndex(header1, ["candidate type", "type"]),
        title: findColumnIndex(header1, ["application title", "title", "job"]),
        hours: findColumnIndex(header1, ["working hours", "hours", "work hours"]),
        publicHoliday: findColumnIndex(header1, ["public holiday", "holiday", "public holidays", "ph"])
    };
    
    // Validation on headers
    if (colIdx1.name === -1 || colIdx1.hours === -1) {
        showToast("Report 1 must contain 'Candidate Name' and 'Working Hours' columns.", "error");
        return;
    }

    let colIdx2 = { name: -1, comfort: -1, comment: -1, cert: -1, days: -1, fromDate: -1, toDate: -1 };
    if (secondReport.length > 0) {
        const header2 = secondReport[0];
        colIdx2 = {
            name: findColumnIndex(header2, ["candidate name", "name", "candidate"]),
            comfort: findColumnIndex(header2, ["comfort working", "comfort"]),
            comment: findColumnIndex(header2, ["comment", "comments", "description"]),
            cert: findColumnIndex(header2, ["sick cert no", "sick cert", "certificate", "cert"]),
            days: findColumnIndex(header2, ["total days", "days", "no of days", "leave days"]),
            fromDate: findColumnIndex(header2, ["sick/leave from date", "from date", "start date", "sick leave from"]),
            toDate: findColumnIndex(header2, ["sick/leave to date", "to date", "end date", "sick leave to"])
        };
        if (colIdx2.name === -1) {
            showToast("Report 2 must contain a 'Candidate Name' column.", "error");
            return;
        }
    }

    const ignored = appState.config.ignoredNames.map(n => n.toLowerCase());
    const threshold = appState.config.thresholdHours;
    const defaultLeave = appState.config.defaultLeaveHours;

    // Index Report 2 leaves by Candidate Name (case-insensitive)
    const leavesByName = {};
    let totalLeavesProcessedCount = 0;
    
    if (secondReport.length > 1) {
        for (let i = 1; i < secondReport.length; i++) {
            const row = secondReport[i];
            const name = row[colIdx2.name] || "";
            const nameLower = name.trim().toLowerCase();
            
            // Filter ignored names
            if (!name || ignored.includes(nameLower)) continue;
            
            if (!leavesByName[nameLower]) {
                leavesByName[nameLower] = [];
            }
            
            const comment = colIdx2.comment !== -1 ? (row[colIdx2.comment] || "") : "";
            
            let parsedHours = null;
            let daysValue = null;
            let fromDateStr = "";
            let toDateStr = "";
            
            // 1. Try comment parsing first, to see if there is a specific custom hour duration
            if (colIdx2.comment !== -1) {
                const commentVal = (row[colIdx2.comment] || "").trim();
                if (commentVal) {
                    parsedHours = parseHoursFromComment(commentVal);
                }
            }
            
            // 2. If comment did not contain custom hours, try reading the Days column
            if (parsedHours === null && colIdx2.days !== -1) {
                const daysCell = (row[colIdx2.days] || "").trim();
                const floatDays = parseFloat(daysCell);
                if (!isNaN(floatDays)) {
                    daysValue = floatDays;
                    parsedHours = floatDays * defaultLeave;
                }
            }
            
            // 3. If still null, try Date Range calculation
            if (parsedHours === null && colIdx2.fromDate !== -1 && colIdx2.toDate !== -1) {
                const fromStr = (row[colIdx2.fromDate] || "").trim();
                const toStr = (row[colIdx2.toDate] || "").trim();
                if (fromStr && toStr) {
                    fromDateStr = fromStr;
                    toDateStr = toStr;
                    const parseDDMMYYYY = (dateStr) => {
                        const parts = dateStr.split(/[-/]/);
                        if (parts.length === 3) {
                            const d = parseInt(parts[0], 10);
                            const m = parseInt(parts[1], 10) - 1;
                            const y = parseInt(parts[2], 10);
                            return new Date(y, m, d);
                        }
                        return new Date(dateStr);
                    };
                    const fromD = parseDDMMYYYY(fromStr);
                    const toD = parseDDMMYYYY(toStr);
                    if (!isNaN(fromD) && !isNaN(toD)) {
                        const diffTime = Math.abs(toD - fromD);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
                        daysValue = diffDays;
                        parsedHours = diffDays * defaultLeave;
                    }
                }
            }
            
            // 4. Default fallback to 1 day (defaultLeave hours)
            if (parsedHours === null) {
                parsedHours = defaultLeave;
            }
            
            if (colIdx2.fromDate !== -1) fromDateStr = (row[colIdx2.fromDate] || "").trim();
            if (colIdx2.toDate !== -1) toDateStr = (row[colIdx2.toDate] || "").trim();
            
            leavesByName[nameLower].push({
                comfortWorking: colIdx2.comfort !== -1 ? (row[colIdx2.comfort] || "") : "",
                comment: comment,
                sickCertNo: colIdx2.cert !== -1 ? (row[colIdx2.cert] || "") : "",
                hours: parsedHours,
                days: daysValue,
                fromDate: fromDateStr,
                toDate: toDateStr
            });
            totalLeavesProcessedCount++;
        }
    }

    // Process Report 1 Candidates
    const processedCandidates = [];
    const allProcessedCandidates = [];
    let totalProcessed = 0;
    let excludedCount = 0;
    
    for (let i = 1; i < firstReport.length; i++) {
        const row = firstReport[i];
        const name = row[colIdx1.name] || "";
        const nameLower = name.trim().toLowerCase();
        
        // Filter ignored names & empty names
        if (!name || ignored.includes(nameLower)) continue;

        // Filter out candidates deleted as part-timers
        const deletedNames = (appState.deletedCandidates || []).map(n => n.toLowerCase());
        if (deletedNames.includes(nameLower)) {
            excludedCount++;
            continue;
        }
        // Filter out candidates without the specific Application Title
        const appTitle = colIdx1.title !== -1 ? (row[colIdx1.title] || "") : "";
        if (appTitle.trim().toLowerCase() !== "ni - employed and fully registered with jobs plus") {
            excludedCount++;
            continue;
        }

        const originalHoursStr = colIdx1.hours !== -1 ? (row[colIdx1.hours] || "0") : "0";
        let originalHoursDecimal = parseTimeToDecimal(originalHoursStr);
        
        // Filter out candidates with 0 hours
        if (originalHoursDecimal === 0) {
            excludedCount++;
            continue;
        }

        // Parse Public Holiday hours (falls back to global config if column is missing or cell is empty)
        let publicHolidayDecimal = appState.config.defaultPublicHolidayHours;
        if (colIdx1.publicHoliday !== -1) {
            const cellVal = (row[colIdx1.publicHoliday] || "").trim();
            if (cellVal !== "") {
                publicHolidayDecimal = parseTimeToDecimal(cellVal);
            }
        }

        // Match with leaves: first check exact match, then smart 2+ name match
        let leaves = leavesByName[nameLower] || null;
        let matchedLeaveKey = nameLower;

        if (!leaves) {
            for (const leaveKey of Object.keys(leavesByName)) {
                if (areNamesMatching(name, leaveKey)) {
                    leaves = leavesByName[leaveKey];
                    matchedLeaveKey = leaveKey;
                    break;
                }
            }
        }
        if (!leaves) {
            leaves = [];
        }

        // Apply overrides if they exist in state (checking candidate name or matched leave name)
        const overrideData = appState.overrides && (appState.overrides[nameLower] || (matchedLeaveKey && appState.overrides[matchedLeaveKey]));
        if (overrideData) {
            if (overrideData.originalHours !== undefined) {
                originalHoursDecimal = overrideData.originalHours;
            }
            if (overrideData.publicHoliday !== undefined) {
                publicHolidayDecimal = overrideData.publicHoliday;
            }
        }
        
        // Apply leave overrides if they exist
        if (overrideData && overrideData.leaves) {
            const leavesOverrides = overrideData.leaves;
            leaves.forEach((leave, lIdx) => {
                if (leavesOverrides[lIdx] !== undefined) {
                    leave.hours = leavesOverrides[lIdx];
                }
            });
        }

        const leaveHoursDecimal = leaves.reduce((sum, leave) => sum + leave.hours, 0);

        const candidateObj = {
            candidateName: name,
            status: colIdx1.status !== -1 ? (row[colIdx1.status] || "") : "",
            candidateType: colIdx1.type !== -1 ? (row[colIdx1.type] || "") : "",
            applicationTitle: colIdx1.title !== -1 ? (row[colIdx1.title] || "") : "",
            originalHours: originalHoursDecimal,
            leaveHours: leaveHoursDecimal,
            publicHoliday: publicHolidayDecimal,
            adjustedHours: 0,
            weeklyHours: threshold,
            missingHours: 0,
            leaves: leaves,
            compliant: false,
            clientName: '',
            dispatchFault: '',
            leaveBalance: '',
            formOfPay: '',
            informedClient: '',
            clarification: '',
            comments: ''
        };

        // Apply summary overrides if they exist in state
        if (overrideData) {
            if (overrideData.clientName !== undefined) {
                candidateObj.clientName = overrideData.clientName;
            }
            if (overrideData.dispatchFault !== undefined) {
                candidateObj.dispatchFault = overrideData.dispatchFault;
            }
            if (overrideData.leaveBalance !== undefined) {
                candidateObj.leaveBalance = overrideData.leaveBalance;
            }
            if (overrideData.formOfPay !== undefined) {
                candidateObj.formOfPay = overrideData.formOfPay;
            }
            if (overrideData.informedClient !== undefined) {
                candidateObj.informedClient = overrideData.informedClient;
            }
            if (overrideData.comments !== undefined) {
                candidateObj.comments = overrideData.comments;
            }
            if (overrideData.clarification !== undefined) {
                candidateObj.clarification = overrideData.clarification;
            }
        }
        
        candidateObj.adjustedHours = candidateObj.originalHours + candidateObj.leaveHours + candidateObj.publicHoliday;
        candidateObj.missingHours = Math.max(0, candidateObj.weeklyHours - candidateObj.adjustedHours);
        candidateObj.compliant = (candidateObj.originalHours >= candidateObj.weeklyHours) || (candidateObj.adjustedHours >= candidateObj.weeklyHours);

        allProcessedCandidates.push(candidateObj);

        if (!candidateObj.compliant) {
            processedCandidates.push(candidateObj);
        } else {
            excludedCount++;
        }
    }

    appState.allProcessedCandidates = allProcessedCandidates;
    appState.results = processedCandidates;
    totalProcessed = allProcessedCandidates.length;
    
    // Update dashboard stats
    statsProcessed.textContent = totalProcessed;
    statsExcluded.textContent = excludedCount;
    statsUnder40.textContent = processedCandidates.length;
    statsLeaves.textContent = totalLeavesProcessedCount;
    
    // Trigger render
    renderResults();
    
    if (processedCandidates.length > 0) {
        showToast(`Processed: ${totalProcessed} candidates. ${processedCandidates.length} are under ${threshold} hours.`, 'success');
    } else {
        showToast(`Processed: ${totalProcessed} candidates. All candidates meet the ${threshold}-hour requirement!`, 'success');
    }
}

// Find column index matching standard headers
function findColumnIndex(headers, aliases) {
    // Exact matches first
    for (let i = 0; i < headers.length; i++) {
        const val = headers[i].toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        for (const alias of aliases) {
            if (val === alias) {
                return i;
            }
        }
    }
    // Substring matches fallback
    for (let i = 0; i < headers.length; i++) {
        const val = headers[i].toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        for (const alias of aliases) {
            if (val.includes(alias)) {
                return i;
            }
        }
    }
    return -1;
}

// Render Results Table
function renderResults() {
    // Manage Summary Actions Bar visibility
    if (summaryActionsBar) {
        if (appState.activeTab === 'summary') {
            summaryActionsBar.style.display = 'flex';
            if (summaryCountBadge) {
                const sc = (appState.summaryCandidates || []).length;
                summaryCountBadge.textContent = `${sc} candidate${sc !== 1 ? 's' : ''}`;
            }
        } else {
            summaryActionsBar.style.display = 'none';
        }
    }

    // If on Grand Summary tab, handle grand summary view exclusively
    if (appState.activeTab === 'grand_summary') {
        if (standardTableWrapper) standardTableWrapper.style.display = 'none';
        if (grandSummaryView) grandSummaryView.style.display = 'block';
        if (selectionActions) selectionActions.style.display = 'none';
        if (restorePartTimersBtn) restorePartTimersBtn.style.display = 'none';
        renderGrandSummary();
        return;
    }

    // For all other standard tabs, ensure standard table wrapper is visible and grand summary view is hidden
    if (standardTableWrapper) standardTableWrapper.style.display = 'block';
    if (grandSummaryView) grandSummaryView.style.display = 'none';

    resultsTableBody.innerHTML = '';
    resultsTableHead.innerHTML = '';

    // If no hours data and no results are loaded, show the initial empty upload state on final, all, and report1 tabs
    if (!appState.hoursData && (!appState.results || appState.results.length === 0) && appState.activeTab !== 'report2' && appState.activeTab !== 'summary') {
        resultsTableHead.innerHTML = `<tr><th>Compliance Report</th></tr>`;
        resultsTableBody.innerHTML = `
            <tr>
                <td class="empty-state">
                    <div class="empty-state-icon">📥</div>
                    <p>Upload your CSV reports above to display the report.</p>
                </td>
            </tr>
        `;
        return;
    }

    // Handle Summary: Summary Report
    if (appState.activeTab === 'summary') {
        const colSpanCount = 8;
        resultsTableHead.innerHTML = `
            <tr>
                <th data-sort="candidateName" class="${appState.sortColumn === 'candidateName' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">
                    <div class="name-header-content">
                        <input type="checkbox" id="select-all-candidates" class="select-all-checkbox" title="Select / Deselect all visible candidates" onclick="event.stopPropagation()" onchange="handleSelectAllCandidates(this.checked)">
                        <span>Candidate Name</span>
                    </div>
                </th>
                <th data-sort="clientName" class="${appState.sortColumn === 'clientName' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Client name</th>
                <th data-sort="dispatchFault" class="${appState.sortColumn === 'dispatchFault' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Dispatch - Who's fault?</th>
                <th data-sort="leaveBalance" class="${appState.sortColumn === 'leaveBalance' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Leave balance - hrs (CHARMAINE)</th>
                <th data-sort="missingHours" class="${appState.sortColumn === 'missingHours' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Missing hours</th>
                <th>Comments</th>
                <th data-sort="formOfPay" class="${appState.sortColumn === 'formOfPay' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Form of pay</th>
                <th data-sort="informedClient" class="${appState.sortColumn === 'informedClient' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Informed client</th>
            </tr>
        `;

        if (!appState.summaryCandidates || appState.summaryCandidates.length === 0) {
            resultsTableBody.innerHTML = `
                <tr>
                    <td colspan="${colSpanCount}" class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <p style="font-weight: 600; font-size: 1rem; color: var(--text-primary); margin-bottom: 0.35rem;">Summary Report is currently clear</p>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); max-width: 520px; margin: 0 auto;">
                            The Summary Report is populated exclusively from the <strong>Grand Summary (Monthly)</strong>.<br>
                            Load your weekly files in the <strong>🌟 Grand Summary (Monthly)</strong> tab, then click <strong>"Send to Summary Report"</strong> to transfer data here.
                        </p>
                    </td>
                </tr>
            `;
            return;
        }

        const dataSet = appState.summaryCandidates;

        // Map with original indices from appState.summaryCandidates
        let filtered = dataSet.map((item, idx) => {
            return {
                ...item,
                originalIndex: idx
            };
        }).filter(item => {
            if (!appState.searchQuery) return true;
            const q = appState.searchQuery.toLowerCase();
            return (
                item.candidateName.toLowerCase().includes(q) ||
                (item.clientName || '').toLowerCase().includes(q) ||
                (item.dispatchFault || '').toLowerCase().includes(q)
            );
        });

        // Sort
        filtered.sort((a, b) => {
            let valA = a[appState.sortColumn];
            let valB = b[appState.sortColumn];
            
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            
            if (valA < valB) return appState.sortAscending ? -1 : 1;
            if (valA > valB) return appState.sortAscending ? 1 : -1;
            return 0;
        });

        if (filtered.length === 0) {
            resultsTableBody.innerHTML = `
                <tr>
                    <td colspan="${colSpanCount}" class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <p>No candidates found matching the criteria.</p>
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach((c) => {
            const originalIndex = c.originalIndex;
            const rowId = `row-summary-${originalIndex}`;
            
            // Build comments string
            const commentsStr = (c.leaves && Array.isArray(c.leaves) && c.leaves.length > 0) 
                ? c.leaves.map(l => l.comment).filter(v => v).join(' | ') 
                : (c.comments || 'N/A');
            
            const tr = document.createElement('tr');
            tr.className = 'candidate-row summary-row';
            tr.id = rowId;

            // Form of pay dropdown options
            const payOptions = ["", "Out of pocket", "Unpaid leave", "Paid leave", "Paid leave+Out of pocket", "Paid leave+Unpaid leave"];
            const payOptionsHtml = payOptions.map(opt => `
                <option value="${opt}" ${c.formOfPay === opt ? 'selected' : ''}>${opt || 'Select form of pay...'}</option>
            `).join('');

            // Informed client dropdown options
            const informedOptions = ["", "Yes", "No"];
            const informedOptionsHtml = informedOptions.map(opt => `
                <option value="${opt}" ${c.informedClient === opt ? 'selected' : ''}>${opt || 'Select...'}</option>
            `).join('');

            // Dispatch fault dropdown options
            const dispatchOptions = ["", "Client", "Candidate", "Client+Candidate"];
            const dispatchOptionsHtml = dispatchOptions.map(opt => `
                <option value="${opt}" ${c.dispatchFault === opt ? 'selected' : ''}>${opt || 'Select fault...'}</option>
            `).join('');

            tr.innerHTML = `
                <td class="candidate-name-cell">
                    <div class="candidate-name-wrapper">
                        <div class="name-checkbox-group">
                            <input type="checkbox" class="candidate-checkbox" data-name="${escapeHTML(c.candidateName)}" value="${escapeHTML(c.candidateName)}" ${appState.selectedCandidates && appState.selectedCandidates.has(c.candidateName) ? 'checked' : ''} onclick="event.stopPropagation()" onchange="handleCandidateCheckboxChange('${escapeHTML(c.candidateName)}', this.checked)">
                            <span class="candidate-name-text">${escapeHTML(c.candidateName)}</span>
                        </div>
                        <button class="row-delete-btn" title="Remove part-timer from report" onclick="deleteCandidate('${escapeHTML(c.candidateName)}', event)">🗑️</button>
                    </div>
                </td>
                
                <td>
                    <div class="editable-cell-container">
                        <input type="text" class="table-input" value="${escapeHTML(c.clientName || '')}" 
                               placeholder="Enter client name..." 
                               onchange="updateSummaryField(${originalIndex}, 'clientName', this.value)" 
                               onclick="event.stopPropagation()">
                        <span class="edit-icon">✏️</span>
                    </div>
                </td>
                
                <td>
                    <select class="table-select" onchange="updateSummaryField(${originalIndex}, 'dispatchFault', this.value)" onclick="event.stopPropagation()">
                        ${dispatchOptionsHtml}
                    </select>
                </td>
                
                <td>
                    <div class="editable-cell-container">
                        <input type="text" class="table-input hours-input" value="${c.leaveBalance ? formatHours(parseTimeToDecimal(c.leaveBalance)) : ''}" 
                               placeholder="00:00:00" 
                               onchange="updateSummaryField(${originalIndex}, 'leaveBalance', this.value)" 
                               onclick="event.stopPropagation()">
                        <span class="edit-icon">✏️</span>
                    </div>
                </td>
                
                <td><span class="hours-badge warning" style="color: var(--danger); font-weight: 600;">${formatHours(c.missingHours)}</span></td>
                
                <td>
                    <div class="editable-cell-container" style="width: 100%;">
                        <textarea class="table-textarea" 
                                  placeholder="Enter comments..." 
                                  onchange="updateSummaryField(${originalIndex}, 'comments', this.value)" 
                                  onclick="event.stopPropagation()">${escapeHTML(c.comments || '')}</textarea>
                        <span class="edit-icon" style="top: 8px;">✏️</span>
                    </div>
                </td>
                
                <td>
                    <select class="table-select" onchange="updateSummaryField(${originalIndex}, 'formOfPay', this.value)" onclick="event.stopPropagation()">
                        ${payOptionsHtml}
                    </select>
                </td>
                
                <td>
                    <select class="table-select informed-select" onchange="updateSummaryField(${originalIndex}, 'informedClient', this.value)" onclick="event.stopPropagation()">
                        ${informedOptionsHtml}
                    </select>
                </td>
            `;

            // Toggle details expansion on click
            tr.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
                const isExpanded = tr.classList.contains('expanded');
                document.querySelectorAll('.candidate-row').forEach(row => row.classList.remove('expanded'));
                if (!isExpanded) {
                    tr.classList.add('expanded');
                }
            });

            resultsTableBody.appendChild(tr);

            // Details row
            const detailsTr = document.createElement('tr');
            detailsTr.className = 'details-row';
            
            let leavesListHtml = '';
            if (c.leaves.length > 0) {
                c.leaves.forEach((lv, lIdx) => {
                    const daysInfo = lv.days !== null ? ` (${lv.days} day${lv.days !== 1 ? 's' : ''})` : '';
                    const datesInfo = lv.fromDate && lv.toDate ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.375rem; margin-top: 0.25rem;">Dates: <strong>${escapeHTML(lv.fromDate)}</strong> to <strong>${escapeHTML(lv.toDate)}</strong></div>` : '';
                    
                    leavesListHtml += `
                        <div class="leave-item">
                            <div class="leave-header">
                                <span>Sick Certificate: <strong>${escapeHTML(lv.sickCertNo) || 'N/A'}</strong></span>
                                <span class="leave-hours">${lv.hours.toFixed(1)} hrs${daysInfo}</span>
                            </div>
                            ${datesInfo}
                            <div class="leave-comment">"${escapeHTML(lv.comment) || 'No comment'}"</div>
                        </div>
                    `;
                });
            } else {
                leavesListHtml = `<div class="empty-state" style="padding: 1rem;"><p>No leaves or sick leaves recorded.</p></div>`;
            }

            detailsTr.innerHTML = `
                <td colspan="${colSpanCount}" class="details-cell">
                    <div class="details-content">
                        <div class="details-grid">
                            <div>
                                <div class="details-block-title">Leave Details &amp; Sick Certificates</div>
                                <div class="leaves-list">
                                    ${leavesListHtml}
                                </div>
                            </div>
                            <div>
                                <div class="details-block-title">Weekly Calculation Visualizer</div>
                                <div class="calc-timeline">
                                    <div class="calc-step">
                                        <span>Original working hours:</span>
                                        <span>${formatHours(c.originalHours)} (${c.originalHours.toFixed(2)}h)</span>
                                    </div>
                                    <div class="calc-step">
                                        <span>Sick leave (Report 2):</span>
                                        <span>+${formatHours(c.leaveHours)} (${c.leaveHours.toFixed(2)}h)</span>
                                    </div>
                                    <div class="calc-step">
                                        <span>Public Holiday hours:</span>
                                        <span>+${formatHours(c.publicHoliday)} (${c.publicHoliday.toFixed(2)}h)</span>
                                    </div>
                                    <div class="calc-step result">
                                        <span>Adjusted Weekly Total:</span>
                                        <span class="hours-badge ${c.compliant ? 'success' : 'warning'}">${formatHours(c.adjustedHours)} (${c.adjustedHours.toFixed(2)}h)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            `;
            resultsTableBody.appendChild(detailsTr);
        });
        updateSelectionUI();
        return;
    }

    // Handle Report 1: Raw Working Hours
    if (appState.activeTab === 'report1') {
        if (!appState.hoursData || appState.hoursData.length === 0) {
            resultsTableHead.innerHTML = `<tr><th>Report 1 Data</th></tr>`;
            resultsTableBody.innerHTML = `
                <tr>
                    <td class="empty-state">
                        <div class="empty-state-icon">⏱️</div>
                        <p>No Working Hours report loaded. Upload Report 1 above.</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Render Headers
        const headers = appState.hoursData[0];
        resultsTableHead.innerHTML = '<tr>' + headers.map((h, i) => `
            <th data-sort-idx="${i}" class="${appState.rawSortIndex === i ? (appState.rawSortAscending ? 'sort-asc' : 'sort-desc') : ''}">
                ${escapeHTML(h)}
            </th>
        `).join('') + '</tr>';

        // Render Rows
        const rows = appState.hoursData.slice(1);
        let filtered = rows;
        if (appState.searchQuery) {
            const q = appState.searchQuery.toLowerCase();
            filtered = rows.filter(row => row.some(cell => cell.toLowerCase().includes(q)));
        }

        // Apply Sorting
        let sorted = filtered;
        if (appState.rawSortIndex !== -1) {
            sorted = sortRawData(filtered, appState.rawSortIndex, appState.rawSortAscending);
        }

        if (sorted.length === 0) {
            resultsTableBody.innerHTML = `<tr><td colspan="${headers.length}" class="empty-state"><p>No rows found matching search query.</p></td></tr>`;
            return;
        }

        sorted.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = row.map(cell => `<td>${escapeHTML(cell)}</td>`).join('');
            resultsTableBody.appendChild(tr);
        });
        return;
    }

    // Handle Report 2: Raw Leaves Details
    if (appState.activeTab === 'report2') {
        if (!appState.leavesData || appState.leavesData.length === 0) {
            resultsTableHead.innerHTML = `<tr><th>Report 2 Data</th></tr>`;
            resultsTableBody.innerHTML = `
                <tr>
                    <td class="empty-state">
                        <div class="empty-state-icon">🩺</div>
                        <p>No Leaves details report loaded. Upload Report 2 above.</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Render Headers
        const headers = appState.leavesData[0];
        resultsTableHead.innerHTML = '<tr>' + headers.map((h, i) => `
            <th data-sort-idx="${i}" class="${appState.rawSortIndex === i ? (appState.rawSortAscending ? 'sort-asc' : 'sort-desc') : ''}">
                ${escapeHTML(h)}
            </th>
        `).join('') + '</tr>';

        // Render Rows
        const rows = appState.leavesData.slice(1);
        let filtered = rows;
        if (appState.searchQuery) {
            const q = appState.searchQuery.toLowerCase();
            filtered = rows.filter(row => row.some(cell => cell.toLowerCase().includes(q)));
        }

        // Apply Sorting
        let sorted = filtered;
        if (appState.rawSortIndex !== -1) {
            sorted = sortRawData(filtered, appState.rawSortIndex, appState.rawSortAscending);
        }

        if (sorted.length === 0) {
            resultsTableBody.innerHTML = `<tr><td colspan="${headers.length}" class="empty-state"><p>No rows found matching search query.</p></td></tr>`;
            return;
        }

        sorted.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = row.map(cell => `<td>${escapeHTML(cell)}</td>`).join('');
            resultsTableBody.appendChild(tr);
        });
        return;
    }

    // Handle Final: Under 40 Report (Default) OR All Processed Candidates
    if (appState.activeTab === 'final' || appState.activeTab === 'all') {
        const isAllTab = appState.activeTab === 'all';
        const colSpanCount = isAllTab ? 11 : 10;
        
        resultsTableHead.innerHTML = `
            <tr>
                <th data-sort="candidateName" class="${appState.sortColumn === 'candidateName' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">
                    <div class="name-header-content">
                        <input type="checkbox" id="select-all-candidates-final" class="select-all-checkbox" title="Select / Deselect all visible candidates" onclick="event.stopPropagation()" onchange="handleSelectAllCandidates(this.checked)">
                        <span>Candidate Name</span>
                    </div>
                </th>
                <th data-sort="status" class="${appState.sortColumn === 'status' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Status</th>
                <th data-sort="candidateType" class="${appState.sortColumn === 'candidateType' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Candidate Type</th>
                <th data-sort="applicationTitle" class="${appState.sortColumn === 'applicationTitle' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Application Title</th>
                <th data-sort="originalHours" class="${appState.sortColumn === 'originalHours' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Original Hours</th>
                <th data-sort="leaveHours" class="${appState.sortColumn === 'leaveHours' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Leaves Hours</th>
                <th data-sort="publicHoliday" class="${appState.sortColumn === 'publicHoliday' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Public Holiday</th>
                <th data-sort="adjustedHours" class="${appState.sortColumn === 'adjustedHours' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Adjusted Hours</th>
                <th data-sort="weeklyHours" class="${appState.sortColumn === 'weeklyHours' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Weekly Hours</th>
                <th data-sort="missingHours" class="${appState.sortColumn === 'missingHours' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Missing Hours</th>
                ${isAllTab ? `<th data-sort="compliant" class="${appState.sortColumn === 'compliant' ? (appState.sortAscending ? 'sort-asc' : 'sort-desc') : ''}">Compliance</th>` : ''}
            </tr>
        `;

        const dataSet = isAllTab ? appState.allProcessedCandidates : appState.results;

        // Map with original indices from appState.allProcessedCandidates
        let filtered = dataSet.map((item) => {
            const idx = appState.allProcessedCandidates.indexOf(item);
            return {
                ...item,
                originalIndex: idx
            };
        }).filter(item => {
            if (!appState.searchQuery) return true;
            const q = appState.searchQuery.toLowerCase();
            return (
                item.candidateName.toLowerCase().includes(q) ||
                item.status.toLowerCase().includes(q) ||
                item.candidateType.toLowerCase().includes(q) ||
                item.applicationTitle.toLowerCase().includes(q)
            );
        });

        // Sort
        filtered.sort((a, b) => {
            let valA = a[appState.sortColumn];
            let valB = b[appState.sortColumn];
            
            if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }
            
            if (valA < valB) return appState.sortAscending ? -1 : 1;
            if (valA > valB) return appState.sortAscending ? 1 : -1;
            return 0;
        });

        // Render Rows
        if (filtered.length === 0) {
            resultsTableBody.innerHTML = `
                <tr>
                    <td colspan="${colSpanCount}" class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <p>No candidates found matching the criteria.</p>
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach((c) => {
            const originalIndex = c.originalIndex;
            const rowId = `row-${originalIndex}`;
            const leavesCount = c.leaves.length;
            
            const tr = document.createElement('tr');
            tr.className = 'candidate-row';
            if (isAllTab) {
                tr.classList.add(c.compliant ? 'compliant-row' : 'non-compliant-row');
            }
            tr.id = rowId;

            const missingHoursHtml = c.compliant
                ? `<td><span class="hours-badge success">00:00:00</span></td>`
                : `<td><span class="hours-badge warning" style="color: var(--danger); font-weight: 600;">${formatHours(c.missingHours)}</span></td>`;
            
            const complianceBadgeHtml = isAllTab
                ? `<td><span class="badge ${c.compliant ? 'btn-success' : 'badge-danger'}">${c.compliant ? 'Compliant' : 'Under 40h'}</span></td>`
                : '';

            tr.innerHTML = `
                <td class="candidate-name-cell">
                    <div class="candidate-name-wrapper">
                        <div class="name-checkbox-group">
                            <input type="checkbox" class="candidate-checkbox" data-name="${escapeHTML(c.candidateName)}" value="${escapeHTML(c.candidateName)}" ${appState.selectedCandidates && appState.selectedCandidates.has(c.candidateName) ? 'checked' : ''} onclick="event.stopPropagation()" onchange="handleCandidateCheckboxChange('${escapeHTML(c.candidateName)}', this.checked)">
                            <span class="candidate-name-text">${escapeHTML(c.candidateName)}</span>
                        </div>
                        <button class="row-delete-btn" title="Remove part-timer from report" onclick="deleteCandidate('${escapeHTML(c.candidateName)}', event)">🗑️</button>
                    </div>
                </td>
                <td><span class="badge ${c.status.toLowerCase() === 'active' ? 'btn-success' : 'btn-secondary'}" style="padding: 2px 6px;">${escapeHTML(c.status)}</span></td>
                <td>${escapeHTML(c.candidateType)}</td>
                <td>${escapeHTML(c.applicationTitle)}</td>
                <td><span class="hours-badge">${formatHours(c.originalHours)}</span></td>
                <td><span class="hours-badge ${leavesCount > 0 ? 'success' : ''}">${leavesCount > 0 ? '+' : ''}${formatHours(c.leaveHours)}</span></td>
                <td><div class="editable-cell-container"><input type="text" class="hours-input ${c.publicHoliday > 0 ? 'success' : ''}" value="${formatHours(c.publicHoliday)}" onchange="overridePublicHoliday(${originalIndex}, this.value)" onclick="event.stopPropagation()"><span class="edit-icon">✏️</span></div></td>
                <td><span class="hours-badge ${c.compliant ? 'success' : 'warning'}">${formatHours(c.adjustedHours)}</span></td>
                <td><span class="hours-badge">${formatHours(c.weeklyHours)}</span></td>
                ${missingHoursHtml}
                ${complianceBadgeHtml}
            `;

            // Toggle Details Row on Click
            tr.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
                const isExpanded = tr.classList.contains('expanded');
                document.querySelectorAll('.candidate-row').forEach(row => row.classList.remove('expanded'));
                if (!isExpanded) {
                    tr.classList.add('expanded');
                }
            });

            resultsTableBody.appendChild(tr);

            // Details row
            const detailsTr = document.createElement('tr');
            detailsTr.className = 'details-row';
            
            let leavesListHtml = '';
            if (leavesCount > 0) {
                c.leaves.forEach((lv, lIdx) => {
                    const daysInfo = lv.days !== null ? ` (${lv.days} day${lv.days !== 1 ? 's' : ''})` : '';
                    const datesInfo = lv.fromDate && lv.toDate ? `<div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.375rem; margin-top: 0.25rem;">Dates: <strong>${escapeHTML(lv.fromDate)}</strong> to <strong>${escapeHTML(lv.toDate)}</strong></div>` : '';
                    
                    leavesListHtml += `
                        <div class="leave-item">
                            <div class="leave-header">
                                <span>Sick Certificate: <strong>${escapeHTML(lv.sickCertNo) || 'N/A'}</strong></span>
                                <span class="leave-hours">${lv.hours.toFixed(1)} hrs${daysInfo}</span>
                            </div>
                            ${datesInfo}
                            <div class="leave-comment">"${escapeHTML(lv.comment) || 'No comment'}"</div>
                            <div class="leave-metadata">
                                <span>Comfort Working: <strong>${escapeHTML(lv.comfortWorking) || 'N/A'}</strong></span>
                                <div class="edit-actions">
                                    <button class="btn btn-xs btn-secondary" onclick="editLeaveHours(${originalIndex}, ${lIdx})">Override Hours</button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                leavesListHtml = `<div class="empty-state" style="padding: 1rem;"><p>No leaves or sick leaves recorded.</p></div>`;
            }

            detailsTr.innerHTML = `
                <td colspan="${colSpanCount}" class="details-cell">
                    <div class="details-content">
                        <div class="details-grid">
                            <div>
                                <div class="details-block-title">Leave Details & Sick Certificates</div>
                                <div class="leaves-list">
                                    ${leavesListHtml}
                                </div>
                            </div>
                            <div>
                                <div class="details-block-title">Weekly Calculation Visualizer</div>
                                <div class="calc-timeline">
                                    <div class="calc-step">
                                        <span>Original working hours:</span>
                                        <span>${formatHours(c.originalHours)} (${c.originalHours.toFixed(2)}h)</span>
                                    </div>
                                    <div class="calc-step">
                                        <span>Sick leave (Report 2):</span>
                                        <span>+${formatHours(c.leaveHours)} (${c.leaveHours.toFixed(2)}h)</span>
                                    </div>
                                    <div class="calc-step">
                                        <span>Public Holiday hours:</span>
                                        <span>+${formatHours(c.publicHoliday)} (${c.publicHoliday.toFixed(2)}h)</span>
                                    </div>
                                    <div class="calc-step result">
                                        <span>Adjusted Weekly Total:</span>
                                        <span class="hours-badge ${c.compliant ? 'success' : 'warning'}">${formatHours(c.adjustedHours)} (${c.adjustedHours.toFixed(2)}h)</span>
                                    </div>
                                    <div class="calc-step" style="font-weight: 600; color: ${c.compliant ? 'var(--success)' : 'var(--danger)'}; margin-top: 0.5rem; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 0.5rem;">
                                        <span>Missing Hours:</span>
                                        <span>${formatHours(c.missingHours)} (${c.missingHours.toFixed(2)}h)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            `;
            resultsTableBody.appendChild(detailsTr);
        });
        updateSelectionUI();
        return;
    }
}

// Candidate Selection & Part-Timer Deletion Handlers
function handleSelectAllCandidates(checked) {
    const visibleCheckboxes = document.querySelectorAll('.candidate-checkbox');
    visibleCheckboxes.forEach(cb => {
        cb.checked = checked;
        const name = cb.getAttribute('data-name');
        if (name) {
            if (checked) {
                appState.selectedCandidates.add(name);
            } else {
                appState.selectedCandidates.delete(name);
            }
        }
    });
    updateSelectionUI();
}

function handleCandidateCheckboxChange(name, checked) {
    if (!name) return;
    if (checked) {
        appState.selectedCandidates.add(name);
    } else {
        appState.selectedCandidates.delete(name);
    }
    updateSelectionUI();
}

function clearCandidateSelection() {
    if (appState.selectedCandidates) {
        appState.selectedCandidates.clear();
    }
    const visibleCheckboxes = document.querySelectorAll('.candidate-checkbox');
    visibleCheckboxes.forEach(cb => { cb.checked = false; });
    const headerCbs = document.querySelectorAll('.select-all-checkbox');
    headerCbs.forEach(cb => {
        cb.checked = false;
        cb.indeterminate = false;
    });
    updateSelectionUI();
}

function updateSelectionUI() {
    const count = appState.selectedCandidates ? appState.selectedCandidates.size : 0;
    const actionsBar = document.getElementById('selection-actions');
    const badge = document.getElementById('selection-count-badge');
    const deleteBtn = document.getElementById('delete-selected-btn');
    
    if (actionsBar && badge) {
        if (count > 0) {
            actionsBar.style.display = 'inline-flex';
            badge.textContent = `${count} selected`;
            if (deleteBtn) {
                deleteBtn.textContent = `🗑️ Delete Part-Timer${count > 1 ? 's' : ''} (${count})`;
            }
        } else {
            actionsBar.style.display = 'none';
        }
    }

    const headerCbs = document.querySelectorAll('.select-all-checkbox');
    headerCbs.forEach(headerCb => {
        const visibleCheckboxes = document.querySelectorAll('.candidate-checkbox');
        if (visibleCheckboxes.length > 0 && count >= visibleCheckboxes.length) {
            headerCb.checked = true;
            headerCb.indeterminate = false;
        } else if (count > 0) {
            headerCb.checked = false;
            headerCb.indeterminate = true;
        } else {
            headerCb.checked = false;
            headerCb.indeterminate = false;
        }
    });

    const restoreBtn = document.getElementById('restore-part-timers-btn');
    const restoreCountEl = document.getElementById('restore-count');
    const deletedCount = (appState.deletedCandidates || []).length;
    if (restoreBtn && restoreCountEl) {
        if (deletedCount > 0) {
            restoreBtn.style.display = 'inline-flex';
            restoreCountEl.textContent = String(deletedCount);
        } else {
            restoreBtn.style.display = 'none';
        }
    }
}

function deleteCandidate(candidateName, e) {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to remove "${candidateName}" as a part-timer from this report?`)) {
        return;
    }
    if (appState.activeTab === 'summary' && appState.summaryCandidates) {
        appState.summaryCandidates = appState.summaryCandidates.filter(c => c.candidateName !== candidateName);
        if (appState.selectedCandidates) {
            appState.selectedCandidates.delete(candidateName);
        }
        saveAppStateToLocalStorage();
        renderResults();
        showToast(`Removed "${candidateName}" from Summary Report.`, 'success');
        return;
    }
    if (!appState.deletedCandidates) appState.deletedCandidates = [];
    if (!appState.deletedCandidates.includes(candidateName)) {
        appState.deletedCandidates.push(candidateName);
    }
    if (appState.selectedCandidates) {
        appState.selectedCandidates.delete(candidateName);
    }
    saveAppStateToLocalStorage();
    processReports();
    showToast(`Removed "${candidateName}" (part-timer) from the report.`, 'success');
}

function deleteSelectedCandidates() {
    if (!appState.selectedCandidates || appState.selectedCandidates.size === 0) {
        showToast('Please check at least one candidate first.', 'error');
        return;
    }
    const selectedList = Array.from(appState.selectedCandidates);
    const msg = selectedList.length === 1
        ? `Remove "${selectedList[0]}" as a part-timer from this report?`
        : `Remove ${selectedList.length} selected candidates as part-timers from this report?`;
    if (!confirm(msg)) return;

    if (appState.activeTab === 'summary' && appState.summaryCandidates) {
        appState.summaryCandidates = appState.summaryCandidates.filter(c => !appState.selectedCandidates.has(c.candidateName));
        appState.selectedCandidates.clear();
        saveAppStateToLocalStorage();
        renderResults();
        showToast(`Removed ${selectedList.length} candidate(s) from Summary Report.`, 'success');
        return;
    }

    if (!appState.deletedCandidates) appState.deletedCandidates = [];
    selectedList.forEach(name => {
        if (!appState.deletedCandidates.includes(name)) {
            appState.deletedCandidates.push(name);
        }
    });
    appState.selectedCandidates.clear();
    saveAppStateToLocalStorage();
    processReports();
    showToast(`Removed ${selectedList.length} part-timer(s) from the report.`, 'success');
}

function openRestoreModal() {
    const modal = document.getElementById('restore-modal');
    const listEl = document.getElementById('restore-candidates-list');
    if (!modal || !listEl) return;

    listEl.innerHTML = '';
    const deletedList = appState.deletedCandidates || [];
    if (deletedList.length === 0) {
        listEl.innerHTML = '<div class="empty-state" style="padding: 1rem;"><p>No candidates currently removed as part-timers.</p></div>';
    } else {
        deletedList.forEach(name => {
            const item = document.createElement('div');
            item.className = 'restore-item';
            item.innerHTML = `
                <span class="restore-item-name">${escapeHTML(name)}</span>
                <button class="btn btn-primary btn-xs" onclick="restoreCandidate('${escapeHTML(name)}')">Restore</button>
            `;
            listEl.appendChild(item);
        });
    }

    modal.style.display = 'flex';
}

function closeRestoreModal() {
    const modal = document.getElementById('restore-modal');
    if (modal) modal.style.display = 'none';
}

function restoreCandidate(candidateName) {
    if (!appState.deletedCandidates) return;
    appState.deletedCandidates = appState.deletedCandidates.filter(n => n !== candidateName);
    saveAppStateToLocalStorage();
    processReports();
    openRestoreModal();
    if (appState.deletedCandidates.length === 0) {
        closeRestoreModal();
    }
    showToast(`Restored "${candidateName}" to the report.`, 'success');
}

function restoreAllCandidates() {
    if (!appState.deletedCandidates || appState.deletedCandidates.length === 0) return;
    const count = appState.deletedCandidates.length;
    appState.deletedCandidates = [];
    saveAppStateToLocalStorage();
    processReports();
    closeRestoreModal();
    showToast(`Restored all ${count} part-timer(s) to the report.`, 'success');
}

window.handleSelectAllCandidates = handleSelectAllCandidates;
window.handleCandidateCheckboxChange = handleCandidateCheckboxChange;
window.clearCandidateSelection = clearCandidateSelection;
window.updateSelectionUI = updateSelectionUI;
window.deleteCandidate = deleteCandidate;
window.deleteSelectedCandidates = deleteSelectedCandidates;
window.openRestoreModal = openRestoreModal;
window.closeRestoreModal = closeRestoreModal;
window.restoreCandidate = restoreCandidate;
window.restoreAllCandidates = restoreAllCandidates;

// User overrides
window.overrideOriginalHours = function(candidateIndex, val) {
    const newDecimal = parseTimeToDecimal(val);
    const item = appState.allProcessedCandidates[candidateIndex];
    item.originalHours = newDecimal;
    
    // Recalculate
    item.adjustedHours = item.originalHours + item.leaveHours + item.publicHoliday;
    item.missingHours = Math.max(0, item.weeklyHours - item.adjustedHours);
    item.compliant = (item.originalHours >= item.weeklyHours) || (item.adjustedHours >= item.weeklyHours);
    
    // Update local overrides cache
    const nameLower = item.candidateName.trim().toLowerCase();
    if (!appState.overrides) appState.overrides = {};
    if (!appState.overrides[nameLower]) appState.overrides[nameLower] = {};
    appState.overrides[nameLower].originalHours = newDecimal;
    saveAppStateToLocalStorage();
    
    // Re-filter Under 40 list
    appState.results = appState.allProcessedCandidates.filter(c => !c.compliant);
    
    // Update stats
    statsUnder40.textContent = appState.results.length;
    statsExcluded.textContent = appState.allProcessedCandidates.length - appState.results.length;
    
    // Re-render
    renderResults();
    showToast(`Updated hours for ${item.candidateName} to ${formatHours(newDecimal)}`, 'success');
};

window.overridePublicHoliday = function(candidateIndex, val) {
    const newDecimal = parseTimeToDecimal(val);
    const item = appState.allProcessedCandidates[candidateIndex];
    item.publicHoliday = newDecimal;
    
    // Recalculate
    item.adjustedHours = item.originalHours + item.leaveHours + item.publicHoliday;
    item.missingHours = Math.max(0, item.weeklyHours - item.adjustedHours);
    item.compliant = (item.originalHours >= item.weeklyHours) || (item.adjustedHours >= item.weeklyHours);
    
    // Update local overrides cache
    const nameLower = item.candidateName.trim().toLowerCase();
    if (!appState.overrides) appState.overrides = {};
    if (!appState.overrides[nameLower]) appState.overrides[nameLower] = {};
    appState.overrides[nameLower].publicHoliday = newDecimal;
    saveAppStateToLocalStorage();
    
    // Re-filter Under 40 list
    appState.results = appState.allProcessedCandidates.filter(c => !c.compliant);
    
    // Update stats
    statsUnder40.textContent = appState.results.length;
    statsExcluded.textContent = appState.allProcessedCandidates.length - appState.results.length;
    
    // Re-render
    renderResults();
    showToast(`Updated public holiday hours for ${item.candidateName} to ${formatHours(newDecimal)}`, 'success');
};

window.updateSummaryField = function(candidateIndex, field, val) {
    if (appState.activeTab === 'summary' && appState.summaryCandidates && appState.summaryCandidates[candidateIndex]) {
        const item = appState.summaryCandidates[candidateIndex];
        item[field] = val;
        saveAppStateToLocalStorage();
        renderResults();
        showToast(`Updated ${field} for ${item.candidateName}`, 'success');
        return;
    }

    const item = appState.allProcessedCandidates && appState.allProcessedCandidates[candidateIndex];
    if (!item) return;
    item[field] = val;
    
    // Update local overrides cache
    const nameLower = item.candidateName.trim().toLowerCase();
    if (!appState.overrides) appState.overrides = {};
    if (!appState.overrides[nameLower]) appState.overrides[nameLower] = {};
    appState.overrides[nameLower][field] = val;
    saveAppStateToLocalStorage();
    
    // Re-filter Under 40 list
    appState.results = appState.allProcessedCandidates.filter(c => !c.compliant);
    
    // Update stats
    statsUnder40.textContent = appState.results.length;
    statsExcluded.textContent = appState.allProcessedCandidates.length - appState.results.length;
    
    renderResults();
    showToast(`Updated ${field} for ${item.candidateName}`, 'success');
};

window.editLeaveHours = function(candidateIndex, leaveIndex) {
    const item = appState.allProcessedCandidates[candidateIndex];
    const leave = item.leaves[leaveIndex];
    const newHours = prompt(`Enter new leave hours for this record (current: ${leave.hours}h):`, leave.hours);
    
    if (newHours !== null) {
        const floatHours = parseFloat(newHours);
        if (!isNaN(floatHours) && floatHours >= 0) {
            leave.hours = floatHours;
            
            // Recalculate
            item.leaveHours = item.leaves.reduce((sum, l) => sum + l.hours, 0);
            item.adjustedHours = item.originalHours + item.leaveHours + item.publicHoliday;
            item.missingHours = Math.max(0, item.weeklyHours - item.adjustedHours);
            item.compliant = (item.originalHours >= item.weeklyHours) || (item.adjustedHours >= item.weeklyHours);
            
            // Update local overrides cache
            const nameLower = item.candidateName.trim().toLowerCase();
            if (!appState.overrides) appState.overrides = {};
            if (!appState.overrides[nameLower]) appState.overrides[nameLower] = {};
            if (!appState.overrides[nameLower].leaves) appState.overrides[nameLower].leaves = {};
            appState.overrides[nameLower].leaves[leaveIndex] = floatHours;
            saveAppStateToLocalStorage();
            
            // Re-filter Under 40 list
            appState.results = appState.allProcessedCandidates.filter(c => !c.compliant);
            
            // Update stats
            statsUnder40.textContent = appState.results.length;
            statsExcluded.textContent = appState.allProcessedCandidates.length - appState.results.length;
            
            renderResults();
            showToast(`Leave hours updated.`, 'success');
        } else {
            showToast(`Invalid hour value.`, 'error');
        }
    }
};

// Set sort column
window.setSortColumn = function(colName) {
    if (appState.sortColumn === colName) {
        appState.sortAscending = !appState.sortAscending;
    } else {
        appState.sortColumn = colName;
        appState.sortAscending = true;
    }
    
    // Update table header indicators
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.className = '';
        if (th.getAttribute('data-sort') === colName) {
            th.className = appState.sortAscending ? 'sort-asc' : 'sort-desc';
        }
    });
    
    renderResults();
};

// Set raw sort index
window.setRawSortIndex = function(idx) {
    if (appState.rawSortIndex === idx) {
        appState.rawSortAscending = !appState.rawSortAscending;
    } else {
        appState.rawSortIndex = idx;
        appState.rawSortAscending = true;
    }
    renderResults();
};

// Sort raw data helper (handles string comparisons and parsing times/numbers)
function sortRawData(rows, colIdx, ascending) {
    return [...rows].sort((a, b) => {
        let valA = a[colIdx] || "";
        let valB = b[colIdx] || "";

        // Check if they look like times
        const isTimeA = valA.includes(':');
        const isTimeB = valB.includes(':');
        
        let numA = parseFloat(valA);
        let numB = parseFloat(valB);
        
        if (isTimeA || isTimeB) {
            numA = parseTimeToDecimal(valA);
            numB = parseTimeToDecimal(valB);
        }

        if (!isNaN(numA) && !isNaN(numB)) {
            return ascending ? numA - numB : numB - numA;
        }

        // Standard string comparison
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
    });
}

// Hook sort column events to headers (using event delegation since headers are dynamic)
resultsTableHead.addEventListener('click', (e) => {
    const thSort = e.target.closest('th[data-sort]');
    if (thSort) {
        setSortColumn(thSort.getAttribute('data-sort'));
        return;
    }
    
    const thIdx = e.target.closest('th[data-sort-idx]');
    if (thIdx) {
        const idx = parseInt(thIdx.getAttribute('data-sort-idx'), 10);
        setRawSortIndex(idx);
    }
});

function toggleGrandSummarySort(targetSort) {
    if (!targetSort) return;
    if (!appState.grandSummarySort) {
        appState.grandSummarySort = { column: 'name', direction: 'asc' };
    }

    if (appState.grandSummarySort.column === targetSort) {
        appState.grandSummarySort.direction = appState.grandSummarySort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        appState.grandSummarySort.column = targetSort;
        appState.grandSummarySort.direction = targetSort === 'name' ? 'asc' : 'desc';
    }
    renderGrandSummaryTable();
}

if (grandTableHead) {
    grandTableHead.addEventListener('click', (e) => {
        const thSort = e.target && e.target.closest ? e.target.closest('th[data-sort]') : null;
        if (!thSort) return;
        const targetSort = thSort.getAttribute('data-sort');
        toggleGrandSummarySort(targetSort);
    });
}

// CSV Export
function exportToCSV() {
    const activeTab = appState.activeTab;
    const isGrandSummaryActive = activeTab === 'grand_summary' || 
        (grandSummaryView && grandSummaryView.style.display !== 'none');

    if (isGrandSummaryActive) {
        exportGrandSummaryCSV();
        return;
    }
    
    if (activeTab === 'summary') {
        const summaryData = appState.summaryCandidates || [];
        if (summaryData.length === 0) {
            showToast('No summary report data to export. Populate from Grand Summary first.', 'error');
            return;
        }
        const headers = [
            "Candidate Name",
            "Client name",
            "Dispatch - Who's fault?",
            "Leave balance - hrs (CHARMAINE)",
            "Missing hours",
            "Comments",
            "Form of pay",
            "Informed client"
        ];
        const rows = summaryData.map(c => {
            const comments = c.comments || '';
            return [
                c.candidateName,
                c.clientName || '',
                c.dispatchFault || '',
                c.leaveBalance || '',
                formatHours(c.missingHours),
                comments,
                c.formOfPay || '',
                c.informedClient || ''
            ];
        });
        const csvData = [headers, ...rows];
        openCsvPreviewModal(csvData, 'Summary_Report', 'Executive Summary Table');
        return;
    }
    
    if (activeTab === 'report1') {
        if (!appState.hoursData || appState.hoursData.length === 0) {
            showToast('No Report 1 data to export.', 'error');
            return;
        }
        const raw = appState.hoursData;
        const header = raw[0] || [];
        const excludedIndices = new Set();
        header.forEach((h, idx) => {
            const low = String(h || '').trim().toLowerCase();
            if (low === 'status' || low.includes('candidate type') || low.includes('application title') || low === 'type' || low === 'title') {
                excludedIndices.add(idx);
            }
        });
        const filteredData = excludedIndices.size > 0
            ? raw.map(row => row.filter((_, idx) => !excludedIndices.has(idx)))
            : raw;
        openCsvPreviewModal(filteredData, 'Working_Hours_Report', 'Working Hours (Report 1)');
        return;
    }
    
    if (activeTab === 'report2') {
        if (!appState.leavesData || appState.leavesData.length === 0) {
            showToast('No Report 2 data to export.', 'error');
            return;
        }
        openCsvPreviewModal(appState.leavesData, 'Leaves_Report', 'Leaves & Sick Details (Report 2)');
        return;
    }
    
    // For 'final' and 'all' tabs
    const dataSet = activeTab === 'all' ? appState.allProcessedCandidates : appState.results;
    if (dataSet.length === 0) {
        showToast('No results to export.', 'error');
        return;
    }

    const headers = [
        "Candidate Name",
        "Original Hours",
        "Leave Hours",
        "Public Holiday",
        "Adjusted Hours",
        "Weekly Hours",
        "Missing Hours",
        ...(activeTab === 'all' ? ["Compliance"] : [])
    ];

    const rows = dataSet.map(c => {
        return [
            c.candidateName,
            formatHours(c.originalHours),
            formatHours(c.leaveHours),
            formatHours(c.publicHoliday),
            formatHours(c.adjustedHours),
            formatHours(c.weeklyHours),
            formatHours(c.missingHours),
            ...(activeTab === 'all' ? [c.compliant ? "Compliant" : "Under 40h"] : [])
        ];
    });

    const csvData = [headers, ...rows];
    const isAll = activeTab === 'all';
    openCsvPreviewModal(
        csvData,
        isAll ? 'All_Processed_Candidates' : 'Under_40_Report',
        isAll ? 'All Processed Candidates Audit' : 'Under 40 Hours Report'
    );
}

// Helper function to save / download CSV data with native Save As file picker
async function downloadCSVData(csvRows, filenamePrefix) {
    const csvContent = csvRows
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\r\n');

    const timestamp = new Date().toISOString().slice(0, 10);
    const suggestedFileName = `${filenamePrefix}_${timestamp}.csv`;

    // Modern Native File System Picker: Lets user choose ANY folder/path and filename
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: suggestedFileName,
                types: [{
                    description: 'CSV Spreadsheet (*.csv)',
                    accept: {
                        'text/csv': ['.csv']
                    }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(csvContent);
            await writable.close();
            showToast(`CSV saved directly to chosen location: "${handle.name}".`, 'success');
            return;
        } catch (err) {
            if (err.name === 'AbortError') {
                return; // User canceled the Save As dialog
            }
            console.warn('File picker error, falling back to download link:', err);
        }
    }

    // Fallback for browsers without File System Access API
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", suggestedFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`CSV report saved as "${suggestedFileName}".`, 'success');
}

// Helper: Show Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// Helper utilities
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Local Storage state save & load helpers
function saveAppStateToLocalStorage() {
    localStorage.setItem('under40_config', JSON.stringify(appState.config));
    localStorage.setItem('under40_overrides', JSON.stringify(appState.overrides || {}));
    localStorage.setItem('under40_deletedCandidates', JSON.stringify(appState.deletedCandidates || []));
    localStorage.setItem('under40_pdfConfig', JSON.stringify(appState.pdfConfig || {}));
    if (appState.summaryCandidates && appState.summaryCandidates.length > 0) {
        localStorage.setItem('under40_summaryCandidates', JSON.stringify(appState.summaryCandidates));
    } else {
        localStorage.removeItem('under40_summaryCandidates');
    }
    if (appState.hoursData) {
        localStorage.setItem('under40_hoursData', JSON.stringify(appState.hoursData));
        localStorage.setItem('under40_fileName1', document.getElementById('file-name-1').textContent);
    } else {
        localStorage.removeItem('under40_hoursData');
        localStorage.removeItem('under40_fileName1');
    }
    if (appState.leavesData) {
        localStorage.setItem('under40_leavesData', JSON.stringify(appState.leavesData));
        localStorage.setItem('under40_fileName2', document.getElementById('file-name-2').textContent);
    } else {
        localStorage.removeItem('under40_leavesData');
        localStorage.removeItem('under40_fileName2');
    }
}

function loadAppStateFromLocalStorage() {
    try {
        const configStr = localStorage.getItem('under40_config');
        if (configStr) {
            appState.config = JSON.parse(configStr);
        }
        
        const overridesStr = localStorage.getItem('under40_overrides');
        if (overridesStr) {
            appState.overrides = JSON.parse(overridesStr);
        } else {
            appState.overrides = {};
        }

        const deletedStr = localStorage.getItem('under40_deletedCandidates');
        if (deletedStr) {
            appState.deletedCandidates = JSON.parse(deletedStr);
        } else {
            appState.deletedCandidates = [];
        }

        const pdfConfigStr = localStorage.getItem('under40_pdfConfig');
        if (pdfConfigStr) {
            try {
                appState.pdfConfig = Object.assign(appState.pdfConfig || {}, JSON.parse(pdfConfigStr));
            } catch (e) {}
        }

        const summaryCandidatesStr = localStorage.getItem('under40_summaryCandidates');
        if (summaryCandidatesStr) {
            try {
                appState.summaryCandidates = JSON.parse(summaryCandidatesStr);
            } catch (e) {
                appState.summaryCandidates = [];
            }
        } else {
            appState.summaryCandidates = [];
        }

        const hoursDataStr = localStorage.getItem('under40_hoursData');
        if (hoursDataStr) {
            appState.hoursData = JSON.parse(hoursDataStr);
            const zone = document.getElementById('drop-zone-1');
            const fileNameEl = document.getElementById('file-name-1');
            zone.classList.add('success');
            fileNameEl.textContent = localStorage.getItem('under40_fileName1') || 'Report 1 loaded';
        }

        const leavesDataStr = localStorage.getItem('under40_leavesData');
        if (leavesDataStr) {
            appState.leavesData = JSON.parse(leavesDataStr);
            const zone = document.getElementById('drop-zone-2');
            const fileNameEl = document.getElementById('file-name-2');
            zone.classList.add('success');
            fileNameEl.textContent = localStorage.getItem('under40_fileName2') || 'Report 2 loaded';
        }
    } catch (e) {
        console.error("Error loading state from localStorage:", e);
    }
}

// Reset the entire application state (Clear all data)
function resetApplicationState() {
    // Reset state object
    appState.hoursData = null;
    appState.leavesData = null;
    appState.hoursFileName = '';
    appState.leavesFileName = '';
    appState.results = [];
    appState.allProcessedCandidates = [];
    appState.deletedCandidates = [];
    appState.summaryCandidates = [];
    appState.selectedCandidates = new Set();
    appState.overrides = {};
    appState.config = {
        thresholdHours: 40,
        defaultLeaveHours: 8,
        defaultPublicHolidayHours: 0,
        ignoredNames: ["TEST Peter", "PENDING SHIFT"]
    };
    appState.searchQuery = '';
    appState.activeTab = 'final';
    appState.sortColumn = 'candidateName';
    appState.sortAscending = true;
    appState.rawSortIndex = -1;
    appState.rawSortAscending = true;

    // Remove localStorage values
    localStorage.removeItem('under40_config');
    localStorage.removeItem('under40_overrides');
    localStorage.removeItem('under40_deletedCandidates');
    localStorage.removeItem('under40_summaryCandidates');
    localStorage.removeItem('under40_hoursData');
    localStorage.removeItem('under40_fileName1');
    localStorage.removeItem('under40_leavesData');
    localStorage.removeItem('under40_fileName2');

    // Reset Drop Zones UI
    if (fileInput1) fileInput1.value = "";
    if (fileInput2) fileInput2.value = "";
    updateUploadZoneUI();

    // Reset Config Panel Inputs
    loadConfiguration();

    // Reset Dashboard Statistics
    statsProcessed.textContent = '0';
    statsExcluded.textContent = '0';
    statsUnder40.textContent = '0';
    statsLeaves.textContent = '0';

    // Clear Search Input
    searchInput.value = '';

    // Clear printable container
    if (printableReportContainer) {
        printableReportContainer.innerHTML = '';
    }

    // Revert tab navigation buttons active state to 'final' (Under 40 Report)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === 'final') {
            btn.classList.add('active');
        }
    });

    // Render results view (will display initial empty upload state)
    renderResults();
}

// CSV Export Preview Modal Handlers
function openCsvPreviewModal(csvRows, filenamePrefix, viewDisplayName) {
    if (!csvRows || csvRows.length === 0) {
        showToast('No data available to preview.', 'error');
        return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const suggestedFileName = `${filenamePrefix}_${timestamp}.csv`;

    appState.pendingCsv = {
        csvRows,
        filenamePrefix,
        suggestedFileName,
        viewDisplayName
    };

    if (csvPreviewViewName) {
        csvPreviewViewName.textContent = viewDisplayName || filenamePrefix;
    }
    if (csvPreviewFilename) {
        csvPreviewFilename.textContent = suggestedFileName;
    }
    if (csvPreviewCount) {
        const colCount = csvRows[0] ? csvRows[0].length : 0;
        const rowCount = Math.max(0, csvRows.length - 1);
        csvPreviewCount.textContent = `${rowCount} data row${rowCount === 1 ? '' : 's'} • ${colCount} columns`;
    }

    renderCsvPreviewTable(csvRows);

    if (csvPreviewModal) {
        csvPreviewModal.style.display = 'flex';
    }
}

function renderCsvPreviewTable(csvRows) {
    if (!csvPreviewTableContainer) return;
    if (!csvRows || csvRows.length === 0) {
        csvPreviewTableContainer.innerHTML = '<div class="empty-state"><p>No data to preview.</p></div>';
        return;
    }

    const headers = csvRows[0] || [];
    const dataRows = csvRows.slice(1);

    let html = '<table class="csv-preview-table">';
    html += '<thead><tr>';
    html += '<th class="csv-row-num-th">#</th>';
    for (let i = 0; i < headers.length; i++) {
        html += `<th>${escapeHTML(headers[i])}</th>`;
    }
    html += '</tr></thead>';

    html += '<tbody>';
    if (dataRows.length === 0) {
        html += `<tr><td colspan="${headers.length + 1}" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">No data records found.</td></tr>`;
    } else {
        for (let r = 0; r < dataRows.length; r++) {
            const row = dataRows[r];
            html += '<tr>';
            html += `<td class="csv-row-num-td">${r + 1}</td>`;
            for (let c = 0; c < headers.length; c++) {
                const val = (row && row[c] !== undefined && row[c] !== null) ? String(row[c]) : '';
                html += `<td>${escapeHTML(val)}</td>`;
            }
            html += '</tr>';
        }
    }
    html += '</tbody></table>';

    csvPreviewTableContainer.innerHTML = html;
}

function closeCsvPreviewModal() {
    if (csvPreviewModal) {
        csvPreviewModal.style.display = 'none';
    }
    appState.pendingCsv = null;
}

async function confirmCsvDownload() {
    if (!appState.pendingCsv || !appState.pendingCsv.csvRows) {
        closeCsvPreviewModal();
        return;
    }
    const { csvRows, filenamePrefix } = appState.pendingCsv;
    closeCsvPreviewModal();
    await downloadCSVData(csvRows, filenamePrefix);
}

// PDF Options Modal handlers
function openPdfOptionsModal() {
    if (!pdfOptionsModal) return;

    if (pdfReportTitleInput) {
        pdfReportTitleInput.value = (appState.pdfConfig && appState.pdfConfig.reportTitle) || 'Weekly Under 40 Hours & Compliance Audit Report';
    }
    if (pdfPeriodLabelInput) {
        let period = (appState.pdfConfig && appState.pdfConfig.periodLabel) || '';
        if (!period && appState.weekLabel) {
            period = appState.weekLabel;
        }
        if (!period) {
            const today = new Date();
            period = `Week ending ${today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        pdfPeriodLabelInput.value = period;
    }
    if (pdfScopeUnder40 && pdfScopeAll) {
        if (appState.pdfConfig && appState.pdfConfig.scope === 'all') {
            pdfScopeAll.checked = true;
        } else {
            pdfScopeUnder40.checked = true;
        }
    }
    if (pdfIncludeKpi) {
        pdfIncludeKpi.checked = appState.pdfConfig ? appState.pdfConfig.includeKpi !== false : true;
    }
    if (pdfIncludeLeaves) {
        pdfIncludeLeaves.checked = appState.pdfConfig ? Boolean(appState.pdfConfig.includeLeaves) : false;
    }
    if (pdfIncludeComments) {
        pdfIncludeComments.checked = appState.pdfConfig ? appState.pdfConfig.includeComments !== false : true;
    }
    if (pdfIncludeSignoff) {
        pdfIncludeSignoff.checked = appState.pdfConfig ? appState.pdfConfig.includeSignoff !== false : true;
    }
    if (pdfOrientLandscape && pdfOrientPortrait) {
        if (appState.pdfConfig && appState.pdfConfig.orientation === 'portrait') {
            pdfOrientPortrait.checked = true;
        } else {
            pdfOrientLandscape.checked = true;
        }
    }

    pdfOptionsModal.style.display = 'flex';
}

function closePdfOptionsModal() {
    if (pdfOptionsModal) {
        pdfOptionsModal.style.display = 'none';
    }
}

function savePdfOptionsFromModal() {
    if (!appState.pdfConfig) appState.pdfConfig = {};

    if (pdfReportTitleInput) {
        appState.pdfConfig.reportTitle = pdfReportTitleInput.value.trim() || 'Weekly Under 40 Hours & Compliance Audit Report';
    }
    if (pdfPeriodLabelInput) {
        appState.pdfConfig.periodLabel = pdfPeriodLabelInput.value.trim();
    }
    if (pdfScopeAll && pdfScopeAll.checked) {
        appState.pdfConfig.scope = 'all';
    } else {
        appState.pdfConfig.scope = 'under40';
    }
    if (pdfIncludeKpi) {
        appState.pdfConfig.includeKpi = pdfIncludeKpi.checked;
    }
    if (pdfIncludeLeaves) {
        appState.pdfConfig.includeLeaves = pdfIncludeLeaves.checked;
    }
    if (pdfIncludeComments) {
        appState.pdfConfig.includeComments = pdfIncludeComments.checked;
    }
    if (pdfIncludeSignoff) {
        appState.pdfConfig.includeSignoff = pdfIncludeSignoff.checked;
    }
    if (pdfOrientPortrait && pdfOrientPortrait.checked) {
        appState.pdfConfig.orientation = 'portrait';
    } else {
        appState.pdfConfig.orientation = 'landscape';
    }

    saveAppStateToLocalStorage();
}

function triggerPdfReportPrint(options) {
    const activeTab = appState.activeTab;
    if (activeTab === 'grand_summary') {
        exportGrandSummaryPDF(options);
        return;
    }

    if (activeTab === 'summary') {
        exportSummaryReportPDF(options);
        return;
    }

    renderPrintableReport(options);
}

function renderPrintableReport(options) {
    if (!printableReportContainer) return;

    const activeTab = appState.activeTab;
    if (activeTab === 'grand_summary') {
        exportGrandSummaryPDF(options);
        return;
    }
    if (activeTab === 'summary') {
        exportSummaryReportPDF(options);
        return;
    }

    const now = new Date();
    const generatedDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + 
                             now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    let printHtml = '';
    let reportDisplayName = 'Weekly Under 40 Hours Report';
    let countText = '0 records';
    let shortageText = '00:00:00';

    if (activeTab === 'report1') {
        if (!appState.hoursData || appState.hoursData.length === 0) {
            showToast('No Report 1 data to export. Please upload working hours report first.', 'error');
            return;
        }
        const raw = appState.hoursData;
        const header = raw[0] || [];
        const excludedIndices = new Set();
        header.forEach((h, idx) => {
            const low = String(h || '').trim().toLowerCase();
            if (low === 'status' || low.includes('candidate type') || low.includes('application title') || low === 'type' || low === 'title') {
                excludedIndices.add(idx);
            }
        });

        const printHeaders = header.filter((_, idx) => !excludedIndices.has(idx));
        const printRows = raw.slice(1).map(row => row.filter((_, idx) => !excludedIndices.has(idx)));

        let thsHtml = printHeaders.map(h => `<th>${escapeHTML(h)}</th>`).join('');
        let trsHtml = printRows.map((r, rIdx) => {
            return `<tr><td class="center-col" style="color: #4b5563;">${rIdx + 1}</td>${r.map(cell => `<td style="color: #111827;">${escapeHTML(cell)}</td>`).join('')}</tr>`;
        }).join('');

        reportDisplayName = 'Report 1: Working Hours';
        countText = `${printRows.length} records`;

        printHtml = `
            <div class="print-header-banner">
                <div class="print-header-left">
                    <h1 class="print-header-title">Report 1: Working Hours &amp; Shifts</h1>
                    <p class="print-header-sub">
                        <strong>Source:</strong> ${escapeHTML(appState.hoursFileName || 'Working Hours CSV')} &bull;
                        <strong>Total Candidates:</strong> ${printRows.length} Records
                    </p>
                </div>
                <div class="print-header-right">
                    <div><strong>Generated:</strong> ${escapeHTML(generatedDateStr)}</div>
                </div>
            </div>
            <table class="print-table">
                <thead>
                    <tr><th class="center-col" style="width: 35px;">#</th>${thsHtml}</tr>
                </thead>
                <tbody>${trsHtml}</tbody>
            </table>
            <div class="print-doc-footer">
                <span>Under 40 Report Dashboard &bull; Report 1: Working Hours</span>
                <span>Generated: ${escapeHTML(generatedDateStr)}</span>
            </div>
        `;
    } else if (activeTab === 'report2') {
        if (!appState.leavesData || appState.leavesData.length === 0) {
            showToast('No Report 2 data to export. Please upload leaves report first.', 'error');
            return;
        }
        const raw = appState.leavesData;
        const header = raw[0] || [];
        const printRows = raw.slice(1);

        let thsHtml = header.map(h => `<th>${escapeHTML(h)}</th>`).join('');
        let trsHtml = printRows.map((r, rIdx) => {
            return `<tr><td class="center-col" style="color: #4b5563;">${rIdx + 1}</td>${r.map(cell => `<td style="color: #111827;">${escapeHTML(cell)}</td>`).join('')}</tr>`;
        }).join('');

        reportDisplayName = 'Report 2: Leaves Details';
        countText = `${printRows.length} entries`;

        printHtml = `
            <div class="print-header-banner">
                <div class="print-header-left">
                    <h1 class="print-header-title">Report 2: Leaves &amp; Sick Details</h1>
                    <p class="print-header-sub">
                        <strong>Source:</strong> ${escapeHTML(appState.leavesFileName || 'Leaves CSV')} &bull;
                        <strong>Total Entries:</strong> ${printRows.length} Records
                    </p>
                </div>
                <div class="print-header-right">
                    <div><strong>Generated:</strong> ${escapeHTML(generatedDateStr)}</div>
                </div>
            </div>
            <table class="print-table">
                <thead>
                    <tr><th class="center-col" style="width: 35px;">#</th>${thsHtml}</tr>
                </thead>
                <tbody>${trsHtml}</tbody>
            </table>
            <div class="print-doc-footer">
                <span>Under 40 Report Dashboard &bull; Report 2: Leaves &amp; Sick Details</span>
                <span>Generated: ${escapeHTML(generatedDateStr)}</span>
            </div>
        `;
    } else {
        // 'final' (Under 40 Report) or 'all' (All Processed Candidates)
        const isAllScope = activeTab === 'all';
        const candidateList = isAllScope 
            ? (appState.allProcessedCandidates || []) 
            : ((appState.results && appState.results.length > 0) ? appState.results : (appState.allProcessedCandidates || []));

        if (candidateList.length === 0) {
            showToast('No report data to print. Please upload reports first.', 'error');
            return;
        }

        const under40List = appState.results || [];
        const totalShortageDecimal = under40List.reduce((sum, c) => sum + (c.missingHours || 0), 0);

        reportDisplayName = isAllScope ? 'All Processed Candidates Report' : 'Weekly Under 40 Hours Report';
        countText = `${candidateList.length} candidates`;
        shortageText = formatHours(totalShortageDecimal);

        let periodLabel = appState.weekLabel || `Week ending ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        const sourceFiles = [
            appState.hoursFileName ? `Hours: ${escapeHTML(appState.hoursFileName)}` : '',
            appState.leavesFileName ? `Leaves: ${escapeHTML(appState.leavesFileName)}` : ''
        ].filter(Boolean).join(' | ') || 'Uploaded Timesheet Reports';

        const headerHtml = `
            <div class="print-header-banner">
                <div class="print-header-left">
                    <h1 class="print-header-title">${escapeHTML(reportDisplayName)}</h1>
                    <p class="print-header-sub">
                        <strong>Period:</strong> ${escapeHTML(periodLabel)} &bull; 
                        <strong>Scope:</strong> ${isAllScope ? 'All Processed Candidates' : 'Candidates Under 40 Hours Only'} &bull;
                        <strong>Target:</strong> 40.00h / week
                    </p>
                </div>
                <div class="print-header-right">
                    <div><strong>Generated:</strong> ${escapeHTML(generatedDateStr)}</div>
                    <div><strong>Source:</strong> ${sourceFiles}</div>
                </div>
            </div>
        `;

        let rowsHtml = '';
        candidateList.forEach((c, idx) => {
            const isUnder = !c.compliant;
            const statusBadge = isUnder 
                ? `<span class="print-deficit-badge">-${formatHours(c.missingHours)}</span>`
                : `<span style="color: #15803d; font-weight: 700;">COMPLIANT</span>`;

            let faultClass = 'print-badge-neutral';
            const faultLower = (c.dispatchFault || '').toLowerCase();
            if (faultLower === 'candidate') faultClass = 'print-badge-candidate';
            else if (faultLower === 'client') faultClass = 'print-badge-client';
            else if (faultLower === 'agency') faultClass = 'print-badge-agency';

            const faultBadge = c.dispatchFault 
                ? `<span class="print-badge ${faultClass}">${escapeHTML(c.dispatchFault)}</span>` 
                : `<span style="color: #9ca3af;">—</span>`;

            rowsHtml += `
                <tr>
                    <td class="center-col" style="font-weight: 600; color: #4b5563;">${idx + 1}</td>
                    <td style="color: #111827;">
                        <div class="print-candidate-name" style="color: #111827; font-weight: 700;">${escapeHTML(c.candidateName)}</div>
                    </td>
                    <td style="color: #111827;">${escapeHTML(c.clientName || '—')}</td>
                    <td class="num-col" style="color: #111827;">${formatHours(c.originalHours)}</td>
                    <td class="num-col" style="color: #111827;">${formatHours(c.leaveHours)}</td>
                    <td class="num-col" style="color: #111827;">${formatHours(c.publicHoliday)}</td>
                    <td class="num-col" style="font-weight: 700; color: #111827;">${formatHours(c.adjustedHours)}</td>
                    <td class="center-col">${statusBadge}</td>
                    <td class="center-col">${faultBadge}</td>
                    <td class="center-col" style="font-size: 7.2pt; color: #111827;">${escapeHTML(c.formOfPay || '—')}</td>
                    <td class="center-col" style="font-size: 7.2pt; color: #111827;">${escapeHTML(c.informedClient || '—')}</td>
                    <td style="font-size: 7.2pt; max-width: 160px; color: #111827;">${escapeHTML(c.comments || '—')}</td>
                </tr>
            `;
        });

        const tableHtml = `
            <table class="print-table">
                <thead>
                    <tr>
                        <th class="center-col" style="width: 25px;">#</th>
                        <th>Candidate Name</th>
                        <th style="width: 110px;">Client Name</th>
                        <th class="num-col" style="width: 60px;">Worked</th>
                        <th class="num-col" style="width: 60px;">Leaves</th>
                        <th class="num-col" style="width: 55px;">Holiday</th>
                        <th class="num-col" style="width: 65px;">Total Adj.</th>
                        <th class="center-col" style="width: 75px;">Shortage</th>
                        <th class="center-col" style="width: 75px;">Fault</th>
                        <th class="center-col" style="width: 65px;">Pay Form</th>
                        <th class="center-col" style="width: 65px;">Informed</th>
                        <th style="width: 140px;">Manager Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;

        const footerHtml = `
            <div class="print-doc-footer">
                <span>Under 40 Report Dashboard &bull; ${escapeHTML(reportDisplayName)}</span>
                <span>Generated: ${escapeHTML(generatedDateStr)}</span>
            </div>
        `;

        printHtml = headerHtml + tableHtml + footerHtml;
    }

    if (printableReportContainer) {
        printableReportContainer.innerHTML = printHtml;
    }

    if (options && options.directPrint) {
        if (document.body) {
            document.body.classList.remove('pdf-portrait');
        }
        window.print();
        return;
    }

    // Open on-screen preview modal before printing
    openPdfPreviewModal(
        printHtml,
        reportDisplayName,
        countText,
        shortageText,
        'landscape'
    );
}

// Save & Open Weekly Report Handlers
async function saveWeeklyReport() {
    if (!appState.hoursData && !appState.leavesData) {
        showToast('No report data loaded to save. Please upload your weekly reports first.', 'error');
        return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const defaultName = `Under40_Report_Week_${today}.json`;

    const reportBundle = {
        version: "1.0",
        app: "Under40ReportDashboard",
        reportType: "weekly_report",
        weekLabel: `Week_${today}`,
        savedAt: new Date().toISOString(),
        hoursFileName: appState.hoursFileName || (document.getElementById('file-name-1') ? document.getElementById('file-name-1').textContent : 'Report 1'),
        leavesFileName: appState.leavesFileName || (document.getElementById('file-name-2') ? document.getElementById('file-name-2').textContent : 'Report 2'),
        hoursData: appState.hoursData,
        leavesData: appState.leavesData,
        results: appState.results || [],
        allProcessedCandidates: appState.allProcessedCandidates || [],
        overrides: appState.overrides || {},
        deletedCandidates: appState.deletedCandidates || [],
        config: appState.config,
        activeTab: appState.activeTab,
        stats: {
            processed: statsProcessed ? statsProcessed.textContent : '0',
            excluded: statsExcluded ? statsExcluded.textContent : '0',
            under40: statsUnder40 ? statsUnder40.textContent : '0',
            leaves: statsLeaves ? statsLeaves.textContent : '0'
        }
    };

    const jsonString = JSON.stringify(reportBundle, null, 2);

    // Modern Native File System Picker: Lets user choose ANY folder/path and filename
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: defaultName,
                types: [{
                    description: 'Under 40 Report File (*.json, *.u40)',
                    accept: {
                        'application/json': ['.json', '.u40']
                    }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(jsonString);
            await writable.close();

            saveAppStateToLocalStorage();
            showToast(`Report saved directly to chosen location: "${handle.name}"`, 'success');
            return;
        } catch (err) {
            if (err.name === 'AbortError') {
                return; // User canceled the Save As dialog
            }
            console.warn('File picker error, falling back to prompt:', err);
        }
    }

    // Fallback for browsers without File System Access API
    const userPrompt = typeof prompt === 'function' ? prompt('Enter a name or label for this weekly report file:', defaultName.replace('.json', '')) : defaultName;
    if (userPrompt === null) {
        return; // User canceled
    }

    const reportName = (userPrompt.trim() || defaultName.replace('.json', '')).replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
    const finalName = reportName.endsWith('.json') ? reportName : `${reportName}.json`;

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Also persist in local storage as active state
    saveAppStateToLocalStorage();

    showToast(`Weekly report "${finalName}" saved successfully!`, 'success');
}

function handleOpenReportFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && !file.name.endsWith('.u40')) {
        showToast('Please select a saved report file (.json or .u40).', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
        loadReportFromJSONText(evt.target.result, file.name);
        if (openReportFile) openReportFile.value = '';
    };
    reader.readAsText(file);
}

function loadReportFromJSONText(text, sourceFileName) {
    try {
        const data = JSON.parse(text);
        if (!data || (!data.hoursData && !data.leavesData)) {
            showToast('Invalid report file: missing report data.', 'error');
            return false;
        }

        appState.hoursData = data.hoursData || null;
        appState.leavesData = data.leavesData || null;
        appState.hoursFileName = data.hoursFileName || 'Report 1 loaded';
        appState.leavesFileName = data.leavesFileName || 'Report 2 loaded';
        appState.overrides = data.overrides || {};
        appState.deletedCandidates = data.deletedCandidates || [];
        if (data.config) {
            appState.config = Object.assign({}, appState.config, data.config);
        }
        if (data.activeTab) {
            appState.activeTab = data.activeTab;
            document.querySelectorAll('.tab-btn').forEach(b => {
                if (b.getAttribute('data-tab') === appState.activeTab) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
        }

        // Update upload drop zones
        updateUploadZoneUI();

        // Process and display reports
        processReports();

        // Save into localStorage
        saveAppStateToLocalStorage();

        const label = data.weekLabel || sourceFileName || 'Saved Report';
        const dateNote = data.savedAt ? ` (Saved ${new Date(data.savedAt).toLocaleDateString()})` : '';
        showToast(`Report "${label}"${dateNote} opened successfully!`, 'success');
        return true;
    } catch (err) {
        console.error('Error loading report JSON:', err);
        showToast(`Failed to open report file: ${err.message}`, 'error');
        return false;
    }
}

// =====================================================
// Grand Summary (Monthly Consolidation) Handlers
// =====================================================

function extractWeekNumberFromFileName(fileName, fallbackIndex) {
    if (!fileName) return fallbackIndex;
    const match = fileName.match(/(?:week|w|payroll|wk)[\s_-]*([1-5])/i) || fileName.match(/\b([1-5])\b/);
    if (match) return parseInt(match[1], 10);
    return fallbackIndex;
}

async function handleGrandSummaryFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const parsedWeeks = [];

    for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        const weekNum = extractWeekNumberFromFileName(file.name, i + 1);
        const fileName = file.name;

        try {
            const text = await readFileAsText(file);
            let candidates = [];
            let weekLabel = `Week ${weekNum}`;

            if (fileName.endsWith('.json') || fileName.endsWith('.u40')) {
                const data = JSON.parse(text);
                weekLabel = data.weekLabel || `Week ${weekNum}`;
                candidates = data.results || data.allProcessedCandidates || [];
            } else if (fileName.endsWith('.csv')) {
                const parsed = parseCSV(text);
                if (parsed.length > 1) {
                    const header = parsed[0];
                    const nameCol = findColumnIndex(header, ["candidate name", "name", "candidate"]);
                    const missingCol = findColumnIndex(header, ["missing hours", "missing", "shortage", "deficit"]);
                    const workedCol = findColumnIndex(header, ["total", "adjusted hours", "original hours", "hours worked", "worked"]);
                    const leavesCol = findColumnIndex(header, ["leave hours", "leaves hours", "leaves"]);
                    const clientCol = findColumnIndex(header, ["client name", "client"]);
                    const faultCol = findColumnIndex(header, ["dispatch", "who's fault", "fault"]);
                    const leaveBalCol = findColumnIndex(header, ["leave balance", "leave balance - hrs (charmaine)", "charmaine", "balance leave", "leave bal"]);
                    const commentCol = findColumnIndex(header, ["comments", "comment", "notes"]);
                    const payCol = findColumnIndex(header, ["form of pay", "pay"]);
                    const informedCol = findColumnIndex(header, ["informed client", "informed"]);

                    for (let r = 1; r < parsed.length; r++) {
                        const row = parsed[r];
                        const name = nameCol >= 0 ? (row[nameCol] || '').trim() : '';
                        if (!name) continue;

                        candidates.push({
                            candidateName: name,
                            missingHours: missingCol >= 0 ? parseTimeToDecimal(row[missingCol]) : 0,
                            originalHours: workedCol >= 0 ? parseTimeToDecimal(row[workedCol]) : 0,
                            leaveHours: leavesCol >= 0 ? parseTimeToDecimal(row[leavesCol]) : 0,
                            clientName: clientCol >= 0 ? (row[clientCol] || '').trim() : '',
                            dispatchFault: faultCol >= 0 ? (row[faultCol] || '').trim() : '',
                            leaveBalance: leaveBalCol >= 0 ? (row[leaveBalCol] || '').trim() : '',
                            comments: commentCol >= 0 ? (row[commentCol] || '').trim() : '',
                            formOfPay: payCol >= 0 ? (row[payCol] || '').trim() : '',
                            informedClient: informedCol >= 0 ? (row[informedCol] || '').trim() : ''
                        });
                    }
                }
            }

            parsedWeeks.push({
                weekNumber: weekNum,
                weekLabel: weekLabel,
                fileName: fileName,
                candidates: candidates
            });
        } catch (err) {
            console.error('Error parsing weekly file:', fileName, err);
            showToast(`Could not read "${fileName}": ${err.message}`, 'error');
        }
    }

    if (parsedWeeks.length === 0) {
        showToast('No valid weekly report files could be loaded.', 'error');
        return;
    }

    // Sort weeks chronologically by week number
    parsedWeeks.sort((a, b) => a.weekNumber - b.weekNumber);

    if (!appState.grandSummary) {
        appState.grandSummary = { weeks: [], mergedCandidates: [] };
    }
    appState.grandSummary.weeks = parsedWeeks;

    processGrandSummaryData();
    renderGrandSummary();

    showToast(`Loaded and merged ${parsedWeeks.length} weekly reports for the monthly grand summary!`, 'success');
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('File reading failed.'));
        reader.readAsText(file);
    });
}

function processGrandSummaryData() {
    if (!appState.grandSummary || !appState.grandSummary.weeks) return;
    const weeks = appState.grandSummary.weeks;
    const numWeeks = weeks.length;
    const candidateMap = new Map();

    weeks.forEach((wk, wIdx) => {
        (wk.candidates || []).forEach(c => {
            const rawName = c.candidateName || c.name || '';
            const trimmedName = rawName.trim();
            if (!trimmedName) return;

            let matchedKey = null;
            for (const existingKey of candidateMap.keys()) {
                if (areNamesMatching(existingKey, trimmedName)) {
                    matchedKey = existingKey;
                    break;
                }
            }

            if (!matchedKey) {
                matchedKey = trimmedName;
                candidateMap.set(matchedKey, {
                    candidateName: trimmedName,
                    weeklyMissing: new Array(numWeeks).fill(0),
                    weeklyWorked: new Array(numWeeks).fill(0),
                    totalMissing: 0,
                    totalWorked: 0,
                    totalLeaves: 0,
                    clientName: c.clientName || '',
                    dispatchFault: c.dispatchFault || '',
                    leaveBalance: c.leaveBalance || '',
                    formOfPay: c.formOfPay || '',
                    informedClient: c.informedClient || '',
                    comments: c.comments || ''
                });
            }

            const rec = candidateMap.get(matchedKey);
            const missing = typeof c.missingHours === 'number' ? c.missingHours : parseTimeToDecimal(c.missingHours);
            const worked = typeof c.originalHours === 'number' ? c.originalHours : parseTimeToDecimal(c.originalHours);
            const leaves = typeof c.leaveHours === 'number' ? c.leaveHours : parseTimeToDecimal(c.leaveHours);

            rec.weeklyMissing[wIdx] = missing;
            rec.weeklyWorked[wIdx] = worked;
            rec.totalMissing += missing;
            rec.totalWorked += worked;
            rec.totalLeaves += leaves;

            if (!rec.clientName && c.clientName) rec.clientName = c.clientName;
            if (!rec.dispatchFault && c.dispatchFault) rec.dispatchFault = c.dispatchFault;
            if (!rec.leaveBalance && c.leaveBalance) rec.leaveBalance = c.leaveBalance;
            if (!rec.formOfPay && c.formOfPay) rec.formOfPay = c.formOfPay;
            if (!rec.informedClient && c.informedClient) rec.informedClient = c.informedClient;
            if (!rec.comments && c.comments) rec.comments = c.comments;
        });
    });

    // Candidates with missing hours across the month, sorted highest shortage first
    const mergedList = Array.from(candidateMap.values())
        .filter(c => c.totalMissing > 0)
        .sort((a, b) => b.totalMissing - a.totalMissing);

    appState.grandSummary.mergedCandidates = mergedList;
}

function renderGrandSummary() {
    if (!grandSummaryView) return;

    const weeks = (appState.grandSummary && appState.grandSummary.weeks) || [];
    const hasWeeks = weeks.length > 0;

    if (!hasWeeks) {
        if (grandEmptyState) grandEmptyState.style.display = 'block';
        if (grandTableWrapper) grandTableWrapper.style.display = 'none';
        if (grandSummaryActionsBar) grandSummaryActionsBar.style.display = 'none';
        return;
    }

    if (grandEmptyState) grandEmptyState.style.display = 'none';
    if (grandTableWrapper) grandTableWrapper.style.display = 'block';
    if (grandSummaryActionsBar) grandSummaryActionsBar.style.display = 'flex';

    // Render badges
    if (grandWeeksBadges) {
        grandWeeksBadges.innerHTML = weeks.map(w => `
            <span class="grand-week-badge">
                ✓ ${escapeHTML(w.weekLabel || ('Week ' + w.weekNumber))} (${w.candidates.length} candidates)
            </span>
        `).join('');
    }

    renderGrandSummaryTable();
}

let currentPdfPrintHtml = '';
let currentPdfOrientation = 'landscape';

function openPdfPreviewModal(printHtml, viewName, countText, shortageText, orientation = 'landscape') {
    currentPdfPrintHtml = printHtml;
    currentPdfOrientation = orientation;

    if (pdfPreviewViewName) pdfPreviewViewName.textContent = viewName;
    if (pdfPreviewCount) pdfPreviewCount.textContent = countText;
    if (pdfPreviewShortage) pdfPreviewShortage.textContent = shortageText;
    if (pdfPreviewOrient) pdfPreviewOrient.textContent = orientation === 'portrait' ? 'Portrait (A4)' : 'Landscape (A4)';
    if (pdfPreviewContent) pdfPreviewContent.innerHTML = printHtml;

    if (pdfPreviewModal) {
        pdfPreviewModal.style.display = 'flex';
    }
}

function closePdfPreviewModal() {
    if (pdfPreviewModal) {
        pdfPreviewModal.style.display = 'none';
    }
}

function confirmPdfPrint() {
    if (printableReportContainer && currentPdfPrintHtml) {
        printableReportContainer.innerHTML = currentPdfPrintHtml;
    }

    if (document.body) {
        if (currentPdfOrientation === 'portrait') {
            document.body.classList.add('pdf-portrait');
        } else {
            document.body.classList.remove('pdf-portrait');
        }
    }

    if (pdfPreviewModal) {
        pdfPreviewModal.style.display = 'none';
    }

    window.print();
}

function renderGrandSummaryTable() {
    if (!grandTableHead || !grandTableBody) return;

    const weeks = (appState.grandSummary && appState.grandSummary.weeks) || [];
    const merged = (appState.grandSummary && appState.grandSummary.mergedCandidates) || [];
    const numWeeks = weeks.length;

    if (!appState.grandSummarySort) {
        appState.grandSummarySort = { column: 'name', direction: 'asc' };
    }
    const sortCol = appState.grandSummarySort.column || 'name';
    const sortDir = appState.grandSummarySort.direction || 'asc';

    // Filter by search query
    let filtered = [...merged];
    if (appState.searchQuery) {
        const q = appState.searchQuery.toLowerCase();
        filtered = filtered.filter(c => c.candidateName.toLowerCase().includes(q));
    }

    // Sort filtered candidates
    filtered.sort((a, b) => {
        if (sortCol === 'name') {
            const cmp = a.candidateName.localeCompare(b.candidateName, undefined, { sensitivity: 'base' });
            return sortDir === 'asc' ? cmp : -cmp;
        } else if (sortCol === 'totalMissing') {
            const diff = (a.totalMissing || 0) - (b.totalMissing || 0);
            return sortDir === 'asc' ? diff : -diff;
        } else if (sortCol.startsWith('week-')) {
            const wIdx = parseInt(sortCol.replace('week-', ''), 10);
            const aVal = (a.weeklyMissing && a.weeklyMissing[wIdx]) || 0;
            const bVal = (b.weeklyMissing && b.weeklyMissing[wIdx]) || 0;
            const diff = aVal - bVal;
            return sortDir === 'asc' ? diff : -diff;
        }
        return 0;
    });

    const nameSortIcon = sortCol === 'name' ? (sortDir === 'asc' ? '▲ A-Z' : '▼ Z-A') : '⇅';
    const missingSortIcon = sortCol === 'totalMissing' ? (sortDir === 'desc' ? '▼ High' : '▲ Low') : '⇅';

    // Header
    let headHtml = '<tr>';
    headHtml += '<th class="center-col" style="width: 45px;">#</th>';
    headHtml += `
        <th class="sortable-th grand-sort-col ${sortCol === 'name' ? 'active-sort' : ''}" data-sort="name" style="cursor: pointer; user-select: none;" title="Click to sort by Candidate Name (A-Z / Z-A)">
            <div class="grand-th-flex">
                <span>Candidate Name <span style="font-weight: 500; font-size: 0.72rem; color: #818cf8; margin-left: 0.35rem;">(${filtered.length} candidates)</span></span>
                <span class="grand-sort-icon">${nameSortIcon}</span>
            </div>
        </th>
    `;
    for (let w = 0; w < numWeeks; w++) {
        const label = weeks[w].weekLabel || `Week ${weeks[w].weekNumber}`;
        const isThisWeek = sortCol === `week-${w}`;
        const weekSortIcon = isThisWeek ? (sortDir === 'desc' ? '▼' : '▲') : '⇅';
        headHtml += `
            <th class="center-col sortable-th grand-sort-col ${isThisWeek ? 'active-sort' : ''}" data-sort="week-${w}" style="width: 120px; cursor: pointer; user-select: none;" title="Click to sort by ${escapeHTML(label)} missing hours">
                <div class="grand-th-flex center">
                    <span>${escapeHTML(label)} Missing</span>
                    <span class="grand-sort-icon" style="margin-left: 4px;">${weekSortIcon}</span>
                </div>
            </th>
        `;
    }
    headHtml += `
        <th class="center-col sortable-th grand-sort-col ${sortCol === 'totalMissing' ? 'active-sort' : ''}" data-sort="totalMissing" style="width: 150px; cursor: pointer; user-select: none;" title="Click to sort by Grand Total Missing">
            <div class="grand-th-flex center">
                <span>Grand Total Missing</span>
                <span class="grand-sort-icon" style="margin-left: 4px;">${missingSortIcon}</span>
            </div>
        </th>
    `;
    headHtml += '</tr>';
    grandTableHead.innerHTML = headHtml;

    if (filtered.length === 0) {
        grandTableBody.innerHTML = `
            <tr>
                <td colspan="${numWeeks + 3}" class="empty-state">
                    <p>${merged.length === 0 ? 'No candidates with missing hours found in the loaded weekly reports.' : 'No candidates matching search query.'}</p>
                </td>
            </tr>
        `;
        return;
    }

    let bodyHtml = '';
    for (let i = 0; i < filtered.length; i++) {
        const c = filtered[i];
        bodyHtml += '<tr>';
        bodyHtml += `<td class="center-col">${i + 1}</td>`;
        bodyHtml += `<td><strong>${escapeHTML(c.candidateName)}</strong></td>`;
        for (let w = 0; w < numWeeks; w++) {
            const val = c.weeklyMissing[w] || 0;
            bodyHtml += `<td class="center-col"><span class="hours-badge ${val > 0 ? 'warning' : 'success'}">${formatHours(val)}</span></td>`;
        }
        bodyHtml += `<td class="center-col"><span class="total-missing-badge">${formatHours(c.totalMissing)}</span></td>`;
        bodyHtml += '</tr>';
    }
    grandTableBody.innerHTML = bodyHtml;
}

function sendGrandSummaryToSummaryReport() {
    if (!appState.grandSummary || !appState.grandSummary.mergedCandidates || appState.grandSummary.mergedCandidates.length === 0) {
        showToast('No candidates with missing hours available to transfer.', 'error');
        return;
    }

    const mergedList = appState.grandSummary.mergedCandidates;

    // Populate ONLY the Summary Report tab with the merged candidates from Grand Summary
    // (Never touches weekly reports, weekly hours target, candidate types, drop zones or status)
    appState.summaryCandidates = mergedList.map(c => ({
        candidateName: c.candidateName,
        clientName: c.clientName || '',
        dispatchFault: c.dispatchFault || '',
        leaveBalance: c.leaveBalance || '',
        missingHours: c.totalMissing,
        originalHours: c.totalWorked || 0,
        leaveHours: c.totalLeaves || 0,
        adjustedHours: (c.totalWorked || 0) + (c.totalLeaves || 0),
        publicHoliday: 0,
        weeklyHours: 40,
        compliant: false,
        comments: c.comments || '',
        formOfPay: c.formOfPay || '',
        informedClient: c.informedClient || '',
        leaves: []
    }));

    // Switch active tab to 'summary'
    appState.activeTab = 'summary';
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === 'summary') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    renderResults();
    saveAppStateToLocalStorage();

    showToast(`Loaded ${appState.summaryCandidates.length} candidates from Grand Summary into Summary Report!`, 'success');
}

function exportGrandSummaryCSV() {
    if (!appState.grandSummary || !appState.grandSummary.mergedCandidates || appState.grandSummary.mergedCandidates.length === 0) {
        showToast('No grand summary data to export. Please load weekly files first.', 'error');
        return;
    }

    const weeks = appState.grandSummary.weeks || [];
    const weekHeaders = weeks.map(w => `${w.weekLabel || ('Week ' + w.weekNumber)} Missing`);
    const headers = [
        "Candidate Name",
        ...weekHeaders,
        "Grand Total Missing Hours"
    ];

    let candidatesToExport = [...appState.grandSummary.mergedCandidates];
    if (appState.searchQuery) {
        const q = appState.searchQuery.toLowerCase();
        candidatesToExport = candidatesToExport.filter(c => c.candidateName.toLowerCase().includes(q));
    }

    const sortCol = appState.grandSummarySort ? appState.grandSummarySort.column : 'name';
    const sortDir = appState.grandSummarySort ? appState.grandSummarySort.direction : 'asc';
    candidatesToExport.sort((a, b) => {
        if (sortCol === 'name') {
            const cmp = a.candidateName.localeCompare(b.candidateName, undefined, { sensitivity: 'base' });
            return sortDir === 'asc' ? cmp : -cmp;
        } else if (sortCol === 'totalMissing') {
            const diff = (a.totalMissing || 0) - (b.totalMissing || 0);
            return sortDir === 'asc' ? diff : -diff;
        } else if (sortCol.startsWith('week-')) {
            const wIdx = parseInt(sortCol.replace('week-', ''), 10);
            const aVal = (a.weeklyMissing && a.weeklyMissing[wIdx]) || 0;
            const bVal = (b.weeklyMissing && b.weeklyMissing[wIdx]) || 0;
            const diff = aVal - bVal;
            return sortDir === 'asc' ? diff : -diff;
        }
        return 0;
    });

    const rows = candidatesToExport.map(c => [
        c.candidateName,
        ...c.weeklyMissing.map(m => formatHours(m)),
        formatHours(c.totalMissing)
    ]);

    const csvData = [headers, ...rows];
    openCsvPreviewModal(csvData, 'Monthly_Grand_Summary', 'Monthly Grand Summary Report');
}

function exportGrandSummaryPDF(options = {}) {
    if (!appState.grandSummary || !appState.grandSummary.mergedCandidates || appState.grandSummary.mergedCandidates.length === 0) {
        showToast('No grand summary data to print. Please load weekly files first.', 'error');
        return;
    }

    const weeks = (appState.grandSummary && appState.grandSummary.weeks) || [];
    const merged = (appState.grandSummary && appState.grandSummary.mergedCandidates) || [];
    const numWeeks = weeks.length;

    let candidatesToPrint = [...merged];
    if (appState.searchQuery) {
        const q = appState.searchQuery.toLowerCase();
        candidatesToPrint = candidatesToPrint.filter(c => c.candidateName.toLowerCase().includes(q));
    }

    const sortCol = appState.grandSummarySort ? appState.grandSummarySort.column : 'name';
    const sortDir = appState.grandSummarySort ? appState.grandSummarySort.direction : 'asc';
    candidatesToPrint.sort((a, b) => {
        if (sortCol === 'name') {
            const cmp = a.candidateName.localeCompare(b.candidateName, undefined, { sensitivity: 'base' });
            return sortDir === 'asc' ? cmp : -cmp;
        } else if (sortCol === 'totalMissing') {
            const diff = (a.totalMissing || 0) - (b.totalMissing || 0);
            return sortDir === 'asc' ? diff : -diff;
        } else if (sortCol.startsWith('week-')) {
            const wIdx = parseInt(sortCol.replace('week-', ''), 10);
            const aVal = (a.weeklyMissing && a.weeklyMissing[wIdx]) || 0;
            const bVal = (b.weeklyMissing && b.weeklyMissing[wIdx]) || 0;
            const diff = aVal - bVal;
            return sortDir === 'asc' ? diff : -diff;
        }
        return 0;
    });

    const totalMissingSum = candidatesToPrint.reduce((sum, c) => sum + (c.totalMissing || 0), 0);

    const now = new Date();
    const generatedDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + 
                             now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    let rowsHtml = '';
    candidatesToPrint.forEach((c, idx) => {
        rowsHtml += `
            <tr>
                <td class="center-col" style="font-weight: 600; color: #4b5563;">${idx + 1}</td>
                <td style="color: #111827;"><strong style="color: #111827;">${escapeHTML(c.candidateName)}</strong></td>
                ${c.weeklyMissing.map(m => `
                    <td class="center-col num-col" style="color: #111827;">${m > 0 ? formatHours(m) : '—'}</td>
                `).join('')}
                <td class="center-col num-col print-deficit-text" style="font-weight: 700; color: #b91c1c;">${formatHours(c.totalMissing)}</td>
            </tr>
        `;
    });

    const printHtml = `
        <div class="print-header-banner">
            <div class="print-header-left">
                <h1 class="print-header-title">Monthly Under 40 Grand Summary Report</h1>
                <p class="print-header-sub">
                    <strong>Period:</strong> Consolidated Payroll (${numWeeks} Weeks) &bull; 
                    <strong>Scope:</strong> Candidates Under 40 Hours &bull;
                    <strong>Target:</strong> 40.00h / week
                </p>
            </div>
            <div class="print-header-right">
                <div><strong>Generated:</strong> ${escapeHTML(generatedDateStr)}</div>
                <div><strong>Weeks Merged:</strong> ${numWeeks} Weeks</div>
            </div>
        </div>

        <table class="print-table">
            <thead>
                <tr>
                    <th class="center-col" style="width: 35px;">#</th>
                    <th>Candidate Name</th>
                    ${weeks.map(w => `<th class="center-col" style="width: 90px;">${escapeHTML(w.weekLabel || ('Week ' + w.weekNumber))} Missing</th>`).join('')}
                    <th class="center-col" style="width: 120px;">Grand Total Missing</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>

        <div class="print-doc-footer">
            <span>Under 40 Report Dashboard &bull; Monthly Grand Summary Report</span>
            <span>Generated: ${escapeHTML(generatedDateStr)}</span>
        </div>
    `;

    if (printableReportContainer) {
        printableReportContainer.innerHTML = printHtml;
    }

    if (options && options.directPrint) {
        if (document.body) {
            document.body.classList.remove('pdf-portrait');
        }
        window.print();
        return;
    }

    // Open on-screen preview before printing
    openPdfPreviewModal(
        printHtml,
        'Monthly Grand Summary Report',
        `${candidatesToPrint.length} candidates`,
        formatHours(totalMissingSum),
        'landscape'
    );
}

function resetGrandSummary() {
    if (!appState.grandSummary) {
        appState.grandSummary = { weeks: [], mergedCandidates: [] };
    } else {
        appState.grandSummary.weeks = [];
        appState.grandSummary.mergedCandidates = [];
    }

    if (grandSummaryFileInput) {
        grandSummaryFileInput.value = '';
    }

    // Clear Summary Report data as well
    appState.summaryCandidates = [];
    localStorage.removeItem('under40_summaryCandidates');

    renderGrandSummary();
    renderResults();
    showToast('Grand Summary and Summary Report cleared.', 'info');
}

function exportSummaryReportPDF(options) {
    const summaryData = appState.summaryCandidates || [];
    if (summaryData.length === 0) {
        showToast('No summary report data to export. Please load from Grand Summary first.', 'error');
        return;
    }

    const now = new Date();
    const generatedDateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + 
                             now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    let candidatesToPrint = [...summaryData];
    if (appState.searchQuery) {
        const q = appState.searchQuery.toLowerCase();
        candidatesToPrint = candidatesToPrint.filter(c => (c.candidateName || '').toLowerCase().includes(q));
    }

    const totalMissingSum = candidatesToPrint.reduce((acc, c) => acc + (c.missingHours || 0), 0);

    let rowsHtml = '';
    for (let i = 0; i < candidatesToPrint.length; i++) {
        const c = candidatesToPrint[i];
        rowsHtml += `
            <tr>
                <td class="center-col" style="font-weight: 600; color: #4b5563;">${i + 1}</td>
                <td style="color: #111827;"><strong style="color: #111827;">${escapeHTML(c.candidateName)}</strong></td>
                <td style="color: #111827;">${escapeHTML(c.clientName || '—')}</td>
                <td class="center-col" style="color: #111827;">${escapeHTML(c.dispatchFault || '—')}</td>
                <td class="center-col" style="color: #111827;">${escapeHTML(c.leaveBalance || '—')}</td>
                <td class="center-col num-col print-deficit-text" style="font-weight: 700; color: #b91c1c;">-${formatHours(c.missingHours || 0)}</td>
                <td class="center-col" style="color: #111827;">${escapeHTML(c.formOfPay || '—')}</td>
                <td class="center-col" style="color: #111827;">${escapeHTML(c.informedClient || '—')}</td>
                <td style="font-size: 7.5pt; color: #111827;">${escapeHTML(c.comments || '—')}</td>
            </tr>
        `;
    }

    const printHtml = `
        <div class="print-header-banner">
            <div class="print-header-left">
                <h1 class="print-header-title">Under 40 Summary Report</h1>
                <p class="print-header-sub">
                    <strong>Scope:</strong> Transferred Candidates with Shortages &bull;
                    <strong>Target:</strong> 40.00h / week
                </p>
            </div>
            <div class="print-header-right">
                <div><strong>Generated:</strong> ${escapeHTML(generatedDateStr)}</div>
                <div><strong>Candidates:</strong> ${candidatesToPrint.length} Records</div>
            </div>
        </div>

        <table class="print-table">
            <thead>
                <tr>
                    <th class="center-col" style="width: 35px;">#</th>
                    <th>Candidate Name</th>
                    <th style="width: 120px;">Client Name</th>
                    <th class="center-col" style="width: 85px;">Dispatch Fault</th>
                    <th class="center-col" style="width: 85px;">Leave Balance</th>
                    <th class="center-col" style="width: 95px;">Missing Hours</th>
                    <th class="center-col" style="width: 80px;">Form of Pay</th>
                    <th class="center-col" style="width: 80px;">Informed</th>
                    <th>Comments / Reason</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>

        <div class="print-doc-footer">
            <span>Under 40 Report Dashboard &bull; Summary Report</span>
            <span>Generated: ${escapeHTML(generatedDateStr)}</span>
        </div>
    `;

    if (printableReportContainer) {
        printableReportContainer.innerHTML = printHtml;
    }

    if (options && options.directPrint) {
        if (document.body) {
            document.body.classList.remove('pdf-portrait');
        }
        window.print();
        return;
    }

    openPdfPreviewModal(
        printHtml,
        'Under 40 Summary Report',
        `${candidatesToPrint.length} candidates`,
        formatHours(totalMissingSum),
        'landscape'
    );
}

function clearSummaryReport() {
    appState.summaryCandidates = [];
    localStorage.removeItem('under40_summaryCandidates');
    renderResults();
    showToast('Summary Report cleared.', 'info');
}

/**
 * Compare two semver strings (e.g., '1.3' vs '1.2' or 'v1.2.1' vs '1.2').
 * Returns 1 if v1 > v2, -1 if v1 < v2, and 0 if equal.
 */
function compareVersions(v1, v2) {
    if (!v1 || !v2) return 0;
    const clean1 = String(v1).trim().replace(/^v/i, '');
    const clean2 = String(v2).trim().replace(/^v/i, '');
    const parts1 = clean1.split('.').map(num => parseInt(num, 10) || 0);
    const parts2 = clean2.split('.').map(num => parseInt(num, 10) || 0);
    const maxLen = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < maxLen; i++) {
        const num1 = parts1[i] || 0;
        const num2 = parts2[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
}

/**
 * Silently or manually checks for a newer application release from GitHub.
 */
async function checkForUpdates(options = { manual: false }) {
    if (options && options.manual) {
        showToast('Checking for updates...', 'info');
    }
    try {
        const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        const signal = controller ? controller.signal : undefined;
        let timeoutId = null;
        if (controller) {
            timeoutId = setTimeout(() => controller.abort(), UPDATE_CONFIG.checkTimeoutMs);
        }

        const checkUrl = `${UPDATE_CONFIG.versionUrl}?_t=${Date.now()}`;
        const response = await fetch(checkUrl, { signal: signal });
        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        const remoteVersion = data.version;
        const releaseNotes = data.releaseNotes || 'A new update is available with improvements and fixes.';
        const downloadUrl = data.downloadUrl || UPDATE_CONFIG.releasesUrl;

        if (compareVersions(remoteVersion, APP_VERSION) > 0) {
            if (updateBanner) {
                if (updateNewVersion) updateNewVersion.textContent = `v${remoteVersion}`;
                if (updateReleaseNotes) updateReleaseNotes.textContent = releaseNotes;
                if (updateDownloadBtn) updateDownloadBtn.href = downloadUrl;
                updateBanner.style.display = 'flex';
            }
            if (options && options.manual) {
                showToast(`New version v${remoteVersion} is available!`, 'success');
            }
        } else {
            if (options && options.manual) {
                showToast(`You are already running the latest version (v${APP_VERSION}).`, 'success');
            }
        }
    } catch (err) {
        if (options && options.manual) {
            showToast('Unable to check for updates right now. Please check your internet connection.', 'warning');
        } else {
            console.debug('Silent update check skipped/failed:', err && err.message ? err.message : err);
        }
    }
}

// Window exports
window.appState = appState;
window.APP_VERSION = APP_VERSION;
window.UPDATE_CONFIG = UPDATE_CONFIG;
window.compareVersions = compareVersions;
window.checkForUpdates = checkForUpdates;
window.saveWeeklyReport = saveWeeklyReport;
window.loadReportFromJSONText = loadReportFromJSONText;
window.openCsvPreviewModal = openCsvPreviewModal;
window.closeCsvPreviewModal = closeCsvPreviewModal;
window.confirmCsvDownload = confirmCsvDownload;
window.openPdfOptionsModal = openPdfOptionsModal;
window.closePdfOptionsModal = closePdfOptionsModal;
window.triggerPdfReportPrint = triggerPdfReportPrint;
window.renderPrintableReport = renderPrintableReport;
window.handleGrandSummaryFiles = handleGrandSummaryFiles;
window.processGrandSummaryData = processGrandSummaryData;
window.renderGrandSummary = renderGrandSummary;
window.renderGrandSummaryTable = renderGrandSummaryTable;
window.toggleGrandSummarySort = toggleGrandSummarySort;
window.sendGrandSummaryToSummaryReport = sendGrandSummaryToSummaryReport;
window.exportGrandSummaryCSV = exportGrandSummaryCSV;
window.exportGrandSummaryPDF = exportGrandSummaryPDF;
window.exportSummaryReportPDF = exportSummaryReportPDF;
window.clearSummaryReport = clearSummaryReport;
window.resetGrandSummary = resetGrandSummary;
window.openPdfPreviewModal = openPdfPreviewModal;
window.closePdfPreviewModal = closePdfPreviewModal;
window.confirmPdfPrint = confirmPdfPrint;
