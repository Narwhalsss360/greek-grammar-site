const header = document.querySelector("header");
const mainContent = document.getElementById("main-content");
const menuBar = document.getElementById("menu-bar");
const newBar = document.getElementById("new-bar");
const newVerbGroup = document.getElementById("new-verb-group");
const newVerbStem = document.getElementById("new-verb-stem");
const errorModal = document.getElementById("error-modal");
const errorModalParagraph = document.getElementById("error-modal-p");
const importInput = document.getElementById("import-file");
const exception = document.getElementById("exceptions-modal");
const exceptionVerbId = document.getElementById("exception-verb-id");
const exceptionGrammaticalFormSelect = document.getElementById("exception-grammatical-form-select");
const exceptionGrammaticalCount = document.getElementById("exception-grammatical-count-select");
const exceptionInput = document.getElementById("exception-input");

const ENDINGS = {
  A1: {
    singular: {
      first: "ω",
      second: "εις",
      third: "ει"
    },
    plural: {
      first: "ουμε",
      second: "ετε",
      third: "ουν(ε)"
    }
  },
  A2: {
    singular: {
      first: "ω",
      second: "ς",
      third: "ει"
    },
    plural: {
      first: "με",
      second: "τε",
      third: "νε"
    }
  },
  B1: {
    singular: {
      first: "άω",
      second: "άς",
      third: "άει"
    },
    plural: {
      first: "άμε",
      second: "άτε",
      third: "άνε"
    }
  },
  B2: {
    singular: {
      first: "ώ",
      second: "είς",
      third: "εί"
    },
    plural: {
      first: "ούμε",
      second: "είτε",
      third: "ούν(ε)"
    }
  },
  "Passive 1": {
    singular: {
      first: "ομαι",
      second: "εσαι",
      third: "εται"
    },
    plural: {
      first: "όμαστε",
      second: "όσαστε",
      third: "οντε"
    }
  },
  "Passive 2": {
    singular: {
      first: "άμαι",
      second: "άσαι",
      third: "άται"
    },
    plural: {
      first: "όμαστε",
      second: "όσαστε",
      third: "ούντε"
    }
  }
};

const VERB_SCHEMA = {
  type: 'object',
  children: {
    group: {
      type: 'string'
    },
    stem: {
      type: 'string'
    },
    singular: {
      type: 'object',
      children: {
        first: { type: 'string' },
        second: { type: 'string' },
        third: { type: 'string' }
      }
    },
    plural: {
      type: 'object',
      children: {
        first: { type: 'string' },
        second: { type: 'string' },
        third: { type: 'string' }
      }
    }
  }
}

const EXCEPTION_SCHEMA = {
  type: 'object',
    singular: {
      type: 'object',
      children: {
        first: { type: 'string' },
        second: { type: 'string' },
        third: { type: 'string' }
      }
    },
    plural: {
      type: 'object',
      children: {
        first: { type: 'string' },
        second: { type: 'string' },
        third: { type: 'string' }
      }
    }
}

function showError(message) {
  errorModalParagraph.innerHTML = message;
  errorModal.style.display = "flex";
  console.error(message);
}

function generateVerb(group, stem) {
  if (!(group in ENDINGS)) {
    throw new Error(`${group} is not a verb group`);
  }

  const verb = {
    group,
    stem,
    singular: {},
    plural: {}
  };

  for (const [grammaticalCount, ending] of Object.entries(ENDINGS[group].singular)) {
    verb.singular[grammaticalCount] = `${stem}${ending}`;
  }
  for (const [grammaticalCount, ending] of Object.entries(ENDINGS[group].plural)) {
    verb.plural[grammaticalCount] = `${stem}${ending}`;
  }

  return verb
}

function withExceptions(verb, exceptions) {
  if (exceptions.singular !== undefined && exceptions.singular !== null) {
    for (const [grammaticalCount, exception] of Object.entries(exceptions.singular)) {
      verb.singular[grammaticalCount] = exception;
    }
  }

  if (exceptions.plural !== undefined && exceptions.plural !== null) {
    for (const [grammaticalCount, exception] of Object.entries(exceptions.plural)) {
      verb.plural[grammaticalCount] = exception;
    }
  }

  return verb
}

const verbs = JSON.parse(localStorage.getItem("verbs") ?? "[]");

function tableId(verb) {
  return `${verb.group}:${verb.stem}`;
}

function getVerbIndex(group, stem) {
  return verbs.findIndex(verb => verb.group === group && verb.stem === stem);
}

function persistVerb(verb) {
  if (verbs.includes(verb)) {
    return false;
  }
  verbs.push(verb);
  localStorage.setItem("verbs", JSON.stringify(verbs));
  return true;
}

