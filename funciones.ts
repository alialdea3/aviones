import { avionCollection } from "./main.ts";
import type { Avion } from "./types.ts";
import { fromModelToAvion } from "./utils.ts";
import { ObjectId } from "mongodb";

type CondicionesVuelo = "despejado" | "estandar" | "adverso";

type DensidadAire = {
    despegue: number;
    crucero: number;
};

const DENSIDAD_ADVERSA: DensidadAire = { despegue: 1.225, crucero: 0.4 };
const DENSIDAD_MEDIA: DensidadAire = { despegue: 1.2, crucero: 0.5 };
const DENSIDAD_DESPEJADA: DensidadAire = { despegue: 1.15, crucero: 0.6 };

const obtenerDensidad = (condicion: CondicionesVuelo): DensidadAire => {
    if (condicion === "despejado") return DENSIDAD_DESPEJADA;
    if (condicion === "adverso") return DENSIDAD_ADVERSA;
    return DENSIDAD_MEDIA;
};

//type ConsumoParams = { id: string; fase: "despegue" | "crucero" | "aterrizaje"; condicion: CondicionesVuelo };
export function calcularConsumo(
    tsfc: number,
    duracionDespegue: number,
    duracionAterrizaje: number,
    tiempoTotal: number,
    condicionVuelo: string,
    velocidadDespegue:number,
    velocidadCrucero:number,
    velocidadAterrizaje:number,
    areaAlar:number,
    coefResistencia:number,
    pesoInicial:number
        
): number[] {
    const consumos: number[] = [];
    const densidadAire = obtenerDensidad(condicionVuelo as CondicionesVuelo);

    const momentos = [
        1, 
        duracionDespegue-1, 
        duracionDespegue + (3600 - duracionAterrizaje - duracionDespegue) / 5,
        duracionDespegue + (3600 - duracionAterrizaje - duracionDespegue) * 2 / 5,
        duracionDespegue + (3600 - duracionAterrizaje - duracionDespegue) * 3 / 5,
        duracionDespegue + (3600 - duracionAterrizaje - duracionDespegue) * 4 / 5,
        3600 - duracionAterrizaje+1,
        3600 
    ];

    for (let tiempo of momentos) {
        let consumo: number;

        if (tiempo < duracionDespegue) {
            // fase de despegue
            consumo = (0.5*velocidadDespegue*velocidadDespegue*densidadAire.despegue*areaAlar*coefResistencia*tsfc)/1000
        } else if (tiempo > tiempoTotal - duracionAterrizaje) {
            // fase de aterrizaje
            consumo = (0.5*velocidadDespegue*velocidadCrucero*densidadAire.crucero*areaAlar*coefResistencia*tsfc)/1000
        } else {
            // fase de crucero
            consumo =(0.5*velocidadDespegue*velocidadAterrizaje*densidadAire.despegue*areaAlar*coefResistencia*tsfc)/1000
        }

        consumos.push(consumo);
    }

    return consumos;
}

export const obtenerAvionPorId = async (id: string): Promise<Avion | null> => {
    const avionDB = await avionCollection.findOne({ _id: new ObjectId(id) });
    return avionDB ? fromModelToAvion(avionDB) : null;
};
