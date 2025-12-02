let rows = [
    { id: 1, value: "", probability: "" },
    { id: 2, value: "", probability: "" },
];
let nextId = 3;
let binomialTable = null;

function switchTab(tab) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));

    if (tab === "manual") {
        document.querySelectorAll(".tab")[0].classList.add("active");
        document.getElementById("manualTab").classList.add("active");
    } else {
        document.querySelectorAll(".tab")[1].classList.add("active");
        document.getElementById("binomialTab").classList.add("active");
    }
}

function renderRows() {
    const container = document.getElementById("rowsContainer");
    container.innerHTML = "";

    rows.forEach((row) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "input-grid";
        rowDiv.innerHTML = `
        <input type="text" step="any" value="${row.value}" 
               oninput="updateRowValue(${row.id}, this.value)" 
               placeholder="Enter value">
        <input type="number" step="0.010000" min="0" max="1" value="${row.probability}" 
               oninput="updateRowProbability(${row.id}, this.value)" 
               placeholder="Enter probability">
        <button class="btn-danger" onclick="removeRow(${row.id})" ${rows.length === 1 ? "disabled" : ""}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </button>
    `;
        container.appendChild(rowDiv);
    });

    updateProbSum();
}

function addRow() {
    rows.push({ id: nextId++, value: "", probability: "" });
    renderRows();
}

function removeRow(id) {
    if (rows.length > 1) {
        rows = rows.filter((row) => row.id !== id);
        renderRows();
    }
}

function updateRowValue(id, value) {
    const row = rows.find((r) => r.id === id);
    if (row) row.value = value;
}

function updateRowProbability(id, value) {
    const row = rows.find((r) => r.id === id);
    if (row) row.probability = value;
    updateProbSum();
}

function updateProbSum() {
    const sum = rows.filter((row) => row.probability !== "").reduce((total, row) => total + parseFloat(row.probability || 0), 0);

    const sumElement = document.getElementById("probSum");
    sumElement.textContent = sum.toFixed(4);

    const isValid = Math.abs(sum - 1) < 0.0001 && sum > 0;
    sumElement.className = isValid ? "valid" : "invalid";
}

function updateBinomialQ() {
    const p = parseFloat(document.getElementById("binomialP").value);
    if (!isNaN(p)) {
        document.getElementById("binomialQ").value = (1 - p).toFixed(6);
    }
}

function updateBinomialP() {
    const q = parseFloat(document.getElementById("binomialQ").value);
    if (!isNaN(q)) {
        document.getElementById("binomialP").value = (1 - q).toFixed(6);
    }
}

function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function binomialCoefficient(n, k) {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    return factorial(n) / (factorial(k) * factorial(n - k));
}

