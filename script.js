// Menggunakan Cache elemen DOM untuk performa yang lebih baik
const matrixAInput = document.getElementById('matrixA');
const matrixBInput = document.getElementById('matrixB');
const latexOutput = document.getElementById('latexOutput');
const decimalCheckbox = document.getElementById('decimal');
const fractionCheckbox = document.getElementById('fraction');
const scalarInput = document.getElementById('scalar');
const powerInput = document.getElementById('power');
const expressionInput = document.getElementById('expression');
const buttons = document.querySelectorAll('[data-action]');
const themeFemaleCheckbox = document.getElementById('themeFemale');

// Variabel untuk menyimpan hasil terakhir yang dihitung agar bisa diformat ulang oleh checkbox
let lastCalculatedResult = null;
let lastCalculatedAction = null; // Menyimpan aksi terakhir untuk menghitung ulang 

function parseMatrix(id) {
    const inputElement = id === 'matrixA' ? matrixAInput : (id === 'matrixB' ? matrixBInput : document.getElementById(id));
    if (!inputElement) {
        console.error(`Elemen dengan id ${id} tidak ditemukan.`);
        return [];
    }

    const rows = inputElement.value
        .trim()
        .split('\n')
        .map(row => row.trim().split(/\s+/).map(val => {
            try {
                const parsedValue = math.evaluate(val);
                return parsedValue;
            } catch (e) {
                console.warn(`Could not parse '${val}' as a number or fraction. Skipping.`);
                return NaN;
            }
        }))
        .filter(row => row.length > 0 && row.every(num => !isNaN(num) || math.isFraction(num)));

    if (rows.length > 1) {
        const firstRowLength = rows[0].length;
        if (!rows.every(row => row.length === firstRowLength)) {
            throw new Error("Error: Jumlah kolom pada setiap baris harus sama.");
        }
    }
    return rows;
}

// Fungsi pembantu untuk mencari GCD (Faktor Persekutuan Terbesar)
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

// Fungsi untuk mengonversi desimal ke pecahan menggunakan pendekatan Continued Fraction
function decimalToFraction(decimal, tolerance = 1.0E-9) {
    if (decimal === 0) return '0';
    const sign = decimal < 0 ? '-' : '';
    decimal = Math.abs(decimal);

    let num1 = 0;
    let den1 = 1;
    let num2 = 1;
    let den2 = 0;
    let x = decimal;

    while (true) {
        const a = Math.floor(x);
        const num3 = num1 + a * num2;
        const den3 = den1 + a * den2;

        if (Math.abs(decimal - (num3 / den3)) < tolerance) {
            const commonDivisor = gcd(num3, den3);
            return `${sign}\\frac{${num3 / commonDivisor}}{${den3 / commonDivisor}}`;
        }

        if (den3 > 1000000) {
            break;
        }

        num1 = num2;
        den1 = den2;
        num2 = num3;
        den2 = den3;
        x = 1 / (x - a);

        if (x === 0 || isNaN(x) || !isFinite(x)) {
            break;
        }
    }
    return `${sign}${decimal.toString().replace('.', ',')}`;
}

// Fungsi ini mengonversi matriks (array of arrays) ke string LaTeX
function toLatex(data) {
    const showDecimal = decimalCheckbox?.checked;
    const showFraction = fractionCheckbox?.checked;

    const formatNumber = (num) => {
        if (math.isFraction(num)) {
            if (showDecimal) {
                return (num.n / num.d).toFixed(2).replace('.', ',');
            } else {
                return `\\frac{${num.s * num.n}}{${num.d}}`;
            }
        } else {
            if (Math.abs(num) < 1e-12) {
                return '0';
            }

            if (showFraction && !showDecimal) {
                return decimalToFraction(num);
            }

            if (showDecimal) {
                return num.toFixed(2).replace('.', ',');
            } else {
                return math.format(num, { precision: 14 }).replace('.', ',');
            }
        }
    };

    if (typeof data === 'number' || math.isFraction(data)) {
        return formatNumber(data);
    }
    if (Array.isArray(data) && !Array.isArray(data[0])) {
           return formatNumber(data[0]);
    }
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
        return `\\begin{bmatrix}${data.map(
            row => row.map(formatNumber).join(' & ')
        ).join(' \\\\ ')}\\end{bmatrix}`;
    }

    return String(data).replace('.', ',');
}

