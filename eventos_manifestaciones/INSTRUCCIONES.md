# Instrucciones de la tarea programada "Disrupciones de tráfico"

Este archivo lo lee la tarea programada de Claude que actualiza, dos veces al día, el dashboard "Disrupciones de tráfico" y esta página (benjamingarcia.cl/eventos_manifestaciones). La URL del dashboard viene en la instrucción de la tarea. Durante la corrida no modifiques este archivo.

El dashboard es un artifact de tipo Dashboard con dos hojas. Cada hoja lee dos conjuntos de datos (archivos JSON):

- Hoja "Estadio Nacional": `datasets/eventos` (lista de eventos) y `datasets/revision` (resumen de la revisión).
- Hoja "Santiago Centro": `datasets/centro` (lista de eventos) y `datasets/centro_revision` (resumen de la revisión).

Trabaja sin preguntar nada: nadie está mirando esta ejecución. Fecha y hora de referencia: ahora, en America/Santiago. Ventana: desde hoy hasta hoy + 60 días.

## Tipo de corrida

La tarea corre dos veces al día. Mira la hora local de inicio:

- Antes de las 12:00: corrida de la mañana. Actualiza las dos hojas.
- Desde las 12:00: corrida de la tarde. Actualiza solo "Santiago Centro" (con foco en convocatorias, autorizaciones, cortes y cierres de Metro de hoy y mañana) y deja "Estadio Nacional" tal como está: no investigues esa hoja ni subas o actualices sus archivos.

## 1. Leer

Carga la herramienta ArtifactData con ToolSearch ("select:ArtifactData"). Lee los cuatro documentos (action "get", collection "datasets", doc_id "eventos", "revision", "centro", "centro_revision") y anota la `version` de cada uno. En cada documento, `source.url` es "/_blob/<id>": lee los cuatro archivos con la herramienta Artifact (action "read", url del dashboard, path = ese id de 32 caracteres, uno por llamada) y guarda una copia de cada uno; los necesitas también en el paso 6. Son las listas y resúmenes actuales. No modifiques `files/index.html`, `dash/meta` ni `dash/params`.

## 2. Investigar

Usa WebSearch/WebFetch (en español, unas 8 a 12 búsquedas por hoja que corresponda, con la fecha actual en las consultas cuando ayude). Usa solo hechos que encuentres en fuentes; no inventes fechas, horas, recorridos ni calles.

Hoja Estadio Nacional (Estadio Nacional y Parque Estadio Nacional, Ñuñoa; efecto en Av. Grecia):

- Cada evento de la lista: ¿sigue en pie, en el Nacional, en esa fecha y hora? ¿Se publicó el plan de cortes (Municipalidad de Ñuñoa, Delegación Presidencial RM, Transporte Informa/UOCT, Carabineros, prensa)? Registra calles, tramos y horarios, sobre todo cortes en Av. Grecia.
- Eventos nuevos: conciertos, partidos de Universidad de Chile como local (Liga de Primera, Copa Chile, copas internacionales; revisa la programación oficial de la ANFP en campeonatochileno.cl), partidos de la Selección, Teletón, carreras con partida o meta en el parque, actos o marchas con cortes en Grecia, festivales.

