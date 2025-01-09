document.addEventListener("DOMContentLoaded", async () => {
    const selectElement = document.getElementById("aviones");

    try {
        const response = await fetch("/aviones");
        if (!response.ok) {
            throw new Error("Error al obtener los aviones");
        }

        const aviones = await response.json();
        selectElement.innerHTML = "";
        aviones.forEach((avion) => {
            const option = document.createElement("option");
            option.value = avion.id;
            option.textContent = avion.nombre;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error("Error:", error);
        selectElement.innerHTML = `<option value="" disabled>Error al cargar aviones</option>`;
    }
});