function showLatexOutput(latexString) {
    latexOutput.dataset.lastLatex = latexString;
    latexOutput.innerHTML = `$$ ${latexString} $$`;
    if (typeof MathJax !== 'undefined' && typeof MathJax.typesetPromise === 'function') {
        MathJax.typesetPromise([latexOutput]).catch((err) => console.error("MathJax typesetting failed: ", err));
    } else {
        console.warn("MathJax not loaded or typesetPromise not available. LaTeX will not be rendered.");
    }
}

function updateOutputFormatting() {
    if (lastCalculatedResult !== null) {
        let latexRepresentation = '';
        if (math.isMatrix(lastCalculatedResult) || Array.isArray(lastCalculatedResult)) {
            latexRepresentation = toLatex(lastCalculatedResult.toArray ? lastCalculatedResult.toArray() : lastCalculatedResult);
        } else if (typeof lastCalculatedResult === 'number' || math.isFraction(lastCalculatedResult)) {
            latexRepresentation = toLatex(lastCalculatedResult);
        } else {
            latexRepresentation = String(lastCalculatedResult);
        }
        showLatexOutput(latexRepresentation);
    } else {
        latexOutput.innerHTML = '';
        if (typeof MathJax !== 'undefined' && typeof MathJax.typesetClear === 'function') {
             MathJax.typesetClear([latexOutput]);
        }
    }
}

function clearMatricesAndOutput() {
    matrixAInput.value = '';
    matrixBInput.value = '';
    latexOutput.innerHTML = '';
    scalarInput.value = '2';
    powerInput.value = '2';
    expressionInput.value = '';
    decimalCheckbox.checked = false;
    fractionCheckbox.checked = false;
    lastCalculatedResult = null;
    lastCalculatedAction = null;
    MathJax.typesetClear([latexOutput]);
}

function clearMatrix(id) {
    const textarea = document.getElementById(id);
    if (textarea) {
        textarea.value = '';
    }
    lastCalculatedResult = null;
    lastCalculatedAction = null;
    latexOutput.innerHTML = '';
    MathJax.typesetClear([latexOutput]);
}

function multiplyScalar() {
    let scalar;
    try {
        scalar = math.evaluate(scalarInput.value);
    } catch (e) {
        showLatexOutput('\\text{Error: Skalar tidak valid. Pastikan format angka atau pecahan.}');
        lastCalculatedResult = null;
        lastCalculatedAction = null;
        return;
    }

    let A;
    try {
        A = parseMatrix('matrixA');
    } catch (e) {
        showLatexOutput(`\\text{Error: Matriks A tidak valid. ${e.message}}`);
        lastCalculatedResult = null;
        lastCalculatedAction = null;
        return;
    }

    if (!A || A.length === 0) {
        showLatexOutput('\\text{Error: Matriks A tidak valid.}');
        lastCalculatedResult = null;
        lastCalculatedAction = null;
        return;
    }

    if (isNaN(scalar) && !math.isFraction(scalar)) {
        showLatexOutput('\\text{Error: Skalar tidak valid.}');
        lastCalculatedResult = null;
        lastCalculatedAction = null;
        return;
    }

    try {
        const result = math.multiply(math.matrix(A), scalar);
        lastCalculatedResult = result;
        lastCalculatedAction = 'multiplyScalar';
        showLatexOutput(`${toLatex(scalar)} \\cdot ${toLatex(A)} = ${toLatex(result.toArray())}`);
    } catch (err) {
        showLatexOutput(`\\text{Error: ${err.message.replace(/_/g, '\\_')}}`);
        lastCalculatedResult = null;
        lastCalculatedAction = null;
    }
}

