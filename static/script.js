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
    const tiempoCruceroInicio = tiempoDespegue;
    const tiempoCruceroFin = tiempoTotal - tiempoAterrizaje;

    let consumosDespegue = [];
    let consumosCrucero = [];
    let consumosAterrizaje = [];

    for (let i = 0; i < consumos.length; i++) {
        const tiempoActual = (i / (consumos.length - 1)) * tiempoTotal;

        if (tiempoActual < tiempoDespegue) {
            consumosDespegue.push(consumos[i]);
        } else if (tiempoActual > tiempoCruceroFin) {
            consumosAterrizaje.push(consumos[i]);
        } else {
            consumosCrucero.push(consumos[i]);
        }
    }

    for (let i = 0; i < 7; i++) {
        const fila = document.createElement("tr");

        const celdaConsumo = document.createElement("td");
        let consumo;
        if (i < consumosDespegue.length) {
            consumo = consumosDespegue[i];
        } else if (i < consumosDespegue.length + consumosCrucero.length) {
            consumo = consumosCrucero[i - consumosDespegue.length];
        } else {
            consumo = consumosAterrizaje[i - consumosDespegue.length - consumosCrucero.length];
        }
        celdaConsumo.textContent = consumo.toFixed(2);
        fila.appendChild(celdaConsumo);

        const celdaFase = document.createElement("td");
        let fase;
        if (i < consumosDespegue.length) {
            fase = "Despegue";
        } else if (i < consumosDespegue.length + consumosCrucero.length) {
            fase = "Crucero";
        } else {
            fase = "Aterrizaje";
        }
        celdaFase.textContent = fase;
        fila.appendChild(celdaFase);

        const celdaMomento = document.createElement("td");
        let tiempoIntervalo;

        if (i === 0) {
            tiempoIntervalo = 0;
        }
        else if (i === 1) {
            tiempoIntervalo = tiempoDespegue - 1;
        }
        else if (i === 5) {
            tiempoIntervalo = 3601 - tiempoAterrizaje;
        }
        else if (i === 6) {
            tiempoIntervalo = 3600;
        }
        else {
            tiempoIntervalo = (i / 6) * tiempoTotal;
        }

        celdaMomento.textContent = Math.round(tiempoIntervalo);
        fila.appendChild(celdaMomento);

        tabla.appendChild(fila);
    }
    tablaContainer.appendChild(tabla);
}


