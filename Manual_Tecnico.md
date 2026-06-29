Manual Técnico - Status Vzla (CRIS)

Este documento detalla el funcionamiento interno, la lógica de negocio, las estructuras de datos y las integraciones de la plataforma Status Vzla. Está dirigido a ingenieros de software, arquitectos de datos y colaboradores técnicos que necesiten comprender, mantener o expandir el sistema.

1. Arquitectura de Datos (Base44)

Status Vzla utiliza Base44 como Backend-as-a-Service (BaaS). Toda la base de datos está modelada a través de esquemas JSONC (ubicados en base44/entities/).

1.1 Entidades y Relaciones Core

El sistema no utiliza bases de datos relacionales tradicionales, sino colecciones de documentos. Las colecciones críticas y sus campos fundamentales son:

A. PersonaCRIS (Personas Buscadas / Encontradas)

Es la entidad central del sistema. Para evitar redundancias, tanto las personas que están siendo buscadas como las que han sido encontradas comparten un modelo base, diferenciándose por el campo estadoActual.

Esquema principal:

id (UUID): Identificador único del reporte.

nombres / apellidos (String): Indexados para búsqueda a texto completo (Full-Text Search).

fechaNacimiento / edadAprox (Number).

genero / rasgosFisicos (String): Descripciones vitales (tatuajes, cicatrices, vestimenta).

estadoActual (Enum): ['BUSCADA', 'ENCONTRADA_BIEN', 'ENCONTRADA_HERIDA', 'FALLECIDA'].

ultimaUbicacionConocida (GeoPoint / String): Coordenadas o dirección de texto.

contactoFamiliar (Object): Ofuscado para el público general. Contiene email y teléfono de quien reporta.

B. ReportesDano y EstadoOperativoEdificio

Manejan la infraestructura.

idEdificio (Relación): Vincula el reporte con un centro registrado.

nivelDano (Enum): ['NINGUNO', 'LEVE', 'MODERADO', 'GRAVE', 'COLAPSO'].

operatividad (Boolean): Indica si el lugar puede recibir pacientes/refugiados.

coordenadas (GeoPoint): Vital para renderizar en el mapa de React Leaflet.

2. Lógica Algorítmica (Cloud Functions)

Las tareas asíncronas pesadas se ejecutan en los servidores de Base44. El código fuente está en TypeScript/JS dentro de base44/functions/.

2.1 Algoritmo cruceBusqueda/

Este es el motor de inteligencia de la aplicación. Se ejecuta mediante un Trigger cada vez que se inserta un nuevo registro en PersonasEncontradas o mediante un CRON Job diario.

Lógica de Coincidencia:

Limpieza de Datos (Sanitization): Convierte nombres a minúsculas, elimina tildes y caracteres especiales.

Búsqueda Fonética / Distancia de Levenshtein: Compara el nombre reportado como "encontrado" contra la base de datos de "buscados". Permite un margen de error tipográfico (ej. "Víctor" vs "Bictor").

Filtro de Metadatos: Si el nombre coincide en más de un 80%, el algoritmo verifica:

Rango de edad (± 5 años).

Género.

Proximidad geográfica (si hay coordenadas disponibles).

Resolución: Si el Score de coincidencia supera un umbral predefinido (ej. 85%), se inserta un registro en la entidad Coincidencia y se dispara la función notificarCoincidencia/.

2.2 geocodificarEdificios/

Intercepta los reportes de ciudadanos que escriben direcciones en texto plano (ej. "Hospital Central nivel 1").

Usa una API externa (ej. Google Maps Geocoding / Mapbox) para traducir el texto a coordenadas [Latitud, Longitud].

Guarda silenciosamente las coordenadas en el registro para que aparezca instantáneamente en el /mapa-danos.

3. Frontend y Estrategia de Resiliencia (React + Vite)

El frontend está diseñado bajo el principio Frictionless (sin barreras) y Offline-First (Tolerancia a fallos de red).

3.1 Gestión de Estado Asíncrono (@tanstack/react-query)

La aplicación asume que la red del usuario fallará intermitentemente.

Configuración de Caché (src/lib/query-client.js): El staleTime para datos no críticos (como lista de refugios estáticos) está configurado a varias horas. Si el usuario pierde conexión, podrá seguir navegando por el directorio cacheado en memoria.

Reintentos Exponenciales: Si un POST (ej. reportar un herido) falla por micro-cortes, React Query reintentará el envío en el background hasta 3 veces, aumentando el tiempo entre cada intento.

3.2 Modo "Baja Conectividad" (LowBwContext.jsx)

Contexto global (src/lib/) que el usuario puede activar, o que se activa solo si detecta una conexión lenta (navigator.connection).

Interceptación de Medios: Cuando está activo, componentes como LazyImage.jsx no cargan la imagen original. Pasan por ImagenProxy.jsx, que llama a la Cloud Function proxyImagen/ para solicitar una miniatura altamente comprimida (WebP) o muestran solo texto descriptivo.

Mapas Desactivados: Los widgets pesados de Leaflet se ocultan, mostrando en su lugar tablas de texto ligero con las direcciones.

4. Variables de Entorno y Entorno Local

Para que la aplicación compile y conecte correctamente con el backend en desarrollo, es imperativo crear un archivo .env.local en la raíz del proyecto.

# Configuración del Cliente Frontend (Base44)
VITE_BASE44_PROJECT_ID="6a3ddf29c9e933d4c38e9646"
VITE_BASE44_API_URL="https://api.base44.com/v1"

# Integraciones de Mapa (Frontend)
VITE_MAPBOX_TOKEN="pk.tu_token_aqui"

# Entorno
VITE_APP_ENV="development"


(Nota: Las claves secretas de Google Drive o notificaciones de correo se configuran directamente en los secretos de las Cloud Functions en el dashboard de Base44, no en el frontend).

5. Seguridad y Control de Acceso (RBAC)

La aplicación implementa un Control de Acceso Basado en Roles manejado por AuthContext.jsx y validado en las políticas de seguridad de Base44.

Público General (No autenticado):

Pueden hacer peticiones GET ofuscadas (ver listas de personas sin datos de contacto).

Pueden hacer POST de reportes (crear personas, daños).

Rol Institucional / Voluntario (/portal-voluntario):

Requiere autenticación.

Pueden hacer GET de datos completos (para contactar familiares).

Se aprueban manualmente a través de la entidad Verificaciones.

Rol Administrador (/admin):

Tienen acceso a las estadísticas (getAdminStats/), eliminación de reportes falsos y purgado de caché.