function powerMatrix() {
    try {
        const n = parseInt(powerInput.value);
        let A_array;
        try {
            A_array = parseMatrix('matrixA');
        } catch (e) {
            showLatexOutput(`\\text{Error: Matriks A tidak valid. ${e.message}}`);
            lastCalculatedResult = null;
            lastCalculatedAction = null;
            return;
        }

        if (!A_array || A_array.length === 0) {
            throw new Error('Error: Matriks A tidak valid.');
        }

        if (A_array.length !== A_array[0].length) {
            throw new Error('Error: Matriks harus persegi untuk perpangkatan.');
        }

        if (isNaN(n)) {
            throw new Error('Error: Pangkat harus berupa angka.');
        }

        const matrixA = math.matrix(A_array);
        const result = math.pow(matrixA, n);

        lastCalculatedResult = result;
        lastCalculatedAction = 'powerMatrix';
        showLatexOutput(`${toLatex(matrixA.toArray())}^{${n}} = ${toLatex(result.toArray())}`);
    } catch (err) {
        showLatexOutput(`\\text{${err.message.replace(/_/g, '\\_')}}`);
        lastCalculatedResult = null;
        lastCalculatedAction = null;
    }
}

function evaluateExpression() {
    const expr = expressionInput.value;
    let A, B;

    try {
        A = parseMatrix('matrixA');
    } catch (e) {
        showLatexOutput(`\\text{Error: Matriks A tidak valid. ${e.message}}`);
        lastCalculatedResult = null;
        lastCalculatedAction = null;
        return;
    }
    try {
        B = parseMatrix('matrixB');
    } catch (e) {
        showLatexOutput(`\\text{Error: Matriks B tidak valid. ${e.message}}`);
        lastCalculatedResult = null;
        lastCalculatedAction = null;
        return;
    }

    const scope = {
        A: A.length > 0 ? math.matrix(A) : [],
        B: B.length > 0 ? math.matrix(B) : []
    };

    try {
        const result = math.evaluate(expr, scope);

        lastCalculatedResult = result;
        lastCalculatedAction = 'evaluateExpression';

        let formattedResult;
        if (math.isMatrix(result) || Array.isArray(result)) {
            formattedResult = toLatex(result.toArray ? result.toArray() : result);
        } else if (typeof result === 'number' || math.isFraction(result)) {
            formattedResult = toLatex(result);
        } else {
            formattedResult = String(result).replace('.', ',');
        }
        showLatexOutput(`${expr.replace(/_/g, '\\_')} = ${formattedResult}`);
    } catch (err) {
        showLatexOutput(`\\text{Error: ${err.message.replace(/_/g, '\\_')}}`);
        lastCalculatedResult = null;
        lastCalculatedAction = null;
    }
}

function applyOBE(matrix) {
    if (!matrix || matrix.length === 0 || !matrix.every(row => Array.isArray(row))) {
        showLatexOutput("\\text{Error: Matriks tidak valid untuk OBE.}");
        return null;
    }
    const m = matrix.map(row => row.slice());
    const rowCount = m.length;
    const colCount = m[0]?.length || 0;

    const op = prompt("Pilih operasi:\n1 = Tukar baris\n2 = Kali baris\n3 = Tambah baris");
    if (!op) return null;

    try {
        if (op === '1') {
            const iStr = prompt("Baris pertama (berbasis 1):");
            const jStr = prompt("Baris kedua (berbasis 1):");
            const i = parseInt(iStr) - 1;
            const j = parseInt(jStr) - 1;

            if (isNaN(i) || isNaN(j) || i < 0 || j < 0 || i >= rowCount || j >= rowCount) {
                throw new Error("Input baris tidak valid.");
            }
            [m[i], m[j]] = [m[j], m[i]];
        } else if (op === '2') {
            const iStr = prompt("Baris yang dikalikan (berbasis 1):");
            const kStr = prompt("Dikalikan dengan:");

            let k = math.evaluate(kStr);

            const i = parseInt(iStr) - 1;

            if (isNaN(i) || i < 0 || i >= rowCount || (isNaN(k) && !math.isFraction(k))) {
                throw new Error("Input tidak valid.");
            }

            m[i] = m[i].map(val => math.multiply(val, k));
        } else if (op === '3') {
            const srcStr = prompt("Baris sumber (berbasis 1):");
            const tgtStr = prompt("Baris target (berbasis 1):");
            const kStr = prompt("Dikalikan dengan:");

            let k = math.evaluate(kStr);

            const src = parseInt(srcStr) - 1;
            const tgt = parseInt(tgtStr) - 1;

            if (isNaN(src) || isNaN(tgt) || (isNaN(k) && !math.isFraction(k)) ||
                src < 0 || src >= rowCount || tgt < 0 || tgt >= rowCount) {
                throw new Error("Input tidak valid.");
            }
            for (let j = 0; j < colCount; j++) {
                m[tgt][j] = math.add(m[tgt][j], math.multiply(k, m[src][j]));
            }

        } else {
            throw new Error("Operasi tidak dikenal.");
        }
    } catch (err) {
        showLatexOutput(`\\text{Error: ${err.message.replace(/_/g, '\\_')}}`);
        return null;
    }

    return m;
}

