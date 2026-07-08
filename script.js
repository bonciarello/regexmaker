/* ============================================================
   Generatore di Regex — Logica applicativa
   ============================================================ */

(function () {
  'use strict';

  // --- DOM references ---
  const form = document.getElementById('regex-form');
  const matchTA = document.getElementById('match-examples');
  const rejectTA = document.getElementById('reject-examples');
  const generateBtn = document.getElementById('generate-btn');
  const formError = document.getElementById('form-error');

  const resultSection = document.getElementById('result-section');
  const regexPattern = document.getElementById('regex-pattern');
  const copyBtn = document.getElementById('copy-btn');
  const copyToast = document.getElementById('copy-toast');
  const explanationList = document.getElementById('explanation-list');

  const testSection = document.getElementById('test-section');
  const testInput = document.getElementById('test-input');
  const testBadge = document.getElementById('test-badge');
  const testHighlight = document.getElementById('test-highlight');
  const highlightText = document.getElementById('highlight-text');

  const manualPattern = document.getElementById('manual-pattern');
  const syntaxIndicator = document.getElementById('syntax-indicator');
  const syntaxMessage = document.getElementById('syntax-message');

  // --- State ---
  let currentPattern = '';
  let currentFlags = 'g';

  // --- Utility ---

  /** Escape special regex characters for literal matching */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Parse textarea into non-empty lines */
  function parseLines(text) {
    return text
      .split('\n')
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
  }

  /** Find longest common prefix of an array of strings */
  function longestCommonPrefix(strings) {
    if (strings.length === 0) return '';
    var prefix = strings[0];
    for (var i = 1; i < strings.length; i++) {
      while (strings[i].indexOf(prefix) !== 0) {
        prefix = prefix.slice(0, -1);
        if (prefix === '') return '';
      }
    }
    return prefix;
  }

  /** Find longest common suffix of an array of strings */
  function longestCommonSuffix(strings) {
    if (strings.length === 0) return '';
    // Reverse all strings
    var reversed = strings.map(function (s) {
      return s.split('').reverse().join('');
    });
    var commonRev = longestCommonPrefix(reversed);
    return commonRev.split('').reverse().join('');
  }

  /** Check if a string contains only digits */
  function isAllDigits(s) {
    return s.length > 0 && /^\d+$/.test(s);
  }

  /** Check if a string contains only ASCII letters */
  function isAllLetters(s) {
    return s.length > 0 && /^[a-zA-Z]+$/.test(s);
  }

  /** Check if a string contains only lowercase ASCII letters */
  function isAllLower(s) {
    return s.length > 0 && /^[a-z]+$/.test(s);
  }

  /** Check if a string contains only uppercase ASCII letters */
  function isAllUpper(s) {
    return s.length > 0 && /^[A-Z]+$/.test(s);
  }

  /** Check if a string is alphanumeric (letters + digits) */
  function isAlphanumeric(s) {
    return s.length > 0 && /^[a-zA-Z0-9]+$/.test(s);
  }

  /** Check if all strings in array satisfy a predicate */
  function all(arr, fn) {
    for (var i = 0; i < arr.length; i++) {
      if (!fn(arr[i])) return false;
    }
    return true;
  }

  /** Check if all strings have the same length */
  function allSameLength(arr) {
    if (arr.length <= 1) return true;
    var len = arr[0].length;
    for (var i = 1; i < arr.length; i++) {
      if (arr[i].length !== len) return false;
    }
    return true;
  }

  /** Get all unique characters used across strings */
  function uniqueChars(strings) {
    var set = {};
    for (var i = 0; i < strings.length; i++) {
      for (var j = 0; j < strings[i].length; j++) {
        set[strings[i][j]] = true;
      }
    }
    return Object.keys(set).sort();
  }

  /** Build a compact character class from a set of chars */
  function buildCharClass(chars) {
    if (chars.length === 0) return '';

    // Check if it's all digits
    var allDigits = chars.every(function (c) { return c >= '0' && c <= '9'; });
    if (allDigits) return '\\d';

    // Check if it's all lowercase letters
    var allLower = chars.every(function (c) { return c >= 'a' && c <= 'z'; });
    if (allLower) return '[a-z]';

    // Check if it's all uppercase letters
    var allUpper = chars.every(function (c) { return c >= 'A' && c <= 'Z'; });
    if (allUpper) return '[A-Z]';

    // Check if it's all letters
    var allLetters = chars.every(function (c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'); });
    if (allLetters) return '[a-zA-Z]';

    // Check if it's word chars
    var allWord = chars.every(function (c) { return /[a-zA-Z0-9_]/.test(c); });
    if (allWord) return '\\w';

    // Build custom class
    var escaped = chars.map(function (c) { return escapeRegex(c); });
    // Merge into ranges where possible
    return '[' + escaped.join('') + ']';
  }

  // --- Core Algorithm: Analyze variable middle part ---

  /**
   * Analyze the variable (non-common) parts of match strings
   * and produce a regex fragment.
   */
  function analyzeVariablePart(middles) {
    // Filter out empty strings
    var nonEmpty = middles.filter(function (s) { return s.length > 0; });

    // If all middles are empty, the pattern is just the fixed parts
    if (nonEmpty.length === 0) return '';

    // If all identical, escape and use literally
    var allSame = nonEmpty.every(function (s) { return s === nonEmpty[0]; });
    if (allSame) return escapeRegex(nonEmpty[0]);

    // If all are digits
    if (all(nonEmpty, isAllDigits)) {
      if (allSameLength(nonEmpty)) {
        return '\\d{' + nonEmpty[0].length + '}';
      }
      // Check range of lengths
      var lens = nonEmpty.map(function (s) { return s.length; });
      var minLen = Math.min.apply(null, lens);
      var maxLen = Math.max.apply(null, lens);
      if (minLen === maxLen) {
        return '\\d{' + minLen + '}';
      }
      return '\\d{' + minLen + ',' + maxLen + '}';
    }

    // If all are lowercase letters
    if (all(nonEmpty, isAllLower)) {
      if (allSameLength(nonEmpty)) {
        return '[a-z]{' + nonEmpty[0].length + '}';
      }
      var lens = nonEmpty.map(function (s) { return s.length; });
      var minLen = Math.min.apply(null, lens);
      var maxLen = Math.max.apply(null, lens);
      if (minLen === maxLen) return '[a-z]{' + minLen + '}';
      return '[a-z]{' + minLen + ',' + maxLen + '}';
    }

    // If all are uppercase letters
    if (all(nonEmpty, isAllUpper)) {
      if (allSameLength(nonEmpty)) {
        return '[A-Z]{' + nonEmpty[0].length + '}';
      }
      var lens = nonEmpty.map(function (s) { return s.length; });
      var minLen = Math.min.apply(null, lens);
      var maxLen = Math.max.apply(null, lens);
      if (minLen === maxLen) return '[A-Z]{' + minLen + '}';
      return '[A-Z]{' + minLen + ',' + maxLen + '}';
    }

    // If all are ASCII letters
    if (all(nonEmpty, isAllLetters)) {
      if (allSameLength(nonEmpty)) {
        return '[a-zA-Z]{' + nonEmpty[0].length + '}';
      }
      var lens = nonEmpty.map(function (s) { return s.length; });
      var minLen = Math.min.apply(null, lens);
      var maxLen = Math.max.apply(null, lens);
      if (minLen === maxLen) return '[a-zA-Z]{' + minLen + '}';
      return '[a-zA-Z]{' + minLen + ',' + maxLen + '}';
    }

    // If same length, analyze position by position
    if (allSameLength(nonEmpty) && nonEmpty[0].length <= 20) {
      var posPatterns = [];
      for (var pos = 0; pos < nonEmpty[0].length; pos++) {
        var chars = uniqueChars(nonEmpty.map(function (s) { return s[pos]; }));
        if (chars.length === 1) {
          posPatterns.push(escapeRegex(chars[0]));
        } else {
          posPatterns.push(buildCharClass(chars));
        }
      }
      return posPatterns.join('');
    }

    // Alphanumeric
    if (all(nonEmpty, isAlphanumeric)) {
      return '[a-zA-Z0-9]+';
    }

    // Fallback: alternation (sorted for consistency)
    var unique = [];
    var seen = {};
    for (var i = 0; i < nonEmpty.length; i++) {
      if (!seen[nonEmpty[i]]) {
        seen[nonEmpty[i]] = true;
        unique.push(nonEmpty[i]);
      }
    }
    unique.sort();

    // If too many options, try to be smarter
    if (unique.length <= 8) {
      var escaped = unique.map(function (s) { return escapeRegex(s); });
      return '(' + escaped.join('|') + ')';
    }

    // Generic catch-all: non-whitespace characters of reasonable length
    return '\\S+';
  }

  // --- Main Generation ---

  /**
   * Generate a regex pattern from match and reject examples.
   * Returns { pattern: string, explanation: string[] }
   */
  function generateRegex(matchLines, rejectLines) {
    var matches = parseLines(matchLines);
    var rejects = parseLines(rejectLines);

    if (matches.length === 0) {
      return { error: 'Inserisci almeno un esempio di testo da abbinare.' };
    }

    var pattern = '';
    var explanation = [];

    if (matches.length === 1) {
      // Single match: escape and use literally, but try to be smart about it
      var single = matches[0];
      pattern = escapeRegex(single);
      explanation.push({
        code: pattern,
        text: 'Pattern generato dall\'unico esempio fornito (caratteri speciali resi letterali).'
      });
    } else {
      // Multiple matches: find common structure
      var prefix = longestCommonPrefix(matches);
      var suffix = longestCommonSuffix(matches);

      // If prefix and suffix overlap or cover everything, adjust
      if (prefix.length + suffix.length > matches[0].length) {
        suffix = '';
        // Recalculate without overlap
        if (prefix.length >= matches[0].length) {
          prefix = longestCommonPrefix(matches.map(function (s) { return s; }));
          // Still, find a better split
        }
      }

      // Recalculate suffix after fixing potential overlap
      var totalLen = matches[0].length;
      if (prefix.length + suffix.length > totalLen) {
        suffix = '';
      }

      // Try again with cleaner calculation
      suffix = longestCommonSuffix(matches);
      if (prefix.length + suffix.length > totalLen) {
        var maxSuffix = totalLen - prefix.length;
        suffix = matches[0].slice(-maxSuffix);
        // Verify it's actually common
        for (var i = 1; i < matches.length; i++) {
          while (!matches[i].endsWith(suffix) && suffix.length > 0) {
            suffix = suffix.slice(1);
          }
        }
      }

      // Extract variable middle parts
      var middles = matches.map(function (s) {
        var mid = s;
        if (prefix.length > 0 && mid.startsWith(prefix)) {
          mid = mid.slice(prefix.length);
        }
        if (suffix.length > 0 && mid.endsWith(suffix)) {
          mid = mid.slice(0, -suffix.length);
        }
        return mid;
      });

      // Build pattern
      var escapedPrefix = prefix ? escapeRegex(prefix) : '';
      var middlePattern = analyzeVariablePart(middles);
      var escapedSuffix = suffix ? escapeRegex(suffix) : '';

      pattern = escapedPrefix + middlePattern + escapedSuffix;

      // Build explanation
      if (prefix) {
        explanation.push({
          code: escapedPrefix,
          text: 'Parte iniziale fissa: tutti gli esempi iniziano con "' + prefix + '".'
        });
      }

      if (middlePattern) {
        var midDesc = describeMiddle(middles, middlePattern);
        explanation.push({
          code: middlePattern,
          text: midDesc
        });
      }

      if (suffix) {
        explanation.push({
          code: escapedSuffix,
          text: 'Parte finale fissa: tutti gli esempi finiscono con "' + suffix + '".'
        });
      }
    }

    // Refine with reject examples
    if (rejects.length > 0) {
      try {
        var testRe = new RegExp(pattern);
        var anyRejectMatches = rejects.some(function (r) {
          return testRe.test(r);
        });

        if (anyRejectMatches) {
          // Try anchoring
          var anchoredPattern = '^' + pattern + '$';
          var anchoredRe = new RegExp(anchoredPattern);
          var stillMatchesReject = rejects.some(function (r) {
            return anchoredRe.test(r);
          });

          if (!stillMatchesReject) {
            pattern = anchoredPattern;
            explanation.push({
              code: '^ … $',
              text: 'Ancore aggiunte per escludere i testi da rifiutare (il pattern deve corrispondere all\'intera stringa).'
            });
          } else {
            // Anchoring didn't help — add word boundaries as fallback
            var boundedPattern = '\\b' + pattern + '\\b';
            var boundedRe = new RegExp(boundedPattern);
            var stillMatchesBounded = rejects.some(function (r) {
              return boundedRe.test(r);
            });

            if (!stillMatchesBounded) {
              pattern = boundedPattern;
              explanation.push({
                code: '\\b … \\b',
                text: 'Limiti di parola aggiunti per evitare corrispondenze parziali nei testi da rifiutare.'
              });
            }
          }
        }
      } catch (e) {
        // Pattern may have issues; skip refinement
      }
    }

    return {
      pattern: pattern,
      explanation: explanation
    };
  }

  /** Produce a human-readable Italian description of the middle pattern */
  function describeMiddle(middles, pattern) {
    if (pattern === '\\S+') {
      return 'Parte variabile: qualsiasi sequenza di caratteri non-spazio.';
    }

    var nonEmpty = middles.filter(function (s) { return s.length > 0; });

    if (nonEmpty.length === 0) return 'Nessuna parte variabile.';

    if (all(nonEmpty, isAllDigits)) {
      var lens = nonEmpty.map(function (s) { return s.length; });
      var minLen = Math.min.apply(null, lens);
      var maxLen = Math.max.apply(null, lens);
      if (minLen === maxLen) {
        return 'Parte variabile: esattamente ' + minLen + ' cifre numeriche.';
      }
      return 'Parte variabile: da ' + minLen + ' a ' + maxLen + ' cifre numeriche.';
    }

    if (all(nonEmpty, isAllLower)) {
      var lens = nonEmpty.map(function (s) { return s.length; });
      var minLen = Math.min.apply(null, lens);
      var maxLen = Math.max.apply(null, lens);
      if (minLen === maxLen) {
        return 'Parte variabile: esattamente ' + minLen + ' lettere minuscole.';
      }
      return 'Parte variabile: da ' + minLen + ' a ' + maxLen + ' lettere minuscole.';
    }

    if (all(nonEmpty, isAllUpper)) {
      var lens = nonEmpty.map(function (s) { return s.length; });
      var minLen = Math.min.apply(null, lens);
      var maxLen = Math.max.apply(null, lens);
      if (minLen === maxLen) {
        return 'Parte variabile: esattamente ' + minLen + ' lettere maiuscole.';
      }
      return 'Parte variabile: da ' + minLen + ' a ' + maxLen + ' lettere maiuscole.';
    }

    if (all(nonEmpty, isAllLetters)) {
      var lens = nonEmpty.map(function (s) { return s.length; });
      var minLen = Math.min.apply(null, lens);
      var maxLen = Math.max.apply(null, lens);
      if (minLen === maxLen) {
        return 'Parte variabile: esattamente ' + minLen + ' lettere (maiuscole o minuscole).';
      }
      return 'Parte variabile: da ' + minLen + ' a ' + maxLen + ' lettere.';
    }

    if (all(nonEmpty, isAlphanumeric)) {
      return 'Parte variabile: una o più lettere o cifre.';
    }

    if (pattern.startsWith('(') && pattern.endsWith(')') && pattern.indexOf('|') > -1) {
      var options = nonEmpty.filter(function (s, i, arr) {
        return arr.indexOf(s) === i;
      });
      return 'Parte variabile: una tra ' + options.length + ' alternative (' + options.join(', ') + ').';
    }

    if (allSameLength(nonEmpty)) {
      return 'Parte variabile: ' + nonEmpty[0].length + ' caratteri, con classi di caratteri dedotte dagli esempi.';
    }

    return 'Parte variabile: sequenza di caratteri non-spazio.';
  }

  // --- Regex Validation ---

  function validateRegex(pattern) {
    if (!pattern || pattern.trim() === '') {
      return { valid: false, message: 'Il pattern è vuoto.' };
    }
    try {
      new RegExp(pattern);
      // Check for common issues
      if (pattern.includes('(?') && !pattern.includes('(?:') && !pattern.includes('(?=') && !pattern.includes('(?!)') && !pattern.includes('(?<=') && !pattern.includes('(?<!')) {
        // Has lookahead/lookbehind — valid but complex, still fine
      }
      return { valid: true, message: 'Sintassi valida.' };
    } catch (e) {
      var msg = e.message || 'Errore di sintassi.';
      // Clean up the message
      msg = msg.replace('Invalid regular expression: ', '').replace(/^\/.*\/: /, '');
      return { valid: false, message: msg.charAt(0).toUpperCase() + msg.slice(1) };
    }
  }

  // --- UI Updates ---

  function updateSyntaxUI(validation) {
    syntaxIndicator.hidden = false;
    syntaxMessage.hidden = false;

    if (validation.valid) {
      syntaxIndicator.className = 'syntax-indicator valid';
      syntaxMessage.className = 'syntax-message valid';
      syntaxMessage.textContent = validation.message;
    } else {
      syntaxIndicator.className = 'syntax-indicator invalid';
      syntaxMessage.className = 'syntax-message invalid';
      syntaxMessage.textContent = validation.message;
    }
  }

  function clearSyntaxUI() {
    syntaxIndicator.hidden = true;
    syntaxMessage.hidden = true;
    syntaxMessage.textContent = '';
  }

  function highlightMatches(text, pattern) {
    if (!pattern) return escapeHtml(text);

    try {
      var re = new RegExp(pattern, 'g');
      var result = '';
      var lastIndex = 0;
      var match;

      while ((match = re.exec(text)) !== null) {
        result += escapeHtml(text.slice(lastIndex, match.index));
        result += '<mark>' + escapeHtml(match[0]) + '</mark>';
        lastIndex = re.lastIndex;
        if (match[0].length === 0) {
          // Avoid infinite loop on zero-length matches
          if (re.lastIndex === text.length) break;
          re.lastIndex++;
        }
      }
      result += escapeHtml(text.slice(lastIndex));
      return result;
    } catch (e) {
      return escapeHtml(text);
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function updateTestUI() {
    var text = testInput.value.trim();
    var pattern = currentPattern;

    if (!text || !pattern) {
      testBadge.hidden = true;
      testHighlight.hidden = true;
      return;
    }

    try {
      var re = new RegExp(pattern);
      var isMatch = re.test(text);

      testBadge.hidden = false;
      if (isMatch) {
        testBadge.textContent = '✓ Match';
        testBadge.className = 'test-result-badge match';
      } else {
        testBadge.textContent = '✗ Nessun match';
        testBadge.className = 'test-result-badge no-match';
      }

      // Show highlight with global flag
      var globalPattern = pattern;
      // Try with global flag for highlighting
      try {
        new RegExp(pattern, 'g');
        globalPattern = pattern;
      } catch (e) {
        // Some patterns can't have global flag (e.g. with ^$ and multiline)
      }

      if (isMatch) {
        testHighlight.hidden = false;
        highlightText.innerHTML = highlightMatches(text, globalPattern);
      } else {
        testHighlight.hidden = true;
      }
    } catch (e) {
      testBadge.hidden = false;
      testBadge.textContent = '⚠ Pattern non valido';
      testBadge.className = 'test-result-badge no-match';
      testHighlight.hidden = true;
    }
  }

  function renderResult(result) {
    if (result.error) {
      formError.textContent = result.error;
      formError.hidden = false;
      resultSection.hidden = true;
      testSection.hidden = true;
      currentPattern = '';
      return;
    }

    formError.hidden = true;
    resultSection.hidden = false;
    testSection.hidden = true; // Will show after user types in test

    currentPattern = result.pattern;
    regexPattern.textContent = result.pattern;
    manualPattern.value = result.pattern;

    // Render explanation
    explanationList.innerHTML = '';
    if (result.explanation && result.explanation.length > 0) {
      result.explanation.forEach(function (item) {
        var li = document.createElement('li');
        var code = document.createElement('code');
        code.textContent = item.code;
        var span = document.createElement('span');
        span.textContent = item.text;
        li.appendChild(code);
        li.appendChild(span);
        explanationList.appendChild(li);
      });
    }

    // Validate the pattern
    var validation = validateRegex(result.pattern);
    updateSyntaxUI(validation);

    // Show test section
    testSection.hidden = false;
    testInput.value = '';
    testBadge.hidden = true;
    testHighlight.hidden = true;
  }

  // --- Event Handlers ---

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var result = generateRegex(matchTA.value, rejectTA.value);

    if (result.error) {
      formError.textContent = result.error;
      formError.hidden = false;
      resultSection.hidden = true;
      testSection.hidden = true;
      currentPattern = '';
      return;
    }

    formError.hidden = true;
    renderResult(result);

    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  copyBtn.addEventListener('click', function () {
    if (!currentPattern) return;

    navigator.clipboard.writeText(currentPattern).then(function () {
      copyToast.classList.add('visible');
      setTimeout(function () {
        copyToast.classList.remove('visible');
      }, 1800);
    }).catch(function () {
      // Fallback for older browsers
      var ta = document.createElement('textarea');
      ta.value = currentPattern;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        copyToast.classList.add('visible');
        setTimeout(function () {
          copyToast.classList.remove('visible');
        }, 1800);
      } catch (err) {
        alert('Copia non riuscita. Seleziona e copia manualmente il pattern.');
      }
      document.body.removeChild(ta);
    });
  });

  testInput.addEventListener('input', function () {
    updateTestUI();
  });

  manualPattern.addEventListener('input', function () {
    var pattern = manualPattern.value.trim();

    if (pattern === '') {
      clearSyntaxUI();
      return;
    }

    var validation = validateRegex(pattern);
    updateSyntaxUI(validation);

    // Update current pattern and results
    if (validation.valid) {
      currentPattern = pattern;
      regexPattern.textContent = pattern;

      // Update explanation for manual edits
      explanationList.innerHTML = '';
      var li = document.createElement('li');
      var code = document.createElement('code');
      code.textContent = pattern;
      var span = document.createElement('span');
      span.textContent = 'Pattern modificato manualmente.';
      li.appendChild(code);
      li.appendChild(span);
      explanationList.appendChild(li);

      // Update test
      if (testInput.value.trim()) {
        updateTestUI();
      }
    }
  });

  // Initialize: check if manual pattern has content on load
  if (manualPattern.value.trim()) {
    var initValidation = validateRegex(manualPattern.value.trim());
    if (initValidation.valid) {
      updateSyntaxUI(initValidation);
    }
  }

  // Expose internals for testing (non-invasive)
  if (typeof window !== 'undefined') {
    window.__regexGen = {
      generateRegex: generateRegex,
      escapeRegex: escapeRegex,
      longestCommonPrefix: longestCommonPrefix,
      longestCommonSuffix: longestCommonSuffix,
      parseLines: parseLines,
      analyzeVariablePart: analyzeVariablePart,
      validateRegex: validateRegex
    };
  }

})();
