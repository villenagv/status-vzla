Status Vzla (CRIS) 🇻🇪

Status Vzla (también conocida bajo las siglas CRIS) es una plataforma ciudadana independiente y de código abierto, diseñada para la gestión de crisis, emergencias y coordinación de apoyo humanitario en Venezuela.

🎯 Nuestra Razón de Ser

Esta iniciativa nace como un esfuerzo tecnológico cívico, independiente, no partidista y estrictamente sin fines de lucro. La herramienta no busca convertirse en un estándar gubernamental ni reemplazar los sistemas oficiales; su propósito es aportar a las tareas de búsqueda, rescate y coordinación, brindando a la comunidad una alternativa ciudadana rápida, confiable y accesible.

Misión

Proveer una plataforma tecnológica resiliente y sin barreras, que democratice el acceso a la información humanitaria y permita a los ciudadanos reportar, consultar y organizar datos críticos en tiempo real durante situaciones de crisis.

Visión

Facilitar la resiliencia comunitaria y apoyar directamente las labores de rescate al conectar rápidamente a quienes necesitan ayuda (ciudadanos, familias) con quienes pueden ofrecerla (instituciones, voluntarios), superando las limitaciones típicas de infraestructura de comunicaciones en zonas de desastre.

Objetivo Principal

Centralizar y organizar reportes ciudadanos sobre personas (desaparecidas o encontradas), infraestructura (daños en edificios) y necesidades (centros de acopio y refugios), operando de manera eficiente incluso en entornos críticos de baja conectividad (Low Bandwidth).

📚 Documentación del Proyecto

Para facilitar el uso, el desarrollo continuo y la comprensión de la plataforma, hemos dividido la documentación en las siguientes áreas clave. Te invitamos a revisarlas según tu perfil (usuario, contribuidor o ingeniero):

README.md: Visión general del proyecto, instalación rápida y manifiesto (Estás aquí).

STRUCTURE.md: Guía de arquitectura, árbol de directorios y patrones de diseño (Lectura obligatoria para desarrolladores).

MANUAL_USUARIO.md (En construcción): Guía práctica sobre cómo utilizar la plataforma para reportar, buscar personas y organizar ayuda.

MANUAL_TECNICO.md (En construcción): Documentación profunda sobre la lógica del servidor, integraciones, base de datos y flujos de datos.

✨ Características Principales

Status Vzla está diseñado pensando en la urgencia y la resiliencia tecnológica:

⚡ Sin Barreras (Frictionless): Reportes y consultas vitales disponibles para el público general sin la necesidad de un registro o cuenta obligatoria.

👥 Gestión de Personas: Módulo dedicado para reportar personas desaparecidas o encontradas, agilizando las búsquedas cruzadas para reunir familias.

🏢 Monitoreo de Infraestructura: Registro y visualización del estado operativo y daños estructurales de edificios e instituciones críticas.

🤝 Coordinación Voluntaria: Portales dedicados para el registro institucional y la gestión eficiente de especialistas y voluntarios en el sitio.

📶 Modo "Baja Conectividad" (Low-Bw): Arquitectura web optimizada para reducir drásticamente el consumo de datos y mantener la operatividad con señal inestable o baja batería.

🗺️ Mapa Interactivo de Daños: Visualización geoespacial de zonas afectadas y puntos de apoyo seguros.

🛠️ Stack Tecnológico

El proyecto está construido como una Single Page Application (SPA) moderna, respaldada por un Backend-as-a-Service, optimizada para cargas ultra rápidas:

Frontend Core: React 18

Build Tool: Vite

Enrutamiento: React Router Dom

Gestión de Datos/Caché: TanStack Query (@tanstack/react-query)

Estilos y UI: Tailwind CSS + Componentes accesibles de Radix UI (shadcn/ui)

Formularios: React Hook Form + Zod (validación)

Mapas: React Leaflet

Backend / Base de Datos: Base44 BaaS (con @base44/sdk)

🚀 Guía Rápida de Instalación

Sigue estos pasos para levantar el entorno de desarrollo local y colaborar:

Prerrequisitos

Node.js (v18 o superior)

npm o yarn

Pasos

Clonar el repositorio:

git clone https://github.com/villenagv/status-vzla.git
cd status-vzla


Instalar dependencias:

npm install


Configurar el entorno Base44:
(Asegúrate de tener configuradas tus credenciales o variables de entorno .env.local necesarias para la conexión con el proyecto Base44 backend).

Iniciar el servidor de desarrollo:

npm run dev


La aplicación estará disponible de forma local en http://localhost:5173.

📂 Estructura del Proyecto

Una visión general de los directorios clave para orientar a los desarrolladores y colaboradores:

status-vzla/
├── base44/           # Configuración, esquemas de entidades y Cloud Functions del entorno backend (BaaS)
├── public/           # Archivos estáticos y widgets web
├── src/
│   ├── api/          # Configuración del cliente Base44 (base44Client.js)
│   ├── components/   # Componentes de UI reutilizables (UI base, institucionales, voluntarios, etc.)
│   ├── hooks/        # Custom React hooks (ej. useOffline)
│   ├── lib/          # Proveedores de Contexto (Auth, Lang, LowBw) y utilidades core
│   ├── pages/        # Vistas principales y rutas completas de la SPA
│   ├── utils/        # Funciones y transformaciones auxiliares
│   ├── App.jsx       # Componente raíz y enrutador principal
│   └── main.jsx      # Punto de entrada de la aplicación
└── package.json      # Dependencias y scripts


🤝 Contribución

¡Las contribuciones de la comunidad técnica son vitales! Al ser una plataforma cívica de emergencias, tu código puede marcar una diferencia real.

Si deseas contribuir con el proyecto:

Haz un Fork del repositorio.

Crea una rama para tu feature o corrección (git checkout -b feature/MiNuevaCaracteristica).

Haz commit de tus cambios (git commit -m 'Añadir: nueva característica vital').

Sube la rama a tu fork (git push origin feature/MiNuevaCaracteristica).

Abre un Pull Request.

Por favor, asegúrate de mantener el código limpio, respetar la accesibilidad y considerar siempre entornos de baja conectividad en los nuevos flujos. Para más detalles técnicos, revisa el archivo STRUCTURE.md.

📄 Licencia y Autoría

Autoría: Este proyecto fue concebido y desarrollado de forma independiente por Gerardo Villena.

Plataforma Oficial y Contacto: Puedes acceder a la herramienta en producción, contactar al equipo o sugerir alianzas a través del sitio web oficial: https://statusvzla.com/.

Licencia: Distribuido bajo la Licencia MIT. Se fomenta el uso, modificación y distribución abierta de este código con el fin exclusivo de preservar la vida y apoyar la coordinación de asistencia civil.

Hecho por venezolanos 🇻🇪 • No partidista • Sin fines de lucro