function applyOKE(matrix) {
    if (!matrix || matrix.length === 0 || !matrix.every(row => Array.isArray(row))) {
        showLatexOutput("\\text{Error: Matriks tidak valid untuk OKE.}");
        return null;
    }
    const m = matrix.map(row => row.slice());
    const rowCount = m.length;
    const colCount = m[0]?.length || 0;

    const op = prompt("Pilih operasi:\n1 = Tukar kolom\n2 = Kali kolom\n3 = Tambah kolom");
    if (!op) return null;

    try {
        if (op === '1') {
            const iStr = prompt("Kolom pertama (berbasis 1):");
            const jStr = prompt("Kolom kedua (berbasis 1):");
            const i = parseInt(iStr) - 1;
            const j = parseInt(jStr) - 1;
            if (isNaN(i) || isNaN(j) || i < 0 || j < 0 || i >= colCount || j >= colCount) {
                throw new Error("Indeks kolom tidak valid.");
            }
            for (let r = 0; r < rowCount; r++) {
                [m[r][i], m[r][j]] = [m[r][j], m[r][i]];
            }

        } else if (op === '2') {
            const iStr = prompt("Kolom yang dikalikan (berbasis 1):");
            const kStr = prompt("Dikalikan dengan:");

            let k = math.evaluate(kStr);

            const i = parseInt(iStr) - 1;
            if (isNaN(i) || i < 0 || i >= colCount || (isNaN(k) && !math.isFraction(k))) {
                throw new Error("Input tidak valid.");
            }
            for (let r = 0; r < rowCount; r++) {
                m[r][i] = math.multiply(m[r][i], k);
            }

        } else if (op === '3') {
            const srcStr = prompt("Kolom sumber (berbasis 1):");
            const tgtStr = prompt("Kolom target (berbasis 1):");
            const kStr = prompt("Dikalikan dengan:");

            let k = math.evaluate(kStr);
            const src = parseInt(srcStr) - 1;
            const tgt = parseInt(tgtStr) - 1;

            if (isNaN(src) || isNaN(tgt) || (isNaN(k) && !math.isFraction(k)) ||
                src < 0 || src >= colCount || tgt < 0 || tgt >= colCount) {
                throw new Error("Input tidak valid.");
            }
            for (let r = 0; r < rowCount; r++) {
                m[r][tgt] = math.add(m[r][tgt], math.multiply(k, m[r][src]));
            }

        } else {
            throw new Error("Operasi tidak dikenal.");
        }
    } catch (err) {
        showLatexOutput(`\\text{Error: ${err.message.replace(/_/g, '\\_')}}`);
        return null;
    }

    return m;
}

function addCheckboxListener(id, callback) {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('change', callback);
    }
}