function calculateBinomialProbability(n, k, p) {
    const coefficient = binomialCoefficient(n, k);
    return coefficient * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function generateBinomialTable() {
    const n = parseInt(document.getElementById("binomialN").value);
    const p = parseFloat(document.getElementById("binomialP").value);
    const q = parseFloat(document.getElementById("binomialQ").value);

    if (isNaN(n) || isNaN(p) || isNaN(q)) {
        alert("Please fill in all binomial parameters");
        return;
    }

    if (n < 1 || n > 1000) {
        alert("Number of experiments must be between 1 and 1000");
        return;
    }

    if (Math.abs(p + q - 1) > 0.0001) {
        alert("Success probability + Failure probability must equal 1");
        return;
    }

    binomialTable = [];
    for (let k = 0; k <= n; k++) {
        const probability = calculateBinomialProbability(n, k, p);
        binomialTable.push({ k, probability });
    }

    renderBinomialTable();
}

function renderBinomialTable() {
    const container = document.getElementById("binomialTableContainer");

    const totalProb = binomialTable.reduce((sum, row) => sum + row.probability, 0);

    container.innerHTML = `
    <div class="table-header">
        <h3>Binomial Distribution Table</h3>
        <button class="btn-success" onclick="loadBinomialToCalculator()">Load to Calculator</button>
    </div>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>k (successes)</th>
                    <th>P(X = k)</th>
                </tr>
            </thead>
            <tbody>
                ${binomialTable
                    .map(
                        (row) => `
                    <tr>
                        <td>${row.k}</td>
                        <td style="font-family: monospace;">${row.probability.toFixed(8)}</td>
                    </tr>
                `
                    )
                    .join("")}
            </tbody>
        </table>
    </div>
    <div class="info-box" style="margin-top: 1rem;">
        <p style="font-size: 0.875rem; color: #6b7280;">
            Total probability: <span style="font-weight: 600;">${totalProb.toFixed(8)}</span>
        </p>
    </div>
`;
}

function loadBinomialToCalculator() {
    if (!binomialTable) return;

    rows = binomialTable.map((item, index) => ({
        id: Date.now() + index,
        value: item.k.toString(),
        probability: item.probability.toString(),
    }));

    nextId = Date.now() + binomialTable.length + 1;

    switchTab("manual");
    renderRows();
    document.getElementById("resultsContainer").innerHTML = "";
}

function calculateExpectedValue(data) {
    return data.reduce((sum, item) => sum + item.value * item.prob, 0);
}

function calculateExpectedSquaredValue(data) {
    return data.reduce((sum, item) => sum + item.value * item.value * item.prob, 0);
}

function calculateVariance(data, expectedValue) {
    const expectedSquare = data.reduce((sum, item) => sum + item.value * item.value * item.prob, 0);
    return expectedSquare - expectedValue * expectedValue;
}

function calculate() {
    const validRows = rows.filter((row) => row.value !== "" && row.probability !== "");

    if (validRows.length === 0) {
        alert("Please enter at least one value-probability pair");
        return;
    }

    const data = validRows.map((row) => ({
        value: parseFloat(row.value),
        prob: parseFloat(row.probability),
    }));

    const totalProb = data.reduce((sum, item) => sum + item.prob, 0);

    if (Math.abs(totalProb - 1) > 0.0001) {
        alert(`Probabilities must sum to 1. Current sum: ${totalProb.toFixed(4)}`);
        return;
    }

    const expectedValue = calculateExpectedValue(data);
    const expectedSquaredValue = calculateExpectedSquaredValue(data);
    const variance = calculateVariance(data, expectedValue);
    const stdDev = Math.sqrt(variance);

    displayResults(expectedValue, expectedSquaredValue, variance, stdDev);
}

function displayResults(expectedValue, expectedSquaredValue, variance, stdDev) {
    const container = document.getElementById("resultsContainer");
    container.innerHTML = `
    <div class="results">
        <h2>Results</h2>
        <div class="result-card">
            <div class="result-label">Expected Value (Mean)</div>
            <div class="result-value">M(X) = ${expectedValue.toFixed(6)}</div>
            <div class="result-formula">M(X) = Σ(x × P(x))</div>
        </div>
        <div class="result-card">
            <div class="result-label">Expected Cubed Value (Mean)</div>
            <div class="result-value">M(X²) = ${expectedSquaredValue.toFixed(6)}</div>
            <div class="result-formula">M(X²) = Σ(x² × P(x))</div>
        </div>
        <div class="result-card">
            <div class="result-label">Variance</div>
            <div class="result-value">D(X) = ${variance.toFixed(6)}</div>
            <div class="result-formula">D(X) = M(X²) - (M(X))²</div>
        </div>
        <div class="result-card">
            <div class="result-label">Standard Deviation</div>
            <div class="result-value">σ = ${stdDev.toFixed(6)}</div>
            <div class="result-formula">σ = √D(X)</div>
        </div>
    </div>
`;
}

function reset() {
    rows = [
        { id: 1, value: "", probability: "" },
        { id: 2, value: "", probability: "" },
    ];
    nextId = 3;
    binomialTable = null;

    document.getElementById("binomialN").value = "";
    document.getElementById("binomialP").value = "";
    document.getElementById("binomialQ").value = "";
    document.getElementById("binomialTableContainer").innerHTML = "";
    document.getElementById("resultsContainer").innerHTML = "";

    renderRows();
}

// Initialize
renderRows();
