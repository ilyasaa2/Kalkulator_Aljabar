function parseMatrix(id) {
  return document.getElementById(id).value
    .trim()
    .split('\n')
    .map(row => row.trim().split(/\s+/).map(Number));
}

function toLatex(matrix) {
  const showDecimal = document.getElementById('decimal')?.checked;
  const limitDecimals = document.getElementById('limitDecimal')?.checked;

  const formatNumber = (num) => {
    if (!showDecimal) return Math.round(num);
    return limitDecimals ? Number(num.toFixed(2)) : num;
  };

  return `\\begin{bmatrix}${matrix.map(
    row => row.map(formatNumber).join(' & ')
  ).join(' \\\\ ')}\\end{bmatrix}`;
}

function roundMatrix(matrix) {
  const limitDecimals = document.getElementById('limitDecimal')?.checked;
  if (!limitDecimals) return matrix;
  return matrix.map(row => row.map(val => Number(val.toFixed(2))));
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
  const result = A.map(row => row.map(val => val * scalar));
  showLatex(`${scalar} \\cdot ${toLatex(A)} = ${toLatex(roundMatrix(result))}`);
}

function powerMatrix() {
  const n = parseInt(document.getElementById('power').value);
  const A = math.matrix(parseMatrix('matrixA'));
  const result = math.pow(A, n).toArray();
  showLatex(`${toLatex(A._data || A)}^${n} = ${toLatex(roundMatrix(result))}`);
}

function evaluateExpression() {
  const expr = document.getElementById('expression').value;
  const A = parseMatrix('matrixA');
  const B = parseMatrix('matrixB');
  const scope = { A, B };
  const result = math.evaluate(expr, scope);
  showLatex(`${expr} = ${toLatex(roundMatrix(result))}`);
}

function applyOBE(matrix) {
  const m = matrix.map(row => row.slice());
  const rowCount = m.length;
  const colCount = m[0]?.length || 0;

  const op = prompt("Pilih operasi:\n1 = Tukar baris\n2 = Kali baris\n3 = Tambah baris");
  if (!op) return m;

  if (op === '1') {
    // Input baris pertama dan kedua yang ingin ditukar
    const i = parseInt(prompt("Baris pertama (1-based):")) - 1;
    const j = parseInt(prompt("Baris kedua (1-based):")) - 1;

    // Validasi input
    if (isNaN(i) || isNaN(j)) {
      alert("Input tidak valid, pastikan memasukkan angka.");
      return m;
    }

    // Cek apakah indeks baris yang dimasukkan valid
    if (i < 0 || j < 0 || i >= rowCount || j >= rowCount) {
      alert(`Indeks baris harus antara 1 dan ${rowCount}`);
      return m;
    }

    // Menukar baris i dan j
    [m[i], m[j]] = [m[j], m[i]];
  } 
  else if (op === '2') {
    // Input baris yang dikalikan dan faktor kali
    const i = parseInt(prompt("Baris yang dikalikan (1-based):")) - 1;
    const k = parseFloat(prompt("Dikalikan dengan:"));
    
    // Validasi input
    if (isNaN(i) || i < 0 || i >= rowCount || isNaN(k)) {
      alert("Input tidak valid.");
      return m;
    }

    // Mengalikan baris i dengan k
    m[i] = m[i].map(val => val * k);
  } 
  else if (op === '3') {
    // Input baris sumber, baris target, dan faktor tambah
    const src = parseInt(prompt("Baris sumber (1-based):")) - 1;
    const tgt = parseInt(prompt("Baris target (1-based):")) - 1;
    const k = parseFloat(prompt("Dikalikan dengan:"));

    // Validasi input
    if (isNaN(src) || isNaN(tgt) || isNaN(k) ||
        src < 0 || src >= rowCount || tgt < 0 || tgt >= rowCount) {
      alert("Input tidak valid.");
      return m;
    }

    // Menambahkan k * baris sumber ke baris target
    for (let j = 0; j < colCount; j++) {
      m[tgt][j] += k * m[src][j];
    }
  } 
  else {
    alert("Operasi tidak dikenal.");
  }

  return m;
}

function applyOKE(matrix) {
  const m = matrix.map(row => row.slice());
  const rowCount = m.length;
  const colCount = m[0]?.length || 0;

  const op = prompt("Pilih operasi:\n1 = Tukar kolom\n2 = Kali kolom\n3 = Tambah kolom");
  if (!op) return m;

  if (op === '1') {
    const i = parseInt(prompt("Kolom pertama (1-based):")) - 1;
    const j = parseInt(prompt("Kolom kedua (1-based):")) - 1;
    if (isNaN(i) || isNaN(j) || i < 0 || j < 0 || i >= colCount || j >= colCount) {
      alert("Indeks kolom tidak valid.");
      return m;
    }
    for (let r = 0; r < rowCount; r++) {
      [m[r][i], m[r][j]] = [m[r][j], m[r][i]];
    }

  } else if (op === '2') {
    const i = parseInt(prompt("Kolom yang dikalikan (1-based):")) - 1;
    const k = parseFloat(prompt("Dikalikan dengan:"));
    if (isNaN(i) || i < 0 || i >= colCount || isNaN(k)) {
      alert("Input tidak valid.");
      return m;
    }
    for (let r = 0; r < rowCount; r++) {
      m[r][i] *= k;
    }

  } else if (op === '3') {
    const src = parseInt(prompt("Kolom sumber (1-based):")) - 1;
    const tgt = parseInt(prompt("Kolom target (1-based):")) - 1;
    const k = parseFloat(prompt("Dikalikan dengan:"));
    if (isNaN(src) || isNaN(tgt) || isNaN(k) ||
        src < 0 || src >= colCount || tgt < 0 || tgt >= colCount) {
      alert("Input tidak valid.");
      return m;
    }
    for (let r = 0; r < rowCount; r++) {
      m[r][tgt] += k * m[r][src];
    }

  } else {
    alert("Operasi tidak dikenal.");
  }

  return m;
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

      switch (action) {
        case 'det':
          showLatex(`\\det\\left(${toLatex(A)}\\right) = ${math.format(math.det(A))}`);
          break;
        case 'inv':
          result = math.inv(A);
          showLatex(`${toLatex(A)}^{-1} = ${toLatex(roundMatrix(result))}`);
          break;
        case 'trans':
          result = math.transpose(A);
          showLatex(`${toLatex(A)}^T = ${toLatex(roundMatrix(result))}`);
          break;
        case 'add':
          result = math.add(A, B);
          showLatex(`${toLatex(A)} + ${toLatex(B)} = ${toLatex(roundMatrix(result))}`);
          break;
        case 'sub':
          result = math.subtract(A, B);
          showLatex(`${toLatex(A)} - ${toLatex(B)} = ${toLatex(roundMatrix(result))}`);
          break;
        case 'mul':
          result = math.multiply(A, B);
          showLatex(`${toLatex(A)} \\times ${toLatex(B)} = ${toLatex(roundMatrix(result))}`);
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
      showLatex(`\\text{Error: ${err.message.replace(/_/g, '\\_')}}`);
    }
  });
});

// Re-render hasil saat checkbox desimal diubah
['decimal', 'limitDecimal'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', () => {
      const output = document.getElementById('latexOutput');
      if (output.dataset.lastLatex) {
        showLatex(output.dataset.lastLatex);
      }
    });
  }
});