buttons.forEach(btn => {
    btn.addEventListener('click', () => {
        try {
            const action = btn.getAttribute('data-action');
            let A_parsed, B_parsed;
            let result;

            try {
                A_parsed = parseMatrix('matrixA');
            } catch (e) {
                showLatexOutput(`\\text{Error: Matriks A tidak valid. ${e.message}}`);
                lastCalculatedResult = null;
                lastCalculatedAction = null;
                return;
            }
            try {
                B_parsed = parseMatrix('matrixB');
            } catch (e) {
                showLatexOutput(`\\text{Error: Matriks B tidak valid. ${e.message}}`);
                lastCalculatedResult = null;
                lastCalculatedAction = null;
                return;
            }

            const isValidMatrix = (matrix) => {
                return matrix && matrix.length > 0 && matrix.every(row => Array.isArray(row) && row.length > 0 && row.every(num => !isNaN(num) || math.isFraction(num)));
            };

            const requiresA = ['det', 'inv', 'trans', 'add', 'sub', 'mul', 'obe', 'oke'];
            if (requiresA.includes(action) && !isValidMatrix(A_parsed)) {
                showLatexOutput('\\text{Error: Matriks A tidak valid atau kosong. Pastikan hanya berisi angka dan spasi/baris baru.}');
                lastCalculatedResult = null;
                lastCalculatedAction = null;
                return;
            }

            const requiresB = ['add', 'sub', 'mul'];
            if (requiresB.includes(action) && !isValidMatrix(B_parsed)) {
                showLatexOutput('\\text{Error: Matriks B tidak valid atau kosong. Pastikan hanya berisi angka dan spasi/baris baru.}');
                lastCalculatedResult = null;
                lastCalculatedAction = null;
                return;
            }

            switch (action) {
                case 'det':
                    if (A_parsed.length !== A_parsed[0]?.length) {
                        showLatexOutput('\\text{Error: Matriks harus persegi untuk determinan.}');
                        return;
                    }
                    const detResult = math.det(math.matrix(A_parsed));
                    lastCalculatedResult = detResult;
                    lastCalculatedAction = 'det';
                    showLatexOutput(`\\det\\left(${toLatex(A_parsed)}\\right) = ${toLatex(detResult)}`);
                    break;
                case 'inv':
                    if (A_parsed.length !== A_parsed[0]?.length) {
                        showLatexOutput('\\text{Error: Matriks harus persegi untuk invers.}');
                        return;
                    }
                    try {
                        result = math.inv(math.matrix(A_parsed));
                        lastCalculatedResult = result;
                        lastCalculatedAction = 'inv';
                        showLatexOutput(`${toLatex(A_parsed)}^{-1} = ${toLatex(result.toArray())}`);
                    } catch (err) {
                        showLatexOutput(`\\text{Error: Matriks singular atau tidak dapat diinverskan.}`);
                        lastCalculatedResult = null;
                        lastCalculatedAction = null;
                    }
                    break;
                case 'trans':
                    result = math.transpose(math.matrix(A_parsed));
                    lastCalculatedResult = result;
                    lastCalculatedAction = 'trans';
                    showLatexOutput(`${toLatex(A_parsed)}^T = ${toLatex(result.toArray())}`);
                    break;
                case 'add':
                    try {
                        if (A_parsed.length !== B_parsed.length || (A_parsed.length > 0 && A_parsed[0].length !== B_parsed[0].length)) {
                            throw new Error('Dimensi matriks harus sama untuk penjumlahan.');
                        }
                        result = math.add(math.matrix(A_parsed), math.matrix(B_parsed));
                        lastCalculatedResult = result;
                        lastCalculatedAction = 'add';
                        showLatexOutput(`${toLatex(A_parsed)} + ${toLatex(B_parsed)} = ${toLatex(result.toArray())}`);
                    } catch (err) {
                        showLatexOutput(`\\text{${err.message.replace(/_/g, '\\_')}}`);
                        lastCalculatedResult = null;
                        lastCalculatedAction = null;
                    }
                    break;
                case 'sub':
                    try {
                        if (A_parsed.length !== B_parsed.length || (A_parsed.length > 0 && A_parsed[0].length !== B_parsed[0].length)) {
                            throw new Error('Dimensi matriks harus sama untuk pengurangan.');
                        }
                        result = math.subtract(math.matrix(A_parsed), math.matrix(B_parsed));
                        lastCalculatedResult = result;
                        lastCalculatedAction = 'sub';
                        showLatexOutput(`${toLatex(A_parsed)} - ${toLatex(B_parsed)} = ${toLatex(result.toArray())}`);
                    } catch (err) {
                        showLatexOutput(`\\text{${err.message.replace(/_/g, '\\_')}}`);
                        lastCalculatedResult = null;
                        lastCalculatedAction = null;
                    }
                    break;
                case 'mul':
                    try {
                        if (A_parsed[0]?.length !== B_parsed?.length) {
                            throw new Error(`Jumlah kolom matriks pertama (${A_parsed[0]?.length || 0}) harus sama dengan jumlah baris matriks kedua (${B_parsed?.length || 0}) untuk perkalian.`);
                        }
                        result = math.multiply(math.matrix(A_parsed), math.matrix(B_parsed));
                        lastCalculatedResult = result;
                        lastCalculatedAction = 'mul';
                        showLatexOutput(`${toLatex(A_parsed)} \\times ${toLatex(B_parsed)} = ${toLatex(result.toArray())}`);
                    } catch (err) {
                        showLatexOutput(`\\text{${err.message.replace(/_/g, '\\_')}}`);
                        lastCalculatedResult = null;
                        lastCalculatedAction = null;
                    }
                    break;
                case 'obe':
                    result = applyOBE(A_parsed);
                    if (result !== null) {
                        lastCalculatedResult = math.matrix(result);
                        lastCalculatedAction = 'obe';
                        showLatexOutput(`\\text{Hasil OBE dari } ${toLatex(A_parsed)} \\rightarrow ${toLatex(result)}`);
                    }
                    break;
                case 'oke':
                    result = applyOKE(A_parsed);
                    if (result !== null) {
                        lastCalculatedResult = math.matrix(result);
                        lastCalculatedAction = 'oke';
                        showLatexOutput(`\\text{Hasil OKE dari } ${toLatex(A_parsed)} \\rightarrow ${toLatex(result)}`);
                    }
                    break;
                case 'evalExpr':
                    evaluateExpression();
                    break;
            }
        } catch (err) {
            showLatexOutput(`\\text{Error tak terduga: ${err.message.replace(/_/g, '\\_')}}`);
            lastCalculatedResult = null;
            lastCalculatedAction = null;
        }
    });
});

