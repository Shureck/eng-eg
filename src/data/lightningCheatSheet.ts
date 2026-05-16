/**
 * Шпаргалка-молния: якоря «ключ вопроса → ключ ответа» (ручная таблица).
 * Разделитель полей в блоках: ||| (в текстах якорей не встречается).
 */
export type CheatPair = { hook: string; answerKey: string };

function parseTriples(block: string): Record<number, CheatPair> {
  const out: Record<number, CheatPair> = {};
  for (const line of block.trim().split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split("|||");
    if (parts.length < 3) continue;
    const id = Number(parts[0].trim());
    const hook = parts[1].trim();
    const answerKey = parts.slice(2).join("|||").trim();
    if (!Number.isFinite(id) || !hook) continue;
    out[id] = { hook, answerKey };
  }
  return out;
}

const T1_RAW = `
1|||main purpose / mathematical methods|||accurate (B)
2|||demand curve|||Linear (A)
3|||Σ symbol|||Summation (B)
4|||calculus purpose|||changes in variables (B)
5|||responsiveness|||Elasticity (C)
6|||derivative of constant|||0 (B)
7|||multivariable example|||Total cost / quantity (A)
8|||ceteris paribus|||constant except one (B)
9|||optimal / linear programming|||Matrices (C)
10|||marginal|||small incremental (A)
11|||game theory role|||strategic interactions (A)
12|||uncertainty|||Probability (A)
13|||equilibrium|||supply and demand (A)
14|||accumulation of wealth|||Geometric (B)
15|||econometrics / estimate parameters|||Regression (A)
16|||integration purpose|||area under curve (B)
17|||average rate of change|||Slope (A)
18|||exponential growth/decay|||Exponential (C)
19|||matrix algebra|||systems of equations (B)
20|||dispersion around mean|||Variance (A)
21|||mathematical models purpose|||simplified way (B)
22|||second derivative|||concavity (B)
23|||average value over interval|||Mean value theorem (A)
24|||partial derivatives|||holding others constant (B)
25|||accumulation of capital|||Compound interest (A)
26|||linear programming|||maximizes/minimizes linear (A)
27|||production function|||Cobb-Douglas (C)
28|||statistical inference|||population / sample (B)
29|||time series|||ARIMA (A)
30|||optimization|||best outcome / constraints (A)
31|||plan for identifying studies|||Search strategy (C)
32|||marginal cost|||one more unit (A)
33|||time value of money|||decreases over time (C)
34|||externalities|||third parties (C)
35|||manage risks|||risk management plan (B)
36|||association of two/more|||Subsidiary company (C)
37|||slope of curve|||derivative (A)
38|||equilibrium (supply/demand)|||supply equals demand (C)
39|||NOT optimization method|||Fourier transforms (D)
40|||Utility theory|||consumption (B)
41|||firms maximize|||Profits (D)
42|||elasticity measures|||price / quantity demanded (A)
43|||regression analysis use|||relationships between variables (A)
44|||central tendency|||Mean (C)
45|||comparative advantage|||Relative efficiency (B)
46|||opportunity cost|||best foregone (A)
47|||linear equations / matrix|||Gauss-Jordan (B)
48|||NOT perfectly competitive|||High barriers (C)
49|||Nash equilibrium|||no incentive to deviate (C)
50|||regression fits data|||F-test (D)
51|||mathematical models purpose (quantify)|||Quantifying (B)
52|||optimization problems|||Calculus (B)
53|||statistical analysis objective|||measure accurately (B)
54|||data collection importance|||measure / empirical (B)
55|||central tendency most common|||Mean (C)
56|||econometric models contribute|||Examining relationships / predicting (B)
57|||economic models purpose|||Simplifying / forecasting (B)
58|||relationship between variables (technique)|||Linear regression (C)
59|||time-series goal|||changes over time (A)
60|||game theory contribute|||strategic / decision-making (B)
61|||economic forecasting|||estimate future / historical (B)
62|||spread/dispersion around mean|||Standard deviation (C)
63|||software assist economists|||analyzing / estimating (B)
64|||statistical techniques importance|||simplify calculations (B)
65|||hypothesis testing|||validity / statistical tests (B)
66|||monetary policy objective|||reduce inflation (B)
67|||strength and direction|||Correlation (B)
68|||ceteris paribus (all else)|||all other things equal (D)
69|||cost-benefit|||profitability / public policy (B)
70|||econometric models (patterns)|||identifying patterns (B)
71|||fiscal policy|||taxation and spending (B)
72|||elasticity measure means|||responsiveness / price (A)
73|||regression objective|||relationship / two or more (B)
74|||true cost = next best|||Principle of opportunity cost (D)
75|||PPF|||maximum output combinations (B)
76|||utility|||satisfaction (C)
77|||Lorenz curve objective|||income inequality (A)
78|||CPI primary function|||prices of consumer goods (A)
79|||instrumental methods|||measure / empirical (B)
80|||Solow growth|||long-term growth (C)
81|||microeconomics|||individual consumers/firms (A)
82|||statistical methods used for|||Analyzing data / inferences (C)
83|||elasticity (term)|||responsiveness / price (A)
84|||externalities|||unintended side effects (B)
85|||HDI purpose|||compare development levels (B)
86|||CPI formula|||basket current/base × 100 (B)
87|||saving/investment/interest|||IS-LM (C)
88|||minimal government / free markets|||Austrian (D)
89|||regression purpose|||estimate relationship (B)
90|||externality|||unintended side effects (C)
91|||inflation / purchasing power|||cost of living up, real income down (A)
92|||GDP|||Gross Domestic Product (A)
93|||comparative advantage / trade|||specialize / lower opportunity cost (B)
94|||generates income|||Revenue model (B)
95|||utility function objective|||consumer preferences (D)
96|||monetary policy|||interest rates / money supply (B)
97|||people face trade-offs|||Principle of opportunity cost (D)
98|||Lorenz curve purpose|||income inequality (A)
99|||Lorenz curve (repeat)|||income inequality (A)
100|||CPI function|||prices of consumer goods (A)
101|||represent relationship two variables|||Linear regression (C)
102|||inflation targeting|||stable prices (A)
103|||marginal utility|||one more unit (B)
104|||Gini coefficient|||income inequality (A)
105|||elasticity contributes|||responsiveness / price (C)
106|||GDP function|||total output (B)
107|||comparative advantage role|||specialize / lower opportunity cost (B)
108|||scarcity|||efficient allocation (B)
109|||Phillips curve|||inflation and unemployment (D)
110|||opportunity cost|||next best alternative forgone (B)
111|||Cobb-Douglas|||inputs and outputs (D)
112|||equilibrium contributes|||supply equals demand (B)
113|||PPI function|||prices received by producers (D)
114|||normal distribution|||analyze using tests (C)
115|||monetary policy stability|||regulating money supply / interest (B)
116|||HDI function|||compare development (D)
117|||max/min subject to constraints|||Optimization (D)
118|||inputs↔outputs equation|||Production Function (B)
119|||math representation of real system|||Model (C)
120|||equality of two expressions|||Equation (A)
121|||independent ↔ dependent|||Regression Analysis (D)
122|||test claim/hypothesis|||Hypothesis Testing (C)
123|||methods play role in __|||economics (C)
124|||__ models represent theories|||Mathematical (D)
125|||__ methods collect/analyze data|||Statistical (B)
126|||equally distributed / partners|||Charge (B)
127|||business __ pays attention|||Community (C)
128|||supply and __|||Demand (D)
129|||price rises / __ decreases|||Purchasing power (C)
130|||struck a deal / rival|||Entrepreneur (A)
131|||comprehensive approach to evidence|||Systematic Review (A)
132|||plan / databases / search terms|||Search Strategy (A)
133|||predictions / past data|||Forecasting (B)
134|||collecting data for synthesis|||Data Extraction (B)
135|||observed − true value|||Error term (A)
136|||graphical / sequential decisions|||Decision tree (A)
137|||one time series predicts another|||Granger causality (B)
138|||check issued / not presented|||Outstanding check (A)
139|||monthly statement from bank|||Bank Statement (A)
140|||variability across multiple studies|||Meta-analysis (D)
141|||instrument of monetary policy|||Collection of funds to budget (A)
142|||confers value to owners|||Capital (C)
143|||total money spent|||Expenditure (C)
144|||payment without direct exchange|||Means of accumulation (D)
145|||availability of benefits|||standard of living (C)
146|||completely belongs to someone|||All answers are correct (D)
147|||not enough / difficult to obtain|||Scarcity (B)
148|||financial __ of outsourcing|||Ramifications (D)
149|||monopolies crucial for economic __|||Development (B)
150|||macroeconomic __|||Indicators (B)
`;

