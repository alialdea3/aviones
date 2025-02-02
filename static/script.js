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

document.getElementById("calcular").addEventListener("click", () => {
    console.log("Botón 'Calcular' presionado");

    const avionId = document.getElementById("aviones").value;
    const condicionVuelo = document.getElementById("condiciones").value;
    console.log("Avión seleccionado:", avionId);
    console.log("Condición de vuelo seleccionada:", condicionVuelo);

    fetch(`/aviones/${avionId}`)
        .then((response) => response.json())
        .catch(err => console.error(err))
        .then((avion) => {
            console.log("Datos del avión:", avion);

            fetch("/calcular-consumo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tsfc: avion.tsfc,
                    duracionDespegue: avion.duracionDespegue,
                    duracionAterrizaje: avion.duracionAterrizaje,
                    tiempoTotal: 3600,
                    condicionVuelo: condicionVuelo,
                    velocidadDespegue: avion.velocidadDespegue,
                    velocidadCrucero: avion.velocidadCrucero,
                    velocidadAterrizaje: avion.velocidadAterrizaje,
                    areaAlar: avion.areaAlar,
                    coefResistencia: avion.coefResistencia,
                    pesoInicial: avion.pesoInicial

                }),
            })
                .then((response) => response.json())
                .then((consumos) => {
                    console.log("Consumos recibidos:", consumos);

                    if (Array.isArray(consumos) && consumos.length > 0) {
                        generarTabla(consumos, avion);
                    } else {
                        console.error("Los consumos no son válidos:", consumos);
                    }
                })
                .catch((error) => {
                    console.error("Error al calcular el consumo:", error);
                });

        })
        .catch((error) => {
            console.error("Error al obtener los datos del avión:", error);
        });
});

function generarTabla(consumos, avion) {
    const tablaContainer = document.getElementById("tabla-container");
    tablaContainer.innerHTML = "";

    const tabla = document.createElement("table");
    tabla.border = "1";

    const filaTitulos = document.createElement("tr");
    const tituloConsumo = document.createElement("th");
    tituloConsumo.textContent = "Consumo de Combustible";
    const tituloFase = document.createElement("th");
    tituloFase.textContent = "Fase del Vuelo";
    const tituloMomento = document.createElement("th");
    tituloMomento.textContent = "Momento de Vuelo";
    filaTitulos.appendChild(tituloConsumo);
    filaTitulos.appendChild(tituloFase);
    filaTitulos.appendChild(tituloMomento);
    tabla.appendChild(filaTitulos);

    const tiempoDespegue = avion.duracionDespegue;
    const tiempoAterrizaje = avion.duracionAterrizaje;
    const tiempoTotal = 3600;

    const momentos = [
        1, // pto 1: inicio del vuelo
        tiempoDespegue - 1, // pto 2: fin del despegue
        // ptos 3-6: ptos intermedios entre el fin del despegue y el inicio del aterrizaje
        tiempoDespegue + (3600 - tiempoAterrizaje - tiempoDespegue) / 5,
        tiempoDespegue + (3600 - tiempoAterrizaje - tiempoDespegue) * 2 / 5,
        tiempoDespegue + (3600 - tiempoAterrizaje - tiempoDespegue) * 3 / 5,
        tiempoDespegue + (3600 - tiempoAterrizaje - tiempoDespegue) * 4 / 5,
        3600 - tiempoAterrizaje + 1, // pto 7: inicio del aterrizaje
        3600 // pto 8: fin del vuelo
    ];

    for (let i = 0; i < 8; i++) {
        const fila = document.createElement("tr");

        const celdaConsumo = document.createElement("td");
        celdaConsumo.textContent = consumos[i].toFixed(2);
        fila.appendChild(celdaConsumo);

        const celdaFase = document.createElement("td");
        let fase;
        if (momentos[i] < tiempoDespegue) {
            fase = "Despegue";
        } else if (momentos[i] > tiempoTotal - tiempoAterrizaje) {
            fase = "Aterrizaje";
        } else {
            fase = "Crucero";
        }
        celdaFase.textContent = fase;
        fila.appendChild(celdaFase);

        const celdaMomento = document.createElement("td");
        celdaMomento.textContent = Math.round(momentos[i]);
        fila.appendChild(celdaMomento);

        tabla.appendChild(fila);
    }

    tablaContainer.appendChild(tabla);
}