function forgetVerb(group, stem) {
  const index = getVerbIndex(group, stem);
  if (index === -1) {
    return false;
  }
  verbs.splice(index, 1);
  localStorage.setItem("verbs", JSON.stringify(verbs));
  return true;
}

function deconstructId(id) {
  const separatorIndex = id.indexOf(":");
  if (separatorIndex === -1) {
    throw new Error("Invalid ID.");
  }

  return [id.substring(0, separatorIndex), id.substring(separatorIndex + 1)];
}

function deleteTable(id) {
  const [group, stem] = deconstructId(id);

  if (!forgetVerb(group, stem)) {
    showError(`Verb '${id}' was not persisted, but tried to forget.`);
  }

  const table = document.getElementById(id);
  if (table === null) {
    showError(`Verb '${id}' table does not exist, but tried to delete.`);
    return;
  }

  mainContent.removeChild(table);
}

function generateVerbTable(verb, allowDuplicate = false) {
  if (document.getElementById(tableId(verb)) !== null && !allowDuplicate) {
    return null;
  }

  const table = document.createElement("table");
  table.id = tableId(verb);
  table.innerHTML = String.raw`
    <thead>
      <th scope="col">Group ${verb.group}</th>
      <th scope="col">1st Person</th>
      <th scope="col">2nd Person</th>
      <th scope="col">3rd Person</th>
    </thead>
    <tbody>
      <tr>
        <th scope="row">Singular</th>
        <td>${verb.singular.first}</td>
        <td>${verb.singular.second}</td>
        <td>${verb.singular.third}</td>
      </tr>

      <tr>
        <th scope="row">Plural</th>
        <td>${verb.plural.first}</td>
        <td>${verb.plural.second}</td>
        <td>${verb.plural.third}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <th scope="row" colspan="4">
          <button class="exceptions-button" onclick="openException('${table.id}')">Exceptions</button>
          <button class="delete-button" onclick="deleteTable('${table.id}')">Delete</button>
        </th>
      </tr>
    </tfoot>
  `
  return table;
}

function getComputedMarginTop(node) {
    const marginTopString = window.getComputedStyle(node).marginTop;
    if (!marginTopString) {
      marginTopString = "0px";
    }

    if (!marginTopString.endsWith("px")) {
      throw new Error("Currently, this observer only supports pixel margin values.");
    }

    return Number(marginTopString.slice(0, marginTopString.length - 2));
}

const mainContentMarginTop = getComputedMarginTop(mainContent);
const menuBarMarginTop = getComputedMarginTop(menuBar);
const newBarMarginTop = getComputedMarginTop(newBar);
const headerBarResizeObserver = new ResizeObserver(entry => {
  mainContent.style.marginTop = `${mainContentMarginTop + entry[0].borderBoxSize[0].blockSize}px`;
  menuBar.style.marginTop = `${menuBarMarginTop + entry[0].borderBoxSize[0].blockSize}px`;
  newBar.style.marginTop = `${newBarMarginTop + entry[0].borderBoxSize[0].blockSize}px`;
}).observe(header);

function createVerbTable(group, stem) {
  const verb = generateVerb(group, stem);

  if (!persistVerb(verb)) {
    console.error(`Failed to persist verb ${tableId(verb)}`);
  }
  const table = generateVerbTable(verb);

  if (table !== null) {
    mainContent.appendChild(table);
  } else {
    showError(`Table ${tableId(verb)} already exists!`);
  }
}

function menuClick() {
  const currentDisplay = window.getComputedStyle(menuBar).display;
  if (currentDisplay === "flex") {
    menuBar.style.display = "none";
  } else {
    menuBar.style.display = "flex";
  }
  closeErrorBox();
}

function newClick() {
  const currentDisplay = window.getComputedStyle(newBar).display;
  if (currentDisplay === "flex") {
    newBar.style.display = "none";
  } else {
    newBar.style.display = "flex";
  }
  closeErrorBox();
}

function addClick() {
  const group = newVerbGroup.value;
  newVerbGroup.selectedIndex = 0;
  const stem = newVerbStem.value;
  newVerbStem.value = "";
  createVerbTable(group, stem);
  closeErrorBox();
}

function closeErrorBox() {
  errorModal.style.display = "none";
}

