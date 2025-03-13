
function filterTable() {
    const input = document.getElementById("filterInput").value.toLowerCase();
    const table = document.getElementById("dataTable");
    const rows = table.getElementsByTagName("tr");

    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName("td");
        let rowContainsFilter = false;

        for (let j = 0; j < cells.length; j++) {
            if (cells[j].textContent.toLowerCase().includes(input)) {
                rowContainsFilter = true;
                break;
            }
        }

        rows[i].style.display = rowContainsFilter ? "" : "none";
    }
}

document.getElementById("filterInput").addEventListener("input", filterTable);

function toggleSpoiler() {
    const spoiler = document.getElementById("spoilerContent");
    spoiler.style.display = spoiler.style.display === "none" ? "block" : "none";
}

document.getElementById("toggleSpoilerVariables").addEventListener("click", toggleSpoiler);