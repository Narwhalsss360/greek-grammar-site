const header = document.querySelector("header");
const mainContent = document.getElementById("main-content");
const menuBar = document.getElementById("menu-bar");
const newBar = document.getElementById("new-bar");
const newVerbGroup = document.getElementById("new-verb-group");
const newVerbStem = document.getElementById("new-verb-stem");
const errorModal = document.getElementById("error-modal");
const errorModalParagraph = document.getElementById("error-modal-p");

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

const verbs = [];

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

function deleteTable(id) {
  closeErrorBox();
  const separatorIndex = id.indexOf(":");
  if (separatorIndex === -1) {
    throw new Error("Invalid ID.");
  }

  const group = id.substring(0, separatorIndex);
  const stem = id.substring(separatorIndex + 1);

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

function generateVerbTable(verb) {
  if (!persistVerb(verb)) {
    return;
  }

  if (document.getElementById(tableId(verb)) !== null) {
    showError(`Table ${tableId(verb)} already exists!`);
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
  const table = generateVerbTable(generateVerb(group, stem))
  if (table !== null) {
    mainContent.appendChild(table);
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

createVerbTable("A1", "Κάν");
createVerbTable("A1", "Βλέπ");