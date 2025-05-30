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

function parseMatrix(id) {
  // Gunakan elemen DOM yang sudah di-cache atau fallback jika tidak di-cache (untuk ketahanan)
  const inputElement = id === 'matrixA' ? matrixAInput : (id === 'matrixB' ? matrixBInput : document.getElementById(id));
  if (!inputElement) {
    console.error(`Elemen dengan id ${id} tidak ditemukan.`);
    return [];
  }

  return inputElement.value
    .trim()
    .split('\n')

    // agar bisa input pecahan
    .map(row => row.trim().split(/\s+/).map(val => {
        try {
          // Coba parse sebagai ekspresi menggunakan math.evaluate, ini akan menangani pecahan
          const parsedValue = math.evaluate(val);
          // math.evaluate bisa mengembalikan objek Fraction jika inputnya pecahan
          // atau Number jika inputnya desimal/integer
          return parsedValue;
        } catch (e) {
          // Jika gagal parsing, mungkin itu bukan angka atau ekspresi yang valid
          console.warn(`Could not parse '${val}' as a number or fraction. Skipping.`);
          return NaN; // Mengembalikan NaN agar filter berikutnya menghapusnya
        }
    }))
    
    .filter(row => row.length > 0 && row.every(num => !isNaN(num)));
}

// Fungsi pembantu untuk mencari GCD (Faktor Persekutuan Terbesar)
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

// Fungsi untuk mengonversi desimal ke pecahan menggunakan pendekatan Continued Fraction
// Lebih kokoh untuk angka-angka kompleks, namun tetap ada batasan presisi floating-point
function decimalToFraction(decimal, tolerance = 1.0E-9) { // Toleransi untuk akurasi floating-point
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

    // Jika selisih antara desimal asli dan pecahan yang ditemukan kurang dari toleransi
    if (Math.abs(decimal - (num3 / den3)) < tolerance) {
      const commonDivisor = gcd(num3, den3);
      return `${sign}\\frac{${num3 / commonDivisor}}{${den3 / commonDivisor}}`;
    }

    // Batasi ukuran penyebut untuk menghindari pecahan yang terlalu besar
    if (den3 > 1000000) {
      break;
    }

    num1 = num2;
    den1 = den2;
    num2 = num3;
    den2 = den3;
    x = 1 / (x - a);

    // Hindari loop tak terbatas atau hasil tak terdefinisi
    if (x === 0 || isNaN(x)) {
      break;
    }
  }
  // Jika tidak dapat menemukan pecahan "bersih" dalam toleransi, kembalikan format desimal standar
  return `${sign}${decimal.toString().replace('.', ',')}`;
}

function toLatex(matrix) {
  const showDecimal = decimalCheckbox?.checked;
  const showFraction = fractionCheckbox?.checked;

  const formatNumber = (num) => {
    // Jika inputnya objek Fraction dari math.js
    if (math.isFraction(num)) {
        if (showDecimal) {
            // Jika ingin menampilkan desimal, konversi pecahan ke desimal
            return (num.n / num.d).toFixed(2).replace('.', ',');
        } else {
            // Default: tampilkan sebagai pecahan
            return `\\frac{${num.s * num.n}}{${num.d}}`;
        }
    } else {
        // Jika inputnya adalah angka (Number)
        if (showFraction && !showDecimal) {
            // Konversi desimal ke pecahan jika diminta
            return decimalToFraction(num);
        }

        if (showDecimal) {
            return num.toFixed(2).replace('.', ',');
        } else {
            if (Math.abs(num) < 1e-9) {
                return '0';
            }
            return num.toString().replace('.', ',');
        }
    }
};
  
  return `\\begin{bmatrix}${matrix.map(
    row => row.map(formatNumber).join(' & ')
  ).join(' \\\\ ')}\\end{bmatrix}`;
}

function roundMatrix(matrix) {
  const showDecimal = decimalCheckbox?.checked;
  const showFraction = fractionCheckbox?.checked;

  // roundMatrix hanya melakukan pembulatan jika mode desimal diaktifkan
  // Jika mode pecahan atau presisi penuh, tidak perlu pembulatan numerik di sini.
  if (showDecimal && !showFraction) {
    return matrix.map(row =>
      row.map(val => {
        // Periksa apakah nilainya adalah objek Fraction
        if (math.isFraction(val)) {
            return Math.round((val.n / val.d) * 100) / 100;
        }
        return Math.round(val * 100) / 100;
      })
    );
  }   
  // Jika tidak ada mode pembulatan spesifik, kembalikan matriks aslinya
  return matrix;
}

function showLatex(latex) {
  latexOutput.dataset.lastLatex = latex;
  latexOutput.innerHTML = `\\(${latex}\\)`;
  MathJax.typesetPromise();
}