const T2_RAW = `
1|||Difference / Diversification / Differentiation|||1-b, 2-c, 3-a
2|||Micro / Macro / Global|||1-c, 2-b, 3-a
3|||Yield / Output / Trade-off|||1-b, 2-a, 3-c
4|||Vector / Matrix / Integration|||1-c, 2-a, 3-b
5|||Augmentation / Reinstatement / Scalability|||1-b, 2-c, 3-a
6|||Decision making / Analytical / Business health|||1-a, 2-c, 3-b
7|||Econometric / Stochastic / Bifurcation|||1-c, 2-b, 3-a
8|||Market share / Panel data / Capital deepening|||1-c, 2-a, 3-b
9|||Economic evaluation / Systematic review / Search strategy|||1-a, 2-b, 3-c
10|||Data management / Relevant data / Eligibility|||1-c, 2-a, 3-b
11|||Economic perspective / Demand-side / Controlling cash|||1-a, 2-c, 3-b
12|||Socioeconomic / Business model / Math method|||1-c, 2-b, 3-a
13|||Social Mood / Supply-side / Downturn|||1-b, 2-c, 3-a
14|||Econ speculations / Quant method / Presumption|||1-a, 2-c, 3-b
15|||Hypothesis testing / Regression / Data mining|||1-c, 2-b, 3-a
16|||Interval estimation / Quant forecast / Consumption expenditure|||1-c, 2-a, 3-b
17|||Disposable income / Quant Method / Remedy|||1-a, 2-c, 3-b
18|||Focus group / Hybrid model / Data visualization|||1-c, 2-a, 3-b
19|||Competitive analysis / Depreciation / Economic turmoil|||1-a, 2-c, 3-b
20|||Proof-reading / Multiple regression / Simple linear|||1-b, 2-a, 3-c
21|||Mitigating risks / Qualitative / Quantitative statement|||1-a, 2-c, 3-b
22|||Hard constraints / Linear programming / Additional revenue|||1-a, 2-c, 3-b
23|||Target audience / Data-driven / Market demand|||1-c, 2-a, 3-b
24|||Bear / Price fluctuation / Bull|||1-b, 2-c, 3-a
25|||Competitive landscape / Soft constraints / Shifting model|||1-b, 2-c, 3-a
`;