addCheckboxListener('decimal', () => {
    if (decimalCheckbox.checked) {
        fractionCheckbox.checked = false;
    }
    updateOutputFormatting();
});

addCheckboxListener('fraction', () => {
    if (fractionCheckbox.checked) {
        decimalCheckbox.checked = false;
    }
    updateOutputFormatting();
});

function applyTheme(isFemaleTheme) {
    if (isFemaleTheme) {
        document.body.classList.add('theme-female');
        localStorage.setItem('theme', 'female');
    } else {
        document.body.classList.remove('theme-female');
        localStorage.setItem('theme', 'male');
    }
}

if (themeFemaleCheckbox) {
    themeFemaleCheckbox.addEventListener('change', () => {
        applyTheme(themeFemaleCheckbox.checked);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    latexOutput.innerHTML = '';
    MathJax.typesetPromise();

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'female') {
        themeFemaleCheckbox.checked = true;
        applyTheme(true);
    } else {
        themeFemaleCheckbox.checked = false;
        applyTheme(false);
    }
});

function swapMatrices() {
    const matrixA = document.getElementById('matrixA');
    const matrixB = document.getElementById('matrixB');

    const tempValue = matrixA.value;
    const tempPlaceholder = matrixA.placeholder;

    matrixA.value = matrixB.value;
    matrixA.placeholder = matrixB.placeholder;

    matrixB.value = tempValue;
    matrixB.placeholder = tempPlaceholder;

    const swapBtn = document.querySelector('.matrix-swap-btn');
    if (swapBtn) {
        swapBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            swapBtn.style.transform = 'rotate(0)';
        }, 300);
    }
    lastCalculatedResult = null;
    lastCalculatedAction = null;
    latexOutput.innerHTML = '';
    MathJax.typesetClear([latexOutput]);
}
