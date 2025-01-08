import { ObjectId, type OptionalId } from "mongodb";

export type AvionModel = OptionalId<{
    _id: ObjectId;
    nombre: string;
    velocidadDespegue: number; // m/s
    velocidadCrucero: number; // m/s
    velocidadAterrizaje: number; // m/s
    pesoInicial: number; // kg
    areaAlar: number; // m^2
    coefResistencia: number; // sin unidad
    tsfc: number; // kg/s/N
    duracionDespegue: number; // s
    duracionAterrizaje: number; // s
}>;

export type Avion = {
    id: string;
    nombre: string;
    velocidadDespegue: number; // m/s
    velocidadCrucero: number; // m/s
    velocidadAterrizaje: number; // m/s
    pesoInicial: number; // kg
    areaAlar: number; // m^2
    coefResistencia: number; // sin unidad
    tsfc: number; // kg/s/N
    duracionDespegue: number; // s
    duracionAterrizaje: number; // s
};