function downloadText(filename, text, mimeType = "text/plain") {
  var element = document.createElement('a');
  element.setAttribute('href', `data:${mimeType};charset=utf-8,` + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';

  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function exportVerbs() {
  downloadText("verbs.json", JSON.stringify(verbs, null, 2), "application/json");
}

function validateImportedVerbs(imported) {
  if (!Array.isArray(imported)) {
    showError("JSON schema error: Verbs must be an array of objects.");
    return false;
  }

  const ensureKey = (name, obj, key, type) => {
      if (key in obj) {
        return true;
      }

      if (typeof obj[key] === type) {
        return true;
      }

      showError(`JSON schema error: Verbs must be an array of objects, where each '${name}' has key '${key}' of type ${type}.`);
      return false;
  }

  for (const verb of imported) {
    if (typeof verb !== "object") {
      showError("JSON schema error: Verbs must be an array of objects.");
      return false;
    }

    if (!ensureKey("verb", verb, "group", "string")) {
      return false;
    }

    if (!ensureKey("verb", verb, "stem", "string")) {
      return false;
    }

    if (!(verb.group in ENDINGS)) {
      showError(`JSON schema error: verb.group $'${verb.group}' is an invalid group for verb '${verb.stem}'.`)
      return false;
    }

    if (!ensureKey("verb", verb, "singular", "object")) {
      return false;
    }
    if (!ensureKey("verb.singular", verb.singular, "first", "string")) {
      return false;
    }
    if (!ensureKey("verb.singular", verb.singular, "second", "string")) {
      return false;
    }
    if (!ensureKey("verb.singular", verb.singular, "third", "string")) {
      return false;
    }

    if (!ensureKey("verb", verb, "plural", "object")) {
      return false;
    }
    if (!ensureKey("verb.plural", verb.plural, "first", "string")) {
      return false;
    }
    if (!ensureKey("verb.plural", verb.plural, "second", "string")) {
      return false;
    }
    if (!ensureKey("verb.plural", verb.plural, "third", "string")) {
      return false;
    }
  }

  return true;
}

importInput.addEventListener("input", () => {
  if (importInput.files.length === 0) {
    return;
  }
  const file = importInput.files[0];

  if (file.type !== "application/json") {
    showError("Imported file must be a json file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    let verbs;
    try {
      verbs = JSON.parse(e.target.result);
    } catch (exc) {
      showError(`An error occurred parsing JSON file: ${exc.message}`);
    }

    if (!validateImportedVerbs(verbs)) {
      return;
    }

    console.log("Imported:");
    console.log(verbs);

    for (const verb of verbs) {
      const table = generateVerbTable(verb);
      if (table === null) {
        console.warn(`Imported verb ${tableId(verb)} already exists! To import exceptions, delete this verb.`);
        continue;
      }
      persistVerb(verb);
      mainContent.appendChild(table);
    }
  }
  reader.readAsText(file);
});

let exceptional = null;

function cancelException() {
  exceptional = null;
  exception.style.display = "none";
}

function saveException() {
  if (exceptional === null) {
    return;
  }

  exceptional[exceptionGrammaticalFormSelect.value][exceptionGrammaticalCount.value] = exceptionInput.value;
  const [group, stem] = deconstructId(tableId(exceptional));
  const index = getVerbIndex(group, stem);
  if (index === -1) {
    showError(`FATAL: Script error: Cannot open exception modal for ${id}, verb not found.`);
    return;
  }

  const existingTable = document.getElementById(tableId(exceptional));
  if (existingTable === null) {
    showError(`Verb ${tableId(exceptional)} was deleted while editing exceptions.`);
    return;
  }

  verbs[index] = exceptional;
  forgetVerb(group, stem);
  persistVerb(exceptional);
  const table = generateVerbTable(exceptional, true);
  existingTable.innerHTML = table.innerHTML;
  cancelException();
}

function openException(id) {
  const [group, stem] = deconstructId(id);
  const index = getVerbIndex(group, stem);
  if (index === -1) {
    showError(`FATAL: Script error: Cannot open exception modal for ${id}, verb not found.`);
    return;
  }
  exceptional = structuredClone(verbs[index]);
  const change = new Event("change");
  exceptionVerbId.innerText = id;
  exceptionGrammaticalFormSelect.dispatchEvent(change);
  exceptionGrammaticalCount.dispatchEvent(change);
  exception.style.display = "flex";
}

exceptionGrammaticalFormSelect.addEventListener("change", () => {
  if (exceptional !== null) {
    exceptionInput.value = exceptional[exceptionGrammaticalFormSelect.value][exceptionGrammaticalCount.value];
  }
});

exceptionGrammaticalCount.addEventListener("change", () => {
  if (exceptional !== null) {
    exceptionInput.value = exceptional[exceptionGrammaticalFormSelect.value][exceptionGrammaticalCount.value];
  }
});

for (const verb of verbs) {
  const table = generateVerbTable(verb);

  if (table !== null) {
    mainContent.appendChild(table);
  }
}