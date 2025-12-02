// Presenter Mode for OpenPII Watcher Presentation
// Press 'P' to open presenter window with speaker notes

class PresenterMode {
    constructor() {
        this.presenterWindow = null;
        this.startTime = null;
        this.isPresenterMode = false;
        this.init();
    }

    init() {
        // Listen for 'N' key to open presenter mode
        document.addEventListener('keydown', (e) => {
            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault();
                this.openPresenterMode();
            }
        });

        // Check if this is the presenter window
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('presenter') === 'true') {
            this.isPresenterMode = true;
            this.setupPresenterView();
        } else {
            // Main window: listen for messages from presenter window
            this.listenToPresenterWindow();
        }
    }

    listenToPresenterWindow() {
        // Main window receives slide changes from presenter window
        window.addEventListener('message', (e) => {
            if (e.data.type === 'presenterSlideChange') {
                this.goToSlide(e.data.slideNum);
            }
        });
    }

    goToSlide(slideNum) {
        // Navigate main window to specific slide
        const slides = document.querySelectorAll('.slide');
        const targetSlide = document.querySelector(`.slide[data-slide="${slideNum}"]`);
        
        if (targetSlide) {
            // Remove active and prev classes from all slides
            slides.forEach(slide => {
                slide.classList.remove('active', 'prev');
            });
            
            // Activate target slide
            targetSlide.classList.add('active');
            
            // Update progress bar and counter if they exist
            const progressFill = document.getElementById('progressFill');
            const slideCounter = document.getElementById('slideCounter');
            if (progressFill) {
                const progress = (slideNum - 1) / 13 * 100;
                progressFill.style.width = progress + '%';
            }
            if (slideCounter) {
                slideCounter.textContent = `${slideNum} / 14`;
            }
        }
    }

    openPresenterMode() {
        if (this.presenterWindow && !this.presenterWindow.closed) {
            this.presenterWindow.focus();
            return;
        }

        // Open new window with presenter parameter
        const presenterUrl = window.location.href.split('?')[0] + '?presenter=true';
        this.presenterWindow = window.open(
            presenterUrl,
            'presenter',
            'width=1200,height=800,menubar=no,toolbar=no,location=no'
        );

        // Start timer
        this.startTime = Date.now();

        // Setup sync between windows
        this.setupSync();
    }

    setupSync() {
        // Listen for slide changes in main window
        const observer = new MutationObserver(() => {
            this.syncSlide();
        });

        observer.observe(document.querySelector('.presentation'), {
            attributes: true,
            subtree: true,
            attributeFilter: ['class']
        });

        // Also listen for keyboard navigation
        document.addEventListener('keydown', () => {
            setTimeout(() => this.syncSlide(), 100);
        });
    }

    syncSlide() {
        if (this.presenterWindow && !this.presenterWindow.closed) {
            const currentSlide = document.querySelector('.slide.active');
            if (currentSlide) {
                const slideNum = currentSlide.getAttribute('data-slide');
                this.presenterWindow.postMessage({
                    type: 'slideChange',
                    slideNum: slideNum
                }, '*');
            }
        }
    }

    setupPresenterView() {
        // This is the presenter window
        document.body.classList.add('presenter-mode');

        // Create presenter notes container
        this.createPresenterUI();

        // Listen for slide changes from main window
        window.addEventListener('message', (e) => {
            if (e.data.type === 'slideChange') {
                this.updatePresenterView(e.data.slideNum);
            }
        });

        // Update on local navigation and sync back to main window
        document.addEventListener('keydown', () => {
            setTimeout(() => {
                this.updatePresenterView();
                this.syncBackToMainWindow();
            }, 100);
        });

        // Start timer
        this.startTimer();
    }

    syncBackToMainWindow() {
        // Send current slide to main window
        const currentSlide = document.querySelector('.slide.active');
        if (currentSlide && window.opener && !window.opener.closed) {
            const slideNum = currentSlide.getAttribute('data-slide');
            window.opener.postMessage({
                type: 'presenterSlideChange',
                slideNum: slideNum
            }, '*');
        }
    }

    createPresenterUI() {
        // Create presenter notes panel
        const notesPanel = document.createElement('div');
        notesPanel.id = 'presenter-notes';
        notesPanel.innerHTML = `
            <div class="presenter-header">
                <div class="timer-section">
                    <div class="timer" id="elapsed-time">00:00</div>
                    <div class="timer-label">Elapsed Time</div>
                </div>
                <div class="slide-info" id="slide-info">
                    <div class="slide-number">Slide 1 / 14</div>
                    <div class="slide-timing">Target: 0:20</div>
                </div>
            </div>
            <div class="notes-content" id="notes-content">
                <p>Loading speaker notes...</p>
            </div>
        `;
        document.body.appendChild(notesPanel);
    }

    startTimer() {
        this.startTime = Date.now();
        setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            const timerEl = document.getElementById('elapsed-time');
            if (timerEl) {
                timerEl.textContent = timeStr;
                
                // Color code based on time
                if (elapsed > 630) { // Over 10:30
                    timerEl.style.color = '#dc2626';
                } else if (elapsed > 600) { // Over 10:00
                    timerEl.style.color = '#f59e0b';
                } else {
                    timerEl.style.color = '#059669';
                }
            }
        }, 1000);
    }

    updatePresenterView(slideNum) {
        const currentSlide = document.querySelector('.slide.active');
        if (!currentSlide) return;

        const slideNumber = slideNum || currentSlide.getAttribute('data-slide');
        const notes = this.getSpeakerNotes(slideNumber);

        // Update slide info
        const slideInfo = document.getElementById('slide-info');
        if (slideInfo) {
            slideInfo.querySelector('.slide-number').textContent = `Slide ${slideNumber} / 14`;
            slideInfo.querySelector('.slide-timing').textContent = `Target: ${notes.timing}`;
        }

        // Update notes content
        const notesContent = document.getElementById('notes-content');
        if (notesContent) {
            notesContent.innerHTML = notes.content;
        }
    }

    getSpeakerNotes(slideNum) {
        const notes = {
            '1': {
                timing: '0:20',
                content: `
                    <h3>Opening (Strong & Confident)</h3>
                    <p>"Good morning. I'm Surya, and with Arsh and Vijay, we built OpenPII Watcher—a system for detecting exposed PII in publicly shared documents like Google Docs and Pastebin.</p>
                    <p>The key results: we achieved <strong>84.3% precision</strong> and <strong>87.6% recall</strong> across six PII types. More importantly, we achieved <strong>perfect 100% F1-scores</strong> for structured PII like emails, addresses, and SSN, and an <strong>84% improvement</strong> over baseline patterns."</p>
                    <div class="key-points">
                        <strong>Key Points:</strong>
                        <ul>
                            <li>Project name clearly stated</li>
                            <li>Key results upfront (84.3%, 100% F1, +84%)</li>
                            <li>Team intro</li>
                        </ul>
                    </div>
                    <div class="transition">→ Transition: "Let me start with the problem we're solving."</div>
                `
            },
            '2': {
                timing: '0:45',
                content: `
                    <h3>Problem Statement</h3>
                    <p>"The problem is straightforward but widespread. People routinely share Google Docs with 'anyone with link' permissions, post Pastebin links on forums—often without realizing these documents contain sensitive PII.</p>
                    <p>On the left, exposure risks: publicly accessible documents with contact lists, signups, sensitive data. On the right, security impacts are serious: exposed emails enable <strong>targeted phishing</strong>, names and phones facilitate <strong>social engineering</strong>, and SSNs can lead to <strong>identity theft</strong>.</p>
                    <p>The key gap: users have no proactive way to check what PII their documents expose <em>before</em> sharing them."</p>
                    <div class="key-points">
                        <strong>Key Points:</strong>
                        <ul>
                            <li>Real-world scenarios (Docs, Pastebin)</li>
                            <li>Serious impacts (phishing, social engineering, identity theft)</li>
                            <li>The gap: no proactive tools</li>
                        </ul>
                    </div>
                    <div class="transition">→ Transition: "This raises our research question."</div>
                `
            },
            '3': {
                timing: '0:35',
                content: `
                    <h3>Research Question</h3>
                    <p>"Our research question: Can we systematically detect PII exposed through publicly accessible sharing links?</p>
                    <p>This breaks down into three sub-questions. First, <strong>accuracy</strong>—what detection accuracy is achievable using transparent, lightweight pattern matching? Second, <strong>coverage</strong>—can we detect diverse PII types? Third, <strong>privacy</strong>—can we do this entirely client-side?"</p>
                    <div class="key-points">
                        <strong>Key Points:</strong>
                        <ul>
                            <li>Main question clearly stated</li>
                            <li>Three dimensions: accuracy, coverage, privacy</li>
                            <li>Sets up the solution</li>
                        </ul>
                    </div>
                    <div class="transition">→ Transition: "Here's our solution."</div>
                `
            },
            '4': {
                timing: '0:50',
                content: `
                    <h3>Solution Overview - 6 Contributions</h3>
                    <p>"We built OpenPII Watcher with six key contributions:</p>
                    <ol>
                        <li><strong>Enhanced detection</strong> - improved regex patterns, <strong>84.3% precision</strong>, 84% improvement over baseline</li>
                        <li><strong>Multi-platform integration</strong> - Pastebin (<strong>95% success</strong>), Google Docs (<strong>60-80%</strong> via two-tier fallback)</li>
                        <li><strong>Privacy-first design</strong> - 100% client-side, no server, no data transmission</li>
                        <li><strong>Rigorous evaluation</strong> - <strong>16 documents</strong>, <strong>192 PII instances</strong>, ground truth</li>
                        <li><strong>Working demo</strong> - deployed on GitHub Pages, usable today</li>
                        <li><strong>Open source</strong> - complete code, evaluation, results public</li>
                    </ol>
                    <div class="transition">→ Transition: "Let me show you how the system works, starting with the architecture."</div>
                `
            },
            '5': {
                timing: '0:50',
                content: `
                    <h3>System Architecture [TECHNICAL]</h3>
                    <p>"Our system uses a modular <strong>three-layer architecture</strong> designed for separation of concerns.</p>
                    <p>The <strong>data layer</strong> handles URL parsing to identify the platform, performs content fetching with platform-specific strategies, and manages CORS challenges. This is essentially an adapter pattern.</p>
                    <p>The <strong>detection layer</strong> runs our enhanced regex patterns against the content. Six pattern matchers for different PII types, false positive filtering—like removing dates that match phone patterns—and confidence scoring. All patterns are transparent and auditable.</p>
                    <p>The <strong>output layer</strong> aggregates results, calculates risk score based on PII count—LOW for under 5, MEDIUM for 5-20, HIGH for over 20—and generates tailored security recommendations.</p>
                    <p>The entire pipeline runs <strong>client-side</strong> in the browser using JavaScript. No backend server, no API calls with user data."</p>
                    <div class="transition">→ Transition: "The data layer's platform integration was our biggest engineering challenge."</div>
                `
            },
            '6': {
                timing: '0:45',
                content: `
                    <h3>Platform Integration [TECHNICAL]</h3>
                    <p><strong>Pastebin</strong> was straightforward. Transform URL from <code>pastebin.com/ABC123</code> to <code>pastebin.com/raw/ABC123</code>. Their /raw/ endpoint natively supports CORS. Tested on 20+ pastes, achieved <strong>95%+ success</strong> with 200-300ms latency.</p>
                    <p><strong>Google Docs</strong> was significantly harder. We engineered a <strong>two-tier fallback strategy</strong>.</p>
                    <p><strong>Tier 1:</strong> Direct fetch from Google's export endpoint—<code>/export?format=txt</code>. Works for 'anyone with link' docs without auth, succeeds ~40% of time. We try this first for privacy—no third party.</p>
                    <p><strong>Tier 2:</strong> When tier 1 fails (CORS blocks), fallback to CORS proxy—<code>api.allorigins.win</code>—which adds headers to bypass same-origin policy. Provides additional 20-40% success, bringing combined to <strong>60-80%</strong>.</p>
                    <p>Implementation: wrap direct fetch in try-catch, if CORS blocks, automatically retry through proxy."</p>
                    <div class="transition">→ Transition: "Once we fetch the content, the detection layer runs our enhanced patterns."</div>
                `
            },
            '7': {
                timing: '1:10',
                content: `
                    <h3>Detection Patterns [TECHNICAL]</h3>
                    <p><strong>Perfect scores (F1: 1.000):</strong> Three PII types—emails, addresses, SSN—achieve perfection because they have consistent, well-defined formats.</p>
                    <p>For <strong>emails</strong>, our pattern handles edge cases like plus-sign tagging (<code>user+tag@domain.com</code>), multiple dots, underscores, subdomain addressing. Baseline <code>\\S+@\\S+\\.\\S+</code> misses these—that's why we get <strong>172% F1 improvement</strong>.</p>
                    <p><strong>Names</strong> achieve 0.723 F1 with <strong>94.1% recall</strong> and 58.7% precision. This is <em>intentional</em>. Pattern matches titles (Dr., Prof.), hyphens (Mary-Anne), apostrophes (O'Brien). The 45 false positives are predictable—'Credit Card', 'High Street'. We accept these because we're a privacy tool: better to alert to all potential names than miss real ones. 94.1% recall means we catch almost all actual names.</p>
                    <p><strong>Phones</strong>: Support multiple formats—<code>(555) 123-4567</code>, <code>555-123-4567</code>—and filter false positives by removing date-like patterns. If first 3 digits ≤12 and next 3 ≤31, reject as likely a date.</p>
                    <p><strong>Credit cards</strong>: 0.333 F1. Match 16-digit patterns, validate with Luhn algorithm. Low recall stems from test data limitations."</p>
                    <div class="transition">→ Transition: "So how well does this actually work? Here are our results."</div>
                `
            },
            '8': {
                timing: '1:20',
                content: `
                    <h3>Results - Simple and Visual</h3>
                    <p>"We tested on <strong>16 documents</strong> with <strong>192 PII instances</strong>. Let me show you the results in simple terms.</p>
                    <p>At the top, you see our overall performance: <strong>84% accuracy</strong>—meaning out of 100 detections, 84 are correct. <strong>88% coverage</strong>—we find 88 out of every 100 PII items that exist. And most importantly, <strong>3 PII types achieve perfect 100% detection</strong>.</p>
                    <p>Now look at the visual bars below. The green bars show our perfect scores:</p>
                    <p><strong>Emails:</strong> 100%—we tested 68 emails and found all 68 correctly, zero mistakes. <strong>Perfect</strong>.</p>
                    <p><strong>Addresses:</strong> 100%—all addresses detected perfectly.</p>
                    <p><strong>SSN:</strong> 100%—all social security numbers found correctly.</p>
                    <p>These three types have consistent formats, so regex works perfectly. This validates our core hypothesis: <em>regex-based detection is optimal for structured PII</em>.</p>
                    <p>For <strong>names</strong> and <strong>phones</strong>, you see blue bars at 72% and 68%. These are good scores. Names catch 94% of all names but have some false positives—that's intentional for a privacy tool. Phones work well but miss international formats."</p>
                    <div class="key-points">
                        <strong>Key message:</strong> "Three types are perfect, two types are good. Overall, we're 84% accurate and catch 88% of all PII."
                    </div>
                    <div class="transition">→ Transition: "But how does this compare to simple approaches? Let me show you."</div>
                `
            },
            '9': {
                timing: '1:00',
                content: `
                    <h3>Baseline Comparison - Visual Side-by-Side</h3>
                    <p>"To prove our enhanced patterns actually matter, we compared against simple baseline patterns—the kind you'd write in 5 minutes.</p>
                    <p>Look at the side-by-side comparison. On the left, red bars show baseline performance. On the right, green and blue bars show our system.</p>
                    <p><strong>Email detection:</strong> Baseline only finds 37 out of 100 emails—the red bar is tiny. Our system finds all 100—the green bar is full. That's <strong>172% better</strong>. Baseline patterns are too simple and miss most emails.</p>
                    <p><strong>Phone detection:</strong> Baseline finds only 34 out of 100 phones—red bar at 34%. Our system finds 68 out of 100—blue bar at 68%. That's <strong>100% improvement</strong>. Baseline only catches one format, we catch multiple.</p>
                    <p><strong>Address detection:</strong> This is the most dramatic. Baseline finds zero addresses—red bar is empty, 0%. Our system finds all addresses perfectly—green bar at 100%. This is a <strong>new capability</strong>—baseline couldn't do this at all.</p>
                    <p>Average improvement: <strong>84%</strong>. The visual bars make it clear: simple patterns miss most PII. Our enhanced approach finds much more and adds capabilities baseline can't do."</p>
                    <div class="key-points">
                        <strong>Key message:</strong> "The side-by-side bars show we're nearly twice as good, and we add capabilities baseline can't do."
                    </div>
                    <div class="transition">→ Transition: "Based on these results, we identified four key findings."</div>
                `
            },
            '10': {
                timing: '0:40',
                content: `
                    <h3>Key Findings</h3>
                    <ol>
                        <li><strong>Regex works for structured PII.</strong> Three perfect F1-scores validate regex for data with consistent patterns. This is important because ML is often assumed superior, but for structured data, transparent regex is both effective and auditable.</li>
                        <li><strong>Precision-recall trade-offs are context-dependent.</strong> Our 94.1% name recall with 58.7% precision represents intentional design for a privacy tool. False positives are transparent and acceptable.</li>
                        <li><strong>Client-side processing is practical.</strong> We proved you don't need server infrastructure. Everything runs in browser at acceptable speeds—typically under 500ms for full document scan.</li>
                        <li><strong>Systematic baseline comparison is essential.</strong> Our 84% improvement demonstrates enhanced patterns significantly outperform naive approaches. You can't just claim 'good results'—you must prove you're better than the obvious alternative.</li>
                    </ol>
                    <div class="transition">→ Transition: "Of course, there are limitations and future directions."</div>
                `
            },
            '11': {
                timing: '0:30',
                content: `
                    <h3>Limitations & Future Work</h3>
                    <p><strong>Three main limitations:</strong></p>
                    <ul>
                        <li><strong>Name precision (58.7%)</strong> - False positives from capitalized words. Future: context-aware filtering using lightweight NLP to distinguish 'Credit Card' from 'Robert Card'.</li>
                        <li><strong>Phone coverage (74.2% recall)</strong> - Miss international formats and extensions. Plan to add patterns for country codes and extension notation.</li>
                        <li><strong>Google Docs (60-80%)</strong> - Limited by CORS and auth. Browser extension with native permissions would achieve 95%+ success.</li>
                    </ul>
                    <p><strong>Three future directions:</strong> Context-aware filtering using NER, browser extension for better access and auto-scanning, and platform expansion to Notion, Dropbox Paper, Google Sheets."</p>
                    <div class="transition">→ Transition: "The system is deployed and available today."</div>
                `
            },
            '12': {
                timing: '1:15',
                content: `
                    <h3>Live Demo (WITH SHOWCASE)</h3>
                    <p>"Let me show you the working demo. I'm navigating to suryacs719.github.io/cse253-openPII-web.</p>
                    <p>[<em>Open URL, wait for page load - 10s</em>]</p>
                    <p>Here's the interface. Users paste a Pastebin or Google Docs URL. Let me use a test Pastebin link.</p>
                    <p>[<em>Paste URL, click Analyze - 10s</em>]</p>
                    <p>[<em>Wait for results - 5s</em>]</p>
                    <p>Here are the results in real-time. You can see the risk level assessment—this shows MEDIUM risk. Below, PII breakdown by type shows we detected 8 emails, 5 phone numbers, 12 names. At bottom, security recommendations tailored to what was found.</p>
                    <p>[<em>Point to each section - 25s</em>]</p>
                    <p>All this processing happened entirely in your browser. No server, no data transmitted. Document content never leaves the client.</p>
                    <p>The code for both demo and evaluation is open source on GitHub."</p>
                    <div class="key-points">
                        <strong>Before demo:</strong> Have test Pastebin URL ready in clipboard!
                    </div>
                    <div class="transition">→ Transition: "Let me conclude."</div>
                `
            },
            '13': {
                timing: '0:30',
                content: `
                    <h3>Conclusion</h3>
                    <p>"In conclusion, we demonstrate that systematic PII detection in shared documents is <strong>feasible</strong>, <strong>effective</strong>, and <strong>privacy-preserving</strong>.</p>
                    <p><strong>Feasible:</strong> we built it, it works, it's deployed on the web today.</p>
                    <p><strong>Effective:</strong> 84.3% overall precision with perfect 100% F1-scores for structured PII like emails, addresses, and SSN.</p>
                    <p><strong>Privacy-preserving:</strong> entirely client-side processing means users' documents never leave their browser.</p>
                    <p>The 84% improvement over baseline validates that enhanced regex patterns with careful filtering significantly outperform naive approaches.</p>
                    <p>This work contributes both academically—through rigorous evaluation with ground truth data and baseline comparison—and practically—through a deployed tool anyone can use right now."</p>
                    <div class="transition">→ Transition: "Our code and demo are available, and I'm happy to take questions."</div>
                `
            },
            '14': {
                timing: '0:15',
                content: `
                    <h3>Resources & Q&A</h3>
                    <p>"All of our work is publicly available. The web demo is at github.io/cse253-openPII-web, and all source code including evaluation scripts, test data, and results is at github.com/SuryaCS719/cse253-openPII.</p>
                    <p>I'm happy to answer questions."</p>
                    <div class="key-points">
                        <strong>Target total time: ~10:30</strong><br>
                        <strong>Q&A: 5 minutes from here</strong>
                    </div>
                `
            }
        };

        return notes[slideNum] || { 
            timing: 'N/A', 
            content: '<p>No notes available for this slide.</p>' 
        };
    }
}

// Initialize presenter mode
document.addEventListener('DOMContentLoaded', () => {
    new PresenterMode();
    console.log('Presenter mode ready. Press "P" to open presenter window.');
});

