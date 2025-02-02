import { serve } from "https://deno.land/std@0.204.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.204.0/http/file_server.ts";
import { MongoClient, ObjectId } from "mongodb";
import type { AvionModel } from "./types.ts";
import { fromModelToAvion } from "./utils.ts";
import { calcularConsumo } from "./funciones.ts";

const DENSIDAD_DESPEJADA = { despegue: 1.225, crucero: 0.4 };
const DENSIDAD_MEDIA = { despegue: 1.2, crucero: 0.5 };
const DENSIDAD_ADVERSA = { despegue: 1.15, crucero: 0.6 };

const obtenerDensidad = (condicion: "despejado" | "estandar" | "adverso") => {
    if (condicion === "despejado") return DENSIDAD_DESPEJADA;
    if (condicion === "adverso") return DENSIDAD_ADVERSA;
    return DENSIDAD_MEDIA;
};

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
    console.error("MONGO_URL is not set");
    Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Connected to MongoDB");

const db = client.db("flota");
export const avionCollection = db.collection<AvionModel>("aviones");

const handler = async (req: Request): Promise<Response> => {
    const method = req.method;
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/" || path.startsWith("/static/")) {
        const filePath = path === "/" ? "/static/index.html" : path;
        try {
            return await serveFile(req, `.${filePath}`);
        } catch {
            return new Response("Archivo no encontrado", { status: 404 });
        }
    }

    if (method === "GET") {
        if (path.startsWith("/aviones/")) {
            const id = path.split("/")[2];
            const avionDB = await avionCollection.findOne({
                _id: new ObjectId(id),
            });
            if (!avionDB) {
                return new Response("Avión no encontrado", { status: 404 });
            }
            const avion = fromModelToAvion(avionDB);
            return new Response(JSON.stringify(avion), { status: 200 });
        } else if (path === "/aviones") {
            const avionDB = await avionCollection.find().toArray();
            const aviones = await Promise.all(
                avionDB.map((u) => fromModelToAvion(u)),
            );
            return new Response(JSON.stringify(aviones), { status: 200 });
        }
    } else if (method === "POST" && path === "/aviones") {
        const avion = await req.json();
        if (
            !avion.nombre || !avion.velocidadDespegue ||
            !avion.velocidadCrucero
        ) {
            return new Response("Bad request", { status: 400 });
        }
        const avionDB = await avionCollection.findOne({ nombre: avion.nombre });
        if (avionDB) {
            return new Response("Avión ya existe", { status: 409 });
        }

        const { insertedId } = await avionCollection.insertOne({
            nombre: avion.nombre,
            velocidadDespegue: avion.velocidadDespegue,
            velocidadCrucero: avion.velocidadCrucero,
            velocidadAterrizaje: avion.velocidadAterrizaje || 0,
            pesoInicial: avion.pesoInicial || 0,
            areaAlar: avion.areaAlar || 0,
            coefResistencia: avion.coefResistencia || 0,
            tsfc: avion.tsfc || 0,
            duracionDespegue: avion.duracionDespegue || 0,
            duracionAterrizaje: avion.duracionAterrizaje || 0,
        });

        return new Response(
            JSON.stringify({
                nombre: avion.nombre,
                velocidadDespegue: avion.velocidadDespegue,
                velocidadCrucero: avion.velocidadCrucero,
                id: insertedId,
            }),
            { status: 201 },
        );
    } else if (method === "DELETE" && path.startsWith("/aviones/")) {
        const id = path.split("/")[2];
        if (!id) return new Response("Bad request", { status: 400 });
        const { deletedCount } = await avionCollection.deleteOne({
            _id: new ObjectId(id),
        });

        if (deletedCount === 0) {
            return new Response("Avión no encontrado", { status: 404 });
        }

        return new Response("Avión eliminado correctamente", { status: 200 });
    }
    if (method === "POST" && path === "/calcular-consumo") {
        const { tsfc, duracionDespegue, duracionAterrizaje, tiempoTotal, condicionVuelo } = await req.json();
        
        const consumos = calcularConsumo(tsfc, duracionDespegue, duracionAterrizaje, tiempoTotal, condicionVuelo);
        
        return new Response(JSON.stringify(consumos), { status: 200 });
    }

    return new Response("Endpoint no encontrado", { status: 404 });
};

serve(handler);