function clearAll() {
  matrixAInput.value = '';
  matrixBInput.value = '';
  latexOutput.innerHTML = '';
}

function multiplyScalar() {
  // Gunakan math.evaluate untuk skalar juga, agar bisa menerima pecahan (misal "1/2")
  let scalar;
  try {
      scalar = math.evaluate(scalarInput.value);
  } catch (e) {
      showLatex('\\text{Error: Skalar tidak valid. Pastikan format angka atau pecahan.}');
      return;
  }
  
  const A = parseMatrix('matrixA');
  if (!A || A.length === 0) {
    showLatex('\\text{Error: Matriks A tidak valid.}');
    return;
  }

  if (isNaN(scalar) && !math.isFraction(scalar)) { // Periksa juga untuk objek Fraction
    showLatex('\\text{Error: Skalar tidak valid.}');
    return;
  }
  
  const result = A.map(row => row.map(val => val * scalar));
  showLatex(`${scalar} \\cdot ${toLatex(A)} = ${toLatex(roundMatrix(result))}`);
}

function powerMatrix() {
  try {
    const n = parseInt(powerInput.value);
    const A_array = parseMatrix('matrixA');

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

    showLatex(`${toLatex(matrixA.toArray())}^{${n}} = ${toLatex(roundMatrix(result.toArray()))}`);
  } catch (err) {
    showLatex(`\\text{${err.message.replace(/_/g, '\\_')}}`);
  }
}

function evaluateExpression() {
  const expr = expressionInput.value;
  const A = parseMatrix('matrixA');
  const B = parseMatrix('matrixB');

  const scope = { A: math.matrix(A), B: math.matrix(B) }; // Pastikan A dan B di scope adalah math.Matrix
  
  try {
    const result = math.evaluate(expr, scope);
    // math.evaluate bisa mengembalikan skalar, array, atau objek math.Matrix
    let formattedResult;
    if (math.isMatrix(result)) {
      formattedResult = toLatex(roundMatrix(result.toArray()));
    } else if (Array.isArray(result)) {
      formattedResult = toLatex(roundMatrix(result));
    } else { // Skalar (angka tunggal)
      formattedResult = toLatex(roundMatrix([[result]])); // Bungkus skalar dalam matriks 1x1 untuk format
    }
    showLateex(`${expr} = ${formattedResult}`);
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

    let k;
    try {
        k = math.evaluate(kStr); // Gunakan math.evaluate untuk skalar
    } catch (e) {
        alert("Error: Skalar pengali tidak valid.");
        return m;
    }

    const i = parseInt(iStr) - 1;

    if (isNaN(i) || i < 0 || i >= rowCount || (isNaN(k) && !math.isFraction(k))) {
      
      alert("Error: Input tidak valid.");
      return m;
    }
    
    m[i] = m[i].map(val => val * k);
  } else if (op === '3') {
    const srcStr = prompt("Baris sumber (berbasis 1):");
    const tgtStr = prompt("Baris target (berbasis 1):");
    const kStr = prompt("Dikalikan dengan:");

    let k;
    try {
        k = math.evaluate(kStr); // Gunakan math.evaluate untuk skalar
    } catch (e) {
        alert("Error: Skalar pengali tidak valid.");
        return m;
    }

    const src = parseInt(srcStr) - 1;
    const tgt = parseInt(tgtStr) - 1;

    if (isNaN(src) || isNaN(tgt) || (isNaN(k) && !math.isFraction(k)) ||
      src < 0 || src >= rowCount || tgt < 0 || tgt >= rowCount) {
      alert("Error: Input tidak valid.");
      return m;
    }
    for (let j = 0; j < colCount; j++) {
       m[tgt][j] = math.add(m[tgt][j], math.multiply(k, m[src][j])); // Gunakan math.add dan math.multiply
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

    let k;
    try {
        k = math.evaluate(kStr); // Gunakan math.evaluate untuk skalar
    } catch (e) {
        alert("Error: Skalar pengali tidak valid.");
        return m;
    }

    const i = parseInt(iStr) - 1;
    if (isNaN(i) || i < 0 || i >= colCount || (isNaN(k) && !math.isFraction(k))) {
      alert("Error: Input tidak valid.");
      return m;
    }
    for (let r = 0; r < rowCount; r++) {
      m[r][i] = math.multiply(m[r][i], k); // Gunakan math.multiply
    }
    
  } else if (op === '3') {
    const srcStr = prompt("Kolom sumber (berbasis 1):");
    const tgtStr = prompt("Kolom target (berbasis 1):");
    const kStr = prompt("Dikalikan dengan:");

    let k;
    try {
        k = math.evaluate(kStr); // Gunakan math.evaluate untuk skalar
    } catch (e) {
        alert("Error: Skalar pengali tidak valid.");
        return m;
    }
    const src = parseInt(srcStr) - 1;
    const tgt = parseInt(tgtStr) - 1;

    if (isNaN(src) || isNaN(tgt) || (isNaN(k) && !math.isFraction(k)) ||
      src < 0 || src >= colCount || tgt < 0 || tgt >= colCount) {
      alert("Error: Input tidak valid.");
    }
    for (let r = 0; r < rowCount; r++) {
      m[r][tgt] = math.add(m[r][tgt], math.multiply(k, m[r][src])); // Gunakan math.add dan math.multiply
    }

  } else {
    alert("Error: Operasi tidak dikenal.");
  }

  return m;
}

// Fungsi pembantu untuk menambahkan event listener ke checkbox
function addCheckboxListener(id, callback) {
  const element = document.getElementById(id);
  if (element) {
    element.addEventListener('change', callback);
  }
}

// Event handler untuk semua tombol operasi
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    try {
      const action = btn.getAttribute('data-action');
      const A = parseMatrix('matrixA');
      const B = parseMatrix('matrixB');
      let result;

      // Fungsi pembantu untuk validasi matriks
      const isValidMatrix = (matrix) => {
        return matrix && matrix.length > 0 && matrix.every(row => Array.isArray(row) && row.length > 0 && row.every(num => !isNaN(num) || math.isFraction(num)));
      };

      const requiresA = ['det', 'inv', 'trans', 'add', 'sub', 'mul', 'obe', 'oke', 'power'];
      if (requiresA.includes(action) && !isValidMatrix(A)) {
        showLatex('\\text{Error: Matriks A tidak valid atau kosong. Pastikan hanya berisi angka dan spasi/baris baru.}');
        return;
      }

      const requiresB = ['add', 'sub', 'mul'];
      if (requiresB.includes(action) && !isValidMatrix(B)) {
        showLatex('\\text{Error: Matriks B tidak valid atau kosong. Pastikan hanya berisi angka dan spasi/baris baru.}');
        return;
      }

      switch (action) {
        case 'det':
          if (A.length !== A[0]?.length) {
            showLatex('\\text{Error: Matriks harus persegi untuk determinan.}');
            return;
          }
          // Untuk determinan, kita ingin menampilkan angka format penuh dari math.js
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
        case 'scalar':
          multiplyScalar();
          break;
        case 'power':
          powerMatrix();
          break;
        case 'expr':
          evaluateExpression();
          break;
        case 'obe':
          result = applyOBE(A);
          if (!result) return;
          showLatex(`\\text{Hasil OBE dari } ${toLatex(A)} \\rightarrow ${toLatex(roundMatrix(result))}`);
          break;
        case 'oke':
          result = applyOKE(A);
          if (!result) return;
          showLatex(`\\text{Hasil OKE dari } ${toLatex(A)} \\rightarrow ${toLatex(roundMatrix(result))}`);
          break;
      }
    } catch (err) {
      showLatex(`\\text{Error tak terduga: ${err.message.replace(/_/g, '\\_')}}`);
    }
  });
});

