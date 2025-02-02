import { avionCollection } from "./main.ts";
import type { Avion } from "./types.ts";
import { fromModelToAvion } from "./utils.ts";
import { ObjectId } from "mongodb";

type CondicionesVuelo = "despejado" | "estandar" | "adverso";

type DensidadAire = {
    despegue: number;
    crucero: number;
};

const DENSIDAD_DESPEJADA: DensidadAire = { despegue: 1.225, crucero: 0.4 };
const DENSIDAD_MEDIA: DensidadAire = { despegue: 1.2, crucero: 0.5 };
const DENSIDAD_ADVERSA: DensidadAire = { despegue: 1.15, crucero: 0.6 };

const obtenerDensidad = (condicion: CondicionesVuelo): DensidadAire => {
    if (condicion === "despejado") return DENSIDAD_DESPEJADA;
    if (condicion === "adverso") return DENSIDAD_ADVERSA;
    return DENSIDAD_MEDIA;
};

type ConsumoParams = { id: string; fase: "despegue" | "crucero" | "aterrizaje"; condicion: CondicionesVuelo };
export function calcularConsumo(tsfc: number, duracionDespegue: number, duracionAterrizaje: number, tiempoTotal: number, condicionVuelo: string): number[] {
    const puntos = 12;
    const intervalo = tiempoTotal / puntos;
    const consumos: number[] = [];
    const densidadAire = obtenerDensidad(condicionVuelo as CondicionesVuelo);

    for (let i = 0; i <= puntos; i++) {
        const tiempo = i * intervalo;
        let consumo: number;

        if (tiempo < duracionDespegue) {
            consumo = tiempo * tsfc * 1.2 * densidadAire.despegue;
        } else if (tiempo > tiempoTotal - duracionAterrizaje) {
            consumo = tsfc * 0.8 * densidadAire.crucero;
        } else {
            consumo = tsfc * densidadAire.crucero;
        }

        consumos.push(consumo);
    }

    return consumos;
}

export const obtenerAvionPorId = async (id: string): Promise<Avion | null> => {
    const avionDB = await avionCollection.findOne({ _id: new ObjectId(id) });
    return avionDB ? fromModelToAvion(avionDB) : null;
};
