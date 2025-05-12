function parseMatrix(id) {
  return document.getElementById(id).value
    .trim()
    .split('\n')
    .map(row => row.trim().split(/\s+/).map(Number))
    .filter(row => row.length > 0 && row.every(num => !isNaN(num)));
}

function toLatex(matrix) {
  const showDecimal = document.getElementById('decimal')?.checked;

  const formatNumber = (num) => {
    const formatted = showDecimal ? num.toFixed(2) : Math.round(num).toString();
    return formatted.replace('.', ','); // gunakan koma desimal
  };

  return `\\begin{bmatrix}${matrix.map(
    row => row.map(formatNumber).join(' & ')
  ).join(' \\\\ ')}\\end{bmatrix}`;
}

function roundMatrix(matrix) {
  const showDecimal = document.getElementById('decimal')?.checked;
  return matrix.map(row =>
    row.map(val =>
      showDecimal ? parseFloat(val.toFixed(2)) : Math.round(val)
    )
  );
}

function showLatex(latex) {
  const output = document.getElementById('latexOutput');
  output.dataset.lastLatex = latex;
  output.innerHTML = `\\(${latex}\\)`;
  MathJax.typesetPromise();
}

function clearAll() {
  document.getElementById('matrixA').value = '';
  document.getElementById('matrixB').value = '';
  document.getElementById('latexOutput').innerHTML = '';
}

function multiplyScalar() {
  const scalar = parseFloat(document.getElementById('scalar').value);
  const A = parseMatrix('matrixA');
  if (!A || A.length === 0) {
    showLatex('\\text{Error: Matriks A tidak valid.}');
    return;
  }
  const result = A.map(row => row.map(val => val * scalar));
  showLatex(`${scalar} \\cdot ${toLatex(A)} = ${toLatex(roundMatrix(result))}`);
}

function powerMatrix() {
  try {
    const n = parseInt(document.getElementById('power').value);
    const A_array = parseMatrix('matrixA');

    if (!A_array || A_array.length === 0) {
      throw new Error('Error: Matriks A tidak valid.');
    }

    if (A_array.length !== A_array[0].length) {
      throw new Error('Error: Matriks harus persegi untuk perpangkatan.');
    }

    const matrixA = math.matrix(A_array);
    let result = math.identity(A_array.length);

    for (let i = 1; i < n; i++) {
      result = math.multiply(result, matrixA);
    }

    showLatex(`${toLatex(matrixA.toArray())}^${n} = ${toLatex(roundMatrix(result.toArray()))}`);
  } catch (err) {
    showLatex(`\\text{${err.message.replace(/_/g, '\\_')}}`);
  }
}

function evaluateExpression() {
  const expr = document.getElementById('expression').value;
  const A = parseMatrix('matrixA');
  const B = parseMatrix('matrixB');
  const scope = { A, B };
  try {
    const result = math.evaluate(expr, scope);
    showLatex(`${expr} = ${toLatex(Array.isArray(result) ? result : [[result]])}`);
  } catch (err) {
    showLatex(`\\text{Error: ${err.message.replace(/_/g, '\\_')}}`);
  }
}