const T3_RAW = `
1|||You can find…|||D, G, A, F, B, C, E
2|||Financial mathematics shows…|||F, A, E, B, G, D, C
3|||Important discoveries in Economics…|||F, B, D, E, C, A
4|||Game theory is a framework…|||D, A, G, F, B, C, E
5|||Organizations can seize…|||B, E, D, C, F, A
6|||What steps should be taken…|||F, G, C, A, E, B, D
7|||Why is seeking…|||B, C, D, A, F, E
8|||A business model outlines…|||F, A, C, B, E, D
9|||Critical aspect of a business model…|||A, E, B, D, C, F
10|||Econometrics prime function…|||D, G, F, A, E, C, B
11|||Why is the variance…|||C, G, E, F, B, A, D
12|||What scientists are considered…|||D, E, F, A, B, C
13|||The empirical relationship should be positive…|||D, C, F, A, E, B, G
14|||Which mathematical concept…|||D, G, F, A, C, B, E
15|||What is the primary objective…|||E, A, F, D, B, C
16|||The next step is to estimate…|||D, A, G, F, B, E, C
17|||What step tests…|||F, A, D, B, C, E
18|||Their competition helps…|||G, A, D, C, B, E, F
19|||Conducting market research…|||F, A, G, B, E, D, C
20|||By what means can…|||C, F, A, E, D, G, B
21|||What line should a company…|||F, C, A, E, B, G, D
22|||Market segmentation involves…|||E, G, C, A, D, F, B
23|||Social mood refers to…|||D, G, F, E, A, C, B
24|||What key points should we keep…|||B, F, G, A, C, E, D
25|||Modern mathematical science…|||B, F, A, E, G, D, C
`;

export const CHEAT_SHEET_T1 = parseTriples(T1_RAW);
export const CHEAT_SHEET_T2 = parseTriples(T2_RAW);
export const CHEAT_SHEET_T3 = parseTriples(T3_RAW);

export function getCheatT1(id: number): CheatPair | undefined {
  return CHEAT_SHEET_T1[id];
}

export function getCheatT2(id: number): CheatPair | undefined {
  return CHEAT_SHEET_T2[id];
}

export function getCheatT3(id: number): CheatPair | undefined {
  return CHEAT_SHEET_T3[id];
}