Hoja Santiago Centro (comuna de Santiago, sobre todo la Alameda entre Plaza Baquedano y Estación Central, Barrio Cívico, Santa Lucía, Los Héroes y Parque O'Higgins; y las líneas 1, 2, 3 y 5 de Metro en el centro):

- Cada evento de la lista: ¿se mantiene la convocatoria, fecha, hora y recorrido? ¿La Delegación Presidencial la autorizó? ¿Se publicaron cortes, desvíos (Transporte Informa, UOCT, Red Movilidad, Carabineros) o cierres de estaciones de Metro?
- Eventos nuevos: marchas y protestas convocadas (CUT, Confech, Colegio de Profesores, ANEF, secundarios, feministas, pobladores, No+AFP, trabajadores de la salud, hinchas, etc.), paros de transporte (buses, taxis, camioneros) que afecten el centro, eventos masivos (Paris Parade, Año Nuevo en la Torre Entel, Teatro a Mil en la calle, Día del Patrimonio, fiestas o conciertos grandes en Parque O'Higgins o el Club Hípico), actos oficiales con cortes (visitas de Estado, ceremonias en La Moneda), obras con cortes programados en ejes del centro y cierres programados de estaciones de Metro. Buenas fuentes: BioBioChile, Emol, La Tercera, Chilevisión, Meganoticias, 24horas, T13, Radio Agricultura, El Desconcierto, Radio U. de Chile, cuentas de Metro de Santiago y Transporte Informa citadas en prensa.
- Las marchas suelen anunciarse con pocos días de anticipación: busca específicamente convocatorias para hoy y los próximos 7 días.

## 3. Construir

Construye las listas nuevas de las hojas que corresponda. Elimina las filas cuya fecha y fecha_alt ya pasaron (anteriores a hoy); incluye eventos hasta hoy + 60 días; ordena por fecha. Mantén el `id` de las filas que siguen (estable, p.ej. "paris-parade-2026-11-29"). Cada fila lleva exactamente estas claves (texto en español, "" si no hay dato):

id, fecha ("YYYY-MM-DD"), fecha_alt ("YYYY-MM-DD" o null, para eventos con dos fechas posibles), fecha_texto (p.ej. "sáb 31 oct" o "sáb 5 o dom 6 dic"), evento, tipo, probabilidad, nivel, <campo de impacto>, hora (horario del evento o de los cortes), cortes (calles, tramos, desvíos y estaciones de Metro publicados, o el precedente usado), nota, fuente_nombre (medio u organismo), fuente (URL https de la mejor fuente).

Estadio Nacional:

- El campo de impacto se llama `grecia` (efecto en Av. Grecia en una frase corta).
- tipo: "Concierto", "Fútbol", "Evento masivo", "Carrera", "Acto".
- Probabilidad de cortes o congestión relevante en Av. Grecia: "Confirmado" = 4 (plan oficial de cortes publicado para ese día); "Muy probable" = 3 (evento masivo confirmado en el Nacional, aunque el plan aún no se publique); "Probable" = 2 (partido u otro evento programado en el Nacional, o evento masivo aún no confirmado); "Baja" = 1 (probablemente no será en el Nacional).

Santiago Centro:

- El campo de impacto se llama `impacto` (efecto en tránsito y transporte público en una frase corta).
- tipo: "Marcha", "Protesta", "Paro", "Evento masivo", "Cultural", "Acto oficial", "Obras".
- Probabilidad de cortes, desvíos o cierres de Metro en el centro: "Confirmado" = 4 (cortes, desvíos o cierres de Metro anunciados oficialmente para ese día, o marcha autorizada con recorrido publicado); "Muy probable" = 3 (marcha grande convocada por la Alameda u otro eje principal, o evento masivo confirmado, sin plan oficial aún); "Probable" = 2 (convocatoria más acotada o en un punto fijo, o evento masivo aún no confirmado); "Baja" = 1 (sin fecha, recorrido o programación que afecte el tránsito).

Una convocatoria sin fecha concreta no entra en la lista: menciónala en el resumen.

## 4. Escribir

Escribe en tu directorio de trabajo (fuera del repositorio) los archivos de las hojas que actualizas: eventos.json y/o centro.json (los arreglos de filas), y revision.json y/o centro_revision.json. Cada archivo de revisión es un arreglo con una fila {"revisado": hora actual ISO en UTC, "revisado_texto": hora de Chile como "lun 19 oct, 06:55", "resumen": UNA o DOS frases sobre esa hoja}. El resumen dice qué cambió respecto de la lista anterior (eventos nuevos, plan de cortes publicado, cambios de fecha, sede o recorrido) o, si nada cambió, "Sin cambios desde la revisión anterior." seguido del próximo evento con nivel ≥ 2 y su fecha. Si hoy hay algo con nivel ≥ 3, el resumen empieza por eso.

## 5. Publicar en el dashboard

Sube cada archivo nuevo como asset del dashboard con la herramienta Artifact (action "publish", url del dashboard, file_path del JSON, asset: true), uno por llamada. Luego, con ArtifactData action "batch", actualiza solo los documentos de las hojas que actualizaste (op "update", collection "datasets", if_version = la versión leída en el paso 1) con:

- source = {"kind": "file", "url": <url /_blob/... devuelta>, "name": <nombre del archivo>, "format": "json"}
- updated = {"at": hora actual ISO UTC, "by": "Claude (tarea diaria)"}

Después borra los assets anteriores de esos documentos (Artifact action "delete", url del dashboard, path = id del asset anterior), solo si el batch se aplicó. No abras, renderices ni navegues el dashboard. Si ya subiste archivos pero el batch falló, relee las versiones y reintenta el batch una vez. Si la investigación de una hoja falla por completo, deja esa hoja como estaba.

## 6. Publicar en el sitio web

benjamingarcia.cl/eventos_manifestaciones se sirve con GitHub Pages desde el repositorio benjamingarciasilva/benjamingarciasilva.github.io, rama main (el mismo donde leíste este archivo). Hazlo solo si el paso 5 se aplicó.

- Trabaja sobre la rama main (no crees una rama claude/): `git checkout main` y `git pull --ff-only origin main` antes de escribir.
- Si no hay acceso de escritura, omite este paso y dilo en una línea al final, con el error exacto.
- Escribe en eventos_manifestaciones/data/ los cuatro archivos vigentes con estos nombres exactos: eventos.json, revision.json, centro.json, centro_revision.json. Para la hoja que actualizaste, usa los archivos nuevos del paso 4; para la que no, la copia leída en el paso 1, sin cambios. Usa JSON UTF-8 válido. No toques ningún otro archivo del repositorio: ni eventos_manifestaciones/index.html ni este archivo.
- Si git no muestra cambios, no hagas commit. Si hay cambios: `git add eventos_manifestaciones/data`, commit con el mensaje "Actualiza disrupciones de tráfico (<fecha y hora de Chile>)" y `git push origin main`. Si el push es rechazado porque la rama remota avanzó, haz `git pull --rebase` una vez y reintenta.

## 7. Mensaje final

Termina con un mensaje breve en español para el usuario.

- Corrida de la mañana: dos partes ("Estadio Nacional" y "Santiago Centro"), qué cambió hoy (o "sin cambios") y el próximo evento con impacto.
- Corrida de la tarde: solo "Santiago Centro"; si no cambió nada, una sola línea.
- Si hoy o mañana hay cortes confirmados en Av. Grecia, o una marcha o evento de nivel ≥ 3 en el centro, dilo primero.
- Agrega una línea solo si la publicación en el sitio web falló o se omitió.