function applyOBE(matrix) {
  if (!matrix || matrix.length === 0 || !matrix.every(row => Array.isArray(row))) {
    alert("Error: Matriks tidak valid.");
    return matrix;
  }
  const m = matrix.map(row => row.slice());
  const rowCount = m.length;
  const colCount = m[0]?.length || 0;

  const op = prompt("Pilih operasi:\n1 = Tukar baris\n2 = Kali baris\n3 = Tambah baris");
  if (!op) return m;

  if (op === '1') {
    const iStr = prompt("Baris pertama (berbasis 1):");
    const jStr = prompt("Baris kedua (berbasis 1):");
    const i = parseInt(iStr) - 1;
    const j = parseInt(jStr) - 1;

    if (isNaN(i) || isNaN(j) || i < 0 || j < 0 || i >= rowCount || j >= rowCount) {
      alert("Error: Input baris tidak valid.");
      return m;
    }
    [m[i], m[j]] = [m[j], m[i]];
  } else if (op === '2') {
    const iStr = prompt("Baris yang dikalikan (berbasis 1):");
    const kStr = prompt("Dikalikan dengan:");
    const i = parseInt(iStr) - 1;
    const k = parseFloat(kStr);

    if (isNaN(i) || i < 0 || i >= rowCount || isNaN(k)) {
      alert("Error: Input tidak valid.");
      return m;
    }
    m[i] = m[i].map(val => val * k);
  } else if (op === '3') {
    const srcStr = prompt("Baris sumber (berbasis 1):");
    const tgtStr = prompt("Baris target (berbasis 1):");
    const kStr = prompt("Dikalikan dengan:");
    const src = parseInt(srcStr) - 1;
    const tgt = parseInt(tgtStr) - 1;
    const k = parseFloat(kStr);

    if (isNaN(src) || isNaN(tgt) || isNaN(k) ||
      src < 0 || src >= rowCount || tgt < 0 || tgt >= rowCount) {
      alert("Error: Input tidak valid.");
      return m;
    }
    for (let j = 0; j < colCount; j++) {
      m[tgt][j] += k * m[src][j];
    }
  } else {
    alert("Error: Operasi tidak dikenal.");
  }

  return m;
}

function applyOKE(matrix) {
  if (!matrix || matrix.length === 0 || !matrix.every(row => Array.isArray(row))) {
    alert("Error: Matriks tidak valid.");
    return matrix;
  }
  const m = matrix.map(row => row.slice());
  const rowCount = m.length;
  const colCount = m[0]?.length || 0;

  const op = prompt("Pilih operasi:\n1 = Tukar kolom\n2 = Kali kolom\n3 = Tambah kolom");
  if (!op) return m;

  if (op === '1') {
    const iStr = prompt("Kolom pertama (berbasis 1):");
    const jStr = prompt("Kolom kedua (berbasis 1):");
    const i = parseInt(iStr) - 1;
    const j = parseInt(jStr) - 1;
    if (isNaN(i) || isNaN(j) || i < 0 || j < 0 || i >= colCount || j >= colCount) {
      alert("Error: Indeks kolom tidak valid.");
      return m;
    }
    for (let r = 0; r < rowCount; r++) {
      [m[r][i], m[r][j]] = [m[r][j], m[r][i]];
    }

  } else if (op === '2') {
    const iStr = prompt("Kolom yang dikalikan (berbasis 1):");
    const kStr = prompt("Dikalikan dengan:");
    const i = parseInt(iStr) - 1;
    const k = parseFloat(kStr);
    if (isNaN(i) || i < 0 || i >= colCount || isNaN(k)) {
      alert("Error: Input tidak valid.");
      return m;
    }
    for (let r = 0; r < rowCount; r++) {
      m[r][i] *= k;
    }

  } else if (op === '3') {
    const srcStr = prompt("Kolom sumber (berbasis 1):");
    const tgtStr = prompt("Kolom target (berbasis 1):");
    const kStr = prompt("Dikalikan dengan:");
    const src = parseInt(srcStr) - 1;
    const tgt = parseInt(tgtStr) - 1;
    const k = parseFloat(kStr);
    if (isNaN(src) || isNaN(tgt) || isNaN(k) ||
      src < 0 || src >= colCount || tgt < 0 || tgt >= colCount) {
      alert("Error: Input tidak valid.");
      return m;
    }
    for (let r = 0; r < rowCount; r++) {
      m[r][tgt] += k * m[r][src];
    }

  } else {
    alert("Error: Operasi tidak dikenal.");
  }

  return m;
}

// Helper function untuk menambahkan event listener ke checkbox
function addCheckboxListener(id, callback) {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('change', callback);
  }
}

