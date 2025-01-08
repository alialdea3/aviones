import { MongoClient, ObjectId } from "mongodb";
import type { AvionModel } from "./types.ts";
import { fromModelToAvion } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
    console.error("MONGO_URL is not set");
    Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Connected to MongoDB");

const db = client.db("flota");

const avionCollection = db.collection<AvionModel>("aviones");

const handler = async (req: Request): Promise<Response> => {
    const method = req.method;
    const url = new URL(req.url);
    const path = url.pathname;

    // Método GET: Obtener un avión específico o todos los aviones
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
        } else if (path == "/aviones") {
            const avionDB = await avionCollection.find().toArray();
            const aviones = await Promise.all(
                avionDB.map((u) => fromModelToAvion(u)),
            );
            return new Response(JSON.stringify(aviones), { status: 200 });
        }
    } // Método POST: Crear un nuevo avión
    else if (method === "POST") {
        if (path === "/aviones") {
            const avion = await req.json();
            if (
                !avion.nombre || !avion.velocidadDespegue ||
                !avion.velocidadCrucero
            ) {
                return new Response("Bad request", { status: 400 });
            }
            const avionDB = await avionCollection.findOne({
                nombre: avion.nombre,
            });
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
        }
    } // Método DELETE: Eliminar un avión
    else if (method === "DELETE") {
        if (path.startsWith("/aviones/")) {
            const id = path.split("/")[2];
            if (!id) return new Response("Bad request", { status: 400 });
            const { deletedCount } = await avionCollection.deleteOne({
                _id: new ObjectId(id),
            });

            if (deletedCount === 0) {
                return new Response("Avión no encontrado", { status: 404 });
            }

            return new Response("Avión eliminado correctamente", {
                status: 200,
            });
        }
    }

    return new Response("Endpoint no encontrado", { status: 404 });
};

Deno.serve({ port: 3000 }, handler);