// Atur event listener untuk checkbox desimal dan pecahan
addCheckboxListener('decimal', () => {
  if (decimalCheckbox.checked) fractionCheckbox.checked = false;
  const lastLatex = latexOutput.dataset.lastLatex;
  if (lastLatex) {
    MathJax.typesetClear();
    showLatex(lastLatex);
  }
});

addCheckboxListener('fraction', () => {
  if (fractionCheckbox.checked) decimalCheckbox.checked = false;
  const lastLatex = latexOutput.dataset.lastLatex;
  if (lastLatex) {
    MathJax.typesetClear();
    showLatex(lastLatex);
  }
});

// Pengaturan awal untuk memastikan MathJax merender konten atau placeholder default
document.addEventListener('DOMContentLoaded', () => {
  MathJax.typesetPromise();
});


// Fungsi buat swapnya
function swapMatrices() {
  const matrixA = document.getElementById('matrixA');
  const matrixB = document.getElementById('matrixB');
  
  // buat nyimpen nilai sementara
  const tempValue = matrixA.value;
  const tempPlaceholder = matrixA.placeholder;
  
  // buat nuker nilai
  matrixA.value = matrixB.value;
  matrixA.placeholder = matrixB.placeholder;
  
  matrixB.value = tempValue;
  matrixB.placeholder = tempPlaceholder;
  
  // buat animasi swap
  const swapBtn = document.querySelector('.swap-btn');
  swapBtn.style.transform = 'rotate(180deg)';
  setTimeout(() => {
    swapBtn.style.transform = 'rotate(0)';
  }, 300);
}

function clearAll() {
  document.getElementById('matrixA').value = '';
  document.getElementById('matrixB').value = '';
  document.getElementById('latexOutput').innerHTML = '';
}

function clearMatrix(id) {
  const textarea = document.getElementById(id);
  if (textarea) {
    textarea.value = '';
  }
}