// Event handler untuk semua tombol operasi
const buttons = document.querySelectorAll('[data-action]');
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    try {
      const action = btn.getAttribute('data-action');
      const A = parseMatrix('matrixA');
      const B = parseMatrix('matrixB');
      let result;

      const requiresA = ['det', 'inv', 'trans', 'add', 'sub', 'mul', 'obe', 'oke'];
      if (requiresA.includes(action) && (!A || A.length === 0 || !A.every(row => Array.isArray(row) && row.every(num => !isNaN(num))))) {
        showLatex('\\text{Error: Matriks A tidak valid.}');
        return;
      }

      const requiresB = ['add', 'sub', 'mul'];
      if (requiresB.includes(action) && (!B || B.length === 0 || !B.every(row => Array.isArray(row) && row.every(num => !isNaN(num))))) {
        showLatex('\\text{Error: Matriks B tidak valid.}');
        return;
      }

      switch (action) {
        case 'det':
          if (A.length !== A[0]?.length) {
            showLatex('\\text{Error: Matriks harus persegi untuk determinan.}');
            return;
          }
          showLatex(`\\det\\left(${toLatex(A)}\\right) = ${math.format(math.det(A))}`);
          break;
        case 'inv':
          if (A.length !== A[0]?.length) {
            showLatex('\\text{Error: Matriks harus persegi untuk invers.}');
            return;
          }
          try {
            result = math.inv(A);
            showLatex(`${toLatex(A)}^{-1} = ${toLatex(roundMatrix(result))}`);
          } catch (err) {
            showLatex(`\\text{Error: Matriks singular atau tidak dapat diinverskan.}`);
          }
          break;
        case 'trans':
          result = math.transpose(A);
          showLatex(`${toLatex(A)}^T = ${toLatex(roundMatrix(result))}`);
          break;
        case 'add':
          try {
            if (A.length !== B.length || (A.length > 0 && A[0].length !== B[0].length)) {
              throw new Error('Error: Dimensi matriks harus sama untuk penjumlahan.');
            }
            result = math.add(A, B);
            showLatex(`${toLatex(A)} + ${toLatex(B)} = ${toLatex(roundMatrix(result))}`);
          } catch (err) {
            showLatex(`\\text{${err.message.replace(/_/g, '\\_')}}`);
          }
          break;
        case 'sub':
          try {
            if (A.length !== B.length || (A.length > 0 && A[0].length !== B[0].length)) {
              throw new Error('Error: Dimensi matriks harus sama untuk pengurangan.');
            }
            result = math.subtract(A, B);
            showLatex(`${toLatex(A)} - ${toLatex(B)} = ${toLatex(roundMatrix(result))}`);
          } catch (err) {
            showLatex(`\\text{${err.message.replace(/_/g, '\\_')}}`);
          }
          break;
        case 'mul':
          try {
            if (A[0]?.length !== B?.length) {
              throw new Error(`Error: Jumlah kolom matriks pertama (${A[0]?.length || 0}) harus sama dengan jumlah baris matriks kedua (${B?.length || 0}) untuk perkalian.`);
            }
            result = math.multiply(A, B);
            showLatex(`${toLatex(A)} \\times ${toLatex(B)} = ${toLatex(roundMatrix(result))}`);
          } catch (err) {
            showLatex(`\\text{${err.message.replace(/_/g, '\\_')}}`);
          }
          break;
        case 'obe':
          result = applyOBE(A);
          showLatex(`\\text{Hasil OBE dari } ${toLatex(A)} = ${toLatex(roundMatrix(result))}`);
          break;
        case 'oke':
          result = applyOKE(A);
          showLatex(`\\text{Hasil OKE dari } ${toLatex(A)} = ${toLatex(roundMatrix(result))}`);
          break;
      }
    } catch (err) {
      showLatex(`\\text{Error tak terduga: ${err.message.replace(/_/g, '\\_')}}`);
    }
  });
});

// Set up event listeners for decimal and limitDecimal checkboxes
addCheckboxListener('decimal', () => {
  const lastLatex = document.getElementById('latexOutput').dataset.lastLatex;
  if (lastLatex) {
    MathJax.typesetClear();
    showLatex(lastLatex);
  }
});