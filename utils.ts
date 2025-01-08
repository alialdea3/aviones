import type { Avion, AvionModel } from "./types.ts";

export const fromModelToAvion = (
    avionDB: AvionModel,
): Avion => {
    return {
        id: avionDB._id!.toString(),
        nombre: avionDB.nombre,
        velocidadDespegue: avionDB.velocidadDespegue,
        velocidadCrucero: avionDB.velocidadCrucero,
        velocidadAterrizaje: avionDB.velocidadAterrizaje,
        pesoInicial: avionDB.pesoInicial,
        areaAlar: avionDB.areaAlar,
        coefResistencia: avionDB.coefResistencia,
        tsfc: avionDB.tsfc,
        duracionDespegue: avionDB.duracionDespegue,
        duracionAterrizaje: avionDB.duracionAterrizaje,
    };
};
