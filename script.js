function parseMatrix(id) {
  return document.getElementById(id).value
    .trim()
    .split('\n')
    .map(row => row.trim().split(/\s+/).map(Number));
}

function toLatex(matrix) {
  const showDecimal = document.getElementById('decimal')?.checked;

  const formatNumber = (num) => {
    return showDecimal ? Number(num.toFixed(2)) : Math.round(num);
  };

  return `\\begin{bmatrix}${matrix.map(
    row => row.map(formatNumber).join(' & ')
  ).join(' \\\\ ')}\\end{bmatrix}`;
}

function roundMatrix(matrix) {
  const showDecimal = document.getElementById('decimal')?.checked;
  return matrix.map(row => row.map(val => showDecimal ? Number(val.toFixed(2)) : Math.round(val)));
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
  try {
    const n = parseInt(document.getElementById('power').value);
    const A = parseMatrix('matrixA');

    if (A.length !== A[0].length) {
      throw new Error('Matriks harus persegi untuk perpangkatan.');
    }

    let result = math.identity(A.length)._data;

    for (let i = 0; i < n; i++) {
      result = math.multiply(result, A);
    }

    showLatex(`${toLatex(A)}^${n} = ${toLatex(roundMatrix(result))}`);
  } catch (err) {
    showLatex(`\\text{Error: ${err.message.replace(/_/g, '\\_')}}`);
  }
}

function evaluateExpression() {
  const expr = document.getElementById('expression').value;
  const A = parseMatrix('matrixA');
  const B = parseMatrix('matrixB');
  const scope = { A, B };
  const result = math.evaluate(expr, scope);
  showLatex(`${expr} = ${toLatex(roundMatrix(result))}`);
}