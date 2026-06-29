Estructura y Arquitectura del Proyecto (Status Vzla)

¡Bienvenido al repositorio de Status Vzla (CRIS)! Este documento está diseñado para ayudar a desarrolladores, ingenieros y contribuidores a entender cómo está construida la aplicación, cómo se organizan los archivos y cuáles son los patrones arquitectónicos clave que utilizamos.

🏗️ 1. Visión General de la Arquitectura

Status Vzla es una Single Page Application (SPA) construida con React 18 y Vite. Sigue una arquitectura Serverless/BaaS utilizando Base44 como backend.

Frontend: React 18, Vite, Tailwind CSS, Radix UI (shadcn/ui).

Estado Asíncrono/Caché: TanStack Query (React Query).

Enrutamiento: React Router Dom.

Backend: Base44 (esquemas JSON y Serverless Functions en TypeScript/JS).

📂 2. Árbol de Directorios Principal

base44/ (Backend as a Service)

Contiene la lógica de servidor y bases de datos.

entities/: Modelos de datos (Data Models) en formato .jsonc.

functions/: Funciones Serverless (Cloud Functions).

src/ (Frontend React SPA)

Residencia de la interfaz de usuario.

api/: Configuración del cliente Base44 (base44Client.js).

components/: Componentes organizados por dominio.

lib/: Contextos globales (Auth, LowBw, Lang).

pages/: Vistas principales (Rutas).

🧩 3. Organización de Componentes (src/components/)

ui/: Componentes base (shadcn/ui).

svzla/: Componentes de uso público para la emergencia.

admin/: Componentes para el panel de administración.

institucional/: Portales de organizaciones.

🧠 4. Patrones y Decisiones Clave

Modo de Baja Conectividad: Usa LowBwContext. No cargues imágenes pesadas si está activo.

Diseño "Frictionless": No requieras inicio de sesión para reportes públicos.

Estado de Red: Nunca uses useEffect para fetch. Usa @tanstack/react-query.

Estilos: Tailwind CSS.

🚀 5. Flujo de Trabajo

Crea un componente en la carpeta adecuada.

Si requieres nuevos datos, define la Entity en /base44/entities/.

Crea la vista en src/pages/ y agrégala a App.jsx.

Prueba con "Network throttling" en el navegador para simular conexiones lentas.