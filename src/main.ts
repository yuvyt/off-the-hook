import "./style.css";
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from "docx";
import { saveAs } from "file-saver";

// document represents the entire html page, its the entry point to the Document Object Model (DOM)

type AppState = {
  rows: number;
  cols: number;
  cellSize: number;
  colors: string[];
};

let state: AppState | null = null;

type Tool = "paint" | "erase";
let activeTool: Tool = "paint";

let isPainting = false; // "let" allows it to be reassigned later

document.addEventListener("mouseup", () => {
  isPainting = false;
});


// creating DOM elements 
const cellSizeInput = document.getElementById("cellSize") as HTMLInputElement; // Finds an element like: "cellSize" (<button id="createGrid">Create Grid</button>)
const grid = document.getElementById("grid") as HTMLDivElement; //returns html div element
const rowsInput = document.getElementById("rows") as HTMLInputElement; // Looks for an element like: <input id="rows" />. HTMLInputElement == <input>
// <input> has .value, .checked, .type, .disabled etc
const colsInput = document.getElementById("cols") as HTMLInputElement; // getElementById is a methos of document that lets you find one specific HTML element by its id
const colorPicker = document.getElementById("colorPicker") as HTMLInputElement; // returns html input element (or null if the element doesnt exist or the script ran before the html loaded)


// element.addEventListener(eventType, callback), eventType - e.g. "click", "input", "change", call back - a function that runs when the event 
// "change" - The value changes and element loses focus / value is committed
// "input"   - fires on every keystroke / movement
// "click"   - mouse click
// "keydown" - key pressed
// "blur"    - focus lost

// anonymous (not externaly defined) arrow function: (param) => {func}
cellSizeInput.addEventListener("change", () => { // Attaches an event listener (“Run some code when an event occurs”)
document.getElementById("createGrid")!.click();
});

document.getElementById("createGrid")!.addEventListener("click", () => {
  const rows = Number(rowsInput.value); //.value is always a string, so there is a conversion
  const cols = Number(colsInput.value);
  const cellSize = Number(cellSizeInput.value);

  if (rows <= 0 || cols <= 0 || cellSize <= 0) {
  alert("Rows, columns, and cell size must be positive numbers");
  return;
  }

  grid.innerHTML = ""; // clears the grid and removes all child elemnts 
  
  // Together, these next two lines define a full grid
  grid.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
  grid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;

  state = {
  rows,
  cols,
  cellSize,
  colors: Array(rows * cols).fill("white"),
  };

  for (let i = 0; i < rows * cols; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.color = "white";

    cell.style.width = `${cellSize}px`;
    cell.style.height = `${cellSize}px`;

    const paintCell = (index: number) => {
      if (!state) return;

      if (activeTool === "erase") {
        state.colors[index] = "white";
        cell.dataset.color = "white";
        cell.style.background = "white";
      } else {
        const selectedColor = colorPicker.value;
        state.colors[index] = selectedColor;
        cell.dataset.color = selectedColor;
        cell.style.background = selectedColor;
      }
    };


    cell.addEventListener("mousedown", () => {
      isPainting = true;
      paintCell(i); 
    });

    cell.addEventListener("mouseenter", () => {
      if (isPainting) {
        paintCell(i);
      }
    });

    grid.appendChild(cell);
  }
});

document.getElementById("exportDoc")!.addEventListener("click", async () => {
  const cells = Array.from(grid.children) as HTMLDivElement[];
  const cols = Number(colsInput.value);

  const tableRows: TableRow[] = [];
  let currentRow: TableCell[] = [];

  cells.forEach((cell, index) => {
    currentRow.push(
      new TableCell({
        shading: {
          fill:
          cell.dataset.color && cell.dataset.color !== "white" ? cell.dataset.color.replace("#", "") : "FFFFFF",
        },
      })
    );

    if ((index + 1) % cols === 0) {
      tableRows.push(new TableRow({ children: currentRow }));
      currentRow = [];
    }
  });

  const table = new Table({ rows: tableRows });

  const doc = new Document({
    sections: [{ children: [new Paragraph("Off the Hook"), table] }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "off-the-hook.docx");
});


type DesignData = {
  rows: number;
  cols: number;
  cellSize: number;
  colors: string[]; // length = rows * cols
};

document.getElementById("saveDesign")!.addEventListener("click", () => {
  const cells = Array.from(grid.children) as HTMLDivElement[];

  const data = {
    rows: Number(rowsInput.value),
    cols: Number(colsInput.value),
    cellSize: Number(cellSizeInput.value),
    colors: state?.colors ?? [],

  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "off-the-hook.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("loadDesign")!.addEventListener("change", (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () =>{ 
    const data = JSON.parse(reader.result as string);
    state = data;

    rowsInput.value = data.rows;
    colsInput.value = data.cols;
    cellSizeInput.value = data.cellSize;

    document.getElementById("createGrid")!.click();

    state.colors.forEach((color, i) => {
      const cell = grid.children[i] as HTMLDivElement;
      cell.dataset.color = color;
      cell.style.background = color;
    });
  };
  reader.readAsText(file);
});

const eraserBtn = document.getElementById("eraser") as HTMLButtonElement;

eraserBtn.addEventListener("click", () => {
  if (activeTool === "erase") {
    activeTool = "paint";
    eraserBtn.classList.remove("active");
  } else {
    activeTool = "erase";
    eraserBtn.classList.add("active");
  }
});
