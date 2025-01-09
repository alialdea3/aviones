// Esperamos a que el DOM se haya cargado
document.addEventListener("DOMContentLoaded", () => {
    const avionSelect = document.getElementById("avionSelect");

    // Función para cargar los aviones desde la API
    const cargarAviones = async () => {
        try {
            const respuesta = await fetch("http://localhost:3000/aviones");
            const aviones = await respuesta.json();

            aviones.forEach(avion => {
                const option = document.createElement("option");
                option.value = avion.id;  // Usamos el ID del avión como valor
                option.textContent = avion.nombre;  // Mostramos el nombre del avión
                avionSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar los aviones:", error);
        }
    };

    // Cargar los aviones cuando se cargue la página
    cargarAviones();